import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Dialog } from "./Dialog";
import { PageRegions } from "../../../test/PageRegions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A dialog opened again while its close is still leaving, checked rendered in
 * Chromium and WebKit.
 *
 * Its panel and backdrop leave together, so on their own the two end
 * together. A `className` that makes the panel's transition quicker (one
 * that drops it, here) ends the panel's leave first on every close. On 5.19.1
 * a dialog opened again before the backdrop's leave ended came back holding
 * the page with no panel.
 *
 * - **Opened again as its panel leaves, it shows its panel** with focus in
 *   the dialog, within the entrance (300ms) and a frame, and then both parts
 *   at full opacity: closed at rest, once nothing is moving, and closed on
 *   the first frame its entrance has started (a set time can land before
 *   that on a busy machine, and nothing turns around), and in the
 *   full-screen layout, whose panel has a transition of its own. The window
 *   is found, not guessed: tried until it has come four times, for up to 12
 *   tries or 8s (the story's limit is 15s), and a run with none fails, as
 *   does a try whose entrance or rest never came. The twin is 5.19.1's
 *   Dialog: every one stuck.
 * - **Opened again as its backdrop leaves, it shows its backdrop.** A
 *   `className` that makes the panel's transition slower ends the backdrop's
 *   leave first, and on 5.19.1 a dialog opened again before the panel's ended
 *   came back with its panel and no backdrop. Closed at rest, found the same
 *   way, and the same twin.
 * - **A closed dialog never leaves the page held.**
 *
 * Each close leaves focus inside, as the dialog's own buttons do. After
 * Escape, which takes focus off first, a dialog opened again during its leave
 * keeps focus on the page: that predates this, and the older reopen check in
 * `Dialog.checks.stories.tsx` logs it. A try that doesn't come back logs what
 * was there: each part, and focus.
 *
 * The quicker and slower panels come from plain classes in a style of the
 * story's own, not utilities: a class named here would ship in `roster.css`.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Dialog/Reopen checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* `Dialog`'s entrance, and a frame. */
const ENTRANCE_MS = 300 + 17;

const dialogs = { open: () => {}, close: () => {} };

/* The panel's transition against the backdrop's. */
type Panel = "quicker" | "slower";

function Reopen({ layout, speed }: { layout: "default" | "fullscreen"; speed: Panel }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    dialogs.open = () => setOpen(true);
    dialogs.close = () => setOpen(false);
  }, []);
  return (
    <PageRegions>
      {/* Unlayered, so they beat Roster's layered utilities: the panel's own
          transition gone, or made longer than the backdrop's. */}
      <style>{".check-quick-panel { transition: none !important; } .check-slow-panel { transition-duration: 700ms !important; }"}</style>
      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Again"
        layout={layout}
        className={speed === "quicker" ? "check-quick-panel" : "check-slow-panel"}
      >
        <button type="button">Inside</button>
      </Dialog>
    </PageRegions>
  );
}

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dialog = () => document.querySelector('[role="dialog"]');
const panel = () => dialog()?.querySelector<HTMLElement>("[id^='headlessui-dialog-panel']") ?? null;
/* Headless UI's backdrop is the dialog's one `aria-hidden` child. */
const backdrop = () => dialog()?.querySelector<HTMLElement>(':scope > [aria-hidden="true"]') ?? null;
/* A part out of the page, or hidden in it: its own leave is over. */
const down = (part: HTMLElement | null) => !part || !!part.closest("[hidden]") || getComputedStyle(part).display === "none";
const panelDown = () => down(panel());
const backdropDown = () => down(backdrop());
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

type Try = { reopened: boolean; backMs: number | null; shown: boolean; heldAfter: boolean; seen?: string };
type CloseAt = "at rest" | "as its entrance starts";

/* Open, and nothing in it moving: the slower panel's entrance is 700ms. */
const atRest = () => {
  const d = dialog();
  return !!d && !!panel() && !panel()!.hasAttribute("data-transition") && d.getAnimations({ subtree: true }).length === 0;
};
/* Both parts drawn at full opacity, not only out of `hidden`. */
const opaque = () => [panel(), backdrop()].every((el) => !!el && !down(el) && getComputedStyle(el).opacity === "1");

/**
 * Opens the dialog, and closes it at rest or the moment its entrance has
 * started. Whether that moment was seen: if not, it closed a second or two
 * later, wherever it was.
 */
async function openThenClose(closeAt: CloseAt): Promise<boolean> {
  for (let i = 0; i < 120 && (dialog() || held()); i += 1) await frame();
  await wait(50);
  let seen = false;
  if (closeAt === "at rest") {
    dialogs.open();
    const at = performance.now();
    while (!seen && performance.now() - at < 2000) {
      await frame();
      seen = atRest();
    }
  } else {
    seen = await new Promise<boolean>((started) => {
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
      dialogs.open();
    });
  }
  dialogs.close();
  return seen;
}

/** Closed, and opened again the moment the quicker part is down while the dialog stays. */
async function closedThenOpenedAgain(closeAt: CloseAt, speed: Panel): Promise<Try> {
  const closedWhereMeant = await openThenClose(closeAt);
  const quickerDown = speed === "quicker" ? panelDown : backdropDown;
  const reopened = await new Promise<boolean>((done) => {
    const observer = new MutationObserver(() => {
      if (!dialog()) return finish(false);
      if (quickerDown()) {
        dialogs.open();
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
  let backMs: number | null = null;
  let shown = false;
  let seen = closedWhereMeant ? undefined : `never ${closeAt}`;
  if (reopened) {
    const at = performance.now();
    while (performance.now() - at < 1000 && backMs === null) {
      await frame();
      if (!panelDown() && !backdropDown() && dialog()?.contains(document.activeElement)) backMs = Math.round(performance.now() - at);
    }
    if (backMs === null) seen = state();
    while (backMs !== null && !shown && performance.now() - at < 1500) {
      await frame();
      shown = opaque();
    }
  }
  dialogs.close();
  const at = performance.now();
  while ((dialog() || held()) && performance.now() - at < 2000) await frame();
  /* Closed somewhere else, it doesn't count as the window coming. */
  return { reopened: reopened && closedWhereMeant, backMs, shown, heldAfter: held(), seen };
}

function check(closeAt: CloseAt, layout: "default" | "fullscreen", speed: Panel): Story {
  return {
    render: () => <Reopen layout={layout} speed={speed} />,
    play: async () => {
      if (!realInputOrSkip()) return;
      const tries: Try[] = [];
      const until = performance.now() + 8000;
      while (tries.length < 12 && tries.filter((t) => t.reopened).length < 4 && performance.now() < until) {
        tries.push(await closedThenOpenedAgain(closeAt, speed));
      }
      const reopened = tries.filter((t) => t.reopened);
      console.info(`DIALOG REOPEN ${layout}, ${speed} panel, closed ${closeAt}: ${JSON.stringify(tries)}`);
      await expect(reopened.length).toBeGreaterThan(0);
      await expect(reopened.filter((t) => t.backMs === null || t.backMs > ENTRANCE_MS || !t.shown)).toEqual([]);
      await expect(tries.filter((t) => t.heldAfter)).toEqual([]);
    },
  };
}

export const OpenedAgainAsItsPanelLeavesClosedAtRest = check("at rest", "default", "quicker");
export const OpenedAgainAsItsPanelLeavesClosedEarly = check("as its entrance starts", "default", "quicker");
export const OpenedAgainAsItsPanelLeavesFullScreen = check("at rest", "fullscreen", "quicker");
export const OpenedAgainAsItsBackdropLeaves = check("at rest", "default", "slower");
