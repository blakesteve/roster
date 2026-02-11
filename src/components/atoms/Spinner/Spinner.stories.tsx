import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta = {
  title: "Atoms/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A lightweight, SVG-based **Spinner** used to indicate active loading states. It is built to be **accessible** and inherits the current text color, allowing for easy customization via utility classes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description:
        "The dimension of the spinner (sm: 16px, md: 24px, lg: 32px).",
      table: { defaultValue: { summary: "md" } },
    },
    className: {
      control: "text",
      description:
        "Additional CSS classes, primarily used for setting text color (e.g., `text-primary-600`).",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Interactive Playground ---
export const Playground: Story = {
  args: {
    size: "md",
    className: "text-primary-600",
  },
};

// --- Static Examples ---
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs font-mono">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs font-mono">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs font-mono">lg</span>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-primary-600" />
        <span className="text-xs text-primary-600 font-medium">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-orange-500" />
        <span className="text-xs text-orange-500 font-medium">Orange</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-teal-500" />
        <span className="text-xs text-teal-500 font-medium">Teal</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-purple-500" />
        <span className="text-xs text-purple-500 font-medium">Purple</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-error-600" />
        <span className="text-xs text-error-600 font-medium">Error</span>
      </div>
    </div>
  ),
};
