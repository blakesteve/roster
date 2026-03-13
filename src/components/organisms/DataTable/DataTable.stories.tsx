import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../atoms/Badge/Badge";

// --- MOCK TYPES & DATA ---
type PickRecord = {
  id: string;
  player: string;
  team: string;
  status: "Won" | "Lost" | "Pending";
  points: number;
};

const mockData: PickRecord[] = [
  { id: "1", player: "Alice", team: "Chiefs", status: "Won", points: 10 },
  { id: "2", player: "Bob", team: "Eagles", status: "Lost", points: 0 },
  { id: "3", player: "Charlie", team: "Bills", status: "Pending", points: 0 },
  { id: "4", player: "Diana", team: "49ers", status: "Won", points: 15 },
  { id: "5", player: "Evan", team: "Lions", status: "Won", points: 12 },
  { id: "6", player: "Fiona", team: "Ravens", status: "Lost", points: 0 },
  { id: "7", player: "George", team: "Bengals", status: "Pending", points: 0 },
  { id: "8", player: "Hannah", team: "Dolphins", status: "Won", points: 8 },
  { id: "9", player: "Ian", team: "Cowboys", status: "Lost", points: 0 },
  { id: "10", player: "Julia", team: "Packers", status: "Won", points: 14 },
  { id: "11", player: "Kevin", team: "Texans", status: "Pending", points: 0 },
  { id: "12", player: "Laura", team: "Rams", status: "Won", points: 11 },
];

// --- COLUMNS DEFINITION ---
const columns: ColumnDef<PickRecord>[] = [
  {
    accessorKey: "player",
    header: "Player",
  },
  {
    accessorKey: "team",
    header: "Team Selected",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      if (status === "Won") {
        return (
          <Badge variant="success" fill="light">
            Won
          </Badge>
        );
      }
      if (status === "Lost") {
        return (
          <Badge variant="error" fill="light">
            Lost
          </Badge>
        );
      }
      return (
        <Badge variant="neutral" fill="outline">
          Pending
        </Badge>
      );
    },
  },
  {
    accessorKey: "points",
    header: () => <div className="text-right">Points Earned</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("points"));
      return (
        <div className="text-right font-medium text-black dark:text-white">
          {amount}
        </div>
      );
    },
  },
];

// --- STORYBOOK META ---
const meta: Meta<typeof DataTable> = {
  title: "Organisms/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
The **DataTable** is a smart, fully-featured data grid powered by \`@tanstack/react-table\`.

### ✨ Included Features:
- **Sorting:** Click on column headers to sort ascending/descending.
- **Pagination:** Automatically paginates data (default pageSize is 10).
- **Custom Rendering:** Easily inject Badges, Buttons, or complex layouts into cells via the TanStack \`cell\` property.
- **Section Customization:** Use \`className\`, \`tableClassName\`, and \`paginationClassName\` to inject targeted styles into specific areas of the component without forking the logic.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  args: {
    columns: columns as any,
    data: mockData,
  },
};

export const DarkMode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Because DataTable relies on the underlying Table primitives, it inherits the explicit `.dark` class styling. Notice the seamless framing between the header, data rows, and the pagination footer.",
      },
    },
  },
  render: (args) => (
    <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800">
      <DataTable {...args} columns={columns as any} data={mockData} />
    </div>
  ),
};

export const CustomSectionStyling: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Need to match a specific brand identity? You can pass `className` to target the outer wrapper, `tableClassName` for the grid, and `paginationClassName` for the footer.",
      },
    },
  },
  args: {
    columns: columns as any,
    data: mockData,
    className: "border-teal-500/30 shadow-lg rounded-lg overflow-hidden",
    tableClassName: "[&_thead]:bg-teal-50 [&_tbody_tr]:bg-white",
    paginationClassName: "bg-teal-50 border-t-teal-500/20",
  },
};
