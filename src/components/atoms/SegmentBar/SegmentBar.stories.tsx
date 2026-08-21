import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { SegmentBar, type SegmentBarSegment } from "./SegmentBar";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const INPUT_METHOD: SegmentBarSegment[] = [
  { key: "kbm",        label: "Keyboard & Mouse", value: 58, color: "#6366f1" },
  { key: "controller", label: "Controller",        value: 35, color: "#10b981" },
  { key: "both",       label: "Both",              value: 7,  color: "#f59e0b" },
];

const SURVEY: SegmentBarSegment[] = [
  { key: "strongly-agree",    label: "Strongly agree",    value: 120, color: "#10b981" },
  { key: "agree",             label: "Agree",             value: 85,  color: "#6ee7b7" },
  { key: "neutral",           label: "Neutral",           value: 40,  color: "#d1d5db" },
  { key: "disagree",          label: "Disagree",          value: 22,  color: "#fca5a5" },
  { key: "strongly-disagree", label: "Strongly disagree", value: 8,   color: "#ef4444" },
];

const BUDGET: SegmentBarSegment[] = [
  { key: "eng",     label: "Engineering", value: 420, color: "#6366f1" },
  { key: "design",  label: "Design",      value: 180, color: "#8b5cf6" },
  { key: "mkt",     label: "Marketing",   value: 250, color: "#f59e0b" },
  { key: "support", label: "Support",     value: 150, color: "#0ea5e9" },
];

const DOMINANT: SegmentBarSegment[] = [
  { key: "yes", label: "Yes", value: 97, color: "#10b981" },
  { key: "no",  label: "No",  value: 3,  color: "#ef4444" },
];

const ZERO: SegmentBarSegment[] = [
  { key: "a", label: "Option A", value: 0, color: "#6366f1" },
  { key: "b", label: "Option B", value: 0, color: "#10b981" },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Atoms/SegmentBar",
  component: SegmentBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "**SegmentBar** renders a proportional horizontal bar divided into colored segments.\n\n" +
          "### Usage\n" +
          "Pass an array of `segments` with `key`, `label`, `value`, and `color`. " +
          "Percentages are computed automatically from the sum of all `value` fields — " +
          "you never need to pre-calculate them.\n\n" +
          "### Colors\n" +
          "Colors are passed as plain CSS strings (`'#6366f1'`, `'hsl(...)'`, `'var(--my-color)'`). " +
          "This avoids Tailwind class-purging issues when colors come from data at runtime.\n\n" +
          "### Zero-value handling\n" +
          "Segments with `value: 0` are silently omitted from both the bar and the legend. " +
          "If all segments are zero the component returns `null`.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    segments: {
      control: false,
      description: "Ordered list of segments rendered left to right.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
      description: "Height of the bar track.",
      table: { defaultValue: { summary: "md" } },
    },
    showLegend: {
      control: "boolean",
      description: "Render a dot-and-label legend below the bar.",
      table: { defaultValue: { summary: "true" } },
    },
    className: {
      control: "text",
      description: "Extra classes applied to the outer wrapper.",
    },
  },
} satisfies Meta<typeof SegmentBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Decorators ──────────────────────────────────────────────────────────────

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="rst:flex rst:w-full rst:rounded-xl rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:shadow-sm">
    <div className="light rst:flex-1 rst:bg-white rst:p-8 rst:relative">
      <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest">
        Light Mode
      </p>
      <div className="rst:mt-4 rst:max-w-sm">
        <Story />
      </div>
    </div>
    <div className="dark rst:flex-1 rst:bg-gray-950 rst:p-8 rst:relative rst:border-l rst:border-gray-200 rst:dark:border-gray-800">
      <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest">
        Dark Mode
      </p>
      <div className="rst:mt-4 rst:max-w-sm">
        <Story />
      </div>
    </div>
  </div>
);

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  tags: ["!autodocs"],
  args: {
    segments: INPUT_METHOD,
    size: "md",
    showLegend: true,
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story: "Live sandbox — swap the segments fixture or adjust props via the controls panel.",
      },
    },
  },
};

export const InputMethod: Story = {
  args: { segments: INPUT_METHOD },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Three-way split — the canonical use case this component was extracted from: " +
          "Keyboard & Mouse vs Controller vs Both.",
      },
    },
  },
};

export const SurveyResults: Story = {
  args: { segments: SURVEY },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Five-segment Likert scale. The component handles any number of segments gracefully.",
      },
    },
  },
};

export const BudgetAllocation: Story = {
  args: { segments: BUDGET },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story: "Budget or resource allocation breakdown across departments.",
      },
    },
  },
};

export const DominantSegment: Story = {
  args: { segments: DOMINANT },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "A 97/3 split. Tiny segments still render — down to sub-pixel widths — and " +
          "remain visible in the legend even when barely visible in the bar.",
      },
    },
  },
};

export const NoLegend: Story = {
  args: { segments: INPUT_METHOD, showLegend: false },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Set `showLegend={false}` for compact contexts where the labels are provided " +
          "elsewhere — a table row, a tooltip, or adjacent text.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { segments: INPUT_METHOD, size: "md" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-sm">
      {(["sm", "md"] as const).map((size) => (
        <div key={size}>
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest rst:mb-2">
            size=&quot;{size}&quot;
          </p>
          <SegmentBar segments={INPUT_METHOD} size={size} />
        </div>
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`md` (8 px, default) works well as a standalone element. " +
          "`sm` (6 px) suits dense lists or table rows.",
      },
    },
  },
};

export const ZeroTotal: Story = {
  args: { segments: ZERO },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "When all segment values are zero the component renders `null`. " +
          "This story intentionally shows an empty panel.",
      },
    },
  },
};