import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Textarea";
import { Button } from "../Button/Button";

const meta = {
  title: "Atoms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
### The Multiline Input

The **Textarea** component is used for collecting long-form text input from users, such as bios, feedback, or scouting reports. 

It matches the exact visual style and dark mode resilience of the \`Input\` and \`Select\` components to ensure consistency across your forms. It includes built-in support for:
- **Labels & Helper Text:** Automatically handles accessible associations.
- **Validation:** Visual error states and error messages that adapt perfectly to dark backgrounds.
- **Resize Control:** Precise control over how users can resize the box.
- **Custom Scrollbars:** Automatically applies themed scrollbars when text overflows.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12 rst:w-full rst:max-w-4xl rst:mx-auto">
        <div className="light rst:bg-gray-50 rst:p-6 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:mb-6 rst:uppercase rst:tracking-widest">
            Light Mode Preview
          </p>
          <div className="rst:max-w-md rst:mx-auto">
            <Story />
          </div>
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode Preview
          </p>
          <div className="rst:max-w-md rst:mx-auto">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
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
      options: ["outline", "soft", "ghost", "white"],
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

// --- 2. Standard Use Case: Outline ---
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

// --- 4. The White Variant (Dark Mode specific) ---
export const WhiteVariant: Story = {
  args: {
    variant: "white",
    label: "Squad Description",
    placeholder: "What is this squad all about?",
    rows: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `white` variant provides a solid white background in light mode, but gracefully degrades to a slightly elevated gray in dark mode. It is the perfect choice for text areas sitting inside of `soft` or `slate` Cards.",
      },
    },
  },
};

// --- 5. Validation States ---
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

// --- 6. Controlled Component Example ---
const ControlledExample = () => {
  const [value, setValue] = useState("");
  const limit = 100;

  return (
    <div className="rst:w-full rst:space-y-4 rst:p-4 rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:rounded-lg rst:bg-white rst:dark:bg-gray-900 rst:shadow-sm rst:transition-colors">
      <Textarea
        label="Tweet your pick"
        variant="outline"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        resize="none"
        placeholder="What's happening?"
        helperText={`${value.length}/${limit} characters`}
        errorMessage={value.length > limit ? "Too long!" : undefined}
      />
      <div className="rst:flex rst:justify-end">
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
          "An example of a **Controlled Component** implementation with character counting logic and button interaction. Try typing past 100 characters to see the error state trigger.",
      },
    },
  },
};

// --- 7. Read-Only / Disabled ---
export const ReadOnly: Story = {
  args: {
    label: "System Logs",
    value:
      "Error: Connection timeout at 12:00 PM\nWarn: Retrying request...\nInfo: Connection established.",
    readOnly: true,
    variant: "soft",
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
