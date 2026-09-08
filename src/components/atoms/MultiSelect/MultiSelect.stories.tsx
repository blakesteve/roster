import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { MultiSelect, type MultiSelectValue } from "./MultiSelect";
import { Select } from "../Select/Select";

const SPORTS = [
  { value: "nfl", label: "NFL" },
  { value: "ncaaf", label: "NCAA Football" },
  { value: "nba", label: "NBA" },
  { value: "wnba", label: "WNBA" },
  { value: "ncaam", label: "NCAA Men's" },
  { value: "mlb", label: "MLB" },
  { value: "nhl", label: "NHL" },
  { value: "mls", label: "MLS" },
];

const meta = {
  title: "Atoms/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A `Select` that holds more than one value.",
          "",
          "Built on the same Headless UI `Listbox` as `Select`, with `multiple` set — the primitive already owns multi-selection, the keyboard model and the `aria-multiselectable` wiring, so what Roster adds is the trigger and the same panel every other anchored popup in the library opens.",
          "",
          "Selections render as chips, and each one is individually dismissible without opening the menu.",
          "",
          "Reach for this over `CheckboxGroup` when the field is one row of a form and the options do not need to be read at a glance. Reach for `CheckboxGroup` when scanning every option matters more than saving the space, or when the options come in labeled categories.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["outline", "soft", "white", "ghost", "slate"],
    },
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    display: { control: "inline-radio", options: ["chips", "count"] },
    clearable: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `value` and `onChange` are applied AFTER the spread, so a story that spreads
 * its `args` cannot freeze the state with the meta's own no-op pair.
 */
function Stateful({
  initial = [],
  ...props
}: Partial<React.ComponentProps<typeof MultiSelect>> & {
  initial?: MultiSelectValue[];
}) {
  const [value, setValue] = useState<MultiSelectValue[]>(initial);
  return (
    <MultiSelect
      options={SPORTS}
      className="rst:max-w-sm"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export const Playground: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: (args) => <Stateful label="Sports" {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /sports/i }));

    /* The panel portals to <body>, so it is outside `canvasElement`. */
    const list = await within(document.body).findByRole("listbox");
    await userEvent.click(within(list).getByRole("option", { name: "NFL" }));
    await userEvent.click(within(list).getByRole("option", { name: "NBA" }));

    /* Still open after two picks. A multi-select that closed on the first one
       would make the second pick cost a reopen, which is the whole difference
       from `Select`. */
    await expect(list).toBeInTheDocument();
    await expect(canvas.getByText("NFL")).toBeInTheDocument();
    await expect(canvas.getByText("NBA")).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "The panel stays open across picks, and each selected option keeps its check mark. Clicking a selected option again removes it.",
      },
    },
  },
};

/**
 * Side by side with the component it is a variation of.
 */
export const NextToSelect: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-wrap rst:items-start rst:gap-4">
      <Stateful label="MultiSelect" initial={["nfl", "nba"]} />
      <Select
        label="Select"
        options={SPORTS}
        value="nfl"
        onChange={() => {}}
        className="rst:max-w-xs"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "An empty MultiSelect is exactly as tall as the Select beside it — the size scale is an alignment contract with whatever shares its row. It grows only once chips need a second line.\n\nOpen both: the panel, its surface, the option rows and the check mark come from `src/internal/popup.ts` rather than from two copies of the same class list.",
      },
    },
  },
};

export const Chips: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-sm">
      <Stateful label="All of them" initial={["nfl", "ncaaf", "nba", "wnba"]} />
      <Stateful
        label="Capped at two"
        initial={["nfl", "ncaaf", "nba", "wnba"]}
        maxChips={2}
      />
      <Stateful
        label="Counted instead"
        initial={["nfl", "ncaaf", "nba", "wnba"]}
        display="count"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("+2")).toBeInTheDocument();
    await expect(canvas.getAllByText("4 selected").length).toBeGreaterThan(0);

    /* Dismiss one, without ever opening the menu. Scoped by count rather than
       by element: the first two fields both hold an NCAA Football chip. */
    const removals = () =>
      canvas.queryAllByRole("button", { name: "Remove NCAA Football" });
    await expect(removals()).toHaveLength(2);
    await userEvent.click(removals()[0]);
    await expect(removals()).toHaveLength(1);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each chip has its own dismiss control, named after the chip — a row of buttons all called \"Remove\" is a row a screen reader user cannot tell apart.\n\nGetting that required restructuring the trigger. A dismiss control is a `<button>` and `ListboxButton` is a button, so the chips cannot be its children; they are **siblings**, with the button stretched `inset-0` across the shell behind them. That keeps the button the full-width element, which is what Headless UI anchors the panel to and sizes it from — a trigger that stopped being full width is how `Combobox` once shipped a 20px unreadable menu.\n\nEverything decorative in the shell is `pointer-events-none`, so a click on a chip's label falls through and opens the menu like the rest of the field. Only the dismiss controls take their events back.\n\n`maxChips` collapses the tail into a `+N` chip; `display=\"count\"` replaces them entirely. Both exist so a field with eight selections does not become four rows tall.",
      },
    },
  },
};

const VARIANTS = ["outline", "soft", "white", "slate", "ghost"] as const;

