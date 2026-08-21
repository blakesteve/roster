import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faEnvelope, faEye } from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A highly versatile **Input** atom powered by Headless UI. It supports leading and trailing icons, built-in labels, helper text, error validation states, and full dark mode compliance across all variants.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12">
        <div className="light rst:bg-gray-50 rst:p-6 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:mb-6 rst:uppercase rst:tracking-widest">
            Light Mode Preview
          </p>
          <div className="rst:max-w-md">
            <Story />
          </div>
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode Preview
          </p>
          <div className="rst:max-w-md">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["white", "soft", "slate", "outline", "ghost"],
    },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default standard text field. Clean, bordered, and works well on light or dark backgrounds.
 */
export const DefaultOutline: Story = {
  args: {
    placeholder: "Enter your name...",
    label: "Full Name",
    variant: "outline",
  },
};

/**
 * The `white` variant provides a solid, elevated background. Perfect for placing inside tinted cards or gray backgrounds.
 */
export const WhiteWithEmail: Story = {
  args: {
    type: "email",
    label: "Email Address",
    placeholder: "user@megasquad.com",
    startIcon: <FontAwesomeIcon icon={faEnvelope} className="rst:h-4 rst:w-4" />,
    helperText: "We'll never share your email.",
    variant: "white",
  },
};

/**
 * The `soft` variant removes the border and uses a subtle background fill. Great for search bars or high-density forms.
 */
export const SoftSearch: Story = {
  args: {
    placeholder: "Search players...",
    variant: "soft",
    startIcon: <FontAwesomeIcon icon={faSearch} className="rst:h-4 rst:w-4" />,
  },
};

/**
 * The `slate` variant provides a bold, dark background. Originally designed for MegaSquad's heavy dashboard dialogs.
 */
export const MegaSquadSlate: Story = {
  args: {
    variant: "slate",
    label: "Filter Roster",
    placeholder: "Filter by name...",
    startIcon: <FontAwesomeIcon icon={faSearch} className="rst:h-4 rst:w-4" />,
  },
};

/**
 * Showcases how to pass interactive elements into the `endIcon` prop.
 */
export const PasswordAction: Story = {
  args: {
    type: "password",
    label: "Password",
    defaultValue: "Secret123",
    endIcon: (
      <button className="rst:opacity-70 rst:hover:opacity-100 rst:transition-opacity rst:focus:outline-none">
        <FontAwesomeIcon icon={faEye} className="rst:h-4 rst:w-4" />
      </button>
    ),
    variant: "outline",
  },
};

/**
 * Error states automatically override the border, text, and focus ring colors, and explicitly style the helper text.
 */
export const WithError: Story = {
  args: {
    label: "Username",
    defaultValue: "taken_username",
    errorMessage: "This username is already taken.",
    variant: "soft",
    error: true,
  },
};

/**
 * Disabled inputs automatically dim their opacity and prevent user interaction.
 */
export const Disabled: Story = {
  args: {
    label: "League ID",
    defaultValue: "LGE-99482-X",
    disabled: true,
    variant: "soft",
    helperText: "You cannot change your league ID after creation.",
  },
};
