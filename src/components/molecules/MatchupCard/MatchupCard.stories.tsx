import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MatchupCard, type TeamMatchupData } from "./MatchupCard";

const meta = {
  title: "Molecules/MatchupCard",
  component: MatchupCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
### Generic Sports Matchup Strip

The **MatchupCard** is a highly flexible molecule designed to display head-to-head competitions. It entirely separates the *data logic* from the *visual state*, automatically handling the complex conditional rendering of winners, losers, and ties.

#### 🎨 Use Cases
* **Schedules:** Pass \`isCompleted={false}\` to show the \`@\` separator and upcoming game information.
* **Results:** Pass \`isCompleted={true}\` along with scores to trigger grayscale loser states and highlighted winner states.
* **Flexibility:** The \`accessory\` prop is a \`ReactNode\`. You can pass simple strings like \`"(5)"\` for pick counts, team records like \`"10-2"\`, or styled spans for betting odds.
`,
      },
    },
  },
  argTypes: {
    isCompleted: {
      control: "boolean",
      description:
        "Toggles the display of scores and applies win/loss/tie visual states.",
      table: { defaultValue: { summary: "false" } },
    },
    isTie: {
      control: "boolean",
      description:
        "If true (and isCompleted is true), overrides win/loss styles with a neutral tie indicator.",
      table: { defaultValue: { summary: "false" } },
    },
    awayTeam: {
      description:
        "Data object containing the away team's logo, score, win state, and accessory slot.",
    },
    homeTeam: {
      description:
        "Data object containing the home team's logo, score, win state, and accessory slot.",
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 min-w-[350px] flex justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchupCard>;

export default meta;
type Story = StoryObj<typeof MatchupCard>;

// --- Mock Data Helpers ---
// Using ui-avatars to generate placeholder team logos so they work out-of-the-box
const mockAwayTeam: TeamMatchupData = {
  id: "away-1",
  name: "Away Team",
  logoSrc:
    "https://ui-avatars.com/api/?name=AW&background=0D8ABC&color=fff&rounded=true&bold=true",
};

const mockHomeTeam: TeamMatchupData = {
  id: "home-1",
  name: "Home Team",
  logoSrc:
    "https://ui-avatars.com/api/?name=HO&background=EF4444&color=fff&rounded=true&bold=true",
};

// --- Stories ---

export const UpcomingPickEm: Story = {
  args: {
    isCompleted: false,
    awayTeam: {
      ...mockAwayTeam,
      accessory: "(12)", // Pick count
    },
    homeTeam: {
      ...mockHomeTeam,
      accessory: "(4)", // Pick count
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The default state for future games. It displays the `@` symbol to indicate location and uses the accessory slot to show how many users picked each team.",
      },
    },
  },
};

export const CompletedHomeWin: Story = {
  args: {
    isCompleted: true,
    awayTeam: {
      ...mockAwayTeam,
      score: 14,
      isWinner: false,
      accessory: "(12)",
    },
    homeTeam: {
      ...mockHomeTeam,
      score: 28,
      isWinner: true,
      accessory: "(4)",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "When `isCompleted` is true, the separator changes to a hyphen. The winning team receives a success highlight, while the losing team is faded and grayscaled.",
      },
    },
  },
};

export const CompletedTie: Story = {
  args: {
    isCompleted: true,
    isTie: true,
    awayTeam: {
      ...mockAwayTeam,
      score: 24,
      isWinner: false,
      accessory: "(8)",
    },
    homeTeam: {
      ...mockHomeTeam,
      score: 24,
      isWinner: false,
      accessory: "(8)",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Passing `isTie={true}` safely overrides the win/loss states, applying a neutral gray indicator to both teams without dimming either.",
      },
    },
  },
};

export const UpcomingWithRecords: Story = {
  args: {
    isCompleted: false,
    awayTeam: {
      ...mockAwayTeam,
      accessory: "10-2",
    },
    homeTeam: {
      ...mockHomeTeam,
      accessory: "6-6",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `accessory` slot is completely data-agnostic. Here it displays team win-loss records instead of pick counts.",
      },
    },
  },
};

export const UpcomingWithBettingOdds: Story = {
  args: {
    isCompleted: false,
    awayTeam: {
      ...mockAwayTeam,
      // Demonstrating that accessory accepts raw React Nodes for custom styling
      accessory: (
        <span className="text-error-500 font-medium tracking-wide">+150</span>
      ),
    },
    homeTeam: {
      ...mockHomeTeam,
      accessory: (
        <span className="text-success-500 font-medium tracking-wide">-200</span>
      ),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Because `accessory` accepts a `ReactNode`, you can pass in fully styled spans. This is perfect for displaying colored betting lines or dynamically styled live-game data.",
      },
    },
  },
};
