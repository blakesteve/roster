import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { Button } from "../../atoms/Button/Button";
import { StepProgress, type StepProgressProps } from "./StepProgress";

const STEPS = ["Account", "Profile", "Shelf", "Invite", "Done"];

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
          "",
          "For steps that run down the page with content of their own (a schedule, a history), see `Timeline`, which shares these markers.",
        ].join("\n"),
      },
    },
  },
  args: { steps: STEPS, current: 3, variant: "stepper" },
  argTypes: {
    variant: { control: "inline-radio", options: ["stepper", "segmented"] },
    current: { control: { type: "range", min: 1, max: 6, step: 1 } },
    steps: { control: "object" },
    labels: { control: "object" },
    className: { control: false },
  },
} satisfies Meta<typeof StepProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

/* The controls and the buttons move the same `current`: Back and Next write
   it to the story's args, so the Controls panel follows them, and a control
   moved by hand is where the buttons start from. `useArgs` runs only in the
   story's own render, so that's where it's called. */
function Walkthrough({ onStep, ...props }: StepProgressProps & { onStep: (current: number) => void }) {
  const last = props.steps.length + 1;
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
      <StepProgress {...props} />
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" variant="outline" colorScheme="neutral" onClick={() => onStep(Math.max(1, props.current - 1))}>
          Back
        </Button>
        <Button size="sm" onClick={() => onStep(Math.min(last, props.current + 1))}>
          Next
        </Button>
      </div>
    </div>
  );
}

function WithArgs(args: StepProgressProps) {
  const [, updateArgs] = useArgs<StepProgressProps>();
  return <Walkthrough {...args} onStep={(current) => updateArgs({ current })} />;
}

export const Stepper: Story = {
  args: { variant: "stepper", current: 2 },
  render: WithArgs,
  parameters: { docs: { description: { story: "The full form. Step through it, or move `current` in the controls: finished steps take a check and the connector fills behind the current one." } } },
};

export const Segmented: Story = {
  args: { variant: "segmented", current: 2 },
  render: WithArgs,
  parameters: { docs: { description: { story: "The compact form, always with \"Step x of y\"." } } },
};

export const OnAPhone: Story = {
  render: () => (
    <div style={{ width: 320, display: "grid", gap: 24 }}>
      <StepProgress steps={["Account", "Profile", "Shelf", "Done"]} current={2} />
      <StepProgress steps={STEPS} current={4} variant="segmented" />
    </div>
  ),
  /* Two fixed forms side by side: nothing here reads the controls. */
  parameters: { controls: { disable: true }, docs: { description: { story: "At 320px: names wrap under their markers; the compact form fits a card." } } },
};
