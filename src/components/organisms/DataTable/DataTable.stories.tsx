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
    // TanStack allows sorting by default, clicking this header will trigger it!
  },
  {
    accessorKey: "team",
    header: "Team Selected",
  },
  {
    accessorKey: "status",
    header: "Status",
    // 🎨 TANSTACK FEATURE: Custom Cell Rendering
    // We can inject Roster components directly into the grid cells
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
    // 🎨 TANSTACK FEATURE: Custom Header Alignment
    header: () => <div className="text-right">Points Earned</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("points"));
      // Formatting the number cell to be bold and right-aligned
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
- **Adaptive Theming:** Inherits all the beautiful Light/Dark mode transitions from Roster's core \`<Table>\` primitives.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  args: {
    columns: columns as any, // Type coercion here avoids strict Storybook generic inference issues
    data: mockData,
  },
};

export const CustomContainerStyling: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Because `DataTable` delegates layout to its wrapper, you can easily pass custom `className` props to add shadows, max-widths, or margin without breaking the table logic.",
      },
    },
  },
  args: {
    columns: columns as any,
    data: mockData,
    className: "max-w-3xl shadow-xl rounded-xl border-primary-500/20",
  },
};
