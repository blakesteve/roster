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
    <div className="rst:flex rst:flex-col rst:gap-3">
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
      <div className="rst:flex rst:flex-col rst:gap-3 rst:rounded-xl rst:bg-gray-950 rst:p-6">
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

/**
 * `current` and `surface` exist so an app can stop hand-rolling a labeled
 * accent panel beside this one. Game Verdict had built exactly that: a gradient
 * callout with a title row, tinted to whichever answer had won. Alert could not
 * take a color from outside its own ramps, so there was nothing to reuse.
 *
 * The wrapper sets `color`; the Alert inherits it for stripe, text and fill.
 * Both themes are shown because the fill is a wash of `currentColor` rather
 * than a step off a ramp — one value has to carry paper and dark ground alike,
 * and that is exactly the kind of claim worth being able to see.
 */
export const PageAccented: Story = {
  args: { children: "Tinted by the page." },
  render: () => {
    const rows = [
      { label: "Flat tint", surface: "tint" as const, color: "#4b45c7" },
      { label: "Gradient", surface: "gradient" as const, color: "#b98a12" },
    ];
    const panel = (mode: "light" | "dark") => (
      <div
        className={
          mode === "dark"
            ? "dark rst:flex rst:flex-col rst:gap-4 rst:rounded-xl rst:border rst:border-gray-800 rst:bg-gray-950 rst:p-6"
            : "light rst:flex rst:flex-col rst:gap-4 rst:rounded-xl rst:border rst:border-gray-100 rst:bg-gray-50 rst:p-6"
        }
      >
        <p className="rst:mb-2 rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400">
          {mode === "dark" ? "Dark Mode" : "Light Mode"}
        </p>
        {rows.map((row) => (
          <div key={row.label} style={{ color: row.color }}>
            <Alert colorScheme="current" surface={row.surface} title={row.label} icon={null}>
              The same component, tinted by the page rather than by Roster.
            </Alert>
          </div>
        ))}
      </div>
    );
    return (
      <div className="rst:grid rst:grid-cols-1 md:rst:grid-cols-2 rst:gap-6">
        {panel("light")}
        {panel("dark")}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two accents Roster has never heard of, both arriving from the page, in both themes. `surface=\"gradient\"` clears the flat fill and fades the color out to the right instead.",
      },
    },
  },
};
