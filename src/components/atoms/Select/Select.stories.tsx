import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select, type SelectOption } from "./Select";

const meta = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A robust **Select** component (powered by Headless UI Listbox). It provides native-like accessibility with custom styling capabilities. It is a controlled component requiring `value` and `onChange` props.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["outline", "soft", "ghost", "filled"],
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
const SelectWithState = (args: any) => {
  const [val, setVal] = useState<string | number | null>(args.value || null);
  return <Select {...args} value={val} onChange={setVal} />;
};

export const DefaultOutline: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Choose a fruit...",
    variant: "outline",
  },
  render: (args) => <SelectWithState {...args} />,
};

export const MegaSquadFilled: Story = {
  args: {
    options: [
      { value: "qb", label: "Quarterback (QB)" },
      { value: "rb", label: "Running Back (RB)" },
      { value: "wr", label: "Wide Receiver (WR)" },
    ],
    placeholder: "Filter by Position",
    variant: "filled",
  },
  render: (args) => <SelectWithState {...args} />,
};

export const WithError: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Required Field",
    error: true,
  },
  render: (args) => <SelectWithState {...args} />,
};

export const Disabled: Story = {
  args: {
    options: fruitOptions,
    value: "banana",
    disabled: true,
  },
};
