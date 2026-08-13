import type { Meta, StoryObj } from "@storybook/react-vite";
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
          "**Markup.** Stat renders a `<div>` wrapping a `<dd>`/`<dt>` pair, so a row of them can sit inside a `<dl>` and stay semantically honest. The value comes first in the DOM because it comes first visually; `<dl>` does not require `<dt>` to precede `<dd>`.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    colorScheme: {
      control: "select",
      options: ["primary", "success", "error", "amber", "neutral", "current"],
    },
  },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    value: "1,573",
    label: "Verdicts cast",
    source: "live · Supabase",
  },
};

export const Sizes: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <div className="flex flex-wrap items-end gap-10">
      <Stat size="sm" value="12" label="Small" />
      <Stat size="md" value="1,573" label="Medium — the default" />
      <Stat size="lg" value="98%" label="Large" />
    </div>
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
    <div className="flex flex-wrap gap-10">
      <Stat colorScheme="neutral" value="1,573" label="Neutral" />
      <Stat colorScheme="primary" value="1,573" label="Primary" />
      <Stat colorScheme="success" value="+18%" label="Success" />
      <Stat colorScheme="error" value="-4.2%" label="Error" />
      <Stat colorScheme="amber" value="3" label="Amber" />
    </div>
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
    <dl className="m-0 flex flex-wrap gap-x-10 gap-y-6">
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
          "The row this component exists for. Note the wrapping `<dl>` — the Stats supply the `<dt>`/`<dd>` pairs, so the list is valid without any extra markup from you.",
      },
    },
  },
};

export const WithoutSource: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="m-0 flex flex-wrap gap-x-10 gap-y-6">
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
    <div className="flex flex-wrap gap-10 text-purple-600 dark:text-purple-400">
      <Stat colorScheme="current" value="1,573" label="Verdicts" />
      <Stat colorScheme="current" value="64%" label="Controller" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`colorScheme=\"current\"` inherits from the parent, which is how a consuming app tints a row of Stats with a per-project accent it computes at runtime. blakeb.dev uses this to paint each case study's numbers in that project's own color.",
      },
    },
  },
};

export const NodeValues: Story = {
  args: { value: "0", label: "placeholder" },
  render: () => (
    <dl className="m-0 flex flex-wrap gap-x-10 gap-y-6">
      <Stat
        value={
          <>
            1,573<span className="text-base opacity-50">+</span>
          </>
        }
        label="Verdicts"
      />
      <Stat
        value={
          <>
            2.1<span className="text-base opacity-50">s</span>
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
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-6 rounded-xl bg-gray-950 p-6">
        <Stat value="1,573" label="Verdicts cast" source="live · Supabase" />
        <Stat colorScheme="primary" value="40" label="Components" />
        <Stat colorScheme="success" value="+18%" label="Week over week" />
        <Stat colorScheme="error" value="-4.2%" label="Bounce rate" />
      </dl>
    </div>
  ),
};
