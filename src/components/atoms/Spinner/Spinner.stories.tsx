import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta = {
  title: "Atoms/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A lightweight, CSS-border-based **Spinner** used to indicate active loading states. It is built to be **accessible** and features built-in dark mode resilience through predefined color and animation variants.",
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
          <div className="rst:flex rst:justify-center">
            <Story />
          </div>
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode Preview
          </p>
          <div className="rst:flex rst:justify-center">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "neutral", "danger", "white"],
      description: "The visual style and color of the spinner.",
      table: { defaultValue: { summary: "primary" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "The dimension and border thickness of the spinner.",
      table: { defaultValue: { summary: "md" } },
    },
    animation: {
      control: "select",
      options: ["classic", "half", "dashed", "dotted"],
      description: "The border style and motion pattern of the spin.",
      table: { defaultValue: { summary: "classic" } },
    },
    className: {
      control: "text",
      description: "Additional CSS classes to override positioning or margins.",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Interactive Playground ---
export const Playground: Story = {
  args: {
    variant: "primary",
    size: "md",
    animation: "classic",
  },
};

// --- Static Examples ---
export const Animations: Story = {
  render: () => (
    <div className="rst:flex rst:items-end rst:gap-10">
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner animation="classic" size="lg" variant="primary" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          classic
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner animation="half" size="lg" variant="primary" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          half
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner animation="dashed" size="lg" variant="primary" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          dashed
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner animation="dotted" size="lg" variant="primary" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          dotted
        </span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Different border styles completely change the feel of the spin. `classic` provides the most standard loading experience, while `dashed` and `dotted` offer a more mechanical or playful look.",
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="rst:flex rst:items-end rst:gap-8">
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner size="sm" variant="neutral" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          sm
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner size="md" variant="neutral" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          md
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner size="lg" variant="neutral" />
        <span className="rst:text-xs rst:font-mono rst:text-gray-500 rst:dark:text-gray-400">
          lg
        </span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Spinner sizes automatically scale both height/width and the border thickness.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="rst:flex rst:items-center rst:gap-8 rst:bg-gray-200 rst:dark:bg-gray-800 rst:p-6 rst:rounded-lg">
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner variant="primary" size="lg" />
        <span className="rst:text-xs rst:font-medium rst:text-gray-700 rst:dark:text-gray-300">
          Primary
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner variant="neutral" size="lg" />
        <span className="rst:text-xs rst:font-medium rst:text-gray-700 rst:dark:text-gray-300">
          Neutral
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner variant="danger" size="lg" />
        <span className="rst:text-xs rst:font-medium rst:text-gray-700 rst:dark:text-gray-300">
          Danger
        </span>
      </div>
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-3">
        <Spinner variant="white" size="lg" />
        <span className="rst:text-xs rst:font-medium rst:text-gray-700 rst:dark:text-gray-300">
          White
        </span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A side-by-side look at all supported color variants. (Note the slightly tinted background added here so the `white` variant is visible in light mode).",
      },
    },
  },
};
