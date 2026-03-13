import type { Meta, StoryObj } from "@storybook/react";
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

const meta: Meta<typeof Table> = {
  title: "Organisms/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
A set of composable, beautifully styled HTML Table primitives. 

### 🏗️ Architecture: Primitives vs. DataTable
Roster provides two ways to build tables to guarantee maximum flexibility and zero bundle bloat:

1. **Table Primitives (This component):** Pure UI atoms (\`<Table>\`, \`<TableRow>\`, etc.). Use these when you need a simple, static layout (like a receipt summary or a small leaderboard). It has **zero external dependencies** and handles all dark mode, borders, and hover states automatically.
2. **DataTable (Smart Wrapper):** A fully-featured data grid powered by \`@tanstack/react-table\`. It consumes these primitives under the hood to provide sorting, pagination, and robust data management. Import \`DataTable\` when dealing with complex, dynamic datasets.
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Adjusts the base font size of the table.",
      table: { defaultValue: { summary: "md" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

const mockLeaderboard = [
  { rank: 1, name: "Alice", correct: 42, winRate: "68%" },
  { rank: 2, name: "Bob", correct: 39, winRate: "62%" },
  { rank: 3, name: "Charlie", correct: 35, winRate: "56%" },
  { rank: 4, name: "Diana", correct: 31, winRate: "50%" },
];

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Current Week Standings</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25">Rank</TableHead>
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
            <TableCell className="text-right font-bold text-primary-500">
              {row.winRate}
            </TableCell>
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
  ),
};
