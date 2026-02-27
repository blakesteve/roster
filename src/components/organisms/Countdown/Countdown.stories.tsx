import type { Meta, StoryObj } from "@storybook/react";
import { Countdown } from "./Countdown";

const meta = {
  title: "Organisms/Countdown",
  component: Countdown,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
### Precision Time Indicator

The **Countdown** component provides a highly visual, animated timer for upcoming deadlines. Powered by \`date-fns\`, it guarantees precise calculations across timezones and daylight saving boundaries.

#### 🎨 Design System Integrations
* **Theme Aware:** Fully supports both \`light\` and \`dark\` mode environments via the \`themeMode\` prop, automatically adjusting gradients, shadows, and text contrast to ensure WCAG accessibility.
* **Fluid Typography:** Scales harmoniously using the \`size\` prop, making it suitable for anything from a small sidebar widget to a massive full-screen hero section.
* **Graceful Degradation:** Automatically handles expired dates by unmounting the timer or replacing it with customized \`completionText\`.
`,
      },
    },
  },
  argTypes: {
    targetDate: {
      control: "date",
      description:
        "A valid JavaScript `Date` object representing the deadline.",
    },
    title: {
      control: "text",
      description: "An optional heading rendered above the timer digits.",
    },
    completionText: {
      control: "text",
      description:
        "Text to display when the countdown hits zero. If omitted, the component renders `null` upon completion.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Proportionally scales the entire component.",
      table: { defaultValue: { summary: "md" } },
    },
    themeMode: {
      control: "radio",
      options: ["light", "dark"],
      description:
        "Adjusts the text colors, gradient intensity, and drop-shadows to match the parent container's background.",
      table: { defaultValue: { summary: "light" } },
    },
  },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof Countdown>;

// --- Helper Functions ---
const getFutureDate = (daysAhead: number, hoursAhead: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(date.getHours() + hoursAhead);
  return date;
};

const getPastDate = () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() - 10);
  return date;
};

// --- Stories ---

export const StandardLight: Story = {
  args: {
    targetDate: getFutureDate(3, 14),
    title: "Season Begins In",
    themeMode: "light",
    size: "md",
  },
  decorators: [
    (Story) => (
      <div className="p-12 bg-white rounded-xl shadow-sm border border-gray-200 min-w-125 flex justify-center">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The default configuration. Uses deeper, high-contrast gradients and darker text to remain legible against white or light-gray backgrounds.",
      },
    },
  },
};

export const HeroDark: Story = {
  args: {
    targetDate: getFutureDate(0, 5), // 5 hours from now
    title: "Championship Kickoff",
    themeMode: "dark",
    size: "xl",
  },
  decorators: [
    (Story) => (
      <div className="p-16 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 min-w-200 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Designed for dark mode hero sections. It scales up to `xl` and uses brighter, glowing gradients with light text to pop against dark slate backgrounds.",
      },
    },
  },
};

export const WidgetSmall: Story = {
  args: {
    targetDate: getFutureDate(1, 2),
    themeMode: "light",
    size: "xs",
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-gray-50 rounded-lg shadow-inner border border-gray-200 max-w-75 flex justify-center">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The `xs` variant with no title. Perfect for embedding within tight layouts like Sidebars, Cards, or compact list items.",
      },
    },
  },
};

export const EventCompleted: Story = {
  args: {
    targetDate: getPastDate(),
    title: "Trade Deadline",
    completionText: "The Trade Window is Closed",
    themeMode: "light",
    size: "lg",
  },
  decorators: [
    (Story) => (
      <div className="p-12 bg-red-50 rounded-xl border-2 border-red-100 min-w-125 flex justify-center text-red-900">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the UI when the `targetDate` has passed. The timer is unmounted and safely replaced by the `completionText` string.",
      },
    },
  },
};
