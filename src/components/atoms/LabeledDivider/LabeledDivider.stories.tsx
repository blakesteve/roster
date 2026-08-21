import type { Meta, StoryObj } from "@storybook/react-vite";
import { LabeledDivider } from "./LabeledDivider";

const meta = {
  title: "Atoms/LabeledDivider",
  component: LabeledDivider,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A horizontal rule carrying a label, and optionally something on the far side of it.",
          "",
          "**Divider or heading?** This reads as a *section marker*, not a heading — it renders no `<h*>` and stays out of the document outline. That makes it the right tool for lists whose contents already have their own headings, where adding another level would flatten the hierarchy you already have. If the label belongs in the outline, use a heading.",
          "",
          "**Accessibility.** The rule itself is `role=\"presentation\"`, because a decorative line has nothing to announce. The label is ordinary text and stays in the accessibility tree on its own.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    align: { control: "inline-radio", options: ["start", "end"] },
    label: { control: "text" },
    trailing: { control: "text" },
  },
} satisfies Meta<typeof LabeledDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { label: "Selected work" },
};

export const WithTrailing: Story = {
  args: { label: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-lg rst:flex-col rst:gap-6">
      <LabeledDivider label="Selected work" trailing="6 projects" />
      <LabeledDivider label="Writing" trailing="2026" />
      <LabeledDivider label="Components" trailing="40 exported" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The trailing slot is for a count, a total, or a date — a fact about the section rather than a second label. Both slots use the same `Eyebrow`, so they read as a matched pair across the rule.",
      },
    },
  },
};

export const Alignment: Story = {
  args: { label: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-lg rst:flex-col rst:gap-6">
      <LabeledDivider align="start" label="Label first" trailing="12" />
      <LabeledDivider align="end" label="Rule first" trailing="12" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`start` is the default and suits a section opening. `align=\"end\"` leads with the rule, which works for a closing marker or the last row before a footer, where the eye should travel to the label rather than away from it.",
      },
    },
  },
};

export const SeparatingSections: Story = {
  args: { label: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-lg rst:flex-col rst:gap-4">
      <LabeledDivider label="2026" trailing="3 projects" />
      <ul className="rst:m-0 rst:flex rst:list-none rst:flex-col rst:gap-2 rst:p-0 rst:text-sm rst:text-gray-900 rst:dark:text-gray-100">
        <li>Game Verdict — controller versus keyboard, settled</li>
        <li>Roster — the library this component ships in</li>
        <li>blakeb.dev — the portfolio it was extracted from</li>
      </ul>

      <LabeledDivider label="2025" trailing="2 projects" />
      <ul className="rst:m-0 rst:flex rst:list-none rst:flex-col rst:gap-2 rst:p-0 rst:text-sm rst:text-gray-900 rst:dark:text-gray-100">
        <li>MegaSquad — bracket pools that survive a bad Thursday</li>
        <li>InnerSquad — the quieter sibling</li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The pattern this was pulled out for: a long list broken into runs, where each break needs a name and a count but not another heading level.",
      },
    },
  },
};

export const InAPanel: Story = {
  args: { label: "placeholder" },
  render: () => (
    <div className="rst:max-w-sm rst:rounded-lg rst:border rst:border-gray-200 rst:p-4 rst:dark:border-gray-800">
      <LabeledDivider label="Stack" />
      <dl className="rst:m-0 rst:mt-3 rst:grid rst:grid-cols-[auto_1fr] rst:gap-x-3 rst:gap-y-1 rst:text-xs">
        <dt className="rst:font-mono rst:uppercase rst:tracking-wide rst:text-gray-500 rst:dark:text-gray-400">
          Framework
        </dt>
        <dd className="rst:m-0 rst:text-gray-900 rst:dark:text-gray-100">Next.js 16</dd>
        <dt className="rst:font-mono rst:uppercase rst:tracking-wide rst:text-gray-500 rst:dark:text-gray-400">
          Data
        </dt>
        <dd className="rst:m-0 rst:text-gray-900 rst:dark:text-gray-100">Supabase</dd>
        <dt className="rst:font-mono rst:uppercase rst:tracking-wide rst:text-gray-500 rst:dark:text-gray-400">
          Host
        </dt>
        <dd className="rst:m-0 rst:text-gray-900 rst:dark:text-gray-100">Vercel</dd>
      </dl>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Inside a card, a labeled rule gives a panel a title without the weight of a heading — useful when several such panels stack and none of them is more important than the others. Pair it with `DescriptionList` for the body.",
      },
    },
  },
};

export const LongLabels: Story = {
  args: { label: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-xs rst:flex-col rst:gap-6">
      <LabeledDivider label="Everything shipped in 2026" trailing="12" />
      <LabeledDivider label="Short" trailing="Also short" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The rule is `flex-1`, so it absorbs whatever space the labels leave. In a narrow container with a long label the rule shrinks rather than pushing the trailing text out of view.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { label: "placeholder" },
  render: () => (
    <div className="dark">
      <div className="rst:flex rst:flex-col rst:gap-6 rst:rounded-xl rst:bg-gray-950 rst:p-6">
        <LabeledDivider label="Selected work" trailing="6 projects" />
        <LabeledDivider align="end" label="Archive" />
      </div>
    </div>
  ),
};
