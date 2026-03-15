import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, type SelectOption, type SelectProps } from "./Select";

const meta = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A robust **Select** component (powered by Headless UI v2 Listbox). It provides native-like accessibility with custom styling capabilities. It is a controlled component requiring `value` and `onChange` props.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12">
        <div className="light bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <div className="pb-32 max-w-sm">
            <Story />
          </div>
        </div>
        <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <div className="pb-32 max-w-sm">
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
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

const fruitOptions: SelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian (Disabled)", disabled: true },
  { value: "elderberry", label: "Elderberry" },
];

// --- Wrapper for Controlled State in Storybook ---
const SelectWithState = (args: SelectProps) => {
  const [val, setVal] = useState<string | number | null>(args.value ?? null);
  return <Select {...args} value={val} onChange={setVal} />;
};

export const DefaultOutline: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Choose a fruit...",
    variant: "outline",
    label: "Favorite Fruit",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const SoftVariant: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Subtle selection...",
    variant: "soft",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const MegaSquadSlate: Story = {
  args: {
    options: [
      { value: "qb", label: "Quarterback (QB)" },
      { value: "rb", label: "Running Back (RB)" },
      { value: "wr", label: "Wide Receiver (WR)" },
    ],
    placeholder: "Filter by Position",
    variant: "slate",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const WithError: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Required Field",
    error: true,
    label: "Invalid Selection",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const Disabled: Story = {
  args: {
    options: fruitOptions,
    value: "banana",
    disabled: true,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};
