import type { Meta, StoryObj } from "@storybook/react";
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
          "A fundamental interactive atom that toggles the visibility of content. It can be used standalone or stacked to create an Accordion.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["soft", "filled", "outline", "ghost"],
      description: "The visual style of the disclosure.",
    },
    defaultOpen: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

// 1. Soft (Default)
export const Soft: Story = {
  args: {
    variant: "soft",
    title: "How does this work?",
    children:
      "Disclosures allow users to toggle the visibility of content, keeping the UI clean.",
  },
};

// 2. Filled (MegaSquad Style)
export const Filled: Story = {
  args: {
    variant: "filled",
    title: "Draft Settings",
    defaultOpen: true,
    children: (
      <div className="space-y-2">
        <p className="font-semibold">Pick Timer: 60s</p>
        <p className="text-gray-600">Auto-pick enabled</p>
      </div>
    ),
  },
};

// 3. Outline
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
