import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressField } from "./ProgressField";

const meta = {
  title: "Molecules/ProgressField",
  component: ProgressField,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "**The form to reach for when showing progress.** A Progress bar with its label and value above it on one baseline (label left, value right, so a column of them lines up down a page) and an optional detail line below for bytes, a step counter or the time left.",
          "",
          "It takes everything Progress does: continuous or segmented, determinate, indeterminate or busy, four statuses, two sizes. A screen reader hears the label and value together, politely, as they change; the visible pair is hidden from it so it isn't read twice. The detail line is ordinary text, read where it sits.",
        ].join("\n"),
      },
    },
  },
  args: { label: "Uploading photos", value: 45 },
} satisfies Meta<typeof ProgressField>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: 24, maxWidth: 440 } as const;

export const Default: Story = {
  render: () => (
    <div style={column}>
      <ProgressField label="Uploading photos" value={45} detail="3.2 MB of 7.1 MB" />
      <ProgressField label="Importing the trail log" value={100} status="success" detail="412 entries" />
      <ProgressField label="Checking links" value={70} status="warning" detail="3 slow to answer" />
    </div>
  ),
  parameters: { docs: { description: { story: "A column of fields, their labels and values lined up." } } },
};

function Syncing() {
  const [pages, setPages] = useState(0);
  const total = 38;
  useEffect(() => {
    const t = setInterval(() => setPages((p) => (p >= total ? 0 : p + 1)), 180);
    return () => clearInterval(t);
  }, []);
  return (
    <ProgressField
      label="Reading your history"
      value={pages}
      max={total}
      detail={`${(pages * 200).toLocaleString("en-US")} of ${(total * 200).toLocaleString("en-US")} entries`}
    />
  );
}

export const ASync: Story = {
  render: () => (
    <div style={column}>
      <Syncing />
      <ProgressField label="Finding where to start" detail="This takes a moment the first time" />
    </div>
  ),
  parameters: { docs: { description: { story: "A long sync with a running count, and the indeterminate wait before the total is known." } } },
};

export const Segmented: Story = {
  render: () => (
    <div style={column}>
      <ProgressField label="Picks made" variant="segmented" segments={["done", "done", "done", "done", "na", "current", "remaining", "remaining"]} detail="One game already started" />
      <ProgressField label="Files sent" variant="segmented" value={3} max={5} valueText="3 of 5 files" />
    </div>
  ),
  parameters: { docs: { description: { story: "A count of discrete things, with the count as the value, or your own words for it." } } },
};
