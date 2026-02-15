import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { Button } from "../Button/Button"; // Assuming we have this from earlier

const meta = {
  title: "Atoms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
### The Multiline Input

The **Textarea** component is used for collecting long-form text input from users, such as bios, feedback, or descriptions. 

It matches the visual style of the \`Input\` and \`Select\` components to ensure consistency across forms. It includes built-in support for:
- **Labels & Helper Text:** Automatically handles accessible associations.
- **Validation:** Visual error states and error messages.
- **Resize Control:** precise control over how users can resize the box.
`,
      },
    },
  },
  argTypes: {
    label: {
      description: "The text label displayed above the input.",
      control: "text",
    },
    placeholder: {
      description: "Temporary text shown when the field is empty.",
      control: "text",
    },
    helperText: {
      description:
        "Assistive text displayed below the input (e.g., character limits).",
      control: "text",
    },
    errorMessage: {
      description:
        "If present, changes the border to red and displays this message below the input.",
      control: "text",
    },
    variant: {
      control: "select",
      options: ["outline", "soft", "ghost", "filled"],
      description: "The visual style of the input container.",
      table: { defaultValue: { summary: "outline" } },
    },
    resize: {
      control: "select",
      options: ["none", "vertical", "horizontal", "both"],
      description: "Constrains the resize handle. Default is `vertical`.",
      table: { defaultValue: { summary: "vertical" } },
    },
    rows: {
      description: "The initial height of the textarea in text lines.",
      control: { type: "number", min: 2, max: 20 },
      table: { defaultValue: { summary: "3" } },
    },
    disabled: {
      description: "Disables interaction and reduces opacity.",
      control: "boolean",
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

// --- 1. The Playground ---
export const Playground: Story = {
  args: {
    label: "Playground Input",
    placeholder: "Type something here...",
    helperText: "Try changing the controls on the right.",
  },
};

// --- 2. MegaSquad Use Case: Scouting Report ---
export const ScoutingReport: Story = {
  args: {
    label: "Player Scouting Report",
    placeholder: "Enter strengths, weaknesses, and key stats...",
    rows: 6,
    helperText: "Markdown is supported.",
    variant: "outline",
    resize: "vertical",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A standard long-form input. Use `rows` to set the initial height appropriate for the expected content length.",
      },
    },
  },
};

// --- 3. Comment Box (Soft Variant) ---
export const CommentBox: Story = {
  args: {
    variant: "soft",
    placeholder: "Write a comment...",
    rows: 3,
    className: "min-h-[60px]", // Custom override if needed
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `soft` variant (gray background) is excellent for secondary inputs like comment sections or replies, where a heavy border might feel too aggressive.",
      },
    },
  },
};

// --- 4. Validation States ---
export const WithError: Story = {
  args: {
    label: "Pick Justification",
    defaultValue: "I just had a feeling.",
    errorMessage: "Please provide a statistical reason for this pick.",
    rows: 4,
  },
  parameters: {
    docs: {
      description: {
        story:
          "When `errorMessage` is provided, the border turns red and the helper text is replaced by the error message automatically.",
      },
    },
  },
};

// --- 5. Controlled Component Example ---
// This proves it works with React state
const ControlledExample = () => {
  const [value, setValue] = useState("");
  const limit = 100;

  return (
    <div className="w-100 space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <Textarea
        label="Tweet your pick"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        resize="none"
        placeholder="What's happening?"
        helperText={`${value.length}/${limit} characters`}
        errorMessage={value.length > limit ? "Too long!" : undefined}
      />
      <div className="flex justify-end">
        <Button size="sm" disabled={value.length === 0 || value.length > limit}>
          Post
        </Button>
      </div>
    </div>
  );
};

export const ControlledWithCharacterLimit: Story = {
  render: () => <ControlledExample />,
  parameters: {
    docs: {
      description: {
        story:
          "An example of a **Controlled Component** implementation with character counting logic and button interaction.",
      },
    },
  },
};

// --- 6. Read-Only / Disabled ---
export const ReadOnly: Story = {
  args: {
    label: "System Logs",
    value: "Error: Connection timeout at 12:00 PM\nWarn: Retrying request...",
    readOnly: true,
    variant: "filled",
    rows: 4,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use `readOnly` for content that users can select/copy but not edit. Use `disabled` if you want to prevent interaction entirely.",
      },
    },
  },
};
