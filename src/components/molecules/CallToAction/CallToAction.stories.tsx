import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CallToAction } from "./CallToAction";
import { Button } from "../../atoms/Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faTriangleExclamation,
  faInfoCircle,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Molecules/CallToAction",
  component: CallToAction,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`CallToAction\` is a high-visibility banner used to nudge users toward specific actions or notify them of time-sensitive events (like lock times or league invites). 

### Key Features
- **Themed Variants**: Supports \`primary\`, \`neutral\`, \`warning\`, and \`error\` via CVA.
- **Dark Mode Ready**: Automatically adjusts backgrounds and text contrast based on the \`.dark\` root class.
- **Flexible Action**: The \`action\` prop accepts any React node, allowing for custom buttons, links, or groups.
- **Dismissible**: Includes an optional \`onDismiss\` callback for user-controlled closure.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12">
        <div className="light bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <Story />
        </div>
        <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      description: "Defines the color scheme and intent of the CTA.",
      control: "select",
      options: ["primary", "neutral", "warning", "error"],
    },
    title: { description: "The main bold heading." },
    description: { description: "The supporting body text (optional)." },
    icon: {
      description: "An optional icon displayed to the left of the text.",
    },
    action: {
      description:
        "A React element (usually a Button) to be displayed on the right.",
    },
    onDismiss: {
      description: "If provided, renders a close button in the top right.",
    },
  },
} satisfies Meta<typeof CallToAction>;

export default meta;
type Story = StoryObj<typeof CallToAction>;

/**
 * The standard 'brand' look. Used for positive events,
 * onboarding, or announcing new season start dates.
 */
export const PicksOpen: Story = {
  args: {
    title: "Week 1 Picks are LIVE!",
    description:
      "The 2026 Season is finally here. Submit your spread picks before kickoff on Thursday night to be eligible for the Weekly Jackpot.",
    variant: "primary",
    icon: <FontAwesomeIcon icon={faTrophy} className="h-5 w-5" />,
    action: (
      <Button variant="solid" colorScheme="primary">
        Make Your Picks
      </Button>
    ),
  },
};

/**
 * Used for high-priority alerts that require immediate attention.
 * Best paired with the 'warning' button color scheme.
 */
export const LockWarning: Story = {
  args: {
    title: "Picks Locking Soon",
    description:
      "The early window games lock in 30 minutes. 4 of your picks are still pending.",
    variant: "warning",
    icon: <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5" />,
    action: (
      <Button variant="outline" colorScheme="amber">
        Finish Picks
      </Button>
    ),
  },
};

/**
 * Used for critical system errors or major issues like sync delays.
 */
export const ScoreSyncError: Story = {
  args: {
    title: "Live Scoring Delayed",
    description:
      "We are experiencing a delay receiving data from the provider. Picks are safe, but scores may lag by 5-10 minutes.",
    variant: "error",
    icon: <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5" />,
    action: (
      <Button variant="outline" colorScheme="error" size="sm">
        View Status Page
      </Button>
    ),
  },
};

/**
 * Demonstrates how to handle a dismissible state with local persistence.
 * This mimics the legacy `MegaCTA` behavior for one-time announcements.
 */
export const WithPersistenceLogic: Story = {
  render: () => {
    const [isVisible, setIsVisible] = useState(true);
    const CTA_ID = "storybook-demo-banner";

    const handleDismiss = () => {
      setIsVisible(false);
      console.log(`CTA ${CTA_ID} dismissed.`);
    };

    if (!isVisible) {
      return (
        <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center">
          <Button variant="ghost" onClick={() => setIsVisible(true)} size="sm">
            <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />
            Reset Banner Visibility
          </Button>
        </div>
      );
    }

    return (
      <CallToAction
        title="New Feature: Survivor Pools"
        description="We've added Survivor Pools to MegaSquad! Survive the longest without a loss to win the pot."
        variant="neutral"
        icon={<FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5" />}
        onDismiss={handleDismiss}
        action={
          <Button variant="outline" colorScheme="neutral" size="sm">
            Learn More
          </Button>
        }
      />
    );
  },
};
