import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Dialog, type DialogProps } from "./Dialog";
import { Button } from "../../atoms/Button/Button";
import { realInputOrSkip } from "../../../test/real-input";
import { stallLeave, transitionRunsOn } from "../../../test/leave";

/**
 * The full-screen layout and the hidden title, checked rendered with real
 * keys and a real mouse in Chromium and WebKit.
 *
 * - **The dialog's box is the viewport.** The element carrying
 *   `role="dialog"` measures the viewport, not merely exists: a role on a
 *   box-less wrapper reads as hidden. The twin is the default layout, whose
 *   role sits on a wrapper with no height.
 * - **The hidden title names the dialog and stays a heading**, from the
 *   accessibility tree. The twin hides the title with `display: none`: the
 *   heading leaves the tree, so a screen reader can't reach it by heading.
 *   (The dialog keeps its name even then: a name taken through
 *   `aria-labelledby` reads hidden content too, so the name alone can't tell
 *   the two apart.)
 * - **Focus and keys:** focus starts on the element marked to take it, Tab
 *   stays inside and wraps, Escape closes, focus goes back to the opener, and
 *   the page behind is inert while it's open.
 * - **States:** caught mid-entrance (fading, not scaling), settled open, and
 *   closed, in both layouts.
 * - **Clicks reach your controls** and never close the dialog: the whole
 *   viewport is the panel.
 * - **`onAfterClose` fires once, after the close,** in both layouts: not
 *   before it, not twice (counted past the watchdog's deadline too), with the
 *   panel gone or leaving within a frame of the call, and no transition
 *   running on the panel in any frame after it. The twin is a call at the
 *   leave's start (`beforeLeave`): the leave runs after it. How long the leave
 *   took, and the panel's opacity then, are logged but not asserted: they're
 *   Headless UI's transition, which can skip the leave under load (seen on CI,
 *   Linux WebKit: 152ms after Escape, opacity 1).
 * - **A leave that never ends is cleaned up.** Headless UI is handed a
 *   transition that never finishes, so it never removes the dialog or calls
 *   `afterLeave`, the end state a close cut into the entrance can leave.
 *   Roster removes it after the 200ms leave and its 300ms margin, calls
 *   `onAfterClose` once, and the page takes the next open. Gone sooner would
 *   mean the stall didn't hold; the twin is no watchdog, and it stays.
 * - **Reopened during the leave, it stays open**, at rest, past the
 *   watchdog's deadline, and that close never reports.
 *
 * Every wait is for a positive end state (the dialog gone, or open and
 * settled), never for "nothing animating", which is also true before an
 * entrance starts.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Dialog/Checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);
const tabKey = () => (chromium() ? "Tab" : "Alt+Tab");
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const opener = () => document.querySelector<HTMLElement>("[data-check-open]")!;
const inTransition = () => !!document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-leave], #headlessui-portal-root [data-transition]");

/* Open: in the page, done entering, with focus inside. */
async function settledOpen() {
  await waitFor(() => expect(dialog()).not.toBeNull());
  await waitFor(() => expect(dialog()!.contains(document.activeElement)).toBe(true));
  await waitFor(() => expect(inTransition()).toBe(false));
}
/* Closed: gone from the page. */
const closed = () => waitFor(() => expect(dialog()).toBeNull(), { timeout: 3000 });

const PHOTOS = ["Harbor at dawn", "Ridge trail", "Meadow"];

/* A photo viewer, the shape the layout is for: every control is its own. */
function Viewer(props: Partial<DialogProps>) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <div>
      <button type="button" data-check-open="" onClick={() => setOpen(true)}>
        Open photos
      </button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Photos" titleHidden layout="fullscreen" {...props}>
        <div style={{ height: "100%", display: "grid", gridTemplateRows: "1fr auto", color: "white" }}>
          <div role="img" aria-label={PHOTOS[index]} data-check-photo="" style={{ margin: 24, background: "linear-gradient(#7aa7d9, #2c4a6b)" }} />
          <div style={{ display: "flex", gap: 8, padding: 16, alignItems: "center" }}>
            <span data-check-counter="">
              {index + 1} of {PHOTOS.length}
            </span>
            <Button onClick={() => setIndex((i) => (i + PHOTOS.length - 1) % PHOTOS.length)}>Previous</Button>
            <Button onClick={() => setIndex((i) => (i + 1) % PHOTOS.length)}>Next</Button>
            <Button autoFocus onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/* ── The box ──────────────────────────────────────────────────────────── */

