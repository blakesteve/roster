import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Combobox as HeadlessCombobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { Combobox } from "../components/atoms/Combobox/Combobox";
import { Select } from "../components/atoms/Select/Select";
import { MultiSelect } from "../components/atoms/MultiSelect/MultiSelect";
import { Input } from "../components/atoms/Input/Input";
import { Dialog } from "../components/organisms/Dialog/Dialog";
import { realInputOrSkip } from "../test/real-input";

/**
 * An anchored panel's width, and the "ResizeObserver loop" page errors it
 * raised, at 1280 in Chromium and WebKit (tagged `real-input` for the project
 * that runs both).
 *
 * A panel opened while its `Dialog` was still scaling in took Headless UI's
 * `--input-width` or `--button-width`, the control's box as painted, which
 * grew each frame of the entrance. floating-ui's observer, repositioning the
 * panel, resized it again inside the same frame, and the browser reported a
 * loop, 19 to 29 times an open. Roster now sizes the panel from the control's
 * width as laid out (`usePopupWidth`), which a transform doesn't move.
 *
 * - **No page error** from a short list, one that fits below its field:
 *   a Combobox opened 20 times 0 to 100ms into its Dialog's entrance, at 1280
 *   by 720 and by 800, five to a story; a Select and a MultiSelect 5 times
 *   each. Opened from the keyboard, since a pointer waits for a moving box to
 *   settle. The twin, Headless UI's combobox with its panel at
 *   `--input-width` inline as 5.22 had it, raises the error on every open.
 * - **The panel holds its width through the entrance**, read each frame, and
 *   is its control's width once settled, for all three. The twin's grows.
 * - **A long list is floating-ui's, and pinned as it is.** A list taller than
 *   the room below its field takes `max-height` from floating-ui's `size`,
 *   and floating-ui's observer resizing it again in the same delivery raises
 *   up to 5 errors an open in Chromium and 3 in WebKit, entering or settled,
 *   held to 6 (with the painted width on top, 14 to 22). floating-ui fixed that in its
 *   #3528, merged 22 Oct 2026 and not yet released; this bound tightens to
 *   zero when Roster takes the release.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Popup width/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const ZONES = Array.from({ length: 400 }, (_, i) => ({ value: `tz${i}`, label: `Region/City ${i} (UTC+${i % 14})` }));
const SHORT = ZONES.slice(0, 5);
const SPORTS = Array.from({ length: 5 }, (_, i) => ({ value: `s${i}`, label: `Sport ${i}` }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const engine = () => (navigator.userAgent.includes("Chrome") ? "chromium" : "webkit");

/* Set as the story renders, so a check can open and close the Dialog. */
const dialog = { open: () => {}, close: () => {} };

