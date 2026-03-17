import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./Table";

const meta = {
  title: "Organisms/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### Context-Aware Table Primitives

A set of composable, beautifully styled HTML Table primitives. 

#### 🏗️ Architecture & Context
Roster uses an advanced **Context-Driven Variant System** for tables. Instead of manually passing \`variant="primary"\` to every single row and cell, you pass it once to the root \`<Table>\` component. Every internal component (\`<TableHeader>\`, \`<TableRow>\`, etc.) listens to that context and automatically applies the perfectly mapped Tailwind classes for that specific theme in both light and dark modes.

#### ⚡ Interactive States
By default, table rows are static. To enable row hover effects and pointer cursors, explicitly pass the \`hoverable\` prop to the root \`<Table>\` component. The hover colors will automatically adjust to match your chosen variant!
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "subtle", "primary", "ghost"],
      description: "The overarching visual theme of the table.",
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Adjusts the base font size and cell padding.",
      table: { defaultValue: { summary: "md" } },
    },
    hoverable: {
      control: "boolean",
      description: "Enables interactive row hover states and pointer cursors.",
      table: { defaultValue: { summary: "false" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12 w-full max-w-5xl mx-auto">
        {/* Light Mode Preview */}
        <div className="light bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <Story />
        </div>

        {/* Dark Mode Preview */}
        <div className="dark bg-gray-950 p-8 rounded-xl border border-gray-800 shadow-xl flex flex-col gap-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof Table>;

const mockLeaderboard = [
  { rank: 1, name: "Alice", correct: 42, winRate: "68%" },
  { rank: 2, name: "Bob", correct: 39, winRate: "62%" },
  { rank: 3, name: "Charlie", correct: 35, winRate: "56%" },
  { rank: 4, name: "Diana", correct: 31, winRate: "50%" },
];

// Helper render function so we don't repeat the table markup for every story
const renderTable = (args: React.ComponentProps<typeof Table>) => (
  <Table {...args}>
    <TableCaption>Current Week Standings</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead className="w-24">Rank</TableHead>
        <TableHead>Player</TableHead>
        <TableHead>Correct Picks</TableHead>
        <TableHead className="text-right">Win Rate</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {mockLeaderboard.map((row) => (
        <TableRow key={row.rank}>
          <TableCell className="font-medium">{row.rank}</TableCell>
          <TableCell>{row.name}</TableCell>
          <TableCell>{row.correct}</TableCell>
          <TableCell className="text-right font-bold">{row.winRate}</TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3}>Total Picks Made</TableCell>
        <TableCell className="text-right">147</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);

export const DefaultTheme: Story = {
  args: {
    variant: "default",
    hoverable: true,
  },
  render: renderTable,
  parameters: {
    docs: {
      description: {
        story:
          "The standard table layout. It uses a high-contrast white background in light mode and a deep black background in dark mode, framed by subtle borders.",
      },
    },
  },
};

export const SubtleTheme: Story = {
  args: {
    variant: "subtle",
    hoverable: true,
  },
  render: renderTable,
  parameters: {
    docs: {
      description: {
        story:
          "A softer approach. The wrapper uses a lighter gray background and transparent rows, perfect for placing inside cards or modals where you don't want harsh white boxes.",
      },
    },
  },
};

export const PrimaryTheme: Story = {
  args: {
    variant: "primary",
    hoverable: true,
  },
  render: renderTable,
  parameters: {
    docs: {
      description: {
        story:
          "Injects the brand's primary color into the borders, headers, and hover states. Excellent for highlighting important data sets.",
      },
    },
  },
};

export const GhostTheme: Story = {
  args: {
    variant: "ghost",
    hoverable: true,
  },
  render: renderTable,
  parameters: {
    docs: {
      description: {
        story:
          "Removes the outer wrapper background and border completely. Useful when you want the table to sit perfectly flush within another highly-styled container.",
      },
    },
  },
};

export const StaticNoHover: Story = {
  args: {
    variant: "default",
    hoverable: false,
  },
  render: renderTable,
  parameters: {
    docs: {
      description: {
        story:
          "By default, `hoverable` is false. This creates a purely static layout that prevents users from thinking the rows are clickable.",
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    variant: "subtle",
    size: "sm",
    hoverable: true,
  },
  render: renderTable,
  parameters: {
    docs: {
      description: {
        story:
          'Pass `size="sm"` to tighten up padding and reduce font sizes. Ideal for dense data sets or tight sidebars.',
      },
    },
  },
};
