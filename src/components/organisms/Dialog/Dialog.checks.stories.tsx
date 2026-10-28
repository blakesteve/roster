import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Dialog, type DialogProps } from "./Dialog";
import { Button } from "../../atoms/Button/Button";
import { realInputOrSkip } from "../../../test/real-input";

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
 * - **`onAfterClose` fires once, after the leave,** in both layouts: not
 *   before the close, not as it starts, and not twice.
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

type AfterClose = { layout: string; afterPress: number; opacity: string | null };
const afterClose = { pressedAt: 0, calls: [] as AfterClose[] };

function Closing() {
  const [which, setWhich] = useState<"fullscreen" | "default" | null>(null);
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
            const panel = document.querySelector<HTMLElement>("#headlessui-portal-root [id^='headlessui-dialog-panel']");
            afterClose.calls.push({ layout, afterPress: performance.now() - afterClose.pressedAt, opacity: panel ? getComputedStyle(panel).opacity : null });
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

export const OnAfterCloseFiresOnceAfterTheLeave: Story = {
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
      /* Long enough for a second call, if there were one. */
      await wait(400);
      const calls = afterClose.calls.filter((c) => c.layout === layout);
      console.info(`DIALOG AFTER CLOSE ${layout} ${JSON.stringify(calls)}`);
      /* After the 200ms leave, with the panel faded out: not as it starts. */
      rows.push(`${layout}: ${beforeClose} before, ${calls.length} after, ${calls.every((c) => c.afterPress >= 150) ? "after the leave" : "too early"}, ${calls.map((c) => c.opacity ?? "panel gone").join(" ")}`);
    }
    await expect(rows).toEqual(["fullscreen: 0 before, 1 after, after the leave, 0", "default: 0 before, 1 after, after the leave, 0"]);
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
       must close: it ends gone from the page, the positive end state, and
       an Escape the dialog never heard fails the check.

       One ending is logged rather than failed: closed but still mounted,
       holding `data-closed`, `data-enter` and `data-transition` with nothing
       running. That is Headless UI's transition hook, shared by every dialog
       built on it: when a close interrupts the entrance, it waits only for
       the transitions it saw one frame in, and a transition that starts
       after that is never waited for, so it never finishes. About 1 in 450
       presses in either engine, either layout, 5.16.0's default included. */
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
    await expect(outcomes.filter((o) => o.endsWith("stayed open"))).toEqual([]);
    /* The twin of the timing: most presses really did land mid-entrance. */
    await expect(outcomes.filter((o) => o.includes("(entering)")).length).toBeGreaterThanOrEqual(6);
  },
};
