import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Sheet } from "./Sheet";
import { PageRegions } from "../../../test/PageRegions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A sheet closed during its entrance and opened again, checked rendered in
 * Chromium and WebKit.
 *
 * Closed as its entrance starts to move, the panel and the backdrop each turn
 * around, and the panel's way back is the shorter: measured, 20ms against the
 * backdrop's 31 in Chromium, 37 against 52 in WebKit. On 5.19.1, and before it
 * for any open but one mounted open, a sheet opened again between the two
 * ends came back with its backdrop, holding the page, and no panel, with focus
 * on `<body>`. Turned around later, the panel's way back can be the longer
 * (in WebKit it was, 50ms into the entrance) and nothing is lost, so each
 * check closes on the first frame the entrance has started, not after a set
 * time: on a busy machine a set time lands before the entrance starts, or
 * too late. A try in which the entrance was never seen counts as no window.
 *
 * That window is a few milliseconds wide, and where it falls depends on how
 * soon the machine turns the entrance around: in CI's Linux Chromium it never
 * came in 20 tries. So the window checks widen it with a style of the story's
 * own that gives the backdrop a 700ms transition. Its leave then ends well
 * after the panel's on every machine, the way the natural one does by a few
 * milliseconds. The set-gaps check keeps the sheet's own timing.
 *
 * - **Opened again in that window, it shows its panel:** the panel there,
 *   focus inside it, within the entrance (280ms) and a frame, and then at
 *   rest on screen, slid all the way in, for a sheet that mounts open and
 *   for one mounted closed and opened later. The window is found, not
 *   guessed: the sheet opens again the moment its panel is down while the
 *   dialog is still there, until it has come four times, for up to 20 tries
 *   or 8s (the story's limit is 15s), and a run in which it never came is a
 *   failure, not a pass. The twin is 5.19.1's Sheet: every one stuck.
 * - **Focus comes back by Sheet's own doing.** Each close takes focus off
 *   first, as Escape and a tap outside do, and Headless UI counts the dialog
 *   open through its leave, so it doesn't focus it again.
 * - **At set gaps too:** opened again 20, 40, 60 and 100ms after that close,
 *   as a page's own reopen is. A try whose entrance was never seen (once in
 *   a WebKit run here; Headless UI skips a transition now and then, as the
 *   older checks find for a leave) is tried again, up to twice.
 * - **A closed sheet never leaves the page held,** after every close.
 *
 * A try that doesn't come back logs what was there: each part, and focus.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Sheet/Reopen checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* `--roster-sheet-enter-duration`, and a frame. */
const ENTRANCE_MS = 280 + 17;

/* Set by the sheet as it renders, so a check can open and close it at any moment. */
const sheet = { open: () => {}, close: () => {}, reset: () => {} };

