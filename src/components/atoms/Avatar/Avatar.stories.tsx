import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    colorScheme: {
      control: "select",
      options: ["primary", "orange", "teal", "purple", "amber", "neutral"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    shape: {
      control: "radio",
      options: ["circle", "square"],
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
