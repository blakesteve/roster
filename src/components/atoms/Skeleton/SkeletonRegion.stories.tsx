import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "../Card/Card";
import { Button } from "../Button/Button";
import { SkeletonRegion } from "./Skeleton";
import { SkeletonCard } from "../../molecules/SkeletonPresets/SkeletonPresets";

const meta = {
  title: "Atoms/Skeleton/SkeletonRegion",
  component: SkeletonRegion,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The region a skeleton stands in for. While `loading`, it's `aria-busy`, the skeleton is hidden from screen readers, and `label` is said once in its place; then the content replaces the skeleton in the same box. Draw the skeleton at the content's size and nothing moves.",
      },
    },
  },
  args: { loading: true, skeleton: null },
} satisfies Meta<typeof SkeletonRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 380 }}>
      <SkeletonRegion loading={loading} label="Loading the trail log" skeleton={<SkeletonCard lines={2} />}>
        <Card>
          <h3 style={{ margin: 0, fontSize: 16, lineHeight: "24px", fontWeight: 600 }}>Ridge loop, 8.4 miles</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: "20px" }}>
            Clear to the saddle, then mud past the second creek. Water at the spring.
          </p>
        </Card>
      </SkeletonRegion>
      <div>
        <Button size="sm" variant="outline" colorScheme="neutral" onClick={() => setLoading(true)}>
          Load again
        </Button>
      </div>
    </div>
  );
}

export const LoadingThenLoaded: Story = {
  render: () => <Demo />,
  parameters: {
    docs: { description: { story: "A card's worth of content arrives after a moment, into the box its skeleton held. Press Load again to watch it twice." } },
  },
};
