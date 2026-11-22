import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
} from "@headlessui/react";
import { Combobox } from "./Combobox";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Combobox as Chromium's accessibility tree hands it to a screen reader
 * (.storybook/ax-tree.ts), open and closed.
 *
 * - **An open Combobox keeps its field's name.** Headless UI's options panel
 *   is modal by default and makes the rest of the page inert while it's open,
 *   the field's own label with it, so the input lost its name just as
 *   someone chose from it. The twin is that panel, Headless UI's defaults
 *   with the same label: its input has no name while open.
 * - **The toggle is named:** "Show options for" the field's label, or "Show
 *   options" with none, replaceable through `labels.showOptions`. The twin is
 *   Headless UI's button as Roster used it, with no name.
 *
 * The expected names are literals, written from the requirement, not read
 * from the component.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Combobox/Accessibility tree",
  /* `ax-tree` runs these in their own project (vite.config.ts). */
  tags: ["!dev", "!autodocs", "ax-tree"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "utc", label: "UTC" },
  { value: "accra", label: "Africa/Accra" },
  { value: "chicago", label: "America/Chicago" },
];
const noop = () => {};

/* The twin: Headless UI's combobox as Roster drew it on 5.22, the options
   modal by default and the toggle unnamed. */
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

/** Reads role and name for each field's input and toggle, by case. */
async function names(real: NonNullable<ReturnType<typeof realInputOrSkip>>, cases: string[]) {
  const probes: string[] = [];
  const selectors = cases.flatMap((c) =>
    ["input", "button"].map((part) => {
      const probe = `${c}-${part}-${Math.random().toString(36).slice(2)}`;
      document.querySelector(`[data-case="${c}"] ${part}`)!.setAttribute("data-ax-probe", probe);
      probes.push(probe);
      return `[data-ax-probe="${probe}"]`;
    }),
  );
  const states = await real.commands.axStates(selectors);
  for (const selector of selectors) document.querySelector(selector)?.removeAttribute("data-ax-probe");
  return Object.fromEntries(cases.map((c, i) => [c, states.slice(i * 2, i * 2 + 2).map((s) => `${s.role} "${s.name}"`)]));
}

async function open(real: NonNullable<ReturnType<typeof realInputOrSkip>>, c: string) {
  await real.commands.realClick(`[data-case="${c}"] button`);
  await waitFor(() => expect(listbox()).not.toBeNull());
}
async function close(real: NonNullable<ReturnType<typeof realInputOrSkip>>) {
  await real.commands.realPress(["Escape"]);
  await waitFor(() => expect(listbox()).toBeNull());
}

export const AnOpenComboboxKeepsItsName: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, width: 320 }}>
      <div data-case="labelled">
        <Combobox label="Time zone" options={OPTIONS} value="utc" onChange={noop} />
      </div>
      <div data-case="twin">
        <HeadlessDefaults />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const closed = await names(real, ["labelled", "twin"]);
    await open(real, "labelled");
    const roster = await names(real, ["labelled"]);
    await close(real);
    await open(real, "twin");
    const twin = await names(real, ["twin"]);
    await close(real);
    console.info(`COMBOBOX TREE ${JSON.stringify({ closed, open: { ...roster, ...twin } })}`);

    await expect(closed.labelled).toEqual(['combobox "Time zone"', 'button "Show options for Time zone"']);
    /* Open, the same names. */
    await expect(roster.labelled).toEqual(['combobox "Time zone"', 'button "Show options for Time zone"']);
    /* The twin: named closed, nameless open, and its toggle never named. */
    await expect(closed.twin).toEqual(['combobox "Time zone"', 'button ""']);
    await expect(twin.twin).toEqual(['combobox ""', 'button ""']);
  },
};

export const TheTogglesNameIsReplaceable: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, width: 320 }}>
      <div data-case="unlabelled">
        <Combobox options={OPTIONS} value={null} onChange={noop} />
      </div>
      <div data-case="replaced">
        <Combobox label="Fuseau horaire" options={OPTIONS} value={null} onChange={noop} labels={{ showOptions: (label) => `Afficher les options : ${label}` }} />
      </div>
      <div data-case="undefined">
        {/* A catalog missing the key keeps the English. */}
        <Combobox label="Time zone" options={OPTIONS} value={null} onChange={noop} labels={{ showOptions: undefined }} />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const read = await names(real, ["unlabelled", "replaced", "undefined"]);
    console.info(`COMBOBOX TOGGLE ${JSON.stringify(read)}`);
    await expect(read.unlabelled[1]).toBe('button "Show options"');
    await expect(read.replaced[1]).toBe('button "Afficher les options : Fuseau horaire"');
    await expect(read.undefined[1]).toBe('button "Show options for Time zone"');
  },
};
