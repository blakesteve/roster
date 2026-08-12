import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

const meta = {
  title: "Molecules/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inline notice strip for feedback in the flow of a page: a failed action, a saved change. Deliberately lighter than `ErrorState`, which is a full empty-state panel and far too heavy for a form-level message. Errors announce assertively; every other scheme is polite.",
      },
    },
  },
  argTypes: {
    colorScheme: {
      control: "select",
      options: ["error", "success", "amber", "info", "primary", "neutral"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "We could not save your changes. Try again." },
};

export const WithTitle: Story = {
  args: {
    title: "Upload failed",
    children: "That file is 12 MB. The limit is 8 MB.",
  },
};

export const Dismissible: Story = {
  args: {
    colorScheme: "success",
    title: "Saved",
    children: "Your profile is up to date.",
    onDismiss: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Passing `onDismiss` renders the close button. The Alert does not manage its own visibility; the consumer owns that state.",
      },
    },
  },
};

export const AllSchemes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert colorScheme="error">Something went wrong.</Alert>
      <Alert colorScheme="success">Your changes were saved.</Alert>
      <Alert colorScheme="amber">This will archive 42 records.</Alert>
      <Alert colorScheme="info">Scoring runs nightly at 2am UTC.</Alert>
      <Alert colorScheme="primary">You are viewing a draft.</Alert>
      <Alert colorScheme="neutral">Nothing to report.</Alert>
    </div>
  ),
};

export const DarkMode: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="dark">
      <div className="flex flex-col gap-3 rounded-xl bg-gray-950 p-6">
        <Alert colorScheme="error">Something went wrong.</Alert>
        <Alert colorScheme="success">Your changes were saved.</Alert>
        <Alert colorScheme="info">Scoring runs nightly at 2am UTC.</Alert>
      </div>
    </div>
  ),
};

export const WithoutIcon: Story = {
  args: {
    icon: null,
    colorScheme: "neutral",
    children: "Pass icon={null} to drop the icon entirely.",
  },
};