/* Starts the two dialogs over from nothing, after one is left stuck. */
const both = { remount: () => {} };

function Both() {
  const [which, setWhich] = useState<"fullscreen" | "default" | null>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    both.remount = () => {
      setWhich(null);
      setKey((k) => k + 1);
    };
  }, []);
  return (
    <div key={key}>
      <button type="button" data-check-full="" onClick={() => setWhich("fullscreen")}>
        Full screen
      </button>
      <button type="button" data-check-default="" onClick={() => setWhich("default")}>
        Default
      </button>
      {(["fullscreen", "default"] as const).map((layout) => (
        <Dialog key={layout} isOpen={which === layout} onClose={() => setWhich(null)} title={`A ${layout} dialog`} layout={layout}>
          <button type="button">Inside</button>
        </Dialog>
      ))}
    </div>
  );
}

export const TheDialogsBoxIsTheViewport: Story = {
  tags: ["real-input"],
  render: () => <Both />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const box = () => {
      const r = dialog()!.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    };
    const viewport = [0, 0, document.documentElement.clientWidth, window.innerHeight];
    const panelLook = () => {
      const panel = dialog()!.querySelector<HTMLElement>("[id^='headlessui-dialog-panel']")!;
      const s = getComputedStyle(panel);
      const r = panel.getBoundingClientRect();
      return [s.backgroundColor, s.borderTopWidth, s.borderTopLeftRadius, s.paddingTop, s.boxShadow, Math.round(r.width) === viewport[2] && Math.round(r.height) === viewport[3]];
    };

    document.querySelector<HTMLElement>("[data-check-full]")!.focus();
    await real.commands.realPress(["Enter"]);
    await settledOpen();
    const full = { box: box(), panel: panelLook(), close: !!dialog()!.querySelector('[aria-label="Close dialog"]') };
    await real.commands.realPress(["Escape"]);
    await closed();

    /* The twin: the default layout's role sits on a wrapper with no height. */
    document.querySelector<HTMLElement>("[data-check-default]")!.focus();
    await real.commands.realPress(["Enter"]);
    await settledOpen();
    const plain = { height: box()[3], close: !!dialog()!.querySelector('[aria-label="Close dialog"]') };
    await real.commands.realPress(["Escape"]);
    await closed();

    console.info(`DIALOG BOX full ${JSON.stringify(full)} default ${JSON.stringify(plain)} viewport ${viewport}`);
    await expect(full).toEqual({ box: viewport, panel: ["rgba(0, 0, 0, 0)", "0px", "0px", "0px", "none", true], close: false });
    await expect(plain).toEqual({ height: 0, close: true });
  },
};

/* ── The hidden title ─────────────────────────────────────────────────── */

export const TheHiddenTitleNamesTheDialog: Story = {
  tags: ["ax-tree"],
  render: () => <Viewer />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    opener().click();
    await settledOpen();
    const title = dialog()!.querySelector<HTMLElement>("h2")!;
    dialog()!.setAttribute("data-ax-probe", "dialog");
    title.setAttribute("data-ax-probe", "title");
    const probes = ['[data-ax-probe="dialog"]', '[data-ax-probe="title"]'];
    const [named, heading] = await real.commands.axStates(probes);
    const r = title.getBoundingClientRect();
    /* Shown to no one but a screen reader: one pixel, clipped. */
    const seen = [r.width <= 1 && r.height <= 1, getComputedStyle(title).position];
    /* The twin: a title hidden the wrong way leaves the tree. */
    title.style.display = "none";
    const [stillNamed, gone] = await real.commands.axStates(probes);
    title.style.display = "";
    const rows = [
      `dialog "${named.name}", heading ${heading.role} "${heading.name}" ignored ${heading.ignored}`,
      `display none: dialog "${stillNamed.name}", heading ignored ${gone.ignored}`,
    ];
    console.info(`DIALOG NAME ${JSON.stringify([rows, seen])}`);
    await expect([named.role, ...rows, ...seen]).toEqual([
      "dialog",
      'dialog "Photos", heading heading "Photos" ignored false',
      'display none: dialog "Photos", heading ignored true',
      true,
      "absolute",
    ]);
  },
};

/* ── Focus and keys ───────────────────────────────────────────────────── */

