import { useState } from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faHeart,
  faFire,
  faBolt,
  faCube,
} from "@fortawesome/free-solid-svg-icons";

import { ActionBar, type ActionBarProps } from "./ActionBar";
import { Button } from "../../atoms/Button/Button";
import { Badge } from "../../atoms/Badge/Badge";

const meta = {
  title: "Organisms/ActionBar",
  component: ActionBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### Contextual Sticky Toolbar

The **ActionBar** provides a persistent, floating area for page-level actions and status indicators. It automatically handles responsive wrapping and includes a "bottom tray" slot (\`children\`) for complex filtering or dynamic data display.

#### 🔧 Layout & Theming
* **Glassmorphism:** Uses \`backdrop-blur\` to ensure scrolling content remains slightly visible underneath.
* **Zero-Config Dark Mode:** Automatically adapts backgrounds, borders, and text contrast when the \`.dark\` class is present on the page.
* **Positioning:** Pass \`position="bottom"\` to stick it to the bottom of the viewport instead of the top.
`,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "soft", "primary", "transparent"],
      description: "The visual theme and background surface of the action bar.",
      table: { defaultValue: { summary: "default" } },
    },
    position: {
      control: "select",
      options: ["top", "bottom", "static"],
      description: "Determines the CSS sticky positioning behavior.",
      table: { defaultValue: { summary: "top" } },
    },
    title: {
      control: "text",
      description: "Primary heading or status.",
    },
    subtitle: {
      control: "text",
      description: "Secondary text below the heading.",
    },
    badge: {
      control: false,
      description:
        "A slot for a status indicator next to the title. **Recommended:** Roster `Badge` component.",
    },
    actions: {
      control: false,
      description:
        "A slot for interactive elements aligned to the right. **Recommended:** Roster `Button` components.",
    },
    children: {
      control: false,
      description:
        "The bottom tray slot. Used for dynamic data display, lists, or complex filters.",
    },
  },
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof ActionBar>;

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="rst:flex rst:flex-col rst:w-full rst:h-200">
    {/* Light Mode Container */}
    <div className="light rst:flex-1 rst:bg-gray-50 rst:overflow-y-auto rst:relative rst:border-b rst:border-gray-200">
      <p className="rst:absolute rst:top-4 rst:right-4 rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest rst:z-10">
        Light Mode
      </p>
      <Story />
    </div>

    {/* Dark Mode Container */}
    <div className="dark rst:flex-1 rst:bg-gray-950 rst:overflow-y-auto rst:relative">
      <p className="rst:absolute rst:top-4 rst:right-4 rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest rst:z-10">
        Dark Mode
      </p>
      <Story />
    </div>
  </div>
);

const FillerBlocks = () => (
  <div className="rst:p-8 rst:space-y-4">
    <div className="rst:h-32 rst:bg-gray-200 rst:dark:bg-gray-800 rst:rounded-lg"></div>
    <div className="rst:h-32 rst:bg-gray-200 rst:dark:bg-gray-800 rst:rounded-lg"></div>
    <div className="rst:h-32 rst:bg-gray-200 rst:dark:bg-gray-800 rst:rounded-lg"></div>
  </div>
);

export const DefaultTheme: Story = {
  render: (args) => (
    <>
      <ActionBar {...args} />
      <FillerBlocks />
    </>
  ),
  args: {
    title: "12 of 16 Games Picked",
    subtitle: "NFL - Week 4",
    variant: "default",
    position: "top",
    badge: (
      <Badge variant="orange" statusBadge>
        MegaSquad Public League
      </Badge>
    ),
    actions: (
      <>
        <Button variant="outline">Reset</Button>
        <Button variant="solid" colorScheme="primary">
          Save Picks
        </Button>
      </>
    ),
    children: (
      <div className="rst:text-sm">
        Bottom tray content goes here (e.g., logo avatars, extra filters).
      </div>
    ),
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **Default** variant creates a seamless header that matches the main app background (white in light mode, gray-950 in dark mode). Notice how the `backdrop-blur` allows the scrolling gray blocks to subtly show through!",
      },
    },
  },
};

export const PrimaryBottomTray: Story = {
  render: (args) => (
    <>
      <FillerBlocks />
      <ActionBar {...args} />
    </>
  ),
  args: {
    title: "Reviewing Lineup",
    subtitle: "Roster locks in 15 mins",
    variant: "primary",
    position: "bottom",
    actions: (
      <>
        <Button
          variant="outline"
          className="rst:text-primary-50 rst:border-primary-400 rst:hover:bg-primary-600"
        >
          Cancel
        </Button>
        <Button variant="solid" colorScheme="neutral">
          Confirm Changes
        </Button>
      </>
    ),
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **Primary** variant uses the brand color for a high-priority, high-contrast bar. Setting `position: 'bottom'` anchors it to the bottom of the scrolling container.",
      },
    },
  },
};

