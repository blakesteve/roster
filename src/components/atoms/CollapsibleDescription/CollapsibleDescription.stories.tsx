import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { CollapsibleDescription } from "./CollapsibleDescription";

const LONG_TEXT =
  "The combat system has been completely overhauled for this entry. Enemies react dynamically to your playstyle, requiring you to constantly adapt your strategy mid-fight. The parry window feels tight but rewarding, and the variety of weapons ensures that no two encounters feel the same. Environmental storytelling is layered and subtle — blink and you'll miss the details that recontextualize everything you thought you knew about the world. The soundtrack shifts seamlessly between tension and relief, and the ambient audio design alone is worth putting on a good pair of headphones for.";

const SHORT_TEXT =
  "A solid entry with great combat and a memorable story.";

const RICH_CONTENT = (
  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
    <p>
      The combat system has been completely overhauled. Enemies react dynamically
      to your playstyle, requiring constant adaptation mid-fight.
    </p>
    <p>
      The parry window feels tight but rewarding, and the variety of weapons
      ensures that no two encounters feel the same.
    </p>
    <p>
      Environmental storytelling is layered and subtle — blink and you&apos;ll
      miss details that recontextualize everything you thought you knew.
    </p>
  </div>
);

const meta = {
  title: "Atoms/CollapsibleDescription",
  component: CollapsibleDescription,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "**CollapsibleDescription** clamps content to a fixed height and reveals a Read more / Show less toggle when the content overflows.\n\n" +
          "### How it works\n" +
          "After every render, the component measures `scrollHeight` vs `clientHeight` on the content element. If the content is taller than the clamped height, it shows the toggle button.\n\n" +
          "### Fade effect\n" +
          "The bottom fade uses CSS `mask-image` rather than a gradient overlay, so it works correctly on **any background color** — no `from-*` color prop needed.\n\n" +
          "### Accepts any children\n" +
          "While the most common usage is a plain text string, `children` accepts any React node — paragraphs, lists, rich formatted content.\n\n" +
          "### i18n\n" +
          "The toggle labels are configurable via `expandLabel` and `collapseLabel`.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "Content to display. Accepts a string or any React node.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Controls the clamped height before the toggle appears.",
      table: { defaultValue: { summary: "md" } },
    },
    expandLabel: {
      control: "text",
      description: "Label shown on the button when the content is collapsed.",
      table: { defaultValue: { summary: "Read more" } },
    },
    collapseLabel: {
      control: "text",
      description: "Label shown on the button when the content is expanded.",
      table: { defaultValue: { summary: "Show less" } },
    },
    className: {
      control: "text",
      description: "Extra CSS classes applied to the outer wrapper.",
    },
  },
} satisfies Meta<typeof CollapsibleDescription>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Decorators ──────────────────────────────────────────────────────────────

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-white p-8 relative">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Light Mode
      </p>
      <div className="mt-4">
        <Story />
      </div>
    </div>
    <div className="dark flex-1 bg-gray-950 p-8 relative border-l border-gray-200 dark:border-gray-800">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Dark Mode
      </p>
      <div className="mt-4">
        <Story />
      </div>
    </div>
  </div>
);

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  tags: ["!autodocs"],
  args: {
    children: LONG_TEXT,
    size: "md",
    expandLabel: "Read more",
    collapseLabel: "Show less",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Live sandbox. Paste in your own long text and adjust the size to see the clamp in action.",
      },
    },
  },
  render: (args) => (
    <CollapsibleDescription {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {args.children as string}
      </p>
    </CollapsibleDescription>
  ),
};

export const Clamped: Story = {
  args: {
    children: LONG_TEXT,
    size: "md",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "When content exceeds the clamped height, the component automatically measures the overflow and shows the toggle. Click **Read more** to expand.",
      },
    },
  },
  render: (args) => (
    <CollapsibleDescription {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {args.children as string}
      </p>
    </CollapsibleDescription>
  ),
};

export const NoClamp: Story = {
  args: {
    children: SHORT_TEXT,
    size: "md",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "When content fits within the clamped height, no toggle is rendered — the component is effectively invisible to the user.",
      },
    },
  },
  render: (args) => (
    <CollapsibleDescription {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {args.children as string}
      </p>
    </CollapsibleDescription>
  ),
};

export const Sizes: Story = {
  args: { children: LONG_TEXT, size: "md" },
  render: () => (
    <div className="flex flex-col gap-8 max-w-xl">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            size=&quot;{size}&quot;
          </p>
          <CollapsibleDescription size={size}>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {LONG_TEXT}
            </p>
          </CollapsibleDescription>
        </div>
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`sm` (~3 lines), `md` (~4–5 lines), and `lg` (~6–7 lines). Choose based on how much preview context is useful for your content.",
      },
    },
  },
};

export const CustomLabels: Story = {
  args: {
    children: LONG_TEXT,
    expandLabel: "See full review",
    collapseLabel: "Collapse review",
    size: "md",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Override `expandLabel` and `collapseLabel` for domain-specific copy or localized strings.",
      },
    },
  },
  render: (args) => (
    <CollapsibleDescription {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {args.children as string}
      </p>
    </CollapsibleDescription>
  ),
};

export const WithRichContent: Story = {
  args: { children: null, size: "md" },
  render: () => (
    <CollapsibleDescription size="md">
      {RICH_CONTENT}
    </CollapsibleDescription>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`children` accepts any React node — here, multiple `<p>` paragraphs are passed directly. The overflow detection works the same regardless of content type.",
      },
    },
  },
};