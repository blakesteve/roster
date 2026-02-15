import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CallToAction } from "./CallToAction";
import { Button } from "../../atoms/Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faTriangleExclamation,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Molecules/CallToAction",
  component: CallToAction,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "neutral", "warning", "error"],
    },
  },
} satisfies Meta<typeof CallToAction>;

export default meta;
type Story = StoryObj<typeof CallToAction>;

// 1. Primary: The "Call to Arms" for the week
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

// 2. Persistent Logic Pattern
const PersistentBannerDemo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const CTA_ID = "banner-intro-v2";

  useEffect(() => {
    const dismissed = sessionStorage.getItem(CTA_ID);
    if (!dismissed) setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(CTA_ID, "true");
  };

  const handleReset = () => {
    sessionStorage.removeItem(CTA_ID);
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <div className="p-4 border border-dashed rounded text-center text-gray-400 text-sm">
        Banner dismissed.{" "}
        <button
          onClick={handleReset}
          className="underline hover:text-primary-500"
        >
          Reset Storage
        </button>{" "}
        to view again.
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("Navigating to Pools...")}
        >
          View Pools
        </Button>
      }
    />
  );
};

export const WithPersistenceLogic: Story = {
  render: () => <PersistentBannerDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "This example replicates the original `MegaCTA` behavior (dismissable banners). The storage logic lives in the parent component.",
      },
    },
  },
};

// 3. System Alert (Warning)
export const LockWarning: Story = {
  args: {
    title: "Picks Locking Soon",
    description:
      "The early window games lock in 30 minutes. 4 of your picks are still pending.",
    variant: "warning",
    icon: <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5" />,
    action: (
      <Button
        variant="solid"
        className="bg-amber-600 hover:bg-amber-700 text-white border-transparent"
      >
        Finish Picks
      </Button>
    ),
  },
};

// 4. Simple Error (No Icon, No Action)
export const ScoreSyncError: Story = {
  args: {
    title: "Live Scoring Delayed",
    description:
      "We are experiencing a delay receiving data from the provider. Picks are safe, but scores may lag by 5-10 minutes.",
    variant: "error",
  },
};
