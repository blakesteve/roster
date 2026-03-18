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
  <div className="flex flex-col w-full h-[800px]">
    {/* Light Mode Container */}
    <div className="light flex-1 bg-gray-50 overflow-y-auto relative border-b border-gray-200">
      <p className="absolute top-4 right-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">
        Light Mode
      </p>
      <Story />
    </div>

    {/* Dark Mode Container */}
    <div className="dark flex-1 bg-gray-950 overflow-y-auto relative">
      <p className="absolute top-4 right-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">
        Dark Mode
      </p>
      <Story />
    </div>
  </div>
);

const FillerBlocks = () => (
  <div className="p-8 space-y-4">
    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
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
      <div className="text-sm">
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
          className="text-primary-50 border-primary-400 hover:bg-primary-600"
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
      <div className="h-75 w-full bg-linear-to-br from-indigo-900 via-purple-900 to-black relative overflow-hidden">
        <Story />
        <div className="pt-20 px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white opacity-20">
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
      <div className="h-[600px] w-full bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden transition-colors duration-300">
        <div className="flex-1 overflow-y-auto relative">
          {/* ✨ MOVED TO THE TOP: The Action Bar must be first in the DOM for sticky top-0 to work! */}
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
              <div className="flex gap-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex h-10 w-10 animate-in fade-in zoom-in items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`h-5 w-5 ${item.color}`}
                    />
                  </div>
                ))}
              </div>
            </ActionBar>
          )}

          <div className="p-8 pb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
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

            <div className="flex gap-4 flex-wrap">
              {AVAILABLE_ICONS.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`h-8 w-8 ${item.color}`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-gray-400 dark:text-gray-500 mt-8 italic">
              Selecting an item above will dynamically populate the ActionBar's
              bottom tray. Scroll down to see the glassmorphism in action!
            </p>

            <div className="mt-12 space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
                    <div className="h-3 bg-gray-50 dark:bg-gray-800/50 rounded w-5/6" />
                    <div className="h-3 bg-gray-50 dark:bg-gray-800/50 rounded w-4/6" />
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
