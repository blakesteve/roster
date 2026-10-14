import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button/Button";
import { Slider, type SliderSnapPoint } from "./Slider";

const SURE: SliderSnapPoint[] = [
  { value: 100, label: "Certain" },
  { value: 75, label: "Likely" },
  { value: 50, label: "Toss-up" },
];
const percent = (v: number) => `${v}%`;

const meta = {
  title: "Molecules/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A value picked along a track: tapped, dragged, stepped with the keys, or set from a named snap point.",
          "",
          "- **It starts with a thumb**, in the middle of the range, or wherever `startValue` or `defaultValue` puts it: `defaultValue={0}` starts it at the low end.",
          "- **Not set** when it's asked for: `defaultValue={null}`, or `value={null}` when controlled, gives no thumb and an empty track until the first input. A form takes it as a valid answer (an empty string under `name`). A consumer controlling `value` can set it back to `null` to clear it.",
          "- **Snap points** are named stops, any values and labels: a selectable `Chip` under the track for each moves the thumb there, and a bead on the rail shows where. Dragging still lands anywhere between them.",
          "- **The number** shows beside the label. A screen reader hears it with the nearest snap point's name, \"72%, Likely\", and \"Not set\" while there's no value.",
          "- **Keys:** the arrows step by `step`, PageUp and PageDown by `pageStep`, Home and End go to the ends. On an empty slider an arrow or Page key places the thumb at `startValue`, the middle by default. Keys always step from the value last set, never from where the thumb is drawn while it eases there.",
          "- **Targets:** the thumb's is 44 by 44 at every value, the track's full height is a target, and so is each chip's 44px.",
          "- **Focus:** by keyboard, the ring is round the thumb; an empty slider rings the track.",
          "",
          "One thumb. Two, for a low and a high, is `RangeSlider`, on the same track.",
        ].join("\n"),
      },
    },
  },
  args: { label: "How sure are you?" },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame = ({ children }: { children: React.ReactNode }) => <div style={{ maxWidth: 420 }}>{children}</div>;

export const Default: Story = {
  render: (args) => (
    <Frame>
      <Slider {...args} />
    </Frame>
  ),
  parameters: { docs: { description: { story: "With nothing passed, the thumb starts in the middle of the range." } } },
};

export const StartsAtZero: Story = {
  render: (args) => (
    <Frame>
      <Slider {...args} defaultValue={0} />
    </Frame>
  ),
  parameters: { docs: { description: { story: "`defaultValue={0}` starts the thumb at the low end." } } },
};

export const WithAValue: Story = {
  render: (args) => (
    <Frame>
      <Slider {...args} defaultValue={72} formatValue={percent} />
    </Frame>
  ),
  parameters: { docs: { description: { story: "A value, with the number beside the label. `formatValue` writes it, here as a percentage." } } },
};

export const SnapPoints: Story = {
  render: (args) => (
    <Frame>
      <Slider {...args} snapPoints={SURE} formatValue={percent} helperText="Pick a chip, or drag to any point between them." />
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Each snap point gets a chip and a mark. A chip moves the thumb to its value and shows as pressed while the value is exactly there; the track still takes any value between.",
      },
    },
  },
};

const SPEEDS: SliderSnapPoint[] = [
  { value: 0.75, label: "Slow" },
  { value: 1, label: "Normal" },
  { value: 1.5, label: "Fast" },
  { value: 2, label: "Fastest" },
];
const HEAT: SliderSnapPoint[] = [
  { value: 0, label: "None" },
  { value: 3, label: "Mild" },
  { value: 6, label: "Hot" },
  { value: 10, label: "Fire" },
];

export const AnyLabelsAndValues: Story = {
  render: () => (
    <Frame>
      <div style={{ display: "grid", gap: 24 }}>
        <Slider label="Playback speed" min={0.5} max={2} step={0.25} defaultValue={1} snapPoints={SPEEDS} formatValue={(v) => `${v}×`} />
        <Slider label="Spice" min={0} max={10} snapPoints={HEAT} formatValue={(v) => `${v} of 10`} />
      </div>
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Snap points are whatever the consumer passes: any values on the slider's own range and step, decimals included, each with its own label. The label is plain text, since a screen reader hears the nearest one's label after the number: \"1×, Normal\".",
      },
    },
  },
};

export const NotSet: Story = {
  render: (args) => (
    <Frame>
      <Slider {...args} defaultValue={null} snapPoints={SURE} formatValue={percent} />
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story: "`defaultValue={null}`: no thumb, an empty track, and the readout says so, for an answer that mustn't look given before it is. Tap the track, drag, press an arrow, or pick a chip.",
      },
    },
  },
};

function Clearable() {
  const [value, setValue] = useState<number | null>(60);
  return (
    <Frame>
      <div style={{ display: "grid", gap: 12 }}>
        <Slider label="How sure are you?" value={value} onChange={setValue} snapPoints={SURE} formatValue={percent} />
        <div>
          <Button size="sm" variant="outline" colorScheme="neutral" onClick={() => setValue(null)} disabled={value === null}>
            Clear
          </Button>
        </div>
      </div>
    </Frame>
  );
}

export const ControlledWithAClear: Story = {
  render: () => <Clearable />,
  parameters: { docs: { description: { story: "Controlled from outside, `null` included: Clear sets it back to not set, and the thumb goes." } } },
};

export const Disabled: Story = {
  render: (args) => (
    <Frame>
      <Slider {...args} defaultValue={40} snapPoints={SURE} disabled />
    </Frame>
  ),
};

function AtLeastHalf() {
  const [value, setValue] = useState<number | null>(20);
  return (
    <Frame>
      <Slider
        label="How sure are you?"
        value={value}
        onChange={setValue}
        snapPoints={SURE}
        formatValue={percent}
        helperText="At least 50%."
        errorMessage={value !== null && value < 50 ? "Pick at least 50." : undefined}
      />
    </Frame>
  );
}

export const WithAnError: Story = {
  render: () => <AtLeastHalf />,
  parameters: {
    docs: {
      description: {
        story: "The error is the consumer's to set and to clear, as in every Roster field. Here it's set while the value is under 50, so sliding to 50 or past it, or picking a chip, clears it and the helper text comes back.",
      },
    },
  },
};

export const DarkTheme: Story = {
  render: (args) => (
    <div className="dark" style={{ background: "#1c1917", padding: 24, borderRadius: 8, maxWidth: 468 }}>
      <Slider {...args} defaultValue={72} snapPoints={SURE} formatValue={percent} />
    </div>
  ),
};