/* The twin: Headless UI's combobox with its panel at `--input-width`, inline. */
function PaintedWidth({ options }: { options: typeof ZONES }) {
  return (
    <HeadlessCombobox value={null} onChange={noop}>
      <ComboboxInput aria-label="Time zone, painted width" style={{ width: "100%", height: 40 }} />
      <ComboboxOptions anchor="bottom start" modal={false} style={{ width: "var(--input-width)", background: "white" }}>
        {options.map((z) => (
          <ComboboxOption key={z.value} value={z.value}>
            {z.label}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </HeadlessCombobox>
  );
}

function OpensADialog({ twin = false, options = SHORT }: { twin?: boolean; options?: typeof ZONES }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    dialog.open = () => setOpen(true);
    dialog.close = () => setOpen(false);
  }, []);
  return (
    <div style={{ minHeight: 1600 }}>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Your details" size="lg">
        <div style={{ display: "grid", gap: 16 }}>
          <Input label="Name" defaultValue="Ann" helperText="What people see" />
          <div data-check="select">
            <Select label="Sport" options={SPORTS} value="s1" onChange={noop} />
          </div>
          <div data-check="multiselect">
            <MultiSelect label="Sports" options={SPORTS} value={["s1"]} onChange={noop} />
          </div>
          <div data-check="combobox">
            {twin ? <PaintedWidth options={options} /> : <Combobox label="Time zone" helperText="For the weekly table" options={options} value={null} onChange={noop} />}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

type Field = "combobox" | "select" | "multiselect";
type Real = NonNullable<ReturnType<typeof realInputOrSkip>>;
const control = (field: Field) =>
  document.querySelector<HTMLElement>(field === "combobox" ? '[data-check="combobox"] input' : `[data-check="${field}"] button[aria-haspopup]`);
const panel = () => document.querySelector<HTMLElement>('[role="listbox"]');
const entering = () => document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-transition]") !== null;

/** Page errors from here on, the twin's kept from the console when asked. */
function listen(quiet = false) {
  const errors: string[] = [];
  const onError = (e: ErrorEvent) => {
    if (!e.message.includes("ResizeObserver loop")) return;
    errors.push(e.message);
    if (quiet) e.preventDefault();
  };
  window.addEventListener("error", onError);
  return { errors, stop: () => window.removeEventListener("error", onError) };
}

async function at1280(real: Real, height: number) {
  await real.page.viewport(1280, height);
  await document.fonts.ready;
  await wait(300);
}

/**
 * Opens the Dialog, waits `gap` ms into its entrance, opens `field` from the
 * keyboard, and counts page errors until it's closed again.
 */
async function openDuringEntrance(real: Real, field: Field, gap: number, errors: string[]) {
  const before = errors.length;
  dialog.open();
  await waitFor(() => expect(control(field)).not.toBeNull());
  await wait(gap);
  control(field)!.focus();
  await real.commands.realPress(["ArrowDown"]);
  await waitFor(() => expect(panel()).not.toBeNull());
  await wait(350);
  dialog.close();
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), { timeout: 3000 });
  await wait(100);
  return errors.length - before;
}

const GAPS = [0, 25, 50, 75, 100];

const shortCombobox = (height: number): Story => ({
  render: () => <OpensADialog />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await at1280(real, height);
    const { errors, stop } = listen();
    const per: number[] = [];
    try {
      for (const gap of GAPS) per.push(await openDuringEntrance(real, "combobox", gap, errors));
    } finally {
      stop();
    }
    console.info(`POPUP WIDTH ${engine()} combobox at 1280x${height}: ${JSON.stringify(per)}`);
    await expect(per).toEqual([0, 0, 0, 0, 0]);
  },
});

/* Five opens a story, so each fits a story's time: twenty in all. */
export const AComboboxOpenedDuringTheEntranceAt720 = shortCombobox(720);
export const AComboboxOpenedDuringTheEntranceAt720Again = shortCombobox(720);
export const AComboboxOpenedDuringTheEntranceAt800 = shortCombobox(800);
export const AComboboxOpenedDuringTheEntranceAt800Again = shortCombobox(800);

export const ASelectAndAMultiSelectToo: Story = {
  render: () => <OpensADialog />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await at1280(real, 800);
    const { errors, stop } = listen();
    const per: Record<string, number[]> = { select: [], multiselect: [] };
    try {
      for (const field of ["select", "multiselect"] as const) for (const gap of GAPS) per[field].push(await openDuringEntrance(real, field, gap, errors));
    } finally {
      stop();
    }
    console.info(`POPUP WIDTH ${engine()} select and multiselect: ${JSON.stringify(per)}`);
    await expect(per).toEqual({ select: [0, 0, 0, 0, 0], multiselect: [0, 0, 0, 0, 0] });
  },
};

export const TheTwinRaisesTheLoop: Story = {
  render: () => <OpensADialog twin />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await at1280(real, 800);
    const { errors, stop } = listen(true);
    const per: number[] = [];
    try {
      for (const gap of [0, 50, 100]) per.push(await openDuringEntrance(real, "combobox", gap, errors));
    } finally {
      stop();
    }
    console.info(`POPUP WIDTH ${engine()} twin: ${JSON.stringify(per)}`);
    for (const n of per) await expect(n).toBeGreaterThan(0);
  },
};

