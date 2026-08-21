import type { Meta, StoryObj } from "@storybook/react-vite";
import { DescriptionList } from "./DescriptionList";
import { InlineCode } from "../../atoms/InlineCode/InlineCode";
import { LabeledDivider } from "../../atoms/LabeledDivider/LabeledDivider";

const stack = [
  { term: "Framework", description: "Next.js 16" },
  { term: "Data", description: "Supabase" },
  { term: "Cache", description: "unstable_cache" },
  { term: "Host", description: "Vercel" },
];

const meta = {
  title: "Molecules/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Label and value pairs: a spec sheet, a metadata panel, a props table, the sidebar of a case study.",
          "",
          "**Why not a table.** A `<table>` claims a two-dimensional relationship — rows that can be compared against each other, columns that mean something. A stack of metadata has neither. `<dl>` is the element the spec actually provides for this, and screen readers announce the pairing, so *\"Framework, Next.js 16\"* arrives as one fact instead of two loose strings.",
          "",
          "**Why not a grid of divs.** Same reason. The markup is free and the semantics are not.",
          "",
          "**About `display: contents`.** In the `inline` layout each row is wrapped in a `contents` div. That keeps the `<dt>` and `<dd>` grouped in the markup while letting the grid treat them as direct children, so the term column can size itself to the longest term across every row. Without it you would need either loose siblings or a nested grid per row, and neither aligns.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["inline", "stacked", "split"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    dividers: { control: "boolean" },
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { items: stack },
};

export const Layouts: Story = {
  args: { items: stack },
  render: () => (
    <div className="rst:grid rst:gap-8 rst:sm:grid-cols-3">
      <div className="rst:flex rst:flex-col rst:gap-3">
        <LabeledDivider label="Inline" />
        <DescriptionList items={stack} layout="inline" />
      </div>
      <div className="rst:flex rst:flex-col rst:gap-3">
        <LabeledDivider label="Stacked" />
        <DescriptionList items={stack} layout="stacked" />
      </div>
      <div className="rst:flex rst:flex-col rst:gap-3">
        <LabeledDivider label="Split" />
        <DescriptionList items={stack} layout="split" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "`inline` is the default: term column sized to its content, values in a second column. It is the most compact and the easiest to scan when the values are short.",
          "",
          "`stacked` puts the term above its value, which is what you want as soon as the values get long enough to wrap — a wrapped value in `inline` leaves a ragged term column.",
          "",
          "`split` pushes the value right and makes it tabular, so a column of numbers lines up on the decimal. Spec sheets, pricing rows, score tables.",
        ].join("\n"),
      },
    },
  },
};

export const Sizes: Story = {
  args: { items: stack },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-8">
      <div className="rst:flex rst:flex-col rst:gap-2">
        <LabeledDivider label="Small — the default" />
        <DescriptionList items={stack} size="sm" />
      </div>
      <div className="rst:flex rst:flex-col rst:gap-2">
        <LabeledDivider label="Medium" />
        <DescriptionList items={stack} size="md" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`sm` is the default because this component's usual home is a sidebar panel, where the list is reference material rather than reading material. `md` suits a list that is the main content of its section.",
      },
    },
  },
};

export const WithDividers: Story = {
  args: { items: stack },
  render: () => (
    <div className="rst:grid rst:max-w-2xl rst:gap-8 rst:sm:grid-cols-2">
      <DescriptionList items={stack} layout="stacked" dividers />
      <DescriptionList items={stack} layout="split" dividers />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Hairlines go under every row *but the last*, so the list does not end on a stray rule that reads as a missing row. Dividers earn their keep in `split`, where the eye has to travel a long way from term to value; in a tight `inline` list they are usually just noise.",
      },
    },
  },
};

export const NodeContent: Story = {
  args: { items: stack },
  render: () => (
    <DescriptionList
      layout="stacked"
      size="md"
      items={[
        {
          term: "Entry point",
          description: <InlineCode>@blakesteve/roster</InlineCode>,
        },
        {
          term: "Table entry",
          description: <InlineCode>@blakesteve/roster/data-table</InlineCode>,
        },
        {
          term: "Reset",
          description: (
            <>
              Opt in from{" "}
              <InlineCode surface="soft">
                @blakesteve/roster/preflight.css
              </InlineCode>
            </>
          ),
        },
        {
          term: "Docs",
          description: (
            <a
              href="https://roster-tan.vercel.app"
              className="rst:text-primary-600 rst:underline rst:dark:text-primary-400"
            >
              roster-tan.vercel.app
            </a>
          ),
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Both `term` and `description` take nodes, so links, code, badges, and icons all drop in. Pair it with `InlineCode` for anything you would otherwise have to describe in words.",
      },
    },
  },
};

export const InAPanel: Story = {
  args: { items: stack },
  render: () => (
    <div className="rst:grid rst:max-w-xl rst:gap-3 rst:sm:grid-cols-2">
      <div className="rst:flex rst:flex-col rst:gap-3 rst:rounded-lg rst:border rst:border-gray-200 rst:p-4 rst:dark:border-gray-800">
        <LabeledDivider label="Stack" />
        <DescriptionList items={stack} />
      </div>
      <div className="rst:flex rst:flex-col rst:gap-3 rst:rounded-lg rst:border rst:border-gray-200 rst:p-4 rst:dark:border-gray-800">
        <LabeledDivider label="Also shipped" />
        <DescriptionList
          items={[
            { term: "Bot", description: "Discord slash commands" },
            { term: "Auth", description: "Anonymous fingerprint" },
            { term: "Egg", description: "CRT mode, Konami" },
          ]}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The pattern this was extracted from: the sidebar of a case study, where two or three of these stack under labeled rules. Roughly this exact markup was hand-rolled twice on the same page before it became a component.",
      },
    },
  },
};

export const LongValues: Story = {
  args: { items: stack },
  render: () => {
    const items = [
      {
        term: "Why",
        description:
          "A login wall on a poll about game controllers would have killed the sample size, so votes are keyed to a browser fingerprint instead.",
      },
      {
        term: "Cost",
        description:
          "Duplicate votes from the same person on two devices. Acceptable at this scale, and cheaper than the votes never cast.",
      },
    ];
    return (
      <div className="rst:grid rst:max-w-2xl rst:gap-8 rst:sm:grid-cols-2">
        <div className="rst:flex rst:flex-col rst:gap-2">
          <LabeledDivider label="Inline — ragged" />
          <DescriptionList items={items} layout="inline" />
        </div>
        <div className="rst:flex rst:flex-col rst:gap-2">
          <LabeledDivider label="Stacked — better" />
          <DescriptionList items={items} layout="stacked" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Side by side, the rule of thumb becomes obvious: once a value wraps, `inline` leaves the term column stranded at the top of a tall row. Switch to `stacked` and the pairing stays tight.",
      },
    },
  },
};

export const Empty: Story = {
  args: { items: [] },
  parameters: {
    docs: {
      description: {
        story:
          "An empty `items` array renders an empty `<dl>` and nothing else — no placeholder, no zero state. If a panel should say something when it has no data, that is `EmptyState`'s job, not this one's.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { items: stack },
  render: () => (
    <div className="dark">
      <div className="rst:grid rst:gap-6 rst:rounded-xl rst:bg-gray-950 rst:p-6 rst:sm:grid-cols-3">
        <DescriptionList items={stack} layout="inline" />
        <DescriptionList items={stack} layout="stacked" dividers />
        <DescriptionList items={stack} layout="split" dividers />
      </div>
    </div>
  ),
};
