import { useState } from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { Field, Label } from "@headlessui/react";
import { Checkbox, type CheckboxProps } from "./Checkbox";

const meta = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The **Checkbox** is a highly-customizable, purely CSS-driven form control built on top of Headless UI. \n\n✨ **New in v2:** \n* **System Colors:** Fully integrates with the new crisp light mode pastels and translucent dark mode stained-glass logic via the `soft` variant.\n* **Smart Sizing:** The internal checkmark SVG automatically scales to perfectly fit the `sm`, `md`, and `lg` bounding boxes.\n* **Indeterminate State:** Pass `indeterminate={true}` to swap the checkmark for a minus icon, perfect for 'Select All' table headers.",
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
      description:
        "The semantic color theme applied when the checkbox is checked.",
      table: { defaultValue: { summary: "primary" } },
    },
    variant: {
      control: "inline-radio",
      options: ["solid", "soft"],
      description: "The visual style of the checked state.",
      table: { defaultValue: { summary: "solid" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "The physical dimensions of the checkbox.",
      table: { defaultValue: { summary: "md" } },
    },
    indeterminate: {
      control: "boolean",
      description: "Displays a dash instead of a checkmark for mixed states.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Dims the control and prevents user interaction.",
      table: { defaultValue: { summary: "false" } },
    },
    checked: {
      control: "boolean",
      description: "The controlled checked state of the component.",
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-gray-50 p-12 relative flex flex-col items-center justify-center">
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

// helper component to make the stories clickable in the playground safely
const InteractiveCheckbox = (args: CheckboxProps) => {
  const [checked, setChecked] = useState(args.checked || false);
  const [prevArg, setPrevArg] = useState(args.checked);

  // Sync state derived from props (without useEffect causing cascading renders)
  if (args.checked !== prevArg) {
    setPrevArg(args.checked);
    setChecked(args.checked || false);
  }

  const handleChange = (newChecked: boolean) => {
    setChecked(newChecked);
    if (args.onChange) args.onChange(newChecked);
  };

  return <Checkbox {...args} checked={checked} onChange={handleChange} />;
};

export const Playground: Story = {
  render: (args) => <InteractiveCheckbox {...args} />,
  args: {
    colorScheme: "primary",
    variant: "solid",
    size: "md",
  },
  decorators: [DualPreviewDecorator],
};

export const SoftVariant: Story = {
  render: (args) => <InteractiveCheckbox {...args} />,
  args: {
    colorScheme: "purple",
    variant: "soft",
    checked: true, // Start checked so we can see the color
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **Soft** variant applies our crisp pastel logic in light mode, and a stunning translucent stained-glass effect in dark mode.",
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <InteractiveCheckbox size="sm" colorScheme="neutral" checked={true} />
      <InteractiveCheckbox size="md" colorScheme="primary" checked={true} />
      <InteractiveCheckbox size="lg" colorScheme="teal" checked={true} />
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Available in `sm`, `md`, and `lg`. The internal checkmark SVG automatically scales to perfectly center itself within the selected bounding box.",
      },
    },
  },
};

export const Indeterminate: Story = {
  render: (args) => <InteractiveCheckbox {...args} />,
  args: {
    colorScheme: "amber",
    variant: "solid",
    indeterminate: true,
    checked: true,
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Pass `indeterminate={true}` to render a minus icon instead of a checkmark. This is standard UX for a 'Select All' checkbox when only a few child items are selected.",
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Field className="flex items-center gap-3 cursor-pointer group">
        <Checkbox
          checked={checked}
          onChange={setChecked}
          colorScheme="success"
          className="group-hover:ring-2 ring-success-500/20 ring-offset-1 dark:ring-offset-gray-950 transition-all"
        />
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none">
          I agree to the Terms of Service
        </Label>
      </Field>
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Because this is an Atom, you should wrap it in Headless UI's `<Field>` and `<Label>` components to ensure clicking the text properly toggles the checkbox.",
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-6">
      <Checkbox disabled checked={false} />
      <Checkbox disabled checked={true} colorScheme="primary" />
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The `disabled` prop dims the opacity of the control and prevents all user interaction.",
      },
    },
  },
};

const ALL_COLOR_SCHEMES: NonNullable<CheckboxProps["colorScheme"]>[] = [
  "primary",
  "orange",
  "teal",
  "purple",
  "amber",
  "success",
  "error",
  "neutral",
];

const ALL_VARIANTS: NonNullable<CheckboxProps["variant"]>[] = ["solid", "soft"];

export const AllVariantsMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto">
      {ALL_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-2">
            Variant: {variant}
          </h3>
          <div className="flex flex-wrap gap-8">
            {ALL_COLOR_SCHEMES.map((color) => (
              <div
                key={`${variant}-${color}`}
                className="flex flex-col items-center gap-2"
              >
                <InteractiveCheckbox
                  variant={variant}
                  colorScheme={color}
                  checked={true}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {color}
                </span>
              </div>
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
          "A complete matrix of all semantic color schemes and variants. Try clicking them!",
      },
    },
  },
};
