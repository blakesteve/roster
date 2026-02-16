import type { Meta, StoryObj } from "@storybook/react";
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
          "Navigation helper that indicates the current page's location within a navigational hierarchy. It automatically handles accessibility attributes like `aria-current` and supports multiple visual themes.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "inverse", "primary"],
      description: "Color theme. Use 'inverse' for dark backgrounds.",
      table: { defaultValue: { summary: "default" } },
    },
    separator: {
      control: false,
      description: "Custom separator element (defaults to a slash '/').",
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

// 1. Standard (Default Slash)
export const Default: Story = {
  args: {
    items: sampleItems,
    variant: "default",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The default style uses a simple slash `/` separator and neutral gray colors.",
      },
    },
  },
};

// 2. With Home Icon
export const WithHome: Story = {
  args: {
    items: sampleItems,
    showHomeIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use `showHomeIcon` to add a clickable home icon at the start of the trail.",
      },
    },
  },
};

// 3. Custom Separator (Chevron)
export const ChevronSeparator: Story = {
  args: {
    items: sampleItems,
    separator: (
      <FontAwesomeIcon
        icon={faChevronRight}
        className="h-2.5 w-2.5 text-gray-400"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "You can override the default slash with any React node, such as a Chevron icon.",
      },
    },
  },
};

// 4. Inverse (Dark Background)
export const InverseOnDark: Story = {
  args: {
    items: sampleItems,
    variant: "inverse",
    showHomeIcon: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "Use `variant='inverse'` when placing breadcrumbs on a dark header or sidebar. Text is lightened (Gray-400) for readability against dark backgrounds.",
      },
    },
  },
  render: (args) => (
    <div className="bg-slate-900 p-6 rounded-md border border-slate-700">
      <Breadcrumbs {...args} />
    </div>
  ),
};
