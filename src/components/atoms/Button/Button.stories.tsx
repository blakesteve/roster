import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  // Auto-generate controls based on your Typescript props
  argTypes: {
    colorScheme: {
      control: "select",
      options: ["primary", "accent", "destructive", "success"],
      description: "The semantic color palette",
      table: { defaultValue: { summary: "primary" } },
    },
    variant: {
      control: "select",
      options: ["solid", "outline", "ghost", "muted", "link"],
      description: "The visual style",
      table: { defaultValue: { summary: "solid" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "md", "lg"],
      table: { defaultValue: { summary: "default" } },
    },
    isLoading: {
      control: "boolean",
      description: "Replaces content with a spinner",
    },
    disabled: {
      control: "boolean",
    },
  },
  args: { onClick: () => console.log("Button Clicked!") },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Interactive Playground ---
export const Playground: Story = {
  args: {
    children: "Mega Button",
    colorScheme: "primary",
    variant: "solid",
    size: "default",
    isLoading: false,
  },
};

// --- Color Schemes ---
export const Primary: Story = {
  args: {
    colorScheme: "primary",
    children: "Primary Action",
  },
};

export const Accent: Story = {
  args: {
    colorScheme: "accent",
    children: "Accent Action",
  },
};

export const Destructive: Story = {
  args: {
    colorScheme: "destructive",
    children: "Delete Account",
  },
};

export const Success: Story = {
  args: {
    colorScheme: "success",
    children: "Complete Order",
  },
};

// --- Variants ---
export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Variant",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Variant",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Variant",
  },
};

// --- States ---
export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Click me",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

// --- Sizes ---
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
