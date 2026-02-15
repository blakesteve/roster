import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./Switch";

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
      options: ["sm", "md", "lg"],
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
const SwitchWithState = (args: any) => {
  const [enabled, setEnabled] = useState(args.checked || false);

  // Sync internal state if the Storybook 'checked' control is changed by the user
  useEffect(() => {
    setEnabled(args.checked);
  }, [args.checked]);

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
    <div className="flex flex-col gap-6 p-4 border rounded-lg bg-gray-50">
      <SwitchWithState
        label="Small Switch"
        description="Fits in dense toolbars."
        size="sm"
        checked={true}
      />
      <hr className="border-gray-200" />
      <SwitchWithState
        label="Medium Switch"
        description="The default size for forms."
        size="md"
        checked={true}
      />
      <hr className="border-gray-200" />
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
          "Available in three sizes: `sm`, `md` (default), and `lg`. Use `lg` for mobile-first interfaces where touch targets need to be larger.",
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
