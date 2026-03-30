import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { Avatar, type AvatarProps } from "./Avatar";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A robust **Avatar** component used to represent a user or entity. It automatically handles image loading errors by falling back to the user's initials. It supports a variety of **sizes**, **shapes**, and semantic **color schemes**, as well as an optional **tooltip** for displaying the full name on hover.\n\n✨ **New in v2:** \n* **Crisp Colors:** Light mode now uses solid pastel backgrounds (`bg-[color]-50`) to prevent muddy text, while dark mode intelligently adapts to translucent layers (`bg-[color]-900/30`) for a stained-glass effect.\n* **Popover Upgrades:** The tooltip now perfectly respects dark and light mode contrast layers.",
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

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-white p-12 relative flex flex-col items-center justify-center">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">
        Light Mode
      </p>
      <Story />
    </div>
    <div className="dark flex-1 bg-gray-950 p-12 relative flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">
        Dark Mode
      </p>
      <Story />
    </div>
  </div>
);

export const Default: Story = {
  args: {
    initials: "JD",
    colorScheme: "primary",
    size: "md",
  },
  decorators: [DualPreviewDecorator],
};

export const WithImage: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    alt: "Tom Cook",
    initials: "TC",
    size: "lg",
  },
  decorators: [DualPreviewDecorator],
};

export const WithTitleTooltip: Story = {
  args: {
    initials: "MK",
    colorScheme: "purple",
    title: "Michael Knight",
    size: "md",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Click or hover over the Avatar to see the newly styled, theme-aware popover tooltip.",
      },
    },
  },
};

export const Square: Story = {
  args: {
    initials: "AB",
    shape: "square",
    colorScheme: "orange",
    size: "md",
  },
  decorators: [DualPreviewDecorator],
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
  decorators: [DualPreviewDecorator],
};

const ALL_COLOR_SCHEMES: NonNullable<AvatarProps["colorScheme"]>[] = [
  "primary",
  "orange",
  "teal",
  "purple",
  "amber",
  "success",
  "error",
  "neutral",
];

export const AllVariantsMatrix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 justify-center">
      {ALL_COLOR_SCHEMES.map((color) => (
        <Avatar
          key={color}
          initials={color?.slice(0, 2).toUpperCase()}
          colorScheme={color}
          size="lg"
          title={color}
        />
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "A complete matrix of all semantic color schemes across light and dark modes.",
      },
    },
  },
};