/**
 * Resolves a CSS color — including `oklab(... / 0.7)` from `border-current/70`
 * — against a known backdrop, by letting the browser composite it.
 *
 * `getComputedStyle` hands back the authored color space with its alpha
 * intact, and parsing that by regex is how a first pass at these numbers
 * produced 2.04 for a border that actually measures 5.59.
 */
function composite(color: string, bg: [number, number, number]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = `rgb(${bg.join(",")})`;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b] as [number, number, number];
}

function ratio(a: [number, number, number], b: [number, number, number]) {
  const lum = (c: [number, number, number]) => {
    const [r, g, b] = c.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [lum(a), lum(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** The nearest painted backdrop, since three of the five fills are transparent. */
function backdrop(el: Element): [number, number, number] {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const match = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      if ((parts[3] ?? 1) > 0) return [parts[0], parts[1], parts[2]];
    }
    node = node.parentElement;
  }
  return [255, 255, 255];
}

/**
 * Every trigger variant, with a selection in each.
 *
 * This story exists because the surface is the variable the chips depend on.
 * `variant="slate"` paints `gray-700`, and `Chip`'s neutral label is also
 * `gray-700`, so the first version of this component rendered chip-shaped
 * holes at 1.00:1 on exactly one variant — invisible in every other story, and
 * invisible to `contrast.test.ts`, which only resolves solid fills.
 */
export const Variants: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-5">
      {VARIANTS.map((variant) => (
        <div key={variant} data-variant={variant}>
          <Stateful label={variant} variant={variant} initial={["nfl", "ncaaf", "nba"]} clearable />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of VARIANTS) {
      const box = canvasElement.querySelector(`[data-variant="${variant}"]`)!;
      const shell = box.querySelector("button[aria-haspopup=listbox]")!.parentElement!;
      const fill = backdrop(shell);

      const chip = shell.querySelector('span[class*="rounded-full"]')!;
      const chipStyle = getComputedStyle(chip);
      const dismiss = chip.querySelector("button")!;
      const clear = shell.querySelector('button[aria-label="Clear selection"]')!;

      const glyph = (el: Element) => {
        const style = getComputedStyle(el);
        const solid = composite(style.color, fill);
        const alpha = parseFloat(style.opacity);
        return solid.map((c, i) =>
          Math.round(alpha * c + (1 - alpha) * fill[i]),
        ) as [number, number, number];
      };

      /* AA text for the label, 1.4.11 for everything that is a boundary or an
         icon standing in for a control. */
      await expect(
        ratio(composite(chipStyle.color, fill), fill),
        `${variant}: chip label`,
      ).toBeGreaterThanOrEqual(4.5);
      await expect(
        ratio(composite(chipStyle.borderTopColor, fill), fill),
        `${variant}: chip border`,
      ).toBeGreaterThanOrEqual(3);
      await expect(
        ratio(glyph(dismiss), fill),
        `${variant}: dismiss glyph`,
      ).toBeGreaterThanOrEqual(3);
      await expect(
        ratio(glyph(clear), fill),
        `${variant}: clear glyph`,
      ).toBeGreaterThanOrEqual(3);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "The chips take `text-inherit` and `border-current` in both schemes rather than `Chip`'s own palette, so they cannot disagree with a surface the consumer chose. The dismiss and clear controls inherit the same way, because the shell is what carries the trigger's color and all three sit inside it.\n\nThe play function measures it: chip label against AA's 4.5:1, and the chip border and both glyphs against 1.4.11's 3:1, on every variant. Colors are composited through a canvas rather than parsed, because `border-current/70` computes to `oklab(... / 0.7)` and reading that with a regex is how a first pass reported 2.04 for a border that measures 5.59.",
      },
    },
  },
};

export const Clearable: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: () => (
    <Stateful label="Sports" initial={["nfl", "nba", "nhl"]} clearable />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Clear selection" }));
    /* Twice: the visible placeholder, and the copy inside the button that
       becomes its accessible name. */
    await expect(canvas.getAllByText("Select options")).toHaveLength(2);
    await expect(
      canvas.queryByRole("button", { name: /^Remove / }),
    ).not.toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "The clear control is a sibling of the trigger rather than a child of it, for the same button-in-a-button reason, and it sits in right padding the trigger reserves when it is present. It appears only when there is something to clear.",
      },
    },
  },
};

export const WithErrorAndHelp: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-sm">
      <Stateful label="Sports" helperText="Pick every sport your squad plays." />
      <Stateful label="Sports" errorMessage="Pick at least one sport." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas
      .getAllByRole("button")
      .find((el) => el.getAttribute("aria-invalid") === "true");
    await expect(invalid).toBeTruthy();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same wording, weight and spacing as `Input`, `Select` and `Combobox`. `errorMessage` implies the error state and sets `aria-invalid` on the trigger.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { options: SPORTS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-4 rst:max-w-sm">
      <Stateful size="sm" label="Small" initial={["nfl"]} />
      <Stateful label="Default" initial={["nfl"]} />
      <Stateful size="lg" label="Large" initial={["nfl"]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The same scale as `Button`, `Input`, `Select` and `Combobox` — `h-9` / `h-10` / `h-11` as a floor, growing from there as chips wrap.",
      },
    },
  },
};
