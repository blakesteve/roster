import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
} from "@headlessui/react";
import { useState } from "react";
import { Combobox } from "./Combobox";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * An open Combobox, under a real mouse and keyboard in Chromium and WebKit
 * (tagged `real-input` for the project that runs both). Chromium's
 * accessibility tree reads the names (Combobox.ax.checks.stories.tsx); WebKit's
 * can't be read from here, so this holds, in both, what those names rest on.
 *
 * - **The label stays live while the list is open:** neither it nor anything
 *   around it is `inert` or `aria-hidden`. The toggle is named "Show options
 *   for" the label, by the accessible-name rules Testing Library uses.
 * - **What modal guarded still holds:** focus stays in the input while the
 *   list is open and its options are walked, Escape closes, and Tab picks the
 *   active option and moves to the next field, as Headless UI documents for
 *   a combobox either way. What changes is the page: it can scroll while the
 *   list is open.
 * - The twin is Headless UI's defaults with the same label: open, its label
 *   is inert and hidden, and the page is locked.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Combobox/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "utc", label: "UTC" },
  { value: "accra", label: "Africa/Accra" },
  { value: "chicago", label: "America/Chicago" },
];
const noop = () => {};

function Roster() {
  const [value, setValue] = useState<string | number | null>(null);
  return <Combobox label="Time zone" options={OPTIONS} value={value} onChange={setValue} />;
}

/* The twin: Headless UI's combobox as Roster drew it on 5.22, its options
   modal by default. */
function HeadlessDefaults() {
  return (
    <Field>
      <Label>Time zone</Label>
      <HeadlessCombobox value={null} onChange={noop}>
        <ComboboxInput />
        <ComboboxButton>
          <span aria-hidden="true">▾</span>
        </ComboboxButton>
        <ComboboxOptions anchor="bottom start">
          {OPTIONS.map((o) => (
            <ComboboxOption key={o.value} value={o.value}>
              {o.label}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </HeadlessCombobox>
    </Field>
  );
}

const listbox = () => document.querySelector('[role="listbox"]');
/* The label, or anything around it up to the page, made inert or hidden. */
const hiddenAround = (el: Element) => {
  const out: string[] = [];
  for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
    if ((node as HTMLElement).inert) out.push(`${node.tagName.toLowerCase()} inert`);
    if (node.getAttribute("aria-hidden") === "true") out.push(`${node.tagName.toLowerCase()} aria-hidden`);
  }
  return out;
};

function Page({ twin = false }: { twin?: boolean }) {
  return (
    <div style={{ display: "grid", gap: 16, width: 320, minHeight: 2000 }}>
      <input data-check="before" aria-label="Before" />
      <div data-check="field">{twin ? <HeadlessDefaults /> : <Roster />}</div>
      <input data-check="after" aria-label="After" />
    </div>
  );
}

export const WhileOpenTheLabelStaysLive: Story = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const field = canvasElement.querySelector('[data-check="field"]')!;
    const input = field.querySelector("input")!;
    await real.commands.realClick('[data-check="field"] button');
    await waitFor(() => expect(listbox()).not.toBeNull());

    await expect(hiddenAround(field.querySelector("label")!), "around the label").toEqual([]);
    await expect(within(field as HTMLElement).getByRole("combobox", { name: "Time zone" })).toBe(input);
    await expect(within(field as HTMLElement).getByRole("button", { name: "Show options for Time zone" })).toBeTruthy();
    /* The page isn't locked: it can scroll while the list is open. */
    await expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");

    /* The keys: focus stays in the input as the options are walked. */
    await waitFor(() => expect(document.activeElement).toBe(input));
    await real.commands.realPress(["ArrowDown"]);
    await real.commands.realPress(["ArrowDown"]);
    await expect(document.activeElement).toBe(input);
    await expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
    await real.commands.realPress(["Escape"]);
    await waitFor(() => expect(listbox()).toBeNull());
    await expect(document.activeElement).toBe(input);

    /* Tab picks the active option and moves on. */
    await real.commands.realPress(["ArrowDown"]);
    await waitFor(() => expect(listbox()).not.toBeNull());
    await real.commands.realPress(["ArrowDown"]);
    await real.commands.realPress(["Tab"]);
    await waitFor(() => expect(listbox()).toBeNull());
    await expect((document.activeElement as HTMLElement).dataset.check).toBe("after");
    await expect(input.value).toBe("Africa/Accra");
  },
};

export const TheTwinLocksAndHides: Story = {
  render: () => <Page twin />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const field = canvasElement.querySelector('[data-check="field"]')!;
    await real.commands.realClick('[data-check="field"] button');
    await waitFor(() => expect(listbox()).not.toBeNull());
    const around = hiddenAround(field.querySelector("label")!);
    const overflow = getComputedStyle(document.documentElement).overflow;
    await real.commands.realPress(["Escape"]);
    await waitFor(() => expect(listbox()).toBeNull());
    console.info(`COMBOBOX TWIN ${JSON.stringify({ around, overflow })}`);
    await expect(around).toEqual(["label inert", "label aria-hidden"]);
    await expect(overflow).toBe("hidden");
  },
};
