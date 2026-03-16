import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./Breadcrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Molecules/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A navigation helper that indicates the user's current location within a hierarchical structure. It automatically handles accessibility attributes (`aria-current`, `aria-label`), visually emphasizes the active page, and features comprehensive dark mode resilience.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12 w-full max-w-4xl mx-auto">
        <div className="light bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <div className="max-w-xl">
            <Story />
          </div>
        </div>
        <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <div className="max-w-xl">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "inverse"],
      description: "Color theme applied to the interactive links.",
      table: { defaultValue: { summary: "default" } },
    },
    separator: {
      control: false,
      description: "Custom separator element (defaults to a slash `/`).",
    },
    showHomeIcon: {
      control: "boolean",
      description:
        "If true, adds a clickable Home icon at the start of the chain.",
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const sampleItems = [
  { label: "Leagues", href: "/leagues" },
  { label: "MegaSquad Premier", href: "/leagues/123" },
  { label: "Settings", href: "/leagues/123/settings" },
];

// --- 1. The Playground ---
export const Playground: Story = {
  args: {
    items: sampleItems,
    variant: "default",
    showHomeIcon: true,
  },
};

// --- 2. All Variants Showcase ---
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-gray-400 mb-2">default</p>
        <Breadcrumbs items={sampleItems} variant="default" showHomeIcon />
      </div>
      <div>
        <p className="text-xs font-mono text-gray-400 mb-2">primary</p>
        <Breadcrumbs items={sampleItems} variant="primary" showHomeIcon />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Breadcrumbs automatically style the final item (the current page) as high-contrast, non-interactive text to firmly ground the user in their current location.",
      },
    },
  },
};

// --- 3. Custom Separator ---
export const ChevronSeparator: Story = {
  args: {
    items: sampleItems,
    showHomeIcon: true,
    separator: (
      <FontAwesomeIcon
        icon={faChevronRight}
        className="h-2.5 w-2.5 text-gray-400 dark:text-gray-600 transition-colors"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "You can override the default slash with any React node, such as a customized Chevron icon.",
      },
    },
  },
};

// --- 4. Inverse (Dark Backgrounds) ---
export const InverseOnDark: Story = {
  render: () => (
    <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-md border border-slate-700 shadow-inner">
      <Breadcrumbs items={sampleItems} variant="inverse" showHomeIcon />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Use `variant='inverse'` when placing breadcrumbs inside dark headers, hero sections, or sidebars regardless of the overall app theme. The links default to a muted light-gray and illuminate to pure white on hover.",
      },
    },
  },
};
