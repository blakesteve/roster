import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
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
      description: "The semantic color palette",
      table: { defaultValue: { summary: "primary" } },
    },
    variant: {
      control: "select",
      options: ["solid", "outline", "ghost", "link"],
      description: "The visual style",
      table: { defaultValue: { summary: "solid" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      table: { defaultValue: { summary: "default" } },
    },
    isLoading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
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
