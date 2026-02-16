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
  parameters: {
    docs: {
      description: {
        component: `
### The "Zero Data" Placeholder

The **EmptyState** component is used to fill the void when a list, table, or container has no content to display.

**UX Best Practices:**
* **Explain Why:** Briefly state why there is no content (e.g., "No search results found").
* **Offer a Way Out:** Always provide a clear call-to-action (CTA) to help the user populate the empty space (e.g., "Create League" or "Clear Filters").
* **Use Visuals:** An icon helps users quickly recognize the context before reading the text.

**Variants:**
* **Dashed (Default):** High visibility. Use this for main content areas (e.g., an empty dashboard).
* **Simple:** Minimalist. Use this for smaller widgets, dropdowns, or narrow sidebars where a border would add too much noise.
`,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["dashed", "simple"],
      description: "The visual style of the container.",
      table: { defaultValue: { summary: "dashed" } },
    },
    title: {
      description: "The primary headline text.",
    },
    description: {
      description: "Secondary text explaining the empty state.",
    },
    icon: {
      control: false,
      description: "An optional icon element displayed at the top.",
    },
    action: {
      control: false,
      description: "The primary call-to-action (Button, Link, etc.).",
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
  parameters: {
    docs: {
      description: {
        story:
          "The **Standard** use case. A dashed border indicates that content *should* be here, encouraging the user to fill it.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "Use the **Simple** variant for transient states like search results. It avoids visual clutter inside dropdowns or lists.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "An example of using the **Soft** button variant for a secondary action that guides the user to a different page.",
      },
    },
  },
};

// 4. Minimal (Just Text)
export const Minimal: Story = {
  args: {
    title: "No History",
    description: "Past game results will appear here.",
    variant: "simple",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Sometimes you don't need an action or an icon. Just text is enough for passive empty states.",
      },
    },
  },
};
