import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faHeart,
  faFire,
  faBolt,
  faCube,
} from "@fortawesome/free-solid-svg-icons";

import { ActionBar } from "./ActionBar";
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

#### 🔧 Layout Notes
* Uses \`backdrop-blur\` to ensure scrolling content remains slightly visible underneath.
* Pass \`position="bottom"\` to stick it to the bottom of the viewport instead of the top.
`,
      },
    },
  },
  argTypes: {
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
        "A slot for a status indicator next to the title. **Recommended:** Roster `Badge` component, but accepts any ReactNode.",
    },
    actions: {
      control: false,
      description:
        "A slot for interactive elements aligned to the right. **Recommended:** Roster `Button` components, but accepts any ReactNode.",
    },
    children: {
      control: false,
      description:
        "The bottom tray slot. Used for dynamic data display, lists, or complex filters. Mounts conditionally.",
    },
    position: {
      control: "select",
      options: ["top", "bottom", "static"],
      description: "Determines the CSS sticky positioning behavior.",
    },
    themeMode: {
      control: "radio",
      options: ["light", "dark"],
      description: "Overrides the OS-level theme preference.",
    },
  },
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof ActionBar>;

export const TopSticky: Story = {
  args: {
    title: "12 of 16 Games Picked",
    subtitle: "NFL - Week 4",
    position: "top",
    themeMode: "light",
    badge: (
      <Badge variant="primary" statusBadge>
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
      <div className="text-sm text-gray-500">
        Bottom tray content goes here (e.g., logo avatars, extra filters).
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="h-100 w-full bg-slate-50 overflow-y-auto relative">
        <Story />
        <div className="p-8 space-y-4">
          <p className="text-gray-400 italic">
            Scroll down to see the sticky behavior...
          </p>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    ),
  ],
};

// --- Interactive Story Setup ---
const AVAILABLE_ICONS = [
  { id: "star", icon: faStar, color: "text-yellow-500" },
  { id: "heart", icon: faHeart, color: "text-error-500" },
  { id: "fire", icon: faFire, color: "text-orange-500" },
  { id: "bolt", icon: faBolt, color: "text-blue-500" },
  { id: "cube", icon: faCube, color: "text-purple-500" },
];

const InteractiveWrapper = (args: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectedItems = AVAILABLE_ICONS.filter((item) =>
    selectedIds.includes(item.id),
  );

  return (
    <div className="h-125 w-full bg-slate-50 relative flex flex-col overflow-hidden">
      {/* Main Page Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-gray-900">
          Select your modifiers
        </h3>
        <div className="flex gap-4 flex-wrap">
          {AVAILABLE_ICONS.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
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
        <p className="text-gray-400 mt-8 italic">
          Selecting an item above will dynamically populate the ActionBar's
          bottom tray.
        </p>
      </div>

      {/* Dynamic Action Bar */}
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
                className="flex h-10 w-10 animate-in fade-in zoom-in items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200"
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
    </div>
  );
};

export const DynamicSelection: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    position: "bottom",
    themeMode: "light",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates how the ActionBar can conditionally mount and dynamically populate its `children` tray based on user interaction.",
      },
    },
  },
};

export const DarkBottomTray: Story = {
  args: {
    title: "Editing Roster",
    position: "bottom",
    themeMode: "dark",
    actions: (
      <>
        <Button variant="outline" className="text-gray-300 border-gray-600">
          Cancel
        </Button>
        <Button variant="solid" colorScheme="primary">
          Confirm Changes
        </Button>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="h-75 w-full bg-slate-900 flex flex-col justify-end">
        <Story />
      </div>
    ),
  ],
};
