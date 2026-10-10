import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./Progress";

const meta = {
  title: "Atoms/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "How far through something is: a **continuous** bar for a fraction, or a **segmented** one for a count of discrete things, where \"twelve of sixteen\" reads without a number beside it. This is the primitive; most screens want **ProgressField**, which adds a label and value above it.",
          "",
          "Leave `value` out for **indeterminate**: a pill crossing the track. Set `busy` when a value stands but work goes on (a server finishing what it was sent): the bar breathes in place. All of it stops under reduced motion.",
          "",
          "Fills are solid, in four statuses, each clearing 3:1 against the track and the page in both themes, and holding up on tinted and glass surfaces where a translucent fill fades to nothing. The track is `--roster-skeleton`. Segments take `done`, `current`, `remaining` and `na` (not part of this one), and round into capsules unless `rounded={false}`.",
          "",
          "The bar is hidden from screen readers. A status region beside it says the value as text, at most every 1.5 seconds, and the end at once.",
          "",
          "**Progress or SegmentBar?** Progress is how much of a task is done. SegmentBar is how a whole divides into parts (a vote split, a budget). Don't use one for the other.",
        ].join("\n"),
      },
    },
  },
  args: { value: 60 },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: 16, maxWidth: 420 } as const;

export const Continuous: Story = {
  render: () => (
    <div style={column}>
      <Progress value={60} label="Default" />
      <Progress value={100} status="success" label="Success" />
      <Progress value={35} status="warning" label="Warning" />
      <Progress value={80} status="error" label="Error" />
      <Progress value={2} label="A low value stays round" />
      <Progress value={60} size="sm" label="Small" />
    </div>
  ),
  parameters: { docs: { description: { story: "Four statuses and two sizes. A low value is a dot, never a squared-off sliver." } } },
};

export const Indeterminate: Story = {
  render: () => (
    <div style={column}>
      <Progress label="Syncing" />
      <Progress value={100} busy label="Finishing" />
    </div>
  ),
  parameters: { docs: { description: { story: "No figure at all: the pill travels. A figure that stands while work goes on: the bar breathes." } } },
};

function Rising() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 4)), 220);
    return () => clearInterval(t);
  }, []);
  return <Progress value={value} label="Copying photos" />;
}

export const Moving: Story = {
  render: () => (
    <div style={column}>
      <Rising />
    </div>
  ),
  parameters: { docs: { description: { story: "A value that keeps changing. A screen reader hears it at most every 1.5 seconds." } } },
};

export const Segmented: Story = {
  render: () => (
    <div style={column}>
      <Progress variant="segmented" value={12} max={16} label="Picks" />
      <Progress variant="segmented" segments={["done", "done", "done", "na", "current", "remaining", "remaining", "na"]} label="Games" />
      <Progress variant="segmented" value={3} max={5} rounded={false} label="Uploads" />
      <Progress variant="segmented" value={5} max={5} status="success" label="Checks" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "A count, each segment's own state (dashed: not part of this one; half: under way), square cells, and a finished set.",
      },
    },
  },
};

export const OnAGlassSurface: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      {/* The retint is for the light theme only: in dark, the fill is
          primary-400, which against primary-200 is about 2:1. */}
      <style>{`.story-glass-retint { --roster-skeleton: var(--roster-primary-200); } .dark .story-glass-retint { --roster-skeleton: var(--roster-gray-700); }`}</style>
      {[
        { background: "rgba(2, 23, 36, 0.9)", name: "Dark glass" },
        { background: "rgba(2, 23, 36, 0.9)", name: "Dark glass, track retinted", retint: true },
        { background: "rgba(8, 64, 99, 0.5)", name: "Brand glass" },
      ].map((s) => (
        <div
          key={s.name}
          style={{
            background: s.background,
            padding: 16,
            borderRadius: 12,
            display: "grid",
            gap: 12,
          }}
          className={s.retint ? "story-glass-retint" : undefined}
        >
          <Progress value={60} label={s.name} />
          <Progress variant="segmented" value={9} max={16} label={`${s.name}, segmented`} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Solid fills on translucent surfaces, where an alpha fill would fade into the glass. On dark glass in the light theme, set `--roster-skeleton` to primary-200 on the surface (the second panel) so the empty cells keep the bar's extent; in the dark theme the default track stays, since primary-400 against primary-200 is about 2:1.",
      },
    },
  },
};
