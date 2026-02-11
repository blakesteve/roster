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
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  None: null,
  Check: <FontAwesomeIcon icon={faCheck} />,
  Plus: <FontAwesomeIcon icon={faPlus} />,
  User: <FontAwesomeIcon icon={faUser} />,
  Close: <FontAwesomeIcon icon={faTimes} />,
  Warning: <FontAwesomeIcon icon={faExclamationCircle} />,
  Shield: <FontAwesomeIcon icon={faShieldAlt} />,
};

const meta: Meta<typeof Badge> = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A versatile **Badge** component used to label content, display status, or indicate counts. It supports a wide range of **semantic colors** and **visual styles** (soft, solid, outline). It also features a **smart 'status pill' mode** that automatically adapts its shape—rendering as a perfect circle for single digits or a rounded pill for text.",
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
      options: ["soft", "solid", "outline"],
      description: "The visual style (background opacity and border).",
      table: { defaultValue: { summary: "soft" } },
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
    fill: "soft",
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
