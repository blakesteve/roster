import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button/Button";
import type { SliderSnapPoint } from "../Slider/Slider";
import { RangeSlider, type RangeValue } from "./RangeSlider";

const TIERS: SliderSnapPoint[] = [
  { value: 100, label: "Budget" },
  { value: 250, label: "Mid-range" },
  { value: 400, label: "Premium" },
];
const dollars = (v: number) => `$${v}`;

const meta = {
  title: "Molecules/RangeSlider",
  component: RangeSlider,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Two values along one track, a low and a high: tapped, dragged, stepped with the keys, or set from a named snap point. `Slider`'s track, with two thumbs.",
          "",
          "- **It starts at the whole range**, `[min, max]`, unless `defaultValue` says otherwise. There's no not-set state: the whole range is what \"any\" looks like.",
          "- **Each thumb is a slider** to the keyboard and a screen reader: its own tab stop, named for the slider and its end (\"Price Minimum\"), with a range that runs to the other thumb. The thumbs meet, and never cross.",
          "- **The pointer** takes the nearer thumb: a tap on the track moves it there, and a drag carries it. Two thumbs on one spot part by the way the drag first moves.",
          "- **Snap points** put a mark on the track and a selectable `Chip` under it, which does what a tap on its mark does: moves the nearer thumb there.",
          "- **The number** beside the label shows both values. Each thumb says its own, with the nearest snap point's name.",
          "- **Targets:** each thumb's is 44 by 44 at every value, and so is each chip's.",
        ].join("\n"),
      },
    },
  },
  args: { label: "Price" },
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame = ({ children }: { children: React.ReactNode }) => <div style={{ maxWidth: 420 }}>{children}</div>;

export const Default: Story = {
  render: (args) => (
    <Frame>
      <RangeSlider {...args} />
    </Frame>
  ),
  parameters: { docs: { description: { story: "With nothing passed, the thumbs start at the two ends: the whole range." } } },
};

export const WithValues: Story = {
  render: (args) => (
    <Frame>
      <RangeSlider {...args} min={0} max={500} step={5} defaultValue={[120, 340]} formatValue={dollars} />
    </Frame>
  ),
  parameters: { docs: { description: { story: "Its own range and step, a starting pair, and `formatValue` writing both numbers." } } },
};

export const SnapPoints: Story = {
  render: (args) => (
    <Frame>
      <RangeSlider {...args} min={0} max={500} step={5} snapPoints={TIERS} formatValue={dollars} helperText="Pick a chip to move the nearer end there." />
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story: "A chip moves whichever thumb is nearer its value, as a tap on its mark would, and shows as pressed while either thumb is on it.",
      },
    },
  },
};

function Resettable() {
  const [value, setValue] = useState<RangeValue>([20, 70]);
  return (
    <Frame>
      <div style={{ display: "grid", gap: 12 }}>
        <RangeSlider label="Price" value={value} onChange={setValue} />
        <div>
          <Button size="sm" variant="outline" colorScheme="neutral" onClick={() => setValue([0, 100])} disabled={value[0] === 0 && value[1] === 100}>
            Any price
          </Button>
        </div>
      </div>
    </Frame>
  );
}

export const Controlled: Story = {
  render: () => <Resettable />,
  parameters: { docs: { description: { story: "Controlled from outside: \"Any price\" sets it back to the whole range." } } },
};

export const Disabled: Story = {
  render: (args) => (
    <Frame>
      <RangeSlider {...args} defaultValue={[30, 60]} snapPoints={[{ value: 50, label: "Half" }]} disabled />
    </Frame>
  ),
};

function AtLeastTwenty() {
  const [value, setValue] = useState<RangeValue>([40, 50]);
  return (
    <Frame>
      <RangeSlider
        label="Price"
        value={value}
        onChange={setValue}
        helperText="Leave at least 20 between them."
        errorMessage={value[1] - value[0] < 20 ? "Leave at least 20 between them." : undefined}
      />
    </Frame>
  );
}

export const WithAnError: Story = {
  render: () => <AtLeastTwenty />,
  parameters: {
    docs: {
      description: {
        story: "The error is the consumer's to set and to clear, as in every Roster field. Here it's set while the ends are under 20 apart, so dragging them apart clears it.",
      },
    },
  },
};

export const DarkTheme: Story = {
  render: (args) => (
    <div className="dark" style={{ background: "#1c1917", padding: 24, borderRadius: 8, maxWidth: 468 }}>
      <RangeSlider {...args} min={0} max={500} step={5} defaultValue={[120, 340]} snapPoints={TIERS} formatValue={dollars} />
    </div>
  ),
};
