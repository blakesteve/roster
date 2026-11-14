import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Dialog } from "./Dialog";
import { PageRegions } from "../../../test/PageRegions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A Dialog opened again while it is still leaving ends with focus inside it,
 * where an open starts it, checked with a real mouse and real keys in
 * Chromium and WebKit.
 *
 * Headless UI counts a dialog open through its leave, so on a reopen its own
 * initial focus doesn't run again. On 5.19.3 focus stayed where the close
 * left it: on `<body>` after Escape, which takes focus off as it closes, and,
 * in Chromium, on the close button a click focuses.
 *
 * - **Opened again 20, 40, 60 and 100ms after the close, focus is on the
 *   dialog's initial focus** within its entrance (300ms) and a frame: the
 *   dialog itself here, as on a first open, or the element marked
 *   `data-autofocus`. Closed by Escape, by the Close button, by a click on
 *   the backdrop and by `open` set false, each in its own story, each after
 *   focus has moved on from where the open put it, to First, so a reopen
 *   that leaves focus where the close left it fails. The backdrop is a
 *   guard, not a twin: its click focuses the dialog on the way, so it passed
 *   on 5.19.3 too.
 * - **Only a reopen during the leave counts.** A leave Headless UI has
 *   already ended, as it sometimes does at once after a click on the
 *   backdrop, leaves a fresh open, which isn't this; the try is run again, up
 *   to three times a gap and ten a story. A story in which no gap was ever
 *   reopened during a leave fails rather than passes.
 * - **A fresh open is Headless UI's.** Opened after the dialog has left the
 *   page, focus a page moves to a field of its own on open stays there.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Dialog/Reopen focus checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* `Dialog`'s entrance, and a frame. */
const ENTRANCE_MS = 300 + 17;

const page = { open: () => {}, close: () => {} };

function Reopen({ autofocus, focusFirstOnOpen = false }: { autofocus: boolean; focusFirstOnOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    page.open = () => setOpen(true);
    page.close = () => setOpen(false);
  }, []);
  /* A page that moves focus to a field of its own once its dialog has opened. */
  useEffect(() => {
    if (!open || !focusFirstOnOpen) return;
    const timer = setTimeout(() => document.querySelector<HTMLElement>('[data-check="first"]')?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open, focusFirstOnOpen]);
  return (
    <PageRegions>
      <button type="button" data-check="opener" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Again">
        <button type="button" data-check="first">
          First
        </button>
        {autofocus ? (
          <button type="button" data-check="marked" data-autofocus>
            Marked
          </button>
        ) : null}
      </Dialog>
    </PageRegions>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const focused = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return "body";
  if (el === dialog()) return "the dialog";
  return (el as HTMLElement).dataset.check ?? el.getAttribute("aria-label") ?? el.tagName.toLowerCase();
};

type Way = "Escape" | "Close" | "backdrop" | "open false";

/**
 * Opens with a real click, closes `way`, opens again `gap` ms later. Whether
 * the dialog was still leaving then, and how long until focus was on the
 * dialog's initial focus, if within a second.
 */
async function reopenOnce(real: NonNullable<ReturnType<typeof realInputOrSkip>>, way: Way, gap: number) {
  for (let i = 0; i < 120 && dialog(); i += 1) await frame();
  await wait(50);
  await real.commands.realClick('[data-check="opener"]');
  await waitFor(() => expect(dialog()?.contains(document.activeElement)).toBe(true));
  await waitFor(() => expect(document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-transition]")).toBeNull());
  await wait(60);
  /* Where a first open starts focus: the requirement for the reopen. Then
     focus moves on, to First, as a person working in the dialog moves it.
     Not by a real Tab: WebKit's skips buttons, and took focus out of the
     page. */
  const initial = focused();
  dialog()!.querySelector<HTMLElement>('[data-check="first"]')!.focus();
  await waitFor(() => expect(focused()).toBe("first"));
  if (way === "Escape") await real.commands.realPress(["Escape"]);
  else if (way === "Close") await real.commands.realClick('[role="dialog"] button[aria-label^="Close"]');
  else if (way === "backdrop") {
    /* The corner of the viewport, outside the panel. */
    await real.commands.realClick('[role="dialog"]', { fx: 0.03, fy: 0.03 });
  } else page.close();
  await wait(gap);
  const leaving = !!dialog();
  page.open();
  const from = performance.now();
  let backMs: number | null = null;
  while (performance.now() - from < 1000) {
    await frame();
    if (focused() === initial) {
      backMs = Math.round(performance.now() - from);
      break;
    }
  }
  const ended = focused();
  page.close();
  for (let i = 0; i < 120 && dialog(); i += 1) await frame();
  (document.activeElement as HTMLElement | null)?.blur();
  return { leaving, backMs, initial, ended };
}

function check(way: Way, autofocus = false, gaps = [20, 40, 60, 100]): Story {
  return {
    render: () => <Reopen autofocus={autofocus} />,
    play: async () => {
      const real = realInputOrSkip();
      if (!real) return;
      const tries: string[] = [];
      const late: string[] = [];
      const initials = new Set<string>();
      let counted = 0;
      for (const gap of gaps) {
        for (let attempt = 0; attempt < 3 && tries.length < 10; attempt += 1) {
          const t = await reopenOnce(real, way, gap);
          initials.add(t.initial);
          tries.push(`${gap}ms: ${t.leaving ? `back in ${t.backMs ?? "never"}ms, on ${t.ended}` : "the leave had ended"}`);
          if (!t.leaving) continue;
          counted += 1;
          if (t.backMs === null || t.backMs > ENTRANCE_MS) late.push(`${gap}ms: on ${t.ended}`);
          break;
        }
      }
      console.info(`DIALOG REOPEN FOCUS ${way}${autofocus ? ", data-autofocus" : ""}: started on ${[...initials].join(", ")}; ${JSON.stringify(tries)}`);
      await expect([...initials]).toEqual([autofocus ? "marked" : "the dialog"]);
      /* A story with no reopen during a leave can't fail, so it doesn't pass. */
      await expect(counted).toBeGreaterThan(0);
      await expect(late).toEqual([]);
    },
  };
}

export const ClosedByEscapeAndOpenedAgain = check("Escape");
export const ClosedByItsCloseButtonAndOpenedAgain = check("Close");
export const ClosedByTheBackdropAndOpenedAgain = check("backdrop");
export const ClosedByOpenSetFalseAndOpenedAgain = check("open false");
export const WithAMarkedElementClosedByEscapeAndOpenedAgain = check("Escape", true, [20, 60]);

/* The guard: an open after the dialog has left the page is Headless UI's,
   and focus a page moves on open stays where it's put. */
export const AFreshOpenLeavesFocusWhereThePagePutsIt: Story = {
  render: () => <Reopen autofocus={false} focusFirstOnOpen />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const ends: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      await real.commands.realClick('[data-check="opener"]');
      await waitFor(() => expect(focused()).toBe("first"));
      /* Past the reopen's frame, and the entrance. */
      await wait(ENTRANCE_MS + 100);
      ends.push(focused());
      page.close();
      await waitFor(() => expect(dialog()).toBeNull(), { timeout: 3000 });
      await wait(100);
      (document.activeElement as HTMLElement | null)?.blur();
    }
    console.info(`DIALOG REOPEN FOCUS fresh opens: ${JSON.stringify(ends)}`);
    await expect([...new Set(ends)]).toEqual(["first"]);
  },
};