export const TransparentHero: Story = {
  args: {
    title: "Championship Sunday",
    subtitle: "Live Scoring",
    variant: "transparent",
    position: "top",
    actions: (
      <Button variant="outline" colorScheme="neutral">
        View Standings
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="rst:h-75 rst:w-full rst:bg-linear-to-br rst:from-indigo-900 rst:via-purple-900 rst:to-black rst:relative rst:overflow-hidden">
        <Story />
        <div className="rst:pt-20 rst:px-8 rst:text-center">
          <h1 className="rst:text-4xl rst:font-extrabold rst:text-white rst:opacity-20">
            Hero Image Area
          </h1>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The **Transparent** variant removes backgrounds, blur, and borders, allowing it to sit seamlessly over hero images or complex gradients.",
      },
    },
  },
};

// --- Interactive Story Setup ---
const AVAILABLE_ICONS = [
  { id: "star", icon: faStar, color: "text-yellow-500" },
  { id: "heart", icon: faHeart, color: "text-error-500" },
  { id: "fire", icon: faFire, color: "text-orange-500" },
  { id: "bolt", icon: faBolt, color: "text-blue-500" },
  { id: "cube", icon: faCube, color: "text-purple-500" },
];

const InteractiveWrapper = (args: ActionBarProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(false);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectedItems = AVAILABLE_ICONS.filter((item) =>
    selectedIds.includes(item.id),
  );

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="rst:h-150 rst:w-full rst:bg-gray-50 rst:dark:bg-gray-950 rst:flex rst:flex-col rst:overflow-hidden rst:transition-colors rst:duration-300">
        <div className="rst:flex-1 rst:overflow-y-auto rst:relative">
          {selectedIds.length > 0 && (
            <ActionBar
              {...args}
              title={`${selectedIds.length} Modifier${
                selectedIds.length > 1 ? "s" : ""
              } Active`}
              actions={
                <>
                  <Button variant="outline" onClick={() => setSelectedIds([])}>
                    Clear All
                  </Button>
                  <Button variant="solid" colorScheme="primary">
                    Apply
                  </Button>
                </>
              }
            >
              <div className="rst:flex rst:gap-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rst:flex rst:h-10 rst:w-10 rst:animate-in rst:fade-in rst:zoom-in rst:items-center rst:justify-center rst:rounded-full rst:bg-white rst:dark:bg-gray-800 rst:shadow-sm rst:ring-1 rst:ring-gray-200 rst:dark:ring-gray-700"
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`rst:h-5 rst:w-5 ${item.color}`}
                    />
                  </div>
                ))}
              </div>
            </ActionBar>
          )}

          <div className="rst:p-8 rst:pb-12">
            <div className="rst:flex rst:justify-between rst:items-center rst:mb-6">
              <h3 className="rst:text-xl rst:font-bold rst:text-gray-900 rst:dark:text-gray-100">
                Select your modifiers
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDark(!isDark)}
              >
                Toggle {isDark ? "Light" : "Dark"} Mode
              </Button>
            </div>

            <div className="rst:flex rst:gap-4 rst:flex-wrap">
              {AVAILABLE_ICONS.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`rst:flex rst:h-20 rst:w-20 rst:items-center rst:justify-center rst:rounded-2xl rst:border-2 rst:transition-all rst:active:scale-95 ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`rst:h-8 rst:w-8 ${item.color}`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="rst:text-gray-400 rst:dark:text-gray-500 rst:mt-8 rst:italic">
              Selecting an item above will dynamically populate the ActionBar's
              bottom tray. Scroll down to see the glassmorphism in action!
            </p>

            <div className="rst:mt-12 rst:space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rst:w-full rst:p-6 rst:rounded-2xl rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:bg-white rst:dark:bg-gray-900 rst:shadow-sm rst:transition-colors rst:duration-300"
                >
                  <div className="rst:flex rst:items-center rst:gap-4 rst:mb-6">
                    <div className="rst:w-12 rst:h-12 rst:rounded-full rst:bg-gray-100 rst:dark:bg-gray-800" />
                    <div className="rst:space-y-2 rst:flex-1">
                      <div className="rst:h-4 rst:bg-gray-200 rst:dark:bg-gray-700 rst:rounded rst:w-1/3" />
                      <div className="rst:h-3 rst:bg-gray-100 rst:dark:bg-gray-800 rst:rounded rst:w-1/4" />
                    </div>
                  </div>
                  <div className="rst:space-y-3">
                    <div className="rst:h-3 rst:bg-gray-50 rst:dark:bg-gray-800/50 rst:rounded rst:w-full" />
                    <div className="rst:h-3 rst:bg-gray-50 rst:dark:bg-gray-800/50 rst:rounded rst:w-5/6" />
                    <div className="rst:h-3 rst:bg-gray-50 rst:dark:bg-gray-800/50 rst:rounded rst:w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DynamicSelection: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    variant: "soft",
    position: "top",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates how the ActionBar can conditionally mount and dynamically populate its `children` tray based on user interaction. Uses the **Soft** variant for a slightly elevated appearance.",
      },
    },
  },
};