export const FocusAndKeysInTheFullscreenLayout: Story = {
  tags: ["real-input"],
  render: () => <Viewer />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const steps: string[] = [];
    const where = () => {
      const el = document.activeElement as HTMLElement;
      return `${el.closest('[role="dialog"]') ? "dialog" : "page"}: ${el.textContent?.trim() || el.tagName.toLowerCase()}`;
    };
    /* From the keyboard, so where focus returns is the dialog's doing alone. */
    opener().focus();
    await real.commands.realPress(["Enter"]);
    await settledOpen();
    steps.push(`opened > ${where()}`);
    const inert = [!!opener().closest("[inert]"), getComputedStyle(document.documentElement).overflow];
    for (let i = 0; i < 4; i++) {
      await real.commands.realPress([tabKey()]);
      await wait(120);
      steps.push(`Tab > ${where()}`);
    }
    await real.commands.realPress(["Shift+" + tabKey()]);
    await wait(120);
    steps.push(`Shift+Tab > ${where()}`);
    await real.commands.realPress(["Escape"]);
    await closed();
    steps.push(`Escape > ${where()}`);
    await expect([...inert, !!opener().closest("[inert]")]).toEqual([true, "hidden", false]);
    await expect(steps).toEqual([
      /* Where the app said: Close carries autoFocus. */
      "opened > dialog: Close",
      /* Round the dialog's own controls, and back: the page is out of reach. */
      "Tab > dialog: Previous",
      "Tab > dialog: Next",
      "Tab > dialog: Close",
      "Tab > dialog: Previous",
      "Shift+Tab > dialog: Close",
      "Escape > page: Open photos",
    ]);
  },
};

/* ── Clicks ───────────────────────────────────────────────────────────── */

export const ClicksReachTheControlsAndNeverClose: Story = {
  tags: ["real-input"],
  render: () => <Viewer />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    opener().focus();
    await real.commands.realPress(["Enter"]);
    await settledOpen();
    const counter = () => document.querySelector("[data-check-counter]")!.textContent;
    /* On the photo, which is no control: nothing closes. */
    await real.commands.realClick("[data-check-photo]");
    await wait(300);
    const afterPhoto = [!!dialog(), counter()];
    await real.commands.realClick('[role="dialog"] button:nth-of-type(2)');
    await waitFor(() => expect(counter()).toBe("2 of 3"));
    /* The app's own Close closes. */
    const close = [...dialog()!.querySelectorAll("button")].find((b) => b.textContent === "Close")!;
    close.setAttribute("data-check-close", "");
    await real.commands.realClick("[data-check-close]");
    await closed();
    await expect(afterPhoto).toEqual([true, "1 of 3"]);
  },
};

/* ── States ───────────────────────────────────────────────────────────── */

export const OpenMidEntranceAndClosedInBothLayouts: Story = {
  tags: ["real-input"],
  render: () => <Both />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    for (const layout of ["fullscreen", "default"] as const) {
      const panel = () => dialog()!.querySelector<HTMLElement>("[id^='headlessui-dialog-panel']")!;
      document.querySelector<HTMLElement>(layout === "fullscreen" ? "[data-check-full]" : "[data-check-default]")!.click();
      /* Caught entering: fading in, and scaling only in the default layout. */
      await waitFor(() => expect(dialog()).not.toBeNull());
      /* Tailwind's `scale-95` is the `scale` property, not `transform`. */
      const scaled = () => !["none", "1"].includes(getComputedStyle(panel()).scale);
      const entering = [inTransition(), Number(getComputedStyle(panel()).opacity) < 1, scaled()];
      await settledOpen();
      const open = [inTransition(), getComputedStyle(panel()).opacity, scaled()];
      await real.commands.realPress(["Escape"]);
      await closed();
      rows.push(`${layout}: entering ${entering.join(" ")} | open ${open.join(" ")} | closed`);
    }
    await expect(rows).toEqual([
      "fullscreen: entering true true false | open false 1 false | closed",
      "default: entering true true true | open false 1 false | closed",
    ]);
  },
};

/* ── After the close ──────────────────────────────────────────────────── */

/* The panel as the call finds it, and a frame later: gone, leaving (Headless
   UI's `data-leave` or `data-closed`), or still there at rest. */
