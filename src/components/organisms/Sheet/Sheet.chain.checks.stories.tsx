import { useEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Sheet } from "./Sheet";
import { Dialog } from "../Dialog/Dialog";
import { PageRegions } from "../../../test/PageRegions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * One overlay opened while another is leaving, checked rendered with real
 * keys and a real mouse in Chromium and WebKit.
 *
 * B mounts already open, as a sheet whose code loads on its first open does,
 * and is unmounted once its own leave has played. On 5.19.0 that sheet never
 * held the part of the page it was written in, and as A's leave ended A's
 * focus restore moved focus out of B onto that page.
 *
 * - **B holds the page from its first frame to its close:** the header, main
 *   and footer beside it all `inert` and `aria-hidden` in every frame B is
 *   there, opened as A's close starts, halfway through A's leave, and in its
 *   last frame. The twin: A leaving alone, before B comes, leaves the page
 *   live, and so does B's own close, so the read can see a live page.
 * - **Focus stays in B** in every frame of A's leave and for 300ms after its
 *   unmount, past A's restore.
 * - **B's close gives focus back to what opened A**, or to the consumer's
 *   `returnFocus`, through B's own leave, and focus goes nowhere else once
 *   it leaves B. `<body>`, where Headless UI leaves it before its restore,
 *   isn't the requirement and isn't pinned.
 * - **A lone sheet holds the page from its first frame and still gives focus
 *   back** to what opened it, closed by Escape, its Close button and the
 *   scrim, mounted from the start or mounting open.
 * - **Mixed stacks:** a Sheet opened as a Dialog leaves, and a Dialog as a
 *   Sheet leaves, as a consumer that switches between them at a width can do.
 *   The second held on 5.19.0 too: it guards, it isn't a twin. The first is
 *   checked at once only: here Headless UI often ends a Dialog's leave in its
 *   first frames (its issue #3902), leaving nothing to open into partway.
 *
 * What it doesn't cover: an opener in the toast host, which stays live by
 * design, still takes focus back from B as A leaves, for a Dialog B as for a
 * Sheet.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Sheet/Chain checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Kind = "sheet" | "dialog";
type When = "at once" | "halfway" | "last frame";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/* Set by the chain as it renders, so a check can open B at any moment. */
const chain = { openB: () => {} };

type OverlayProps = { kind: Kind; name: string; open: boolean; onClose: () => void; onAfterClose?: () => void; returnFocus?: HTMLElement | null; children: ReactNode };
function Overlay({ kind, name, open, onClose, onAfterClose, returnFocus, children }: OverlayProps) {
  return kind === "sheet" ? (
    <Sheet isOpen={open} onClose={onClose} onAfterClose={onAfterClose} title={name} returnFocus={returnFocus}>
      {children}
    </Sheet>
  ) : (
    <Dialog isOpen={open} onClose={onClose} onAfterClose={onAfterClose} title={name}>
      {children}
    </Dialog>
  );
}

/**
 * A page with an opener for A, and A holding the button that closes it. B is
 * mounted as it opens, so it mounts open, and unmounted after its leave.
 * `at once` opens B in the same press; the other two leave it to the check.
 */
function Chain({ a, b, when = "at once", giveBackTo = false }: { a: Kind; b: Kind; when?: When; giveBackTo?: boolean }) {
  const [openA, setA] = useState(false);
  const [openB, setB] = useState(false);
  const [mountedB, setMountedB] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const showB = () => {
    setMountedB(true);
    setB(true);
  };
  useEffect(() => {
    chain.openB = showB;
  }, []);
  return (
    <PageRegions>
      <button type="button" data-check="open-a" onClick={() => setA(true)}>
        Open A
      </button>
      {giveBackTo && (
        <button type="button" ref={setTarget} data-check="give-back">
          Chosen by the consumer
        </button>
      )}
      <Overlay kind={a} name="A" open={openA} onClose={() => setA(false)}>
        <button
          type="button"
          data-check="go"
          onClick={() => {
            setA(false);
            if (when === "at once") showB();
          }}
        >
          On to B
        </button>
      </Overlay>
      {mountedB && (
        <Overlay kind={b} name="B" open={openB} onClose={() => setB(false)} onAfterClose={() => setMountedB(false)} returnFocus={giveBackTo ? target : undefined}>
          <button type="button" data-check="in-b">
            In B
          </button>
        </Overlay>
      )}
    </PageRegions>
  );
}

const named = (name: string) => [...document.querySelectorAll('[role="dialog"]')].find((d) => d.querySelector("h2")?.textContent === name) ?? null;
const regions = () => ["page-header", "page-main", "page-footer"].map((id) => document.querySelector(`[data-testid="${id}"]`));
const held = (el: Element | null) => !!el && (el as HTMLElement).inert && el.getAttribute("aria-hidden") === "true";
const page = () => {
  const each = regions().map(held);
  return each.every(Boolean) ? "held" : each.some(Boolean) ? "partly held" : "live";
};
const focus = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return "body";
  for (const name of ["A", "B"]) if (named(name)?.contains(el)) return `in ${name}`;
  return (el as HTMLElement).dataset.check ?? el.tagName.toLowerCase();
};

