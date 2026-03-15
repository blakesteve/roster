import type { Meta, StoryObj } from "@storybook/react-vite";
import { Disclosure } from "./Disclosure";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Atoms/Disclosure",
  component: Disclosure,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A fundamental interactive atom that toggles the visibility of content. Fully responsive and theme-aware (supports dark mode). It can be used standalone or stacked to create an Accordion.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12">
        <div className="light bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <Story />
        </div>
        <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["white", "soft", "slate", "outline", "ghost"],
      description: "The visual style of the disclosure.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether the disclosure is open by default.",
    },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The standard clean appearance. Crisp white in light mode, elevated gray in dark mode.
 */
export const White: Story = {
  args: {
    variant: "white",
    title: "What is MegaSquad?",
    children:
      "MegaSquad is the ultimate sports pick-em application for you and your friends.",
  },
};

/**
 * A slightly inset, subtle appearance. Great for FAQs or secondary settings.
 */
export const Soft: Story = {
  args: {
    variant: "soft",
    title: "How does this work?",
    children:
      "Disclosures allow users to toggle the visibility of content, keeping the UI clean.",
  },
};

/**
 * A heavier visual weight, providing strong contrast against page backgrounds.
 */
export const Slate: Story = {
  args: {
    variant: "slate",
    title: "Draft Settings",
    defaultOpen: true,
    children: (
      <div className="space-y-2">
        <p className="font-semibold text-inherit">Pick Timer: 60s</p>
        <p className="text-inherit opacity-80">Auto-pick enabled</p>
      </div>
    ),
  },
};

/**
 * A clean, bordered look. Best used when placed against a solid white or very dark background to establish clear boundaries.
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    title: (
      <div className="flex items-center gap-2">
        <span>Subscription</span>
        <Badge variant="success" size="xs">
          ACTIVE
        </Badge>
      </div>
    ),
    children: "Next billing date: Feb 28, 2026.",
  },
};

/**
 * A minimalist approach that blends directly into the background until hovered.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    title: "Advanced Options",
    children: "Only show this to power users who want to break things.",
  },
};
