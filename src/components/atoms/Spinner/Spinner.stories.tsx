import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta = {
  title: "Atoms/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "The size of the spinner",
    },
    className: {
      control: "text",
      description: "Additional CSS classes (useful for setting color)",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Interactive Playground ---
export const Playground: Story = {
  args: {
    size: "md",
    className: "text-primary-500",
  },
};

// --- Static Examples ---
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs">lg</span>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-primary-500" />
        <span className="text-xs text-primary-500">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-accent-500" />
        <span className="text-xs text-accent-500">Accent</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-error-500" />
        <span className="text-xs text-error-500">Error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-success-500" />
        <span className="text-xs text-success-500">Success</span>
      </div>
    </div>
  ),
};
