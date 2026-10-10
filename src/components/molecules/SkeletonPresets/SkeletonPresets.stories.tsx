import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../../organisms/Table/Table";
import { SkeletonAvatar, SkeletonCard, SkeletonStat, SkeletonTableRow } from "./SkeletonPresets";

const meta = {
  title: "Atoms/Skeleton/Presets",
  component: SkeletonCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Skeletons for what people wait on most: a card, a table row, an avatar, a stat. Each is the real component's container with lines set in the real text sizes, so content laid out the way it documents lands in exactly the box it drew.",
          "",
          "- **SkeletonCard:** a Card with an optional media block (16px under it), a `text-base` title, and `text-sm` body lines 8px under that.",
          "- **SkeletonTableRow:** Table's own row and cells, a line each, at the table's size.",
          "- **SkeletonAvatar:** an Avatar at its size, with a `text-sm` name beside it if asked.",
          "- **SkeletonStat:** Stat's figure and label, in Stat's type and spacing.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof SkeletonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, alignItems: "start" }}>
      <SkeletonCard media={140} lines={2} />
      <SkeletonCard media={140} lines={2} />
      <SkeletonCard lines={3} />
    </div>
  ),
  parameters: { docs: { description: { story: "A grid of cards, with and without media." } } },
};

export const TableRows: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trail</TableHead>
          <TableHead>Distance</TableHead>
          <TableHead>Gain</TableHead>
          <TableHead>Last walked</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonTableRow key={i} columns={4} />
        ))}
      </TableBody>
    </Table>
  ),
  parameters: { docs: { description: { story: "Rows inside the real table, under its real header." } } },
};

export const AvatarsAndStats: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <SkeletonAvatar size="md" withName />
        <SkeletonAvatar size="lg" withName />
      </div>
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <SkeletonStat size="sm" />
        <SkeletonStat size="md" />
        <SkeletonStat size="lg" />
      </div>
    </div>
  ),
  parameters: { docs: { description: { story: "People with names, and stat tiles at Stat's three sizes." } } },
};
