import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PasswordInput } from "./PasswordInput";
import { Button } from "../Button/Button";

const meta = {
  title: "Atoms/PasswordInput",
  component: PasswordInput,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A password field with a reveal toggle: the pattern every sign-in form needs and nobody should rewrite.",
          "",
          "It wraps `Input`, so `label`, `helperText`, `errorMessage`, and every variant behave exactly as they do everywhere else. The toggle is a real `<button type=\"button\">`: keyboard reachable, never submits the surrounding form, and disabled alongside the field. Edge's native reveal control is hidden so you don't get two eyes.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["white", "soft", "slate", "outline", "ghost"],
    },
    revealable: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "Password", placeholder: "Enter your password" },
};

export const WithHelperText: Story = {
  args: {
    label: "New password",
    placeholder: "Choose something memorable",
    helperText: "At least 12 characters. A passphrase beats a puzzle.",
  },
};

export const WithError: Story = {
  args: {
    label: "Password",
    defaultValue: "hunter2",
    errorMessage: "That password has appeared in a known breach.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Error styling comes straight from `Input`, so the border, ring, and message all behave identically to any other field.",
      },
    },
  },
};

export const StartsRevealed: Story = {
  args: {
    label: "Password",
    defaultValue: "correct horse battery staple",
    defaultRevealed: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "`defaultRevealed` starts the field visible while leaving the component uncontrolled. Pair with `onRevealChange` if you want to observe without owning the state.",
      },
    },
  },
};

export const NotRevealable: Story = {
  args: {
    label: "Password",
    placeholder: "No peeking",
    revealable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "`revealable={false}` drops the toggle entirely, for contexts where policy forbids showing the value on screen.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    label: "Password",
    defaultValue: "hunter2",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The toggle disables with the field, so a disabled password cannot be revealed.",
      },
    },
  },
};

export const Variants: Story = {
  args: { label: "Password" },
  render: () => (
    <div className="rst:flex rst:max-w-sm rst:flex-col rst:gap-4">
      {(["outline", "white", "soft", "ghost"] as const).map((variant) => (
        <PasswordInput
          key={variant}
          variant={variant}
          label={variant}
          placeholder="••••••••"
        />
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  args: { label: "Password" },
  render: function ControlledExample() {
    const [revealed, setRevealed] = useState(false);

    return (
      <div className="rst:flex rst:max-w-sm rst:flex-col rst:gap-3">
        <PasswordInput
          label="Password"
          defaultValue="hunter2"
          revealed={revealed}
          onRevealChange={setRevealed}
        />
        <Button size="sm" variant="outline" onClick={() => setRevealed((r) => !r)}>
          Toggle from outside, currently {revealed ? "visible" : "hidden"}
        </Button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pass `revealed` and `onRevealChange` to own the state. The field then never flips itself. Clicking the eye reports the intent and waits for you, which is what lets an outside control stay in sync.",
      },
    },
  },
};

export const InASignInForm: Story = {
  args: { label: "Password" },
  render: function SignInExample() {
    const [submitted, setSubmitted] = useState(false);

    return (
      <form
        className="rst:flex rst:max-w-sm rst:flex-col rst:gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <PasswordInput
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          helperText="Toggling visibility will not submit this form."
        />
        <Button type="submit" colorScheme="primary">
          Sign in
        </Button>
        {submitted && (
          <p className="rst:text-sm rst:text-success-600 rst:dark:text-success-400">
            Submitted, and only by the button.
          </p>
        )}
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The reason the toggle is explicitly `type=\"button\"`: a bare `<button>` inside a form defaults to `submit`, so peeking at your password would submit the login form. **Click the eye, then click Sign in.** Only the second one submits. Set `autoComplete` yourself (`current-password` or `new-password`); the component does not guess.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { label: "Password" },
  render: () => (
    <div className="dark">
      <div className="rst:flex rst:max-w-sm rst:flex-col rst:gap-4 rst:rounded-xl rst:bg-gray-950 rst:p-6">
        <PasswordInput label="Password" placeholder="••••••••" />
        <PasswordInput
          label="New password"
          defaultValue="correct horse"
          defaultRevealed
          helperText="At least 12 characters."
        />
        <PasswordInput label="Confirm" errorMessage="Passwords do not match." />
      </div>
    </div>
  ),
};
