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
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "accent",
        "accent2",
        "accent3",
        "accent4",
        "success",
        "error",
        "neutral",
      ],
    },
    fill: {
      control: "radio",
      options: ["soft", "solid", "outline"],
      description: "Visual style of the badge",
      table: {
        defaultValue: { summary: "soft" },
      },
    },
    size: {
      control: "radio",
      options: ["xs", "sm", "md"],
    },
    statusBadge: {
      control: "boolean",
      description: "Turn into a circular status indicator (pill)",
    },
    leftIcon: {
      options: Object.keys(iconMap),
      mapping: iconMap,
      control: { type: "select", labels: { None: "No Icon" } },
    },
    rightIcon: {
      options: Object.keys(iconMap),
      mapping: iconMap,
      control: { type: "select", labels: { None: "No Icon" } },
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
    variant: "accent",
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
