import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Disclosure } from "./Disclosure";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Atoms/Disclosure",
  component: Disclosure,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "A fundamental interactive atom that toggles the visibility of content. Fully responsive and theme-aware (supports dark mode). It can be used standalone or stacked to create an Accordion.",
          "",
          "The button's `aria-controls` names the panel for exactly as long as the panel exists: from the moment it opens until its closing transition ends. A closed panel is unmounted, and `aria-controls` may only name an element that is there.",
          "",
          "Under `prefers-reduced-motion` the panel fades without growing, and the chevron flips without turning.",
        ].join("\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12">
        <div className="light rst:bg-white rst:p-6 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:mb-6 rst:uppercase rst:tracking-widest">
            Light Mode Preview
          </p>
          <Story />
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode Preview
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["white", "soft", "slate", "outline", "ghost"],
      description: "The visual style of the disclosure.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether the disclosure is open by default.",
    },
    isOpen: { control: false, description: "Controls the open state. Pair it with `onToggle`." },
    onToggle: { control: false, description: "Called with the next open state on every click." },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The standard clean appearance. Crisp white in light mode, elevated gray in dark mode.
 */
export const White: Story = {
  args: {
    variant: "white",
    title: "What is MegaSquad?",
    children:
      "MegaSquad is the ultimate sports pick-em application for you and your friends.",
  },
};

/**
 * A slightly inset, subtle appearance. Great for FAQs or secondary settings.
 */
export const Soft: Story = {
  args: {
    variant: "soft",
    title: "How does this work?",
    children:
      "Disclosures allow users to toggle the visibility of content, keeping the UI clean.",
  },
};

/**
 * A heavier visual weight, providing strong contrast against page backgrounds.
 */
export const Slate: Story = {
  args: {
    variant: "slate",
    title: "Draft Settings",
    defaultOpen: true,
    children: (
      <div className="rst:space-y-2">
        <p className="rst:font-semibold rst:text-inherit">Pick Timer: 60s</p>
        <p className="rst:text-inherit rst:opacity-80">Auto-pick enabled</p>
      </div>
    ),
  },
};

/**
 * A clean, bordered look. Best used when placed against a solid white or very dark background to establish clear boundaries.
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    title: (
      <div className="rst:flex rst:items-center rst:gap-2">
        <span>Subscription</span>
        <Badge variant="success" size="xs">
          ACTIVE
        </Badge>
      </div>
    ),
    children: "Next billing date: Feb 28, 2026.",
  },
};

/**
 * A minimalist approach that blends directly into the background until hovered.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    title: "Advanced Options",
    children: "Only show this to power users who want to break things.",
  },
};

/* These stories render twice, on a light and a dark surface, so each play
   works on the first copy. */
const first = (canvasElement: HTMLElement, name: string) =>
  within(canvasElement).getAllByRole("button", { name })[0];

/**
 * The button's `aria-controls` names the panel for exactly as long as the
 * panel exists: set as it opens, kept while it closes, removed once it has
 * gone. A closed panel is unmounted, and `aria-controls` may only name an
 * element that is there.
 */
export const PanelWiring: Story = {
  args: { variant: "soft", title: "Shipping details", children: "Ships in two to three working days." },
  play: async ({ canvasElement }) => {
    const button = first(canvasElement, "Shipping details");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).not.toHaveAttribute("aria-controls");

    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const id = button.getAttribute("aria-controls")!;
    await expect(document.getElementById(id)).toHaveTextContent("Ships in two to three working days.");

    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    // Still leaving, so still there and still named.
    await expect(document.getElementById(id)).not.toBeNull();
    await expect(button).toHaveAttribute("aria-controls", id);
    await waitFor(() => expect(document.getElementById(id)).toBeNull());
    await expect(button).not.toHaveAttribute("aria-controls");
  },
};

/**
 * Controlled: `isOpen` decides, and `onToggle` reports the click. Here the
 * parent refuses to close it once opened.
 */
export const Controlled: Story = {
  args: { title: "Terms", children: "Read these before you continue.", onToggle: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <Disclosure
        {...args}
        isOpen={open}
        onToggle={(next) => {
          args.onToggle?.(next);
          if (next) setOpen(true);
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const button = first(canvasElement, "Terms");
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenLastCalledWith(true);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenLastCalledWith(false);
    await expect(button).toHaveAttribute("aria-expanded", "true");
  },
};

/**
 * Under `prefers-reduced-motion` the panel fades without growing and the
 * chevron flips without turning. Turn on "Emulate CSS prefers-reduced-motion"
 * in your browser's rendering tools to see it. The play function checks
 * whichever mode the browser is in, and the test run includes a pass with it
 * on.
 */
export const ReducedMotion: Story = {
  tags: ["reduced-motion"],
  args: { variant: "soft", title: "Motion", children: "Panel content.", defaultOpen: true },
  play: async ({ canvasElement }) => {
    const button = first(canvasElement, "Motion");
    const chevron = button.lastElementChild as HTMLElement;
    const panel = within(canvasElement).getAllByTestId("disclosure-panel")[0];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* The panel's closed state, read at rest: set the attribute Headless UI
       sets while closing, with transitions off, and see what it scales to. */
    panel.style.transition = "none";
    panel.setAttribute("data-closed", "");
    const closedScale = getComputedStyle(panel).scale;
    panel.removeAttribute("data-closed");
    panel.style.transition = "";
    await expect(closedScale).toBe(reduced ? "none" : "0.95");

    // Open, so the chevron is flipped either way; only whether it turns differs.
    await expect(getComputedStyle(chevron).rotate).toBe("180deg");
    if (reduced) await expect(getComputedStyle(chevron).transitionProperty).toBe("none");
  },
};

