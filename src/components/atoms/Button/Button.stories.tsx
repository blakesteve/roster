import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { Button, type ButtonProps } from "./Button";
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
    layout: "padded",
    docs: {
      description: {
        component:
          "The **Button** is the primary interactive element for triggering actions. It supports multiple **visual hierarchies** (Solid, Soft, Outline, Ghost, Link) and a comprehensive **semantic color palette**. \n\n✨ **New in v2:** \n* **Crisp Colors:** Soft and Outline variants now use pristine light-mode backgrounds (`bg-[color]-50`) and dark-mode stained-glass translucent layers (`bg-[color]-900/30`).\n* **Smart Spinner:** The `isLoading` spinner now uses `text-current` to automatically inherit the perfect text color across all variants.",
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
      options: ["xs", "sm", "default", "lg", "icon"],
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

export const Playground: Story = {
  args: {
    children: "Mega Button",
    colorScheme: "primary",
    variant: "solid",
  },
  decorators: [DualPreviewDecorator],
};

export const Primary: Story = {
  args: {
    colorScheme: "primary",
    children: "Submit Picks",
    variant: "solid",
  },
  decorators: [DualPreviewDecorator],
};

export const Soft: Story = {
  args: {
    variant: "soft",
    colorScheme: "teal",
    children: "Save Draft",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **Soft** variant is perfect for secondary actions. Notice how the updated theme applies a crisp background in light mode and a deep translucent background in dark mode.",
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
  decorators: [DualPreviewDecorator],
};

export const Outline: Story = {
  args: {
    variant: "outline",
    colorScheme: "neutral",
    children: "Cancel",
  },
  decorators: [DualPreviewDecorator],
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    colorScheme: "neutral",
    children: "Back to Dashboard",
  },
  decorators: [DualPreviewDecorator],
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end justify-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon Size Example">
        <FontAwesomeIcon icon={faCheck} />
      </Button>
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Buttons come in multiple sizes to fit various contexts, from tiny inline actions (`xs`) like dropdown items, to large primary calls to action (`lg`).",
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-4">
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
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Use `startIcon` and `endIcon` to add visual cues. The button automatically handles spacing and protects the icons from crushing.",
      },
    },
  },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    variant: "outline",
    children: <FontAwesomeIcon icon={faDownload} />,
    "aria-label": "Download Report",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Use `size='icon'` for square buttons containing only an icon. **Note:** Always provide an `aria-label` for accessibility.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Processing...",
    colorScheme: "primary",
    variant: "solid",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "When `isLoading` is true, a spinner is prepended. The spinner automatically inherits the button's dynamic text color.",
      },
    },
  },
};

const ALL_COLOR_SCHEMES: NonNullable<ButtonProps["colorScheme"]>[] = [
  "primary",
  "orange",
  "teal",
  "purple",
  "amber",
  "success",
  "error",
  "neutral",
];

const ALL_VARIANTS: NonNullable<ButtonProps["variant"]>[] = [
  "solid",
  "soft",
  "outline",
  "ghost",
  "link",
];

export const AllVariantsMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto">
      {ALL_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-2">
            Variant: {variant}
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {ALL_COLOR_SCHEMES.map((color) => (
              <Button
                key={`${variant}-${color}`}
                variant={variant}
                colorScheme={color}
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "A complete matrix of all semantic color schemes and variants across light and dark modes.",
      },
    },
  },
};