function Reopen({ mountsOpen, slowBackdrop = false }: { mountsOpen: boolean; slowBackdrop?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(!mountsOpen);
  useEffect(() => {
    sheet.open = () => {
      setMounted(true);
      setOpen(true);
    };
    sheet.close = () => setOpen(false);
    sheet.reset = () => {
      setOpen(false);
      setMounted(!mountsOpen);
    };
  }, [mountsOpen]);
  return (
    <PageRegions>
      {/* Unlayered, so it beats Roster's layered utilities: the backdrop's
          transition, made longer than the panel's. */}
      {slowBackdrop && <style>{'[data-testid="sheet-backdrop"] { transition-duration: 700ms !important; }'}</style>}
      {mounted && (
        <Sheet isOpen={open} onClose={() => setOpen(false)} title="Again">
          <button type="button">Inside</button>
        </Sheet>
      )}
    </PageRegions>
  );
}

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dialog = () => document.querySelector('[role="dialog"]');
const panel = () => dialog()?.querySelector<HTMLElement>('[data-testid="sheet-panel"]') ?? null;
const backdrop = () => dialog()?.querySelector<HTMLElement>('[data-testid="sheet-backdrop"]') ?? null;
/* A part out of the page, or hidden in it: its own leave is over. */
const down = (part: HTMLElement | null) => !part || !!part.closest("[hidden]") || getComputedStyle(part).display === "none";
const panelDown = () => down(panel());
/* What's there when a reopen hasn't come back. */
const state = () => {
  const part = (el: HTMLElement | null) => (!el ? "gone" : down(el) ? "hidden" : "shown");
  return `panel ${part(panel())}, backdrop ${part(backdrop())}, focus on ${document.activeElement?.tagName ?? "nothing"}`;
};
const held = () => {
  const main = document.querySelector<HTMLElement>('[data-testid="page-main"]');
  return !!main && (main.inert || main.getAttribute("aria-hidden") === "true");
};
/* Its entrance under way: Headless UI has taken `data-closed` off to start it. */
const entering = () => {
  const p = panel();
  return !!p && p.hasAttribute("data-enter") && !p.hasAttribute("data-closed");
};

type Try = { reopened: boolean; backMs: number | null; slidIn: boolean; heldAfter: boolean; seen?: string };

/**
 * Opens the sheet from its starting state and closes it as its entrance
 * starts, taking focus off first as Escape and a tap outside do. Whether the
 * entrance was seen: if not, it closed at rest a second later.
 */
async function openThenClose(): Promise<boolean> {
  sheet.reset();
  for (let i = 0; i < 120 && (dialog() || held()); i += 1) await frame();
  await wait(50);
  const seen = await new Promise<boolean>((started) => {
    const observer = new MutationObserver(() => {
      if (entering()) finish(true);
    });
    const timer = setTimeout(() => finish(false), 1000);
    function finish(found: boolean) {
      observer.disconnect();
      clearTimeout(timer);
      started(found);
    }
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-enter", "data-closed"] });
    sheet.open();
  });
  (document.activeElement as HTMLElement | null)?.blur();
  sheet.close();
  return seen;
}

/** Opened again: how long until its panel is there and focus inside it, if within a second. */
async function backIn(): Promise<number | null> {
  const at = performance.now();
  while (performance.now() - at < 1000) {
    await frame();
    if (!panelDown() && panel()!.contains(document.activeElement)) return Math.round(performance.now() - at);
  }
  return null;
}

/** Whether the panel comes to rest on screen, slid all the way in, not held at `translate-y-full`. */
async function slidIn(): Promise<boolean> {
  const at = performance.now();
  while (performance.now() - at < 800) {
    await frame();
    const p = panel();
    if (!p || panelDown() || p.matches("[data-closed], [data-enter], [data-transition]")) continue;
    const box = p.getBoundingClientRect();
    if (Math.abs(box.bottom - innerHeight) <= 1 && box.top < innerHeight - 40) return true;
  }
  return false;
}

/** Closed for good: whether the page is still held once the sheet has gone. */
async function heldOnceGone() {
  sheet.close();
  const at = performance.now();
  while ((dialog() || held()) && performance.now() - at < 2000) await frame();
  return held();
}

/** Closed as its entrance starts and opened again the moment its panel is down while the dialog stays. */
async function inTheWindow(): Promise<Try> {
  if (!(await openThenClose())) return { reopened: false, backMs: null, slidIn: false, heldAfter: await heldOnceGone(), seen: "no entrance" };
  const reopened = await new Promise<boolean>((done) => {
    const observer = new MutationObserver(() => {
      if (!dialog()) return finish(false);
      if (panelDown()) {
        sheet.open();
        finish(true);
      }
    });
    const timer = setTimeout(() => finish(false), 1500);
    function finish(found: boolean) {
      observer.disconnect();
      clearTimeout(timer);
      done(found);
    }
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style", "class"] });
  });
  const backMs = reopened ? await backIn() : null;
  const seen = reopened && backMs === null ? state() : undefined;
  const slid = reopened && backMs !== null ? await slidIn() : false;
  return { reopened, backMs, slidIn: slid, heldAfter: await heldOnceGone(), seen };
}

/** Closed as its entrance starts and opened again `gap` ms after. */
async function atGap(gap: number): Promise<Try> {
  const entered = await openThenClose();
  await wait(gap);
  sheet.open();
  const backMs = await backIn();
  const seen = !entered ? "no entrance" : backMs === null ? state() : undefined;
  const slid = backMs !== null ? await slidIn() : false;
  return { reopened: entered, backMs, slidIn: slid, heldAfter: await heldOnceGone(), seen };
}

function windowCheck(mountsOpen: boolean): Story {
  return {
    render: () => <Reopen mountsOpen={mountsOpen} slowBackdrop />,
    play: async () => {
      if (!realInputOrSkip()) return;
      /* Tried until the window has come four times, for up to 20 tries or
         8s: a busy machine's long frames can carry the close past where it
         opens. */
      const tries: Try[] = [];
      const until = performance.now() + 8000;
      while (tries.length < 20 && tries.filter((t) => t.reopened).length < 4 && performance.now() < until) tries.push(await inTheWindow());
      const reopened = tries.filter((t) => t.reopened);
      console.info(`SHEET REOPEN window, ${mountsOpen ? "mounting open" : "from closed"}: ${JSON.stringify(tries)}`);
      /* A run with no window can't fail, so it doesn't count as a pass. */
      await expect(reopened.length).toBeGreaterThan(0);
      await expect(reopened.filter((t) => t.backMs === null || t.backMs > ENTRANCE_MS || !t.slidIn)).toEqual([]);
      await expect(tries.filter((t) => t.heldAfter)).toEqual([]);
    },
  };
}

export const OpenedAgainAsItsPanelLeavesMountingOpen = windowCheck(true);
export const OpenedAgainAsItsPanelLeavesFromClosed = windowCheck(false);

export const OpenedAgainAtSetGaps: Story = {
  render: () => <Reopen mountsOpen />,
  play: async () => {
    if (!realInputOrSkip()) return;
    const backs: Record<number, (number | null)[]> = {};
    const notes: string[] = [];
    const retried: number[] = [];
    const noEntrance: number[] = [];
    const notIn: number[] = [];
    const leftHeld: number[] = [];
    for (const gap of [20, 40, 60, 100]) {
      backs[gap] = [];
      for (let i = 0; i < 2; i += 1) {
        let t = await atGap(gap);
        /* No entrance seen, so nothing was closed early: tried again, up to
           twice. */
        for (let again = 0; again < 2 && !t.reopened; again += 1) {
          retried.push(gap);
          t = await atGap(gap);
        }
        backs[gap].push(t.backMs);
        if (t.seen) notes.push(`${gap}ms: ${t.seen}`);
        if (!t.reopened) noEntrance.push(gap);
        if (!t.slidIn) notIn.push(gap);
        if (t.heldAfter) leftHeld.push(gap);
      }
    }
    console.info(
      `SHEET REOPEN gaps: ${JSON.stringify(backs)}${notes.length ? ` ${JSON.stringify(notes)}` : ""}${retried.length ? `, retried ${JSON.stringify(retried)}` : ""}`,
    );
    const late = Object.entries(backs).filter(([, ms]) => ms.some((m) => m === null || m > ENTRANCE_MS));
    await expect([late, noEntrance, notIn, leftHeld]).toEqual([[], [], [], []]);
  },
};
