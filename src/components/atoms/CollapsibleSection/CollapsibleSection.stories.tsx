import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { CollapsibleSection, type CollapsibleSectionProps } from "./CollapsibleSection";

const LONG_TEXT =
  "The combat system has been completely overhauled for this entry. Enemies react dynamically to your playstyle, requiring you to constantly adapt your strategy mid-fight. The parry window feels tight but rewarding, and the variety of weapons ensures that no two encounters feel the same. Environmental storytelling is layered and subtle — blink and you'll miss the details that recontextualize everything you thought you knew about the world. The soundtrack shifts seamlessly between tension and relief, and the ambient audio design alone is worth putting on a good pair of headphones for.";

const SHORT_TEXT =
  "A solid entry with great combat and a memorable story.";

const GENRES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation",
  "Horror", "Puzzle", "Racing", "Sports", "Platformer",
  "Fighting", "Shooter", "Stealth", "Survival", "Roguelike",
  "Metroidvania", "Visual Novel", "Tower Defense",
];

const meta = {
  title: "Atoms/CollapsibleSection",
  component: CollapsibleSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "**CollapsibleSection** clamps any content to a fixed height and reveals a toggle when it overflows.\n\n" +
          "### How it works\n" +
          "After every render, the component measures `scrollHeight` vs `clientHeight` on the content element. If the content is taller than the clamped height, it shows the toggle button.\n\n" +
          "### Fade effect\n" +
          "The bottom fade uses CSS `mask-image` rather than a gradient overlay, so it works correctly on **any background color** — no `from-*` color prop needed.\n\n" +
          "### Accepts any children\n" +
          "`children` accepts any React node — prose, chip rows, image grids, card lists. The `size` prop covers everything from a single chip row (`xs`) to long-form text (`lg`).\n\n" +
          "### i18n\n" +
          "The toggle labels are fully configurable via `expandLabel` and `collapseLabel`.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "Any content — prose, chips, images, card grids, etc.",
    },
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "md", "lg"],
      description: "Controls the clamped height before the toggle appears.",
      table: { defaultValue: { summary: "md" } },
    },
    expandLabel: {
      control: "text",
      description: "Label shown on the button when the content is collapsed.",
      table: { defaultValue: { summary: "Show more" } },
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
} satisfies Meta<typeof CollapsibleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Decorators ──────────────────────────────────────────────────────────────

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-white p-8 relative min-w-0">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Light Mode
      </p>
      <div className="mt-4">
        <Story />
      </div>
    </div>
    <div className="dark flex-1 bg-gray-950 p-8 relative border-l border-gray-200 dark:border-gray-800 min-w-0">
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
    size: "md",
    expandLabel: "Show more",
    collapseLabel: "Show less",
  } as CollapsibleSectionProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story: "Live sandbox. Adjust size and labels to see the clamp in action.",
      },
    },
  },
  render: (args) => (
    <CollapsibleSection {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {LONG_TEXT}
      </p>
    </CollapsibleSection>
  ),
};

export const ProseContent: Story = {
  args: { size: "md" } as CollapsibleSectionProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The most common use case — clamping a long text block. Click **Show more** to reveal the full content.",
      },
    },
  },
  render: (args) => (
    <CollapsibleSection {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {LONG_TEXT}
      </p>
    </CollapsibleSection>
  ),
};

export const ChipRow: Story = {
  args: {
    size: "xs",
    expandLabel: "Show all genres",
    collapseLabel: "Show less",
  } as CollapsibleSectionProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`size=\"xs\"` clamps to a single chip row (`max-h-9`). When genre tags overflow into a second row, the component shows **Show all genres** — the same pattern as a browse-filter UI. Any React node works as `children`, not just text.",
      },
    },
  },
  render: (args) => (
    <CollapsibleSection {...args}>
      <div className="flex flex-wrap gap-1.5">
        {GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
          >
            {genre}
          </button>
        ))}
      </div>
    </CollapsibleSection>
  ),
};

export const NoClamp: Story = {
  args: { size: "md" } as CollapsibleSectionProps,
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
    <CollapsibleSection {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {SHORT_TEXT}
      </p>
    </CollapsibleSection>
  ),
};

export const Sizes: Story = {
  args: { size: "md" } as CollapsibleSectionProps,
  render: () => (
    <div className="flex flex-col gap-8 max-w-xl">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <div key={size}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            size=&quot;{size}&quot;
          </p>
          {size === "xs" ? (
            <CollapsibleSection size="xs" expandLabel="Show all genres" collapseLabel="Show less">
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          ) : (
            <CollapsibleSection size={size}>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {LONG_TEXT}
              </p>
            </CollapsibleSection>
          )}
        </div>
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`xs` (single chip row), `sm` (~3 lines), `md` (~4–5 lines), `lg` (~6–7 lines). The `xs` size is purpose-built for horizontal chip/tag rows.",
      },
    },
  },
};

export const RichContent: Story = {
  args: { size: "md" } as CollapsibleSectionProps,
  render: () => (
    <CollapsibleSection size="md">
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
    </CollapsibleSection>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`children` accepts any React node — here, multiple `<p>` paragraphs. The overflow detection works the same regardless of content type.",
      },
    },
  },
};

export const CustomLabels: Story = {
  args: {
    expandLabel: "Read more",
    collapseLabel: "Collapse review",
    size: "md",
  } as CollapsibleSectionProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Override `expandLabel` and `collapseLabel` for domain-specific copy — prose descriptions, genre filters, review blurbs, or localized strings.",
      },
    },
  },
  render: (args) => (
    <CollapsibleSection {...args}>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {LONG_TEXT}
      </p>
    </CollapsibleSection>
  ),
};