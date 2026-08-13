import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eyebrow } from "./Eyebrow";

const meta = {
  title: "Atoms/Eyebrow",
  component: Eyebrow,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "The small tracked-out uppercase label that sits above a heading, beside a rule, or at the head of a column.",
          "",
          "Extracted from blakeb.dev, where it lived as a hand-rolled `.u` class and had been used 26 times before anyone noticed it was a component.",
          "",
          "**Why monospace.** At this size, a tracked-out uppercase label in a proportional face just reads as small prose. Monospace makes it read as chrome, which is the entire job — an eyebrow is a wayfinding mark, not a sentence.",
          "",
          "**Eyebrow or heading?** An eyebrow *labels* a section; it never *is* the heading. It renders a `<span>` by default and carries no heading semantics, so it will not appear in a document outline or a screen reader's heading list. If you want it in the outline, that is a heading, not an eyebrow.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["xs", "sm", "md"] },
    tone: {
      control: "inline-radio",
      options: ["faint", "default", "strong", "primary"],
    },
    weight: {
      control: "inline-radio",
      options: ["normal", "medium", "semibold"],
    },
    as: {
      control: false,
      description: "Element to render. Defaults to `span`.",
    },
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "Selected work" },
};

export const Sizes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow size="xs">Extra small — the default</Eyebrow>
      <Eyebrow size="sm">Small</Eyebrow>
      <Eyebrow size="md">Medium</Eyebrow>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tracking tightens as the size grows, because letter spacing that reads as deliberate at 10px reads as broken at 12px. The three sizes are already balanced against each other; you should not need to hand-tune `tracking-*` on top.",
      },
    },
  },
};

export const Tones: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow tone="faint">Faint — the default, for chrome</Eyebrow>
      <Eyebrow tone="default">Default — for a label doing real work</Eyebrow>
      <Eyebrow tone="strong">Strong — when it is nearly a heading</Eyebrow>
      <Eyebrow tone="primary">Primary — for the active one</Eyebrow>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`faint` is the default on purpose. An eyebrow is supposed to lose the contrast fight with the heading beneath it — if it wins, you have two headings.",
      },
    },
  },
};

export const Weights: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow weight="normal">Normal</Eyebrow>
      <Eyebrow weight="medium">Medium</Eyebrow>
      <Eyebrow weight="semibold">Semibold</Eyebrow>
    </div>
  ),
};

export const AboveAHeading: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <Eyebrow tone="primary">Case study</Eyebrow>
      <h2 className="m-0 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Game Verdict
      </h2>
      <p className="m-0 text-sm text-gray-600 dark:text-gray-400">
        Settling the controller-versus-keyboard argument with 1,573 verdicts and
        a fingerprint instead of a login wall.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The canonical use: a kicker naming what kind of thing follows.",
      },
    },
  },
};

export const AsAColumnHead: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="grid max-w-md grid-cols-3 gap-x-6 gap-y-2">
      <Eyebrow>Project</Eyebrow>
      <Eyebrow>Stack</Eyebrow>
      <Eyebrow>Year</Eyebrow>
      {[
        ["Game Verdict", "Next.js", "2025"],
        ["MegaSquad", "Vite", "2024"],
        ["Roster", "Vite lib", "2024"],
      ].map((row) => (
        <div key={row[0]} className="contents">
          {row.map((cell) => (
            <span
              key={cell}
              className="text-sm text-gray-900 dark:text-gray-100"
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "In a grid that is not a real table, an Eyebrow is the honest column head — it labels without claiming `<th>` semantics the markup cannot back up. If it *is* a table, use `Table` and a real `<th>`.",
      },
    },
  },
};

export const PolymorphicAs: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-4">
      <dl className="m-0">
        <dt>
          <Eyebrow>Rendered inside a dt</Eyebrow>
        </dt>
        <dd className="m-0 text-sm text-gray-900 dark:text-gray-100">
          Value
        </dd>
      </dl>
      <Eyebrow as="p" className="m-0">
        Rendered as a paragraph
      </Eyebrow>
      <Eyebrow as="legend">Rendered as a legend</Eyebrow>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`as` swaps the element without touching the styling, for when the surrounding markup wants something specific — a `<dt>`, a `<legend>`, a `<figcaption>`. Reach for it when the semantics demand it, not for looks.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="dark">
      <div className="flex flex-col gap-3 rounded-xl bg-gray-950 p-6">
        <Eyebrow tone="faint">Faint</Eyebrow>
        <Eyebrow tone="default">Default</Eyebrow>
        <Eyebrow tone="strong">Strong</Eyebrow>
        <Eyebrow tone="primary">Primary</Eyebrow>
      </div>
    </div>
  ),
};
