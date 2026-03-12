import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPlus,
  faUser,
  faTimes,
  faExclamationCircle,
  faShieldAlt,
  faBolt,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  None: null,
  Check: <FontAwesomeIcon icon={faCheck} />,
  Plus: <FontAwesomeIcon icon={faPlus} />,
  User: <FontAwesomeIcon icon={faUser} />,
  Close: <FontAwesomeIcon icon={faTimes} />,
  Warning: <FontAwesomeIcon icon={faExclamationCircle} />,
  Shield: <FontAwesomeIcon icon={faShieldAlt} />,
  Lightning: <FontAwesomeIcon icon={faBolt} />,
  Idea: <FontAwesomeIcon icon={faLightbulb} />,
};

const meta: Meta<typeof Badge> = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A versatile **Badge** component used to label content, display status, or indicate counts. \n\n✨ **New:** Badges now use an **opacity-based scaling system** for backgrounds and adaptive text colors. \n\n💡 **Light Variant:** We've added a 'light' fill variant that provides a middle ground between 'soft' and 'solid'—perfect for categorized labels that need structure without being overwhelming.",
      },
    },
  },
  argTypes: {
    variant: {
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
      description: "The semantic color theme of the badge.",
      table: { defaultValue: { summary: "primary" } },
    },
    fill: {
      control: "radio",
      options: ["soft", "light", "solid", "outline"], // Added light here
      description: "The visual style (background opacity and border).",
      table: { defaultValue: { summary: "solid" } }, // Reflected your new default
    },
    size: {
      control: "radio",
      options: ["xs", "sm", "md"],
      description: "The size of the badge.",
      table: { defaultValue: { summary: "sm" } },
    },
    statusBadge: {
      control: "boolean",
      description:
        "Transforms the badge into a circular notification dot or status pill.",
      table: { defaultValue: { summary: "false" } },
    },
    leftIcon: {
      options: Object.keys(iconMap),
      mapping: iconMap,
      control: { type: "select", labels: { None: "No Icon" } },
      description: "Icon to display on the left side of the text.",
    },
    rightIcon: {
      options: Object.keys(iconMap),
      mapping: iconMap,
      control: { type: "select", labels: { None: "No Icon" } },
      description: "Icon to display on the right side of the text.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "primary",
    fill: "solid",
    size: "sm",
    leftIcon: "None",
  },
};

export const SuccessSolid: Story = {
  args: {
    children: "Verified",
    variant: "success",
    fill: "solid",
    leftIcon: "Shield",
  },
};

// Testing the brand new middle-ground variant!
export const TealLight: Story = {
  args: {
    children: "Subtle Hint",
    variant: "teal",
    fill: "light",
    leftIcon: "Idea",
  },
};

export const ErrorOutline: Story = {
  args: {
    children: "Failed",
    variant: "error",
    fill: "outline",
    rightIcon: "Warning",
  },
};

export const UserBadge: Story = {
  args: {
    children: "Admin",
    variant: "orange",
    fill: "soft",
    leftIcon: "User",
  },
};

export const NotificationCount: Story = {
  args: {
    children: "3",
    statusBadge: true,
    variant: "error",
    fill: "solid",
    size: "sm",
  },
};

export const AmberSolidTest: Story = {
  args: {
    children: "New Feature",
    variant: "amber",
    fill: "solid",
    size: "sm",
    leftIcon: "Lightning",
  },
};