type Read = { at: string; a: boolean; b: boolean; page: string; focus: string };

/* Where focus went once it left the overlay that's closing, in order: not
   the overlay itself, and not `<body>`, where it waits for Headless UI's
   restore (and where Headless UI puts it first on Escape). */
const leftFor = (reads: Read[], closing: string) =>
  reads.map((r) => r.focus).filter((f) => f !== "body" && f !== `in ${closing}`).filter((f, i, all) => f !== all[i - 1]);

/**
 * Reads the page and focus in every frame, and at the moment each overlay's
 * node leaves: a MutationObserver's callback runs before Headless UI's
 * restore, which is queued as the node is unmounted.
 */
function watch() {
  const reads: Read[] = [];
  const t0 = performance.now();
  const gone = new Set<string>();
  const read = (at: string) => reads.push({ at, a: !!named("A"), b: !!named("B"), page: page(), focus: focus() });
  const observer = new MutationObserver(() => {
    for (const name of ["A", "B"]) {
      if (!gone.has(name) && reads.some((r) => r[name.toLowerCase() as "a" | "b"]) && !named(name)) {
        gone.add(name);
        read(`${name} left`);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  let running = true;
  const loop = () => {
    if (!running) return;
    read(`${Math.round(performance.now() - t0)}ms`);
    requestAnimationFrame(loop);
  };
  loop();
  return {
    reads,
    mark: read,
    stop() {
      running = false;
      observer.disconnect();
    },
  };
}

/** A's leave: how far its longest transition has got and how long it has left, or null when nothing runs in it. */
function leave(): { progress: number; leftMs: number } | null {
  const running = (named("A")?.getAnimations({ subtree: true }) ?? [])
    .filter((a) => a.playState === "running")
    .map((a) => ({ at: Number(a.currentTime), duration: Number(a.effect!.getTiming().duration) }))
    .sort((x, y) => y.duration - x.duration)[0];
  if (!running) return null;
  return { progress: running.at / running.duration, leftMs: running.duration - running.at };
}

/* B opened at `when` into A's leave: halfway, or in the last frame before it
   ends (under 25ms left, a frame and a half). Frames are read, not timed, so
   a leave can end between two reads before its point; then B opens anyway
   and the try says it missed, to be run again. */
async function openBAt(when: When): Promise<boolean> {
  if (when === "at once") return true;
  const stop = performance.now() + 1000;
  let seen = false;
  for (;;) {
    await frame();
    const now = leave();
    if (now) seen = true;
    if (now && (when === "halfway" ? now.progress >= 0.5 : now.leftMs < 25)) break;
    if ((seen && !now) || performance.now() > stop) {
      chain.openB();
      return false;
    }
  }
  chain.openB();
  return true;
}

async function openA(real: NonNullable<ReturnType<typeof realInputOrSkip>>) {
  document.querySelector<HTMLElement>('[data-check="open-a"]')!.focus();
  await real.commands.realPress(["Enter"]);
  await waitFor(() => expect(named("A")?.contains(document.activeElement)).toBe(true));
  await waitFor(() => expect(document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-transition]")).toBeNull());
  await wait(100);
}

/**
 * The chain: A open, its button pressed, B opened at `when`, then B closed by
 * its Close button. What happened in each frame, cut into what the checks
 * need. Under load Headless UI can skip A's leave, leaving no chain to read;
 * that try is thrown away and the chain run again, up to five times, and it
 * fails rather than pass on a try where A was gone before B came.
 */
async function runChain(when: When) {
  const real = realInputOrSkip();
  if (!real) return null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await openA(real);
    const w = watch();
    let beforeClose = 0;
    let onTime = false;
    try {
      await real.commands.realClick('[data-check="go"]');
      w.mark("pressed");
      onTime = await openBAt(when);
      await waitFor(() => expect(named("B")).not.toBeNull());
      await waitFor(() => expect(named("A")).toBeNull(), { timeout: 3000 });
      await wait(300);
      beforeClose = w.reads.length;
      await real.commands.realClick('[role="dialog"] button[aria-label^="Close"]');
      await waitFor(() => expect(named("B")).toBeNull(), { timeout: 3000 });
      await wait(300);
    } finally {
      w.stop();
    }
    const reads = w.reads;
    const withB = reads.slice(0, beforeClose).filter((r) => r.b);
    const chained = withB.length > 0 && withB[0].a;
    if (!chained || !onTime) {
      console.info(`SHEET CHAIN ${when}: try ${attempt} ${chained ? `missed ${when}` : "had no chain, A gone before B came"}`);
      continue;
    }
    const pressed = reads.findIndex((r) => r.at === "pressed");
    const aLeft = reads.findIndex((r) => r.at === "A left");
    const bFirst = reads.findIndex((r) => r.b);
    const aliveUntil = aLeft + reads.slice(aLeft).findIndex((r) => r.at.endsWith("ms") && Number.parseInt(r.at) >= Number.parseInt(reads[aLeft - 1].at) + 300);
    return {
      /* Every read with B there, until its close was pressed. */
      pageWhileB: [...new Set(withB.map((r) => r.page))],
      /* A leaving alone, after the press and before B came. */
      liveBeforeB: reads.slice(pressed, bFirst).some((r) => r.page === "live"),
      /* From B's first frame to 300ms past A's unmount. */
      focusThroughA: [...new Set(reads.slice(bFirst, aliveUntil > aLeft ? aliveUntil : beforeClose).map((r) => r.focus))],
      /* After B's close was pressed. */
      afterClose: leftFor(reads.slice(beforeClose), "B"),
      pageAfter: reads.at(-1)!.page,
    };
  }
  throw new Error(`no chain at ${when} in five tries`);
}

function chainCheck(a: Kind, b: Kind, when: When): Story {
  return {
    render: () => <Chain a={a} b={b} when={when} />,
    play: async () => {
      const seen = await runChain(when);
      if (!seen) return;
      console.info(`SHEET CHAIN ${a} then ${b}, ${when}: ${JSON.stringify(seen)}`);
      await expect(seen).toEqual({
        pageWhileB: ["held"],
        liveBeforeB: when !== "at once",
        focusThroughA: ["in B"],
        afterClose: ["open-a"],
        pageAfter: "live",
      });
    },
  };
}

export const SheetThenSheetAtOnce = chainCheck("sheet", "sheet", "at once");
export const SheetThenSheetHalfway = chainCheck("sheet", "sheet", "halfway");
export const SheetThenSheetOnTheLastFrame = chainCheck("sheet", "sheet", "last frame");
export const DialogThenSheetAtOnce = chainCheck("dialog", "sheet", "at once");
export const SheetThenDialogHalfway = chainCheck("sheet", "dialog", "halfway");

/* B's close gives focus to the consumer's `returnFocus` instead. */
export const BsCloseGivesFocusToReturnFocus: Story = {
  render: () => <Chain a="sheet" b="sheet" when="halfway" giveBackTo />,
  play: async () => {
    const seen = await runChain("halfway");
    if (!seen) return;
    await expect([seen.pageWhileB, seen.focusThroughA, seen.afterClose]).toEqual([["held"], ["in B"], ["give-back"]]);
  },
};

/* ── A lone sheet ─────────────────────────────────────────────────────── */

function Lone({ mountsOpen }: { mountsOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(!mountsOpen);
  return (
    <PageRegions>
      <button
        type="button"
        data-check="open-a"
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
      >
        Open A
      </button>
      {mounted && (
        <Sheet isOpen={open} onClose={() => setOpen(false)} onAfterClose={() => setMounted(!mountsOpen)} title="A">
          <p>Inside A.</p>
        </Sheet>
      )}
    </PageRegions>
  );
}

const CLOSES = {
  Escape: (real: NonNullable<ReturnType<typeof realInputOrSkip>>) => real.commands.realPress(["Escape"]),
  "its Close button": (real: NonNullable<ReturnType<typeof realInputOrSkip>>) => real.commands.realClick('[role="dialog"] button[aria-label="Close"]'),
  "the scrim": (real: NonNullable<ReturnType<typeof realInputOrSkip>>) => real.commands.realClick('[role="dialog"]', { fx: 0.5, fy: 0.04 }),
};

function loneCheck(mountsOpen: boolean): Story {
  return {
    render: () => <Lone mountsOpen={mountsOpen} />,
    play: async () => {
      const real = realInputOrSkip();
      if (!real) return;
      const seen: Record<string, { pageWhileOpen: string[]; afterClose: string[] }> = {};
      for (const [how, close] of Object.entries(CLOSES)) {
        const w = watch();
        let closing = 0;
        try {
          await openA(real);
          closing = w.reads.length;
          await close(real);
          await waitFor(() => expect(named("A")).toBeNull(), { timeout: 3000 });
          await wait(300);
        } finally {
          w.stop();
        }
        seen[how] = {
          /* From the sheet's first frame to its close. */
          pageWhileOpen: [...new Set(w.reads.slice(0, closing).filter((r) => r.a).map((r) => r.page))],
          afterClose: leftFor(w.reads.slice(closing), "A"),
        };
      }
      const right = { pageWhileOpen: ["held"], afterClose: ["open-a"] };
      await expect(seen).toEqual({ Escape: right, "its Close button": right, "the scrim": right });
    },
  };
}

export const ALoneSheetGivesFocusBack = loneCheck(false);
export const ALoneSheetThatMountsOpenGivesFocusBack = loneCheck(true);
