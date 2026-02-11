import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A robust **Avatar** component used to represent a user or entity. It automatically handles image loading errors by falling back to the user's initials. It supports a variety of **sizes**, **shapes**, and semantic **color schemes**, as well as an optional **tooltip** for displaying the full name on hover.",
      },
    },
  },
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
      description: "The semantic color theme for the fallback initials.",
      table: { defaultValue: { summary: "primary" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The dimension of the avatar.",
      table: { defaultValue: { summary: "md" } },
    },
    shape: {
      control: "radio",
      options: ["circle", "square"],
      description: "The geometric shape of the container.",
      table: { defaultValue: { summary: "circle" } },
    },
    src: {
      description: "The URL of the avatar image.",
    },
    initials: {
      description:
        "The fallback text (max 2 chars) if the image fails or is missing.",
    },
    title: {
      description: "Optional text to display in a tooltip on hover/click.",
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initials: "JD",
    colorScheme: "primary",
    size: "md",
  },
};

export const WithImage: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    alt: "Tom Cook",
    initials: "TC",
    size: "lg",
  },
};

export const WithTitleTooltip: Story = {
  args: {
    initials: "MK",
    colorScheme: "purple",
    title: "Michael Knight",
    size: "md",
  },
};

export const Square: Story = {
  args: {
    initials: "AB",
    shape: "square",
    colorScheme: "orange",
    size: "md",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar initials="XS" size="xs" colorScheme="neutral" />
      <Avatar initials="SM" size="sm" colorScheme="teal" />
      <Avatar initials="MD" size="md" colorScheme="primary" />
      <Avatar initials="LG" size="lg" colorScheme="purple" />
      <Avatar initials="XL" size="xl" colorScheme="orange" />
    </div>
  ),
};