type PanelThen = "gone" | "leaving" | "at rest";
type AfterClose = {
  layout: string;
  afterPress: number;
  opacity: string | null;
  atCall: PanelThen;
  nextFrame?: PanelThen;
  /* Whether a transition ran on the panel in a frame after the call. */
  leaveRunsAfter: Promise<boolean>;
};
const afterClose: { pressedAt: number; calls: AfterClose[]; open: (which: "fullscreen" | "default" | null) => void } = {
  pressedAt: 0,
  calls: [],
  open: () => {},
};
const findPanel = () => document.querySelector<HTMLElement>("#headlessui-portal-root [id^='headlessui-dialog-panel']");
const panelNow = (): [PanelThen, string | null] => {
  const panel = findPanel();
  if (!panel) return ["gone", null];
  return [panel.closest("[data-leave], [data-closed]") || panel.matches("[data-leave], [data-closed]") ? "leaving" : "at rest", getComputedStyle(panel).opacity];
};
const callsFor = (layout: string) => afterClose.calls.filter((c) => c.layout === layout);

function Closing() {
  const [which, setWhich] = useState<"fullscreen" | "default" | null>(null);
  useEffect(() => {
    afterClose.open = setWhich;
  }, []);
  return (
    <div>
      <button type="button" data-check-full="" onClick={() => setWhich("fullscreen")}>
        Full screen
      </button>
      <button type="button" data-check-default="" onClick={() => setWhich("default")}>
        Default
      </button>
      {(["fullscreen", "default"] as const).map((layout) => (
        <Dialog
          key={layout}
          isOpen={which === layout}
          onClose={() => setWhich(null)}
          onAfterClose={() => {
            const [atCall, opacity] = panelNow();
            const call: AfterClose = {
              layout,
              afterPress: Math.round(performance.now() - afterClose.pressedAt),
              opacity,
              atCall,
              leaveRunsAfter: transitionRunsOn(findPanel),
            };
            afterClose.calls.push(call);
            requestAnimationFrame(() => {
              call.nextFrame = panelNow()[0];
            });
          }}
          title={`A ${layout} dialog`}
          layout={layout}
        >
          <button type="button">Inside</button>
        </Dialog>
      ))}
    </div>
  );
}

export const OnAfterCloseFiresOnceAfterTheClose: Story = {
  tags: ["real-input"],
  render: () => <Closing />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    afterClose.calls = [];
    const rows: string[] = [];
    for (const layout of ["fullscreen", "default"] as const) {
      document.querySelector<HTMLElement>(layout === "fullscreen" ? "[data-check-full]" : "[data-check-default]")!.click();
      await settledOpen();
      const beforeClose = afterClose.calls.filter((c) => c.layout === layout).length;
      afterClose.pressedAt = performance.now();
      await real.commands.realPress(["Escape"]);
      await closed();
      /* Past the watchdog's deadline, the 200ms leave and its 300ms margin, so
         a second call from it would be counted. */
      await wait(Math.max(200, 800 - (performance.now() - afterClose.pressedAt)));
      const calls = callsFor(layout);
      const leaveRunsAfter = await Promise.all(calls.map((c) => c.leaveRunsAfter));
      console.info(`DIALOG AFTER CLOSE ${layout} ${JSON.stringify(calls)} leave running after the call ${JSON.stringify(leaveRunsAfter)}`);
      /* The promise: once, after the close, with the panel on its way out and
         its leave over. The leave's length and the opacity are in the log
         above, not asserted. */
      const outOfTheWay = calls.every((c) => c.atCall !== "at rest" || c.nextFrame !== "at rest");
      rows.push(
        `${layout}: ${beforeClose} before, ${calls.length} after, panel ${outOfTheWay ? "gone or leaving" : "still at rest"}, ${
          leaveRunsAfter.some(Boolean) ? "a leave running after the call" : "nothing running after the call"
        }`,
      );
    }
    await expect(rows).toEqual([
      "fullscreen: 0 before, 1 after, panel gone or leaving, nothing running after the call",
      "default: 0 before, 1 after, panel gone or leaving, nothing running after the call",
    ]);
  },
};

/* ── A leave that never ends ──────────────────────────────────────────── */

