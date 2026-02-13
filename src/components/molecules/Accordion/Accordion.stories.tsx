import type { Meta, StoryObj } from "@storybook/react";
import { Accordion } from "./Accordion";
import { Badge } from "../../atoms/Badge/Badge";
import { Button } from "../../atoms/Button/Button";

const meta = {
  title: "Molecules/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The **Accordion** is a layout molecule that manages a vertical stack of **Disclosure** atoms. \n\nIt is primarily used to organize large amounts of content into collapsible sections. It supports two main modes of operation: \n\n1. **Single (Classic):** Only one section can be open at a time. Opening a new section automatically closes the previous one.\n2. **Multiple:** Users can expand as many sections as they like independently.",
      },
    },
  },
  argTypes: {
    items: {
      description: "Array of objects containing `id`, `title`, and `content`.",
    },
    variant: {
      control: "select",
      options: ["soft", "filled", "outline", "ghost"],
      description: "Visual style applied to all items in the list.",
      table: { defaultValue: { summary: "soft" } },
    },
    allowMultiple: {
      control: "boolean",
      description: "If `true`, multiple items can be expanded simultaneously.",
      table: { defaultValue: { summary: "false" } },
    },
    showDividers: {
      control: "boolean",
      description: "Renders a subtle separator line between items.",
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      control: "text",
      description: "Outer wrapper styling.",
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Mock Data ---
const basicItems = [
  {
    id: "overview",
    title: "Project Overview",
    content:
      "MegaSquad is a next-gen fantasy sports application built with React and Tailwind.",
  },
  {
    id: "tech-stack",
    title: "Tech Stack",
    content:
      "We use Vite, TypeScript, Storybook, and Vitest for a robust development environment.",
  },
  {
    id: "contact",
    title: "Contact Support",
    content: "Reach out to the dev team via Slack channel #megasquad-dev.",
  },
];

const richItems = [
  {
    id: 1,
    title: (
      <div className="flex items-center justify-between w-full pr-4">
        <span>Payment Method</span>
        <Badge variant="success" size="xs">
          ACTIVE
        </Badge>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">Visa ending in 4242</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="ghost" colorScheme="error">
            Remove
          </Button>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: (
      <div className="flex items-center justify-between w-full pr-4">
        <span>Billing History</span>
        <span className="text-xs text-gray-400 font-normal">3 Invoices</span>
      </div>
    ),
    content: (
      <ul className="list-disc pl-5 text-gray-600 space-y-1">
        <li>Jan 2026 - $12.00</li>
        <li>Dec 2025 - $12.00</li>
        <li>Nov 2025 - $12.00</li>
      </ul>
    ),
  },
];

export const Default: Story = {
  args: {
    items: basicItems,
    variant: "soft",
  },
};

export const MultiExpand: Story = {
  args: {
    items: basicItems,
    allowMultiple: true,
    variant: "outline",
    showDividers: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Set `allowMultiple` to `true` to let users keep multiple sections open at once. This is useful for filters or settings pages.",
      },
    },
  },
};

export const MegaSquadFilled: Story = {
  args: {
    items: [
      {
        id: "draft",
        title: "Draft Settings",
        content: "Draft Date: Feb 28th, 2026 at 8:00 PM EST.",
      },
      {
        id: "roster",
        title: "Roster Configuration",
        content: "QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6",
      },
    ],
    variant: "filled",
    allowMultiple: false,
    showDividers: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `filled` variant uses the darker gray background requested for the MegaSquad dashboard panels.",
      },
    },
  },
};

export const GhostMinimal: Story = {
  args: {
    items: basicItems,
    variant: "ghost",
    showDividers: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `ghost` variant has no background color until hovered. It pairs well with `showDividers` for a clean list look.",
      },
    },
  },
};

export const ComplexContent: Story = {
  args: {
    items: richItems,
    variant: "outline",
    allowMultiple: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `title` and `content` props accept any React Node, allowing you to embed Badges, Buttons, or complex layouts directly into the Accordion.",
      },
    },
  },
};
