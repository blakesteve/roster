import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Sheet } from "./Sheet";
import { realInputOrSkip } from "../../../test/real-input";
import { stallLeave, transitionRunsOn } from "../../../test/leave";

/**
 * How a sheet leaves, checked rendered with real keys in Chromium and WebKit,
 * and under reduced motion in Chromium.
 *
 * - **`onAfterClose` fires once, after the close:** not before it, not twice
 *   (counted past the watchdog's deadline too), with the panel gone or
 *   leaving when it's called and no transition running on it in any frame
 *   after. The twin is a call at the leave's start (`beforeLeave`): the leave
 *   runs after it.
 * - **A leave that never ends is cleaned up.** Headless UI is handed a
 *   transition that never finishes, so it never removes the sheet or calls
 *   `afterLeave`, the end state a close cut into the entrance can leave.
 *   Roster removes it after the leave (200ms, or the 150ms fade under reduced
 *   motion) and a 300ms margin, calls `onAfterClose` once, and the page takes
 *   the next open. Gone sooner would mean the stall didn't hold; the twin is
 *   no watchdog, and it stays.
 * - **A zero-length leave ends through `afterLeave`,** not the watchdog: one
 *   call, made with the panel still in the page, where the watchdog's
 *   removal reports with it gone. Not timed: on a busy machine Headless UI's
 *   own call came 1,453ms after Escape.
 * - **Reopened during the leave, it stays open**, at rest, past the
 *   watchdog's deadline, and that close never reports.
 * - **Escape during the entrance closes**, at points through the 280ms
 *   entrance: gone from the page, never left mounted.
 *
 * Every wait is for a positive end state (the sheet gone, or open and
 * settled), never for "nothing animating", which is also true before an
 * entrance starts.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Sheet/Checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const findPanel = () => document.querySelector<HTMLElement>('[data-testid="sheet-panel"]');
const opener = () => document.querySelector<HTMLElement>("[data-check-open]")!;
const inTransition = () => !!document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-leave], #headlessui-portal-root [data-transition]");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Open: in the page, done entering, with focus inside. */
async function settledOpen() {
  await waitFor(() => expect(dialog()).not.toBeNull());
  await waitFor(() => expect(dialog()!.contains(document.activeElement)).toBe(true));
  await waitFor(() => expect(inTransition()).toBe(false));
}
/* Closed: gone from the page. */
const closed = () => waitFor(() => expect(dialog()).toBeNull(), { timeout: 3000 });

/* Opened from the keyboard, so nothing about the pointer is in play. */
async function openFromKeys(real: NonNullable<ReturnType<typeof realInputOrSkip>>) {
  opener().focus();
  await real.commands.realPress(["Enter"]);
  await settledOpen();
}

type PanelThen = "gone" | "leaving" | "at rest";
type AfterClose = { afterPress: number; atCall: PanelThen; leaveRunsAfter: Promise<boolean> };
const sheet: { pressedAt: number; calls: AfterClose[]; open: (open: boolean) => void } = {
  pressedAt: 0,
  calls: [],
  open: () => {},
};
const panelNow = (): PanelThen => {
  const panel = findPanel();
  if (!panel) return "gone";
  return panel.matches("[data-leave], [data-closed]") ? "leaving" : "at rest";
};

function Closing() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    sheet.open = setOpen;
  }, []);
  return (
    <div>
      <button type="button" data-check-open="" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <Sheet
        isOpen={open}
        onClose={() => setOpen(false)}
        onAfterClose={() =>
          sheet.calls.push({
            afterPress: Math.round(performance.now() - sheet.pressedAt),
            atCall: panelNow(),
            leaveRunsAfter: transitionRunsOn(findPanel),
          })
        }
        title="Details"
      >
        <p>Inside the sheet.</p>
      </Sheet>
    </div>
  );
}

/* ── After the close ──────────────────────────────────────────────────── */

export const OnAfterCloseFiresOnceAfterTheClose: Story = {
  tags: ["real-input", "reduced-motion"],
  render: () => <Closing />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    sheet.calls = [];
    await openFromKeys(real);
    const beforeClose = sheet.calls.length;
    sheet.pressedAt = performance.now();
    await real.commands.realPress(["Escape"]);
    await closed();
    /* Past the watchdog's deadline, the leave and its 300ms margin, so a
       second call from it would be counted. */
    await wait(Math.max(200, 800 - (performance.now() - sheet.pressedAt)));
    const leaveRunsAfter = await Promise.all(sheet.calls.map((c) => c.leaveRunsAfter));
    console.info(`SHEET AFTER CLOSE ${JSON.stringify(sheet.calls)} leave running after the call ${JSON.stringify(leaveRunsAfter)}`);
    await expect(
      `${beforeClose} before, ${sheet.calls.length} after, panel ${sheet.calls.every((c) => c.atCall !== "at rest") ? "gone or leaving" : "still at rest"}, ${
        leaveRunsAfter.some(Boolean) ? "a leave running after the call" : "nothing running after the call"
      }`,
    ).toBe("0 before, 1 after, panel gone or leaving, nothing running after the call");
  },
};

