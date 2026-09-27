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

The **Countdown** component provides a highly visual, animated timer for upcoming deadlines. It counts elapsed time from the difference between two timestamps rather than calendar time, so month ends and daylight saving changes do not shift the numbers, and the day count is the whole remaining total.

#### 🎨 Design System Integrations
* **Zero-Config Dark Mode:** No manual theme props required! The component natively listens to your app's \`.dark\` class and perfectly flips its text contrast, gradients, and shadows.
* **Variant System:** Choose between the flashy animated \`gradient\`, a solid \`primary\` brand color, or a \`neutral\` style that inherits from its parent container.
* **Fluid Typography:** Scales harmoniously using the \`size\` prop, making it suitable for anything from a small sidebar widget to a massive full-screen hero section.
* **Graceful Degradation:** Automatically handles expired dates by replacing the timer with customized \`completionText\`.

---

#### 🧠 Headless Hook Option: \`useCountdown\`
If you want the same countdown with a completely custom UI, import the underlying hook directly. It counts elapsed time rather than calendar time, so \`days\` is the whole remaining total and reads correctly across month ends and daylight-saving changes.

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

/**
 * Three-digit days, beside two-digit days, at every size and at two container
 * widths. The day count is the whole remaining total rather than a calendar
 * remainder, so a target a few months out shows three digits and the days
 * column has to hold them.
 */
export const ThreeDigitDays: Story = {
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-10">
      {(["20rem", "40rem"] as const).map((width) => (
        <div key={width} className="rst:flex rst:flex-col rst:gap-6">
          <p className="rst:text-xs rst:font-mono rst:text-gray-500">
            container {width}
          </p>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <div
              key={size}
              data-case={`${width}-${size}`}
              className="rst:flex rst:flex-col rst:gap-3"
            >
              {[9, 400].map((days) => (
                <div
                  key={days}
                  data-days={days}
                  className="rst:border rst:border-dashed rst:border-gray-300 rst:dark:border-gray-700"
                  style={{ width }}
                >
                  <Countdown
                    /* Built from a timestamp, not from calendar days, and
                       given an hour of margin, so the count reads 9 and 400
                       rather than 08 and 399. Adding calendar days loses an
                       hour to any spring clock change in between, which
                       would eat the margin exactly. */
                    targetDate={new Date(Date.now() + days * 86_400_000 + 3_600_000)}
                    size={size}
                    variant="neutral"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The days column holds the whole remaining total, so anything more than 99 days out shows three digits. Each pair renders the same size at 9 days and at 400 days inside the same dashed box, so a column that grows past its container is visible as an overhang.\n\nMeasured in the 20rem box: `xs` through `lg` hold three digits with room to spare. `xl`, the hero size, already overhangs a phone-width container by a few pixels at two digits, and the third digit widens that to about 20px on each side.",
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
