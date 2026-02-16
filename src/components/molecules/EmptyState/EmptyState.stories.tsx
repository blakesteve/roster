import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "../../atoms/Button/Button";
import { Link } from "../../atoms/Link/Link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faMagnifyingGlass,
  faClipboardList,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Molecules/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["dashed", "simple"],
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof EmptyState>;

// 1. Dashboard Context: No Leagues Yet
export const NoLeagues: Story = {
  args: {
    title: "No Active Leagues",
    description:
      "You haven't joined any MegaSquad leagues yet. Create your own or find one to join.",
    variant: "dashed",
    icon: <FontAwesomeIcon icon={faTrophy} />,
    action: (
      <div className="flex gap-3">
        <Button variant="solid" colorScheme="primary">
          Create League
        </Button>
        <Button variant="outline">Join Existing</Button>
      </div>
    ),
  },
};

// 2. Search Context: No Results
export const NoSearchResults: Story = {
  args: {
    title: "No players found",
    description:
      "We couldn't find any players matching 'Tom Brodi'. Try checking the spelling.",
    variant: "simple", // Clean look for inside a dropdown/list
    icon: <FontAwesomeIcon icon={faMagnifyingGlass} />,
    action: (
      <Link href="#" variant="primary" size="sm">
        Clear Filters
      </Link>
    ),
  },
};

// 3. Section Context: No Picks Made
export const NoPicks: Story = {
  args: {
    title: "Your Slip is Empty",
    description:
      "Start selecting spreads from the game board to build your entry.",
    variant: "dashed",
    icon: <FontAwesomeIcon icon={faClipboardList} />,
    action: (
      <Button
        size="sm"
        variant="soft"
        startIcon={<FontAwesomeIcon icon={faPlus} />}
      >
        Go to Game Board
      </Button>
    ),
  },
};

// 4. Minimal (Just Text)
export const Minimal: Story = {
  args: {
    title: "No History",
    description: "Past game results will appear here.",
    variant: "simple",
  },
};