/* ── A leave that never ends ──────────────────────────────────────────── */

export const AStalledLeaveIsRemovedAndReportedOnce: Story = {
  tags: ["real-input", "reduced-motion"],
  render: () => <Closing />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    sheet.calls = [];
    /* The watchdog's deadline: the leave, the fade under reduced motion, and
       its margin. Gone sooner, and Headless UI removed it after all. */
    const deadline = (reducedMotion() ? 150 : 200) + 300;
    await openFromKeys(real);
    stallLeave(findPanel()!);
    sheet.pressedAt = performance.now();
    await real.commands.realPress(["Escape"]);
    await closed();
    const goneAfter = Math.round(performance.now() - sheet.pressedAt);
    await wait(400);
    const calls = sheet.calls.length;
    const focus = (document.activeElement as HTMLElement | null)?.textContent?.trim();
    console.info(`SHEET STALLED gone ${goneAfter}ms after Escape (deadline ${deadline}ms), focus on ${focus}, calls ${JSON.stringify(sheet.calls)}`);
    /* The page is live again: the next open opens, and closes. */
    await openFromKeys(real);
    await real.commands.realPress(["Escape"]);
    await closed();
    await expect(
      `gone ${goneAfter >= deadline - 50 ? "after the leave and the margin" : `too soon, ${goneAfter}ms`}, onAfterClose ${calls} with the panel ${
        sheet.calls[0]?.atCall
      }, opens again`,
    ).toBe("gone after the leave and the margin, onAfterClose 1 with the panel gone, opens again");
  },
};

/* A leave made zero-length, with both of the sheet's durations at 0. */
function ZeroLength() {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--roster-sheet-leave-duration", "0ms");
    root.setProperty("--roster-sheet-fade-duration", "0ms");
    return () => {
      root.removeProperty("--roster-sheet-leave-duration");
      root.removeProperty("--roster-sheet-fade-duration");
    };
  }, []);
  return <Closing />;
}

export const AZeroLengthLeaveEndsThroughAfterLeave: Story = {
  tags: ["real-input", "reduced-motion"],
  render: () => <ZeroLength />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    sheet.calls = [];
    await openFromKeys(real);
    sheet.pressedAt = performance.now();
    await real.commands.realPress(["Escape"]);
    await closed();
    await wait(800);
    console.info(`SHEET ZERO-LENGTH ${JSON.stringify(sheet.calls)}`);
    /* Headless UI ended it and called `afterLeave`, with the panel still in
       the page. The watchdog's removal reports with the panel gone. */
    await expect(sheet.calls.map((c) => (c.atCall === "leaving" ? "once, from afterLeave" : `once, with the panel ${c.atCall}`))).toEqual([
      "once, from afterLeave",
    ]);
  },
};

/* ── Reopened during the leave ────────────────────────────────────────── */

export const ReopenedDuringTheLeaveItStaysOpen: Story = {
  tags: ["real-input"],
  render: () => <Closing />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    sheet.calls = [];
    await openFromKeys(real);
    await real.commands.realPress(["Escape"]);
    await wait(60);
    const leaving = inTransition();
    /* The opener is under the leaving backdrop, so the app reopens it. */
    sheet.open(true);
    /* Past the watchdog's deadline, counted from the close. */
    await wait(900);
    await settledOpen();
    const row = `reopened ${leaving ? "while leaving" : "after the leave"}, open ${!!dialog()}, ${panelNow()}, onAfterClose ${sheet.calls.length}`;
    await real.commands.realPress(["Escape"]);
    await closed();
    await expect(row).toBe("reopened while leaving, open true, at rest, onAfterClose 0");
  },
};

/* ── Escape during the entrance ───────────────────────────────────────── */

export const EscapeDuringTheEntranceCloses: Story = {
  tags: ["real-input"],
  render: () => <Closing />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const outcomes: string[] = [];
    /* Pressed at points through the 280ms entrance. Each must close: gone
       from the page, the positive end state. An Escape never heard fails, and
       so does a sheet closed but left mounted. */
    for (const delay of [0, 40, 120, 200]) {
      opener().click();
      await waitFor(() => expect(dialog()).not.toBeNull());
      if (delay) await wait(delay);
      const midway = inTransition();
      await real.commands.realPress(["Escape"]);
      let end = "closed";
      try {
        await closed();
      } catch {
        end = document.querySelector("#headlessui-portal-root [data-closed][data-enter]") ? "stuck in the transition" : "stayed open";
        sheet.open(false);
        await closed().catch(() => undefined);
      }
      outcomes.push(`${delay}ms${midway ? " (entering)" : ""}: ${end}`);
    }
    console.info(`SHEET ESCAPE ${outcomes.join(", ")}`);
    await expect(outcomes.filter((o) => !o.endsWith(": closed"))).toEqual([]);
    /* The twin of the timing: most presses really did land mid-entrance. */
    await expect(outcomes.filter((o) => o.includes("(entering)")).length).toBeGreaterThanOrEqual(3);
  },
};
