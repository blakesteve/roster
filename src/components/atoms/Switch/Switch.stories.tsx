import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Switch, type SwitchProps } from "./Switch";

const meta = {
  title: "Atoms/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
### The Binary Toggle

The **Switch** component is used to toggle a single setting on or off **immediately**. 

**The label and the track are the control.** Clicking the label toggles the switch, as clicking any control's label does. Pass \`labelClickable={false}\` when an ancestor already has a click handler that toggles: with both, one click on the label reaches that handler twice.

**Every size is a 44x44 target**, centered on the track, without changing the track's size. It overhangs the track, so it needs room: in a stacked list of one-line rows, 10px between rows at \`xs\` and \`md\`, 12px at \`sm\`, 8px at \`lg\`, or the target takes clicks meant for the neighbor. For every row's full 44px: 24px at \`xs\` and \`sm\`, 20px at \`md\`, 16px at \`lg\`. An ancestor with \`overflow: hidden\` clips the overhang.

**UX Best Practices:**
* **Use a Switch** for "Activation" (e.g., Airplane Mode, Dark Mode). The action should take effect immediately.
* **Use a Checkbox** for "Selection" (e.g., Picking 3 items from a list). The action usually requires a "Save" or "Submit" button.
`,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "success", "danger", "neutral"],
      description: "The color theme of the switch when active.",
      table: { defaultValue: { summary: "primary" } },
    },
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "md", "lg"], // <-- Added xs here!
      description: "The size of the track and thumb.",
      table: { defaultValue: { summary: "md" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents interaction.",
    },
    checked: {
      control: "boolean",
      description: "The state of the switch (controlled).",
    },
    label: { control: "text", description: "Visible label; clicking it toggles the switch." },
    description: { control: "text", description: "Secondary text under the label." },
    labelClickable: {
      control: "boolean",
      description:
        "Whether clicking the label toggles. Turn off when an ancestor already toggles on click.",
      table: { defaultValue: { summary: "true" } },
    },
    ariaLabel: { control: "text", description: "Accessible name when there is no visible label." },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof Switch>;

// --- Interactive Wrapper ---
// Allows the switch to be toggled in Storybook while still respecting controls.
// onChange is omitted: the wrapper owns it, so stories only pass the rest.
const SwitchWithState = (args: Omit<SwitchProps, "onChange">) => {
  const [enabled, setEnabled] = useState(args.checked ?? false);

  // Sync internal state when the Storybook 'checked' control changes. Adjusted
  // during render rather than in an effect: React re-runs this component
  // immediately without committing, so the switch never paints one frame in
  // the stale position the way an effect would.
  const [control, setControl] = useState(args.checked);
  if (control !== args.checked) {
    setControl(args.checked);
    setEnabled(args.checked ?? false);
  }

  return <Switch {...args} checked={enabled} onChange={setEnabled} />;
};

// 1. Default (Primary)
export const Default: Story = {
  args: {
    label: "Push Notifications",
    variant: "primary",
    checked: true,
  },
  render: (args) => <SwitchWithState {...args} />,
};

// 2. Success (Live Status)
export const SuccessState: Story = {
  args: {
    label: "Live Mode",
    description: "Changes are visible to the public immediately.",
    variant: "success",
    checked: true,
  },
  render: (args) => <SwitchWithState {...args} />,
};

// 3. Danger (Critical Actions)
export const DangerZone: Story = {
  args: {
    label: "Maintenance Mode",
    description: "Take the site offline for everyone.",
    variant: "danger",
    checked: true,
  },
  render: (args) => <SwitchWithState {...args} />,
};

// 4. Sizes Showcase
export const Sizes: Story = {
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:p-4 rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:rounded-lg rst:bg-gray-50 rst:dark:bg-gray-900 rst:transition-colors">
      <SwitchWithState
        label="Extra Small Switch"
        description="Designed specifically for dense dropdowns and inline text."
        size="xs"
        checked={true}
      />
      <hr className="rst:border-gray-200 rst:dark:border-gray-800" />
      <SwitchWithState
        label="Small Switch"
        description="Fits in dense toolbars."
        size="sm"
        checked={true}
      />
      <hr className="rst:border-gray-200 rst:dark:border-gray-800" />
      <SwitchWithState
        label="Medium Switch"
        description="The default size for forms."
        size="md"
        checked={true}
      />
      <hr className="rst:border-gray-200 rst:dark:border-gray-800" />
      <SwitchWithState
        label="Large Switch"
        description="High visibility for mobile touch targets."
        size="lg"
        checked={true}
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Available in four sizes: `xs`, `sm`, `md` (default), and `lg`. Use `xs` for dense menus and `lg` for mobile-first interfaces where touch targets need to be larger.",
      },
    },
  },
};