export const AStalledLeaveIsRemovedAndReportedOnce: Story = {
  tags: ["real-input"],
  render: () => <Closing />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    afterClose.calls = [];
    const rows: string[] = [];
    for (const layout of ["fullscreen", "default"] as const) {
      const openerOf = () => document.querySelector<HTMLElement>(layout === "fullscreen" ? "[data-check-full]" : "[data-check-default]")!;
      openerOf().focus();
      await real.commands.realPress(["Enter"]);
      await settledOpen();
      stallLeave(findPanel()!);
      afterClose.pressedAt = performance.now();
      await real.commands.realPress(["Escape"]);
      await closed();
      const goneAfter = Math.round(performance.now() - afterClose.pressedAt);
      await wait(400);
      const calls = callsFor(layout);
      const focus = (document.activeElement as HTMLElement | null)?.textContent?.trim();
      console.info(`DIALOG STALLED ${layout} gone ${goneAfter}ms after Escape, focus on ${focus}, calls ${JSON.stringify(calls)}`);
      /* The page is live again: the next open opens, and closes. */
      openerOf().focus();
      await real.commands.realPress(["Enter"]);
      await settledOpen();
      await real.commands.realPress(["Escape"]);
      await closed();
      rows.push(
        `${layout}: gone ${goneAfter >= 450 ? "after the leave and the margin" : `too soon, ${goneAfter}ms`}, onAfterClose ${calls.length} with the panel ${
          calls[0]?.atCall
        }, opens again`,
      );
    }
    await expect(rows).toEqual([
      "fullscreen: gone after the leave and the margin, onAfterClose 1 with the panel gone, opens again",
      "default: gone after the leave and the margin, onAfterClose 1 with the panel gone, opens again",
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
    afterClose.calls = [];
    const rows: string[] = [];
    for (const layout of ["fullscreen", "default"] as const) {
      document.querySelector<HTMLElement>(layout === "fullscreen" ? "[data-check-full]" : "[data-check-default]")!.focus();
      await real.commands.realPress(["Enter"]);
      await settledOpen();
      await real.commands.realPress(["Escape"]);
      await wait(60);
      const leaving = inTransition();
      /* The opener is under the leaving scrim, so the app reopens it. */
      afterClose.open(layout);
      /* Past the watchdog's deadline, counted from the close. */
      await wait(900);
      await waitFor(() => expect(dialog() && !inTransition()).toBe(true));
      const focus = document.activeElement as HTMLElement | null;
      console.info(`DIALOG REOPENED ${layout} focus on ${focus?.closest('[role="dialog"]') ? "the dialog" : "the page"}: ${focus?.tagName} ${focus?.textContent?.trim().slice(0, 30)}`);
      rows.push(`${layout}: reopened ${leaving ? "while leaving" : "after the leave"}, open ${!!dialog()}, opacity ${getComputedStyle(findPanel()!).opacity}, onAfterClose ${callsFor(layout).length}`);
      afterClose.open(null);
      await closed();
    }
    await expect(rows).toEqual([
      "fullscreen: reopened while leaving, open true, opacity 1, onAfterClose 0",
      "default: reopened while leaving, open true, opacity 1, onAfterClose 0",
    ]);
  },
};

/* ── Escape during the entrance ───────────────────────────────────────── */

export const EscapeDuringTheEntranceCloses: Story = {
  tags: ["real-input"],
  render: () => <Both />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const outcomes: string[] = [];
    /* Pressed at points through the 300ms entrance, in both layouts. Each
       must close: it ends gone from the page, the positive end state. An
       Escape the dialog never heard fails the check, and so does a dialog
       closed but still mounted, holding `data-closed` and `data-enter`.

       That second ending is Headless UI's transition hook: when a close
       interrupts the entrance, it can stop waiting while a transition is
       unfinished and never look again (about 1 press in 450 in 5.16.0).
       Roster removes such a dialog after the leave and a margin, well inside
       the 3s this waits, so here it closes. */
    for (const layout of ["fullscreen", "default"] as const) {
      for (const delay of [0, 40, 120, 200]) {
        document.querySelector<HTMLElement>(layout === "fullscreen" ? "[data-check-full]" : "[data-check-default]")!.click();
        await waitFor(() => expect(dialog()).not.toBeNull());
        if (delay) await wait(delay);
        const midway = inTransition();
        await real.commands.realPress(["Escape"]);
        let end = "closed";
        try {
          await closed();
        } catch {
          const held = document.querySelector("#headlessui-portal-root [data-closed][data-enter]");
          end = held ? "stuck in the transition" : "stayed open";
          both.remount();
          await closed().catch(() => undefined);
        }
        outcomes.push(`${layout} ${delay}ms${midway ? " (entering)" : ""}: ${end}`);
      }
    }
    console.info(`DIALOG ESCAPE ${outcomes.join(", ")}`);
    await expect(outcomes.filter((o) => !o.endsWith(": closed"))).toEqual([]);
    /* The twin of the timing: most presses really did land mid-entrance. */
    await expect(outcomes.filter((o) => o.includes("(entering)")).length).toBeGreaterThanOrEqual(6);
  },
};
