import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faPlus,
  faTrash,
  faDownload,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The **Button** is the primary interactive element for triggering actions. It supports multiple **visual hierarchies** (Solid, Soft, Outline, Ghost, Link) and a comprehensive **semantic color palette**. \n\nIt features built-in support for **loading states** (prepending a spinner while maintaining width) and **icon slots** (start/end) to provide visual context.",
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
      options: ["solid", "soft", "outline", "ghost", "link"],
      description: "The visual style determining the button's prominence.",
      table: { defaultValue: { summary: "solid" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg", "icon"],
      description: "The dimension of the button.",
      table: { defaultValue: { summary: "default" } },
    },
    isLoading: {
      control: "boolean",
      description: "Prepends a spinner to the text and disables interaction.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Dims the button and prevents all user interaction.",
      table: { defaultValue: { summary: "false" } },
    },
    startIcon: {
      control: false,
      description: "Icon element placed before the children.",
    },
    endIcon: {
      control: false,
      description: "Icon element placed after the children.",
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

// --- 1. The Playground ---
export const Playground: Story = {
  args: {
    children: "Mega Button",
    colorScheme: "primary",
    variant: "solid",
  },
};

// --- 2. Standard Use Cases ---
export const Primary: Story = {
  args: {
    colorScheme: "primary",
    children: "Submit Picks",
    variant: "solid",
  },
};

export const Soft: Story = {
  args: {
    variant: "soft",
    colorScheme: "teal",
    children: "Save Draft",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The **Soft** variant is perfect for secondary actions. It has less visual weight than 'Solid' but is more discoverable than 'Ghost'.",
      },
    },
  },
};

export const Destructive: Story = {
  args: {
    colorScheme: "error",
    variant: "solid",
    children: "Delete League",
    startIcon: <FontAwesomeIcon icon={faTrash} />,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    colorScheme: "neutral",
    children: "Cancel",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    colorScheme: "neutral",
    children: "Back to Dashboard",
  },
};

// --- 3. Icon Integrations ---
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button startIcon={<FontAwesomeIcon icon={faPlus} />}>
        Create League
      </Button>
      <Button
        variant="outline"
        endIcon={<FontAwesomeIcon icon={faArrowRight} />}
      >
        Next Step
      </Button>
      <Button
        variant="soft"
        colorScheme="success"
        startIcon={<FontAwesomeIcon icon={faCheck} />}
      >
        Mark Complete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Use `startIcon` and `endIcon` to add visual cues. The button automatically handles spacing and alignment.",
      },
    },
  },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    variant: "outline",
    children: <FontAwesomeIcon icon={faDownload} />,
    "aria-label": "Download Report", // Accessibility best practice
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use `size='icon'` for square buttons containing only an icon. **Note:** Always provide an `aria-label` for accessibility.",
      },
    },
  },
};

// --- 4. States ---
export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Processing...",
    colorScheme: "primary",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When `isLoading` is true, a spinner is prepended. The button width is preserved as much as possible to prevent layout shift.",
      },
    },
  },
};
