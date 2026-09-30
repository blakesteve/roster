import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Stat } from "./Stat";

const meta = {
  title: "Atoms/Stat",
  component: Stat,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A single figure with its label, and optionally where the figure came from.",
          "",
          "**Stat, Badge, or Pill?** Badge and Pill carry a *word*. A Stat carries a *magnitude*, and it is built to be scanned in a row of siblings — which is why the digits are `tabular-nums` and the tracking is tight enough that a four-figure number does not sprawl.",
          "",
          "**About `source`.** The third line is small, quiet, and easy to leave off, and it is the most valuable part of the component. A figure whose provenance is stated (*live · package exports*, *at build time*, *GitHub API*) reads very differently from one that is merely asserted. If you cannot name where a number came from, that is worth knowing before you ship it.",
          "",
          "**Markup.** By default a Stat is a `<div>` holding a `<dt>` (the label) and then a `<dd>` (the value, with the source inside it), which is what a group inside a `<dl>` must be. Put a row of them in a `<dl>`. The value still shows first: the grid places it there, whatever the DOM order. A selector like `[&>dd]` on the Stat reaches the value and the source; the source sets its own face, size, weight and color, so a font rule there changes only the value. The layout uses CSS subgrid (Chrome 117, Safari 16, Firefox 71).",
          "",
          "**Outside a list**, use `semantics=\"standalone\"`, which renders spans: a `<dt>` or `<dd>` anywhere but a `<dl>` is invalid.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    semantics: {
      control: "inline-radio",
      options: ["definition", "standalone"],
      description: "`definition`: a `dt`/`dd` pair for a `<dl>`. `standalone`: spans, for use outside a list.",
      table: { defaultValue: { summary: "definition" } },
    },
    colorScheme: {
      control: "select",
      options: ["primary", "success", "error", "amber", "neutral", "current"],
    },
  },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) =>
    args.semantics === "standalone" ? (
      <Stat {...args} />
    ) : (
      <dl className="rst:m-0">
        <Stat {...args} />
      </dl>
    ),
  args: {
    value: "1,573",
    label: "Verdicts cast",
    source: "live · Supabase",
  },
};

export const Sizes: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:items-end rst:gap-10">
      <Stat size="sm" value="12" label="Small" />
      <Stat size="md" value="1,573" label="Medium — the default" />
      <Stat size="lg" value="98%" label="Large" />
    </dl>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`md` and `lg` are fluid (`clamp`), so a hero figure shrinks on a phone instead of wrapping mid-number. `sm` is fixed, since it is meant for dense rows where a fluid size would make the row jump.",
      },
    },
  },
};

export const ColorSchemes: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-10">
      <Stat colorScheme="neutral" value="1,573" label="Neutral" />
      <Stat colorScheme="primary" value="1,573" label="Primary" />
      <Stat colorScheme="success" value="+18%" label="Success" />
      <Stat colorScheme="error" value="-4.2%" label="Error" />
      <Stat colorScheme="amber" value="3" label="Amber" />
    </dl>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`neutral` is the default because most figures are not good or bad, they are just true. Save `success` and `error` for numbers that genuinely carry a direction.",
      },
    },
  },
};

export const WithSource: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-x-10 rst:gap-y-6">
      <Stat value="1,573" label="Verdicts cast" source="live · Supabase" />
      <Stat value="40" label="Components" source="live · package exports" />
      <Stat value="64%" label="Prefer controller" source="of all verdicts" />
      <Stat value="2.1s" label="Largest paint" source="PageSpeed, mobile" />
    </dl>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The row this component exists for. Note the wrapping `<dl>` — the Stats supply the `<dt>`/`<dd>` pairs, so the list is valid without any extra markup from you. The DOM order is label, then value and source; the layout shows value, label, source.",
      },
    },
  },
};

/**
 * Measured, because the order is now the grid's doing rather than the DOM's.
 */
