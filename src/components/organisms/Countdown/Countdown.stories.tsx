import type { Meta, StoryObj } from "@storybook/react-vite";
import { Countdown } from "./Countdown";

const meta = {
  title: "Organisms/Countdown",
  component: Countdown,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### Precision Time Indicator

The **Countdown** component provides a highly visual, animated timer for upcoming deadlines. Powered by \`date-fns\`, it guarantees precise calculations across timezones and daylight saving boundaries.

#### 🎨 Design System Integrations
* **Zero-Config Dark Mode:** No manual theme props required! The component natively listens to your app's \`.dark\` class and perfectly flips its text contrast, gradients, and shadows.
* **Variant System:** Choose between the flashy animated \`gradient\`, a solid \`primary\` brand color, or a \`neutral\` style that inherits from its parent container.
* **Fluid Typography:** Scales harmoniously using the \`size\` prop, making it suitable for anything from a small sidebar widget to a massive full-screen hero section.
* **Graceful Degradation:** Automatically handles expired dates by replacing the timer with customized \`completionText\`.

---

#### 🧠 Headless Hook Option: \`useCountdown\`
If you need the precision date-math but want to build a completely custom UI, import the underlying hook directly!

\`\`\`tsx
import { useCountdown } from 'roster'; // Adjust import to match your library path

const CustomTimer = () => {
  const { days, hours, minutes, seconds, isFinished } = useCountdown(new Date('2026-12-31'));

  if (isFinished) return <span>Time is up!</span>;
  
  return <span>{days}d {hours}h {minutes}m {seconds}s remaining</span>;
};
\`\`\`
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
      description: "Text to display when the countdown hits zero.",
    },
    variant: {
      control: "select",
      options: ["gradient", "primary", "neutral"],
      description: "The visual style applied to the countdown numbers.",
      table: { defaultValue: { summary: "gradient" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Proportionally scales the entire component.",
      table: { defaultValue: { summary: "md" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12 rst:w-full rst:max-w-4xl rst:mx-auto">
        {/* Light Mode Preview */}
        <div className="light rst:bg-white rst:p-8 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm rst:flex rst:flex-col rst:relative rst:min-h-50">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest rst:absolute rst:top-4 rst:left-4">
            Light Mode Preview
          </p>
          <div className="rst:grow rst:flex rst:items-center rst:justify-center rst:mt-6">
            <Story />
          </div>
        </div>

        {/* Dark Mode Preview */}
        <div className="dark rst:bg-gray-950 rst:p-8 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl rst:flex rst:flex-col rst:relative rst:min-h-50">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest rst:absolute rst:top-4 rst:left-4">
            Dark Mode Preview
          </p>
          <div className="rst:grow rst:flex rst:items-center rst:justify-center rst:mt-6">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
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

export const DefaultGradient: Story = {
  args: {
    targetDate: getFutureDate(3, 14),
    title: "Draft Begins In",
    variant: "gradient",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The default configuration. A highlight sweeps across the digits and rests between passes, retinted for dark containers and held still for `prefers-reduced-motion`.",
      },
    },
  },
};

export const PrimarySolid: Story = {
  args: {
    targetDate: getFutureDate(7, 2),
    title: "Next Matchup",
    variant: "primary",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Applies your design system's primary brand color to the numbers. A great choice for cleaner, less flashy interfaces.",
      },
    },
  },
};

export const NeutralText: Story = {
  args: {
    targetDate: getFutureDate(1, 5),
    title: "Maintenance Window",
    variant: "neutral",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The neutral variant strips away distinct colors and forces the numbers to inherit the standard text color of its environment (`gray-900` in light mode, `gray-100` in dark mode).",
      },
    },
  },
};

export const HeroLarge: Story = {
  args: {
    targetDate: getFutureDate(0, 5),
    title: "Championship Kickoff",
    variant: "gradient",
    size: "xl",
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:w-full rst:max-w-5xl rst:mx-auto">
        <div className="dark rst:p-16 rst:bg-slate-900 rst:rounded-3xl rst:shadow-2xl rst:border rst:border-slate-800 rst:flex rst:justify-center rst:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Scales the typography and spacing up to `xl`. Perfect for anchoring a large hero section or landing page against a textured dark background.",
      },
    },
  },
};

export const WidgetSmall: Story = {
  args: {
    targetDate: getFutureDate(1, 2),
    variant: "primary",
    size: "xs",
  },
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
    variant: "neutral",
    size: "lg",
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:w-full rst:max-w-4xl rst:mx-auto">
        <div className="rst:bg-error-50 rst:dark:bg-error-900/20 rst:border-2 rst:border-error-200 rst:dark:border-error-800 rst:rounded-xl rst:p-12 rst:flex rst:justify-center rst:text-error-900 rst:dark:text-error-100">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the UI when the `targetDate` has passed. The timer is unmounted and safely replaced by the `completionText`. Notice how the component seamlessly inherits the red text color from the parent wrapper!",
      },
    },
  },
};
