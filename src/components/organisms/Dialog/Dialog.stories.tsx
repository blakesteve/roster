import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog, type DialogProps } from "./Dialog";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

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

#### 🌙 Native Dark Mode
This component relies on Tailwind's native \`dark:\` classes. It automatically listens to the \`.dark\` class on your document's root. The typography uses \`text-inherit\` and opacity utilities to guarantee perfect contrast across wildly different background colors without manual text-color prop drilling.

#### 🚀 Implementation Instructions

Because the Dialog is a controlled component, its visibility is managed by the parent using standard React state. 

The API leverages two dimensions of styling:
1. **\`variant\`**: Defines the base background and text color (e.g., \`white\`, \`slate\`, \`primary\`).
2. **\`status\`**: Overlays semantic accents on top of the base variant (e.g., \`destructive\`, \`success\`).

\`\`\`tsx
import { useState } from 'react';
import { Dialog, Button } from '@blakesteve/roster';

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
        variant="white"
        status="destructive" // Applies the red error border
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
      options: ["white", "slate", "primary", "glass"],
      description:
        "The base visual style and background color of the dialog. Adapts automatically to dark mode.",
      table: { defaultValue: { summary: "white" } },
    },
    status: {
      control: "select",
      options: ["default", "destructive", "success"],
      description: "Applies semantic top-border accents over the base variant.",
      table: { defaultValue: { summary: "default" } },
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

const DialogWrapper = (args: Omit<DialogProps, "isOpen" | "onClose">) => {
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

export const WhiteStandard: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Invite Teammates",
    description: "Send invitations to join your roster.",
    size: "md",
    variant: "white",
    status: "default",
    children: (
      <div className="mt-4 flex flex-col gap-4 text-left">
        <Input placeholder="Enter email address..." />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" colorScheme="neutral">
            Cancel
          </Button>
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
          "The standard `white` variant. Crisp white in light mode, dropping to a sophisticated dark gray in dark mode. Ideal for standard forms.",
      },
    },
  },
};

export const SlateMoody: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "System Update Available",
    description: "Version 2.4.0 is ready to install.",
    size: "sm",
    variant: "slate",
    status: "default",
    children: (
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          className="text-white border-gray-500 hover:bg-gray-600"
        >
          Remind Me Later
        </Button>
        <Button variant="solid" colorScheme="primary">
          Install Now
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `slate` variant provides a solid mid-dark gray in light mode, dropping to a deep, moody gray in dark mode. Great for technical prompts or terminal-style interfaces.",
      },
    },
  },
};

export const PrimaryBrand: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Welcome to MegaSquad!",
    description: "You're almost ready to make your first pick.",
    size: "md",
    variant: "primary",
    status: "default",
    children: (
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="solid"
          className="bg-white text-primary-700 hover:bg-gray-100"
        >
          Let's Go!
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `primary` variant drenches the dialog in your brand color. The typography automatically inherits the color to ensure it remains perfectly readable.",
      },
    },
  },
};

export const DestructiveAction: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Delete League",
    description:
      "Are you sure you want to delete this league? All data will be permanently removed. This action cannot be undone.",
    size: "md",
    variant: "white",
    status: "destructive",
    children: (
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" colorScheme="neutral">
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
          'Demonstrates the composability of the new API. The `status="destructive"` prop applies a semantic error border on top of the `variant="white"` base style.',
      },
    },
  },
};

export const SuccessSlate: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Payment Successful",
    description: "Your subscription has been renewed for another year.",
    size: "sm",
    variant: "slate",
    status: "success",
    children: (
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="solid"
          colorScheme="success"
          className="w-full justify-center"
        >
          View Receipt
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Another example of composability: a `status="success"` border applied to a `variant="slate"` dialog.',
      },
    },
  },
};

export const GlassEffect: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Pro Feature",
    description: "Upgrade your account to access advanced analytics.",
    size: "sm",
    variant: "glass",
    status: "default",
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
          "The `glass` variant utilizes `backdrop-blur` directly on the panel. This creates a stunning frosted effect when triggered over image-heavy backgrounds.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-24 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-slate-900 rounded-xl flex justify-center transition-colors">
        <Story />
      </div>
    ),
  ],
};