export const VisualOrder: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-x-10 rst:gap-y-6">
      <Stat value="1,573" label="Orders placed" source="live" />
      <Stat value="40" label="Components" />
    </dl>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const top = (text: string) => canvas.getByText(text).getBoundingClientRect().top;
    await expect(top("1,573")).toBeLessThan(top("Orders placed"));
    await expect(top("Orders placed")).toBeLessThan(top("live"));
    await expect(top("40")).toBeLessThan(top("Components"));
    /* The label and value line up across a mixed row: a source below one
       Stat does not push its neighbor's label down. */
    await expect(Math.abs(top("Orders placed") - top("Components"))).toBeLessThan(1);
    /* The same 3px between lines as the flex column this replaced, with and
       without a source. */
    const box = (text: string) => canvas.getByText(text).closest("dd, dt, span")!.getBoundingClientRect();
    const dt = (text: string) => canvas.getByText(text).closest("dt")!.getBoundingClientRect();
    await expect(dt("Orders placed").top - box("1,573").bottom).toBeCloseTo(3, 0);
    await expect(box("live").top - dt("Orders placed").bottom).toBeCloseTo(3, 0);
    await expect(dt("Components").top - box("40").bottom).toBeCloseTo(3, 0);
    /* One column: every line starts at the same left edge, and the Stat is
       as wide as its widest line, not the label and the value side by side.
       Placed by row alone, the dd once moved to a second column. */
    for (const [v, l, src] of [["1,573", "Orders placed", "live"], ["40", "Components", null]] as const) {
      const lefts = [v, l, src].filter(Boolean).map((t) => canvas.getByText(t as string).getBoundingClientRect().left);
      for (const left of lefts) await expect(Math.abs(left - lefts[0])).toBeLessThan(0.5);
      const stat = canvas.getByText(l).closest("dt")!.parentElement!;
      const widest = Math.max(
        ...[v, l, src].filter(Boolean).map((t) => canvas.getByText(t as string).getBoundingClientRect().width),
      );
      await expect(Math.abs(stat.getBoundingClientRect().width - widest)).toBeLessThan(0.5);
    }
    // And the label is selectable text on top, not under the dd's box.
    const label = canvas.getByText("Orders placed").getBoundingClientRect();
    const hit = document.elementFromPoint(label.left + 2, label.top + label.height / 2);
    await expect(canvas.getByText("Orders placed").contains(hit)).toBe(true);
  },
};

/**
 * `semantics="standalone"` for a Stat that is not in a `<dl>`. It renders
 * spans, and looks the same.
 */
export const Standalone: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-wrap rst:gap-10">
      <Stat semantics="standalone" value="1,573" label="Orders placed" source="live" />
      <Stat semantics="standalone" value="40" label="Components" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("dt, dd")).toBeNull();
    // The same lines as the definition markup: one left edge, 3px apart.
    const canvas = within(canvasElement);
    const box = (t: string) => canvas.getByText(t).getBoundingClientRect();
    await expect(box("Orders placed").left).toBeCloseTo(box("1,573").left, 0);
    await expect(box("live").left).toBeCloseTo(box("1,573").left, 0);
    await expect(box("Orders placed").top - box("1,573").bottom).toBeCloseTo(3, 0);
    await expect(box("live").top - box("Orders placed").bottom).toBeCloseTo(3, 0);
  },
};

export const WithoutSource: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-x-10 rst:gap-y-6">
      <Stat value="16" label="Years shipping" />
      <Stat value="6" label="Projects" />
      <Stat value="1" label="Component library" />
    </dl>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`source` is optional, and figures that are self-evidently static do not need one. The baseline stays consistent whether or not the third line is present, so a mixed row still lines up.",
      },
    },
  },
};

export const InheritsColor: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-10 rst:text-purple-600 rst:dark:text-purple-400">
      <Stat colorScheme="current" value="1,573" label="Verdicts" />
      <Stat colorScheme="current" value="64%" label="Controller" />
    </dl>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`colorScheme=\"current\"` inherits from the parent, which is how a consuming app tints a row of Stats with an accent it computes at runtime, such as each project's own color on a portfolio page.",
      },
    },
  },
};

export const NodeValues: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-x-10 rst:gap-y-6">
      <Stat
        value={
          <>
            1,573<span className="rst:text-base rst:opacity-50">+</span>
          </>
        }
        label="Verdicts"
      />
      <Stat
        value={
          <>
            2.1<span className="rst:text-base rst:opacity-50">s</span>
          </>
        }
        label="Largest paint"
      />
    </dl>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`value` and `label` take nodes, not just strings, so units and suffixes can be de-emphasized without breaking the tabular alignment of the digits themselves.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <div className="dark">
      <dl className="rst:m-0 rst:flex rst:flex-wrap rst:gap-x-10 rst:gap-y-6 rst:rounded-xl rst:bg-gray-950 rst:p-6">
        <Stat value="1,573" label="Verdicts cast" source="live · Supabase" />
        <Stat colorScheme="primary" value="40" label="Components" />
        <Stat colorScheme="success" value="+18%" label="Week over week" />
        <Stat colorScheme="error" value="-4.2%" label="Bounce rate" />
      </dl>
    </div>
  ),
};

/**
 * Restyling the value from outside: a selector on the Stat's `dd` reaches the
 * value and the source, and the source keeps its own face, so a display font
 * set this way changes only the figure. A scoped `<style>` stands in for a
 * consumer's `[&>dd]:font-…` class here.
 */
export const StyledValue: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <>
      <style>{`[data-stat-demo] > dd { font-family: Georgia, serif; }`}</style>
      <dl className="rst:m-0">
        <Stat data-stat-demo="" value="1,573" label="Orders placed" source="live" />
      </dl>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(getComputedStyle(canvas.getByText("1,573")).fontFamily).toContain("Georgia");
    await expect(getComputedStyle(canvas.getByText("live")).fontFamily).not.toContain("Georgia");
    await expect(getComputedStyle(canvas.getByText("live")).fontWeight).toBe("400");
  },
};

