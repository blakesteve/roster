import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The **Button** is the primary interactive element for triggering actions. It supports multiple **visual hierarchies** (Solid, Outline, Ghost, Link) and a comprehensive **semantic color palette**. It also features built-in support for **loading states** (swapping text for a spinner) and **disabled states** to prevent user interaction during processing.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    colorScheme: {
      control: "select",
      options: [
        "primary",
        "orange",
        "teal",
        "purple",
        "amber",
        "success",
        "error",
        "neutral",
      ],
      description: "The semantic color theme of the button.",
      table: { defaultValue: { summary: "primary" } },
    },
    variant: {
      control: "select",
      options: ["solid", "outline", "ghost", "link"],
      description: "The visual style determining the button's prominence.",
      table: { defaultValue: { summary: "solid" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "The dimension of the button.",
      table: { defaultValue: { summary: "default" } },
    },
    isLoading: {
      control: "boolean",
      description:
        "Replaces the button text with a spinner and prevents interaction.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Dims the button and prevents all user interaction.",
      table: { defaultValue: { summary: "false" } },
    },
    onClick: {
      description: "Callback function fired when the button is clicked.",
    },
  },
  args: {
    onClick: () => console.log("Clicked"),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: "Mega Button",
    colorScheme: "primary",
    variant: "solid",
  },
};

export const Primary: Story = {
  args: { colorScheme: "primary", children: "Primary Action" },
};

export const Orange: Story = {
  args: { colorScheme: "orange", children: "Orange Action" },
};

export const Error: Story = {
  args: { colorScheme: "error", children: "Delete Account" },
};

export const OutlinePrimary: Story = {
  args: {
    variant: "outline",
    colorScheme: "primary",
    children: "Cancel",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    colorScheme: "neutral",
    children: "Back",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Click me",
  },
};
