import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Atoms/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A placeholder in the shape of what's loading, so a page keeps its layout while it waits and nothing moves when the content lands.",
          "",
          "Three shapes. A **line** is one line of text, exactly one line box tall at its `size` (`sm` 12px on 16, `md` 14px on 20, `lg` 16px on 24, or `inherit`), so a paragraph of skeleton is the height of the paragraph that replaces it. A **block** stands in for an image or a chart at its `height`. A **circle** is an avatar at Avatar's sizes.",
          "",
          "It's drawn in `--roster-skeleton`, a neutral surface shared with the empty part of a progress bar, and a band of light crosses it. Under reduced motion it holds still on the flat fill. Skeletons are always hidden from screen readers; the region they stand in for says it's busy (see `SkeletonRegion`). For the things people most often wait on, the presets draw the real component's box: see Skeleton/Presets.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lines: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 20, maxWidth: 420 }}>
      <Skeleton size="lg" width="50%" />
      <Skeleton size="md" lines={3} />
      <Skeleton size="sm" lines={2} width="35%" />
    </div>
  ),
  parameters: {
    docs: { description: { story: "A title, a paragraph, a caption. The last line of a paragraph is the short one, at `width`." } },
  },
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
        <Skeleton key={s} shape="circle" size={s} />
      ))}
      <div style={{ width: 200 }}>
        <Skeleton shape="block" height={96} />
      </div>
      <div style={{ width: 120 }}>
        <Skeleton shape="block" height={96} radius="full" />
      </div>
    </div>
  ),
  parameters: { docs: { description: { story: "Circles at Avatar's five sizes, and blocks at a height, on the radius scale." } } },
};

export const InheritingTheText: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <h3 style={{ fontSize: 24, lineHeight: "32px", margin: 0 }}>
        <Skeleton size="inherit" width="60%" />
      </h3>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
        <Skeleton size="inherit" lines={2} />
      </p>
    </div>
  ),
  parameters: {
    docs: { description: { story: "`size=\"inherit\"` takes the surrounding text's size and line height, so it fits inside a heading or a paragraph you've already styled." } },
  },
};
