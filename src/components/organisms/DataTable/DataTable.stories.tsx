import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable, type DataTableProps } from "./DataTable";
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
const columns: ColumnDef<PickRecord, unknown>[] = [
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
        <div className="text-right font-medium text-gray-900 dark:text-gray-100">
          {amount}
        </div>
      );
    },
  },
];

// --- STORYBOOK META ---
const meta = {
  title: "Organisms/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
The **DataTable** is a smart, fully-featured data grid powered by \`@tanstack/react-table\`. It consumes the base \`<Table>\` primitives under the hood, meaning it inherits all of the advanced theme variants and automatic dark mode support.

### ✨ Included Features:
- **Variant Theming:** Pass \`variant="primary"\` or \`variant="ghost"\` to instantly re-theme the entire grid and its pagination controls.
- **Sorting:** Click on column headers to sort ascending/descending automatically.
- **Pagination:** Automatically paginates data (default pageSize is 10).
- **Interactive Rows:** Pass \`hoverable\` to enable intuitive, variant-aware hover states across all data rows.
- **Custom Rendering:** Easily inject Badges, Buttons, or complex layouts into cells via the TanStack \`cell\` property.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "subtle", "primary", "ghost"],
      description: "The overarching visual theme of the data table.",
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
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof DataTable>;

// ✨ Helper to safely bypass generic inference issues in Storybook without using "any"
type DataTableStoryProps = Omit<
  DataTableProps<PickRecord, unknown>,
  "columns" | "data"
>;

const renderDataTable = (args: DataTableStoryProps) => (
  <DataTable<PickRecord, unknown> columns={columns} data={mockData} {...args} />
);

export const DefaultTheme: Story = {
  args: {
    variant: "default",
    hoverable: true,
  },
  render: renderDataTable,
  parameters: {
    docs: {
      description: {
        story:
          "The standard Data Table. Notice how the pagination automatically activates because our mock dataset has 12 items (the default page size is 10). The header click-to-sort functionality is also fully active.",
      },
    },
  },
};

export const PrimaryTheme: Story = {
  args: {
    variant: "primary",
    hoverable: true,
  },
  render: renderDataTable,
  parameters: {
    docs: {
      description: {
        story:
          "Injects the brand's primary color into the table borders, headers, and hover states. This proves that passing `variant` to the `<DataTable>` properly proxies down into the underlying Context.",
      },
    },
  },
};

export const SubtleTheme: Story = {
  args: {
    variant: "subtle",
    hoverable: true,
  },
  render: renderDataTable,
  parameters: {
    docs: {
      description: {
        story:
          "A softer layout utilizing lighter gray backgrounds and transparent rows. Perfect for admin panels heavily populated with nested cards.",
      },
    },
  },
};

export const GhostTheme: Story = {
  args: {
    variant: "ghost",
    hoverable: true,
  },
  render: renderDataTable,
  parameters: {
    docs: {
      description: {
        story:
          "The `ghost` variant strips away all outer borders and background colors. Notice how the pagination controls visually detach and float beautifully beneath the un-bordered grid.",
      },
    },
  },
};

export const CompactSize: Story = {
  args: {
    variant: "default",
    size: "sm",
    hoverable: true,
  },
  render: renderDataTable,
  parameters: {
    docs: {
      description: {
        story:
          'Reduces the padding and font size across the entire table via the `size="sm"` prop. Ideal for dense analytics dashboards.',
      },
    },
  },
};
