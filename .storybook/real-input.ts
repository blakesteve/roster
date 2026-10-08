/**
 * Real input for the story tests: a wheel and a mouse drag that the browser
 * treats as the user's own.
 *
 * Testing Library's events are synthetic, and a synthetic wheel or pointer
 * event never scrolls anything: the browser runs no default action for an
 * event a script made. So "a vertical wheel scrolls the page, not the row"
 * and "the click that ends a drag lands where a real one would" can't be
 * tested with them. These run in the test runner's Node process and drive
 * Playwright's mouse, whose events are trusted.
 *
 * Registered as Vitest browser commands in vite.config.ts, and handed to the
 * stories by .storybook/vitest.setup.ts. Storybook's own UI has neither, so a
 * story checks for them and skips the trusted steps there.
 */
import type { BrowserCommand } from "vitest/node";

type Point = { x: number; y: number };

async function centerOf(
  context: Parameters<BrowserCommand>[0],
  selector: string,
  at: { fx?: number; fy?: number } = {},
): Promise<Point> {
  const frame = await context.frame();
  const element = await frame.waitForSelector(selector, { state: "attached" });
  await element.scrollIntoViewIfNeeded();
  /* A viewport change resizes the test frame over a few frames, and a box read
     during it puts the pointer somewhere else. Wait for two reads that agree. */
  let box = await element.boundingBox();
  for (let i = 0; i < 20; i++) {
    await context.page.waitForTimeout(50);
    const again = await element.boundingBox();
    if (box && again && box.x === again.x && box.y === again.y && box.width === again.width) break;
    box = again;
  }
  if (!box) throw new Error(`real-input: ${selector} has no box`);
  return { x: box.x + box.width * (at.fx ?? 0.5), y: box.y + box.height * (at.fy ?? 0.5) };
}

/* Fails loudly when the pointer is not over the target, rather than letting a
   wheel or a press land on the page and a test pass for the wrong reason. */
async function assertOver(context: Parameters<BrowserCommand>[0], selector: string) {
  const frame = await context.frame();
  try {
    /* A string, so this Node-side file needs no DOM types: it runs in the page. */
    await frame.waitForFunction(`!!document.querySelector(${JSON.stringify(selector)})?.matches(":hover")`, undefined, {
      timeout: 1000,
    });
  } catch {
    throw new Error(`real-input: the pointer is not over ${selector}`);
  }
}

/** Wheel over the middle of `selector`. */
export const realWheel: BrowserCommand<[selector: string, deltaX: number, deltaY: number]> = async (
  context,
  selector,
  deltaX,
  deltaY,
) => {
  const { x, y } = await centerOf(context, selector);
  await context.page.mouse.move(x, y);
  await assertOver(context, selector);
  await context.page.mouse.wheel(deltaX, deltaY);
  /* A wheel scrolls asynchronously; give it a few frames to land. */
  await context.page.waitForTimeout(250);
};

/**
 * Press on `selector` (at a fraction of its box, the middle by default), move
 * by `dx` in `steps`, and release. `holdMs` waits before the release, so a
 * slow drag reads as slow.
 */
export const realDrag: BrowserCommand<
  [selector: string, dx: number, options?: { steps?: number; holdMs?: number; fx?: number; fy?: number }]
> = async (context, selector, dx, options = {}) => {
  const start = await centerOf(context, selector, options);
  const mouse = context.page.mouse;
  await mouse.move(start.x, start.y);
  await assertOver(context, selector);
  await mouse.down();
  await mouse.move(start.x + dx, start.y, { steps: options.steps ?? 12 });
  if (options.holdMs) await context.page.waitForTimeout(options.holdMs);
  await mouse.up();
};

/** A plain click on `selector`, at a fraction of its box (the middle by default). */
export const realClick: BrowserCommand<[selector: string, at?: { fx?: number; fy?: number }]> = async (
  context,
  selector,
  at = {},
) => {
  const { x, y } = await centerOf(context, selector, at);
  await context.page.mouse.move(x, y);
  await assertOver(context, selector);
  await context.page.mouse.click(x, y);
};

/** A file for the commands below: its bytes as base64, or `size` zero bytes. */
export type RealFile = { name: string; mimeType: string; base64?: string; size?: number };
const buffers = (files: RealFile[]) =>
  files.map((f) => ({
    name: f.name,
    mimeType: f.mimeType,
    buffer: f.base64 ? Buffer.from(f.base64, "base64") : Buffer.alloc(f.size ?? 0),
  }));

/**
 * Picks `files` in the file input at `selector`, as the person would through
 * the system's file chooser: Playwright hands them to the browser, which fires
 * the input's own `input` and `change`. A script can't do that; it can only
 * pretend with a DataTransfer.
 */
export const realSetFiles: BrowserCommand<[selector: string, files: RealFile[]]> = async (context, selector, files) => {
  const frame = await context.frame();
  await frame.setInputFiles(selector, buffers(files));
};

/**
 * Drags `files` onto `selector` and drops them: dragenter, dragover and drop,
 * carrying a DataTransfer that holds real File objects. No automation can
 * drag a file in from the operating system, so these events are dispatched
 * rather than trusted; what they test is the page's handling of a drop.
 */
export const realDropFiles: BrowserCommand<[selector: string, files: RealFile[]]> = async (context, selector, files) => {
  const frame = await context.frame();
  const payload = files.map((f) => ({ name: f.name, type: f.mimeType, base64: f.base64 ?? "", size: f.size ?? 0 }));
  /* A string, so this Node-side file needs no DOM types: it runs in the page. */
  const dataTransfer = await frame.evaluateHandle(`(() => {
    const dt = new DataTransfer();
    for (const f of ${JSON.stringify(payload)}) {
      const bytes = f.base64 ? Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0)) : new Uint8Array(f.size);
      dt.items.add(new File([bytes], f.name, { type: f.type }));
    }
    return dt;
  })()`);
  for (const type of ["dragenter", "dragover", "drop"]) await frame.dispatchEvent(selector, type, { dataTransfer });
};

export const realInputCommands = { realWheel, realDrag, realClick, realSetFiles, realDropFiles };

declare module "vitest/browser" {
  interface BrowserCommands {
    realWheel: (selector: string, deltaX: number, deltaY: number) => Promise<void>;
    realDrag: (
      selector: string,
      dx: number,
      options?: { steps?: number; holdMs?: number; fx?: number; fy?: number },
    ) => Promise<void>;
    realClick: (selector: string, at?: { fx?: number; fy?: number }) => Promise<void>;
    realSetFiles: (selector: string, files: RealFile[]) => Promise<void>;
    realDropFiles: (selector: string, files: RealFile[]) => Promise<void>;
  }
}