/* The panel's width each frame until 400ms after the Dialog opened (its
   entrance is 300ms), opened at once, and when the first read came. */
async function widthsThroughTheEntrance(real: Real) {
  const t0 = performance.now();
  dialog.open();
  await waitFor(() => expect(control("combobox")).not.toBeNull());
  control("combobox")!.focus();
  await real.commands.realPress(["ArrowDown"]);
  await waitFor(() => expect(panel()).not.toBeNull());
  const firstAt = Math.round(performance.now() - t0);
  const widths = new Set<number>();
  let frames = 0;
  while (performance.now() - t0 < 400) {
    widths.add(Math.round(panel()!.getBoundingClientRect().width * 10) / 10);
    frames += 1;
    await new Promise((r) => requestAnimationFrame(r));
  }
  dialog.close();
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), { timeout: 3000 });
  return { widths: [...widths], frames, firstAt };
}

export const ThePanelHoldsItsWidthThroughTheEntrance: Story = {
  render: () => <OpensADialog />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await at1280(real, 800);
    const read = await widthsThroughTheEntrance(real);
    console.info(`POPUP WIDTH ${engine()} through the entrance: ${JSON.stringify(read)}`);
    /* Premise: read from inside the entrance. */
    await expect(read.firstAt).toBeLessThan(200);
    await expect(read.frames).toBeGreaterThan(5);
    await expect(read.widths).toHaveLength(1);
  },
};

export const TheTwinsWidthGrowsThroughTheEntrance: Story = {
  render: () => <OpensADialog twin />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await at1280(real, 800);
    const { stop } = listen(true);
    try {
      const read = await widthsThroughTheEntrance(real);
      console.info(`POPUP WIDTH ${engine()} twin through the entrance: ${JSON.stringify(read)}`);
      await expect(read.widths.length).toBeGreaterThan(2);
    } finally {
      stop();
    }
  },
};

export const ThePanelIsTheControlsWidth: Story = {
  render: () => <OpensADialog />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.page.viewport(1280, 800);
    dialog.open();
    await waitFor(() => expect(control("combobox")).not.toBeNull());
    await waitFor(() => expect(entering()).toBe(false));
    const widths: Record<string, number[]> = {};
    for (const field of ["combobox", "select", "multiselect"] as const) {
      control(field)!.focus();
      await real.commands.realPress(["ArrowDown"]);
      await waitFor(() => expect(panel()).not.toBeNull());
      await wait(100);
      /* MultiSelect's button is stretched across its shell. */
      widths[field] = [Math.round(control(field)!.getBoundingClientRect().width * 2) / 2, Math.round(panel()!.getBoundingClientRect().width * 2) / 2];
      await real.commands.realPress(["Escape"]);
      await waitFor(() => expect(panel()).toBeNull());
    }
    dialog.close();
    console.info(`POPUP WIDTH ${engine()} widths ${JSON.stringify(widths)}`);
    for (const [field, [of, is]] of Object.entries(widths)) {
      await expect(is, field).toBe(of);
      await expect(is, field).toBeGreaterThan(200);
    }
  },
};

/* floating-ui's own loop: at most this many errors an open, entering or not.
   Measured at most 5 in Chromium and 3 in WebKit, where the painted width on
   top made 14 to 22. */
const FLOATING_UI_LOOP = 6;

export const ALongListIsFloatingUisLoop: Story = {
  render: () => <OpensADialog options={ZONES} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await at1280(real, 800);
    const { errors, stop } = listen(true);
    const per: number[] = [];
    try {
      for (const gap of [0, 50, 400]) per.push(await openDuringEntrance(real, "combobox", gap, errors));
    } finally {
      stop();
    }
    console.info(`POPUP WIDTH ${engine()} long list: ${JSON.stringify(per)}`);
    for (const n of per) await expect(n).toBeLessThanOrEqual(FLOATING_UI_LOOP);
  },
};
