import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Dialog } from "./Dialog";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { Select } from "../../atoms/Select/Select";

const meta = {
  title: "Organisms/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
### Accessible Modal Window

The **Dialog** component interrupts the user's workflow to demand a response or convey critical information. Built on top of \`@headlessui/react\`, it handles focus trapping, escape-key closing, and screen-reader announcements automatically.

#### 🚀 Implementation Instructions

Because the Dialog is a controlled component, its visibility is managed by the parent using standard React state. 

\`\`\`tsx
import { useState } from 'react';
import { Dialog, Button } from 'roster';

const Feature = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete Item</Button>
      
      <Dialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        description="This action cannot be undone."
        variant="destructive"
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="solid" colorScheme="error">Delete</Button>
        </div>
      </Dialog>
    </>
  );
};
\`\`\`
`,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description:
        "Toggles the dialog visibility. **Must be controlled by parent state.**",
      table: { defaultValue: { summary: "false" } },
    },
    onClose: {
      description:
        "Callback fired when the user clicks the backdrop, presses Escape, or clicks the close icon.",
      action: "closed",
    },
    title: {
      control: "text",
      description: "The primary accessible heading of the dialog.",
      type: { name: "string", required: true },
    },
    description: {
      control: "text",
      description:
        "Optional subtext displayed directly below the title. Automatically linked for screen readers.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"],
      description:
        "Constrains the maximum width of the dialog panel, allowing it to adapt gracefully on mobile devices.",
      table: { defaultValue: { summary: "md" } },
    },
    variant: {
      control: "select",
      options: ["default", "destructive", "success", "glass"],
      description:
        "Applies contextual semantic styling. Uses top-border accents for status, or backdrop blurring for the glass effect.",
      table: { defaultValue: { summary: "default" } },
    },
    themeMode: {
      control: "radio",
      options: ["light", "dark"],
      description:
        "Overrides the OS-level theme preference to force the dialog into a specific color context.",
      table: { defaultValue: { summary: "light" } },
    },
    children: {
      description:
        "The main content area of the dialog. Typically used for forms, confirmation messages, and action buttons.",
      control: false,
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof Dialog>;

const DialogWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <Dialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {args.children}
      </Dialog>
    </>
  );
};

export const DefaultLight: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Invite Teammates",
    description: "Send invitations to join your roster.",
    size: "md",
    variant: "default",
    themeMode: "light",
    children: (
      <div className="mt-4 flex flex-col gap-4 text-left">
        <Input placeholder="Enter email address..." />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline">Cancel</Button>
          <Button variant="solid" colorScheme="primary">
            Send Invite
          </Button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The standard `md` size with `default` styling. Ideal for quick, single-input actions or standard confirmations.",
      },
    },
  },
};

export const LargeForm: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Create New Squad",
    description: "Fill out the details below to start a new season.",
    size: "xl",
    variant: "default",
    themeMode: "light",
    children: (
      <form className="space-y-5 mt-4 text-left">
        <Input label="Squad Name" placeholder="e.g. The Recruits" required />
        <Select
          label="Privacy Setting"
          value="public"
          onChange={() => {}}
          options={[
            { label: "Public - Anyone can join", value: "public" },
            { label: "Invite Only - Require approval", value: "private" },
          ]}
        />
        <div className="pt-6 flex justify-end gap-3 border-t border-gray-200">
          <Button variant="outline">Cancel</Button>
          <Button variant="solid" colorScheme="primary">
            Create Squad
          </Button>
        </div>
      </form>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `xl` size variant utilized to house a complex data entry form, integrating multiple atomic input components like `Select` and `Input`.",
      },
    },
  },
};

export const DestructiveDark: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Delete League",
    description:
      "Are you sure you want to delete this league? All data will be permanently removed. This action cannot be undone.",
    size: "md",
    variant: "destructive",
    themeMode: "dark",
    children: (
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" className="text-gray-300 border-gray-600">
          Cancel
        </Button>
        <Button variant="solid" colorScheme="error">
          Yes, Delete League
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `destructive` variant forces a thick, semantic error border at the top of the dialog. Shown here paired with `themeMode="dark"` for high contrast.',
      },
    },
  },
};

export const GlassDark: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Pro Feature",
    description: "Upgrade your account to access advanced analytics.",
    size: "sm",
    variant: "glass",
    themeMode: "dark",
    children: (
      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="solid"
          colorScheme="primary"
          className="w-full justify-center"
        >
          Upgrade Now
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `glass` variant removes the heavy backdrop blur and applies it directly to the dialog panel. This creates a stunning frosted glass effect when triggered over image-heavy or vibrant backgrounds.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-24 bg-linear-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-xl flex justify-center">
        <Story />
      </div>
    ),
  ],
};