// 5. Disabled State
export const Disabled: Story = {
  args: {
    label: "Enforced Setting",
    description: "This setting is managed by your organization.",
    checked: true,
    disabled: true,
  },
  render: (args) => <SwitchWithState {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Enforced Setting" });
    await userEvent.click(canvas.getByText("Enforced Setting"));
    await expect(control).toHaveAttribute("aria-checked", "true");
    await expect(control).toBeDisabled();
  },
};

/**
 * 44x44 at every size, centered on the track. Measured: a point 21px from the
 * track's center toggles it in all four directions, and 23px above or below
 * does not.
 */
export const TargetSize: Story = {
  render: () => (
    <div className="rst:flex rst:items-center rst:gap-12 rst:p-8">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <SwitchWithState key={size} size={size} ariaLabel={`Size ${size}`} checked={false} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const el of within(canvasElement).getAllByRole("switch")) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const at = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('[role="switch"]');
      for (const [dx, dy] of [[0, -21], [0, 21], [-21, 0], [21, 0]]) {
        await expect(at(cx + dx, cy + dy)).toBe(el);
      }
      for (const [dx, dy] of [[0, -23], [0, 23]]) {
        await expect(at(cx + dx, cy + dy)).not.toBe(el);
      }
    }
  },
  parameters: { controls: { disable: true } },
};

/**
 * Clicking the label toggles the switch.
 */
export const ClickableLabel: Story = {
  args: { label: "Show seconds", checked: false },
  render: (args) => <SwitchWithState {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Show seconds" });
    await expect(control).toHaveAttribute("aria-checked", "false");
    await userEvent.click(canvas.getByText("Show seconds"));
    await expect(control).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * A settings list. At \`gap-3\` (12px) every track is its own at every size:
 * a point just inside a track's top or bottom edge toggles that switch, not
 * its neighbor.
 */
export const StackedList: Story = {
  render: () => (
    <div className="rst:flex rst:w-72 rst:flex-col rst:gap-3">
      {(["xs", "sm", "md", "lg"] as const).flatMap((size) =>
        [1, 2].map((n) => (
          <SwitchWithState key={`${size}-${n}`} size={size} label={`Setting ${size} ${n}`} checked={false} />
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const el of within(canvasElement).getAllByRole("switch")) {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const at = (y: number) => document.elementFromPoint(x, y)?.closest('[role="switch"]');
      await expect(at(r.top + 1)).toBe(el);
      await expect(at(r.bottom - 1)).toBe(el);
    }
  },
  parameters: { controls: { disable: true } },
};

/**
 * `labelClickable={false}`: the label names the switch but does not toggle it.
 * Only the track does.
 */
export const LabelNotClickable: Story = {
  args: { label: "Show seconds", checked: false, labelClickable: false },
  render: (args) => <SwitchWithState {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Show seconds" });
    await userEvent.click(canvas.getByText("Show seconds"));
    await expect(control).toHaveAttribute("aria-checked", "false");
    await userEvent.click(control);
    await expect(control).toHaveAttribute("aria-checked", "true");
  },
};


