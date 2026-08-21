import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
};
