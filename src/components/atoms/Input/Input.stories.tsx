import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faEnvelope, faEye } from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["outline", "soft", "ghost", "filled"],
    },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// 1. Standard Text Field
export const Default: Story = {
  args: {
    placeholder: "Enter your name...",
    label: "Full Name",
    variant: "outline",
  },
};

// 2. With Icons (Search)
export const Search: Story = {
  args: {
    placeholder: "Search players...",
    variant: "soft",
    startIcon: <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />,
  },
};

// 3. Email with Helper
export const Email: Story = {
  args: {
    type: "email",
    label: "Email Address",
    placeholder: "user@megasquad.com",
    startIcon: <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />,
    helperText: "We'll never share your email.",
    variant: "outline",
  },
};

// 4. Password with Action Icon
export const Password: Story = {
  args: {
    type: "password",
    label: "Password",
    defaultValue: "Secret123",
    endIcon: (
      <button className="hover:text-gray-800 focus:outline-none">
        <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
      </button>
    ),
    variant: "outline",
  },
};

// 5. Error State
export const WithError: Story = {
  args: {
    label: "Username",
    defaultValue: "taken_username",
    errorMessage: "This username is already taken.",
  },
};

// 6. MegaSquad Dark Theme
export const MegaSquadFilled: Story = {
  args: {
    variant: "filled",
    label: "Filter Roster",
    placeholder: "Filter by name...",
  },
  parameters: {
    backgrounds: { default: "dark" }, // Show on dark bg in storybook if configured
  },
};
