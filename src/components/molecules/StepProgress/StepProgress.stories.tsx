import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button/Button";
import { StepProgress } from "./StepProgress";

const meta = {
  title: "Molecules/StepProgress",
  component: StepProgress,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Progress through named steps rather than a fraction: a join flow, a setup, a checkout.",
          "",
          "- **`stepper`**, the full form: every step named, with a numbered marker, a check once it's done, and connectors that fill behind the current step.",
          "- **`segmented`**, the compact form for a card or a side panel: a segmented bar with \"Step 2 of 5\" and the step's name. The segments alone don't say where you are, so the words always come with them.",
          "",
          "The current step is `aria-current=\"step\"`, a finished one says \"done\", and a polite status says the new position when it changes. `current` counts from 1; past the last step, every step is done.",
        ].join("\n"),
      },
    },
  },
  args: { steps: ["Account", "Profile", "Shelf", "Invite", "Done"], current: 3 },
} satisfies Meta<typeof StepProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = ["Account", "Profile", "Shelf", "Invite", "Done"];

function Walkthrough({ variant }: { variant: "stepper" | "segmented" }) {
  const [current, setCurrent] = useState(2);
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
      <StepProgress steps={STEPS} current={current} variant={variant} />
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" variant="outline" colorScheme="neutral" onClick={() => setCurrent((c) => Math.max(1, c - 1))}>
          Back
        </Button>
        <Button size="sm" onClick={() => setCurrent((c) => Math.min(STEPS.length + 1, c + 1))}>
          Next
        </Button>
      </div>
    </div>
  );
}

export const Stepper: Story = {
  render: () => <Walkthrough variant="stepper" />,
  parameters: { docs: { description: { story: "The full form. Step through it: finished steps take a check and the connector fills behind the current one." } } },
};

export const Segmented: Story = {
  render: () => <Walkthrough variant="segmented" />,
  parameters: { docs: { description: { story: "The compact form, always with \"Step x of y\"." } } },
};

export const OnAPhone: Story = {
  render: () => (
    <div style={{ width: 320, display: "grid", gap: 24 }}>
      <StepProgress steps={["Account", "Profile", "Shelf", "Done"]} current={2} />
      <StepProgress steps={STEPS} current={4} variant="segmented" />
    </div>
  ),
  parameters: { docs: { description: { story: "At 320px: names wrap under their markers; the compact form fits a card." } } },
};
