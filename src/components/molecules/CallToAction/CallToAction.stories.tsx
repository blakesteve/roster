import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CallToAction } from "./CallToAction";
import { Button } from "../../atoms/Button/Button";
import { Countdown } from "../../organisms/Countdown/Countdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faTriangleExclamation,
  faInfoCircle,
  faCircleCheck,
  faCheckDouble,
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
- **Themed Variants**: Supports \`primary\`, \`neutral\`, \`warning\`, \`error\`, \`success\`, and \`info\` via CVA.
- **Dark Mode Perfected**: Automatically adjusts backgrounds to a rich 30% opacity with vibrant, high-contrast borders and text when the \`.dark\` root class is applied.
- **Rich Content**: The \`description\` prop accepts any React Node, meaning you can embed complex components (like a \`Countdown\` timer) directly into the body of the CTA!
- **Flexible Action**: The \`action\` prop accepts any React node, allowing for custom buttons, links, or groups.
- **Dismissible**: Includes an optional \`onDismiss\` callback for user-controlled closure.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12">
        <div className="light bg-gray-50 p-8 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <Story />
        </div>
        <div className="dark bg-gray-950 p-8 rounded-xl border border-gray-800 shadow-xl">
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
      options: ["primary", "neutral", "warning", "error", "success", "info"],
    },
    title: { description: "The main bold heading." },
    description: {
      description: "The supporting body text or React Node (optional).",
    },
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
 * The brand new Rich Description superpower!
 * Demonstrates embedding another component (Countdown) directly into the description prop.
 */
export const RichDescriptionEmbedded: Story = {
  args: {
    title: "NFL Season is coming soon!",
    variant: "primary",
    icon: <FontAwesomeIcon icon={faTrophy} className="h-5 w-5" />,
    description: (
      <div className="flex flex-col gap-4 mt-2">
        <span>
          First game expected on September 4th. Get your squad together and
          create a NFL league. Once games are available, the schedule will
          automatically populate.
        </span>
        <div className="bg-black/5 dark:bg-black/20 p-4 rounded-xl border border-black/10 dark:border-white/10 self-start">
          <Countdown
            targetDate={new Date(new Date().setDate(new Date().getDate() + 14))} // 14 days from now
            size="sm"
            variant="neutral" // Instructs the text to inherit the CTA's color!
            className="text-left"
          />
        </div>
      </div>
    ),
    action: (
      <Button variant="solid" colorScheme="primary">
        Create League
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Because `description` is a ReactNode, you can inject complex layouts and other components—like this `Countdown` timer—directly into the body of the Call To Action. Setting the Countdown to `variant="neutral"` ensures it perfectly inherits the text color of the CTA variant!',
      },
    },
  },
};

/**
 * The new Success variant. Perfect for confirmation states or completed onboarding steps.
 */
export const SuccessState: Story = {
  args: {
    title: "All Picks Submitted",
    description:
      "You are locked in for Week 5 across all 3 of your active leagues. Good luck!",
    variant: "success",
    icon: <FontAwesomeIcon icon={faCheckDouble} className="h-5 w-5" />,
    action: (
      <Button variant="outline" colorScheme="success" size="sm">
        Review Picks
      </Button>
    ),
  },
};

/**
 * Used for high-priority alerts that require immediate attention.
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
 * The new Info variant. Great for general system messages or contextual help.
 */
export const InfoMessage: Story = {
  args: {
    title: "Scoring Update",
    description:
      "We've updated how tie-breakers are calculated for the playoffs. Check out the new rules before making your wildcard picks.",
    variant: "info",
    icon: <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5" />,
    action: (
      <Button variant="ghost" colorScheme="primary" size="sm">
        Read Rules
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
