import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import React from "react";
import { Tooltip } from "./Tooltip";
import "@testing-library/jest-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderTooltip(props: Partial<React.ComponentProps<typeof Tooltip>> = {}) {
  return render(
    <Tooltip content="Default tooltip text" {...props}>
      {props.children ?? <button type="button">Trigger</button>}
    </Tooltip>,
  );
}

// When Radix Tooltip is open it mounts a content div (data-testid="tooltip-content")
// and also a visually-hidden <span role="tooltip"> for screen readers.
// We use queryByTestId / getByRole("tooltip") to avoid ambiguous text matches.

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Tooltip Component", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the trigger children", () => {
    renderTooltip({ children: <button type="button">My trigger</button> });
    expect(screen.getByRole("button", { name: /my trigger/i })).toBeInTheDocument();
  });

  it("wraps the trigger in a focusable span", () => {
    renderTooltip();
    const wrapper = screen.getByTestId("tooltip-trigger");
    expect(wrapper.tagName).toBe("SPAN");
    expect(wrapper).toHaveAttribute("tabindex", "0");
  });

  it("does not mount the content bubble by default", () => {
    renderTooltip({ content: "Secret content" });
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });

  // ── defaultOpen ────────────────────────────────────────────────────────────

  it("mounts the content bubble immediately when defaultOpen is true", () => {
    renderTooltip({ content: "I am visible", defaultOpen: true });
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
  });

  it("renders the correct text content when defaultOpen is true", () => {
    renderTooltip({ content: "Accessible text", defaultOpen: true });
    // Radix places the text in a visually-hidden <span role="tooltip"> for a11y
    expect(screen.getByRole("tooltip")).toHaveTextContent("Accessible text");
  });

  it("renders the tooltip content in a portal (document.body)", () => {
    renderTooltip({ content: "Portal content", defaultOpen: true });
    const bubble = screen.getByTestId("tooltip-content");
    expect(document.body).toContainElement(bubble);
  });

  // ── Click / toggle interaction ─────────────────────────────────────────────

  it("opens the tooltip when the trigger is clicked", async () => {
    const user = userEvent.setup();
    renderTooltip({ content: "Click to open" });

    await user.click(screen.getByTestId("tooltip-trigger"));

    await waitFor(() =>
      expect(screen.getByTestId("tooltip-content")).toBeInTheDocument(),
    );
  });

  it("shows the correct content after the trigger is clicked", async () => {
    const user = userEvent.setup();
    renderTooltip({ content: "Revealed text" });

    await user.click(screen.getByTestId("tooltip-trigger"));

    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("Revealed text"),
    );
  });

  it("closes the tooltip on a second click of the trigger", async () => {
    const user = userEvent.setup();
    renderTooltip({ content: "Toggle me" });

    const trigger = screen.getByTestId("tooltip-trigger");
    await user.click(trigger);
    await waitFor(() =>
      expect(screen.getByTestId("tooltip-content")).toBeInTheDocument(),
    );

    // fireEvent.click (no pointer events) avoids JSDOM keeping the trigger
    // "hovered", which causes Radix's onPointerMove to re-open immediately.
    // Without CSS animations in JSDOM, Radix unmounts the content instantly.
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument(),
    );
  });

  it("starts open and closes on the first click when defaultOpen is true", async () => {
    renderTooltip({ content: "Was open", defaultOpen: true });

    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tooltip-trigger"));
    await waitFor(() =>
      expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument(),
    );
  });

  // ── Keyboard accessibility ─────────────────────────────────────────────────

  it("trigger wrapper is focusable via Tab", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await user.tab();
    expect(screen.getByTestId("tooltip-trigger")).toHaveFocus();
  });

  it("trigger has aria-describedby pointing at the tooltip when open", () => {
    renderTooltip({ defaultOpen: true });
    const trigger = screen.getByTestId("tooltip-trigger");
    const tooltipEl = screen.getByRole("tooltip");
    expect(trigger).toHaveAttribute("aria-describedby", tooltipEl.id);
  });

  // ── Variants ───────────────────────────────────────────────────────────────

  it("applies dark variant classes by default", () => {
    renderTooltip({ defaultOpen: true });
    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveClass("bg-zinc-900", "text-zinc-100");
  });

  it("applies light variant classes when variant is 'light'", () => {
    renderTooltip({ variant: "light", defaultOpen: true });
    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveClass("bg-white", "text-zinc-900");
  });

  it("does not apply dark classes when variant is 'light'", () => {
    renderTooltip({ variant: "light", defaultOpen: true });
    expect(screen.getByTestId("tooltip-content")).not.toHaveClass("bg-zinc-900");
  });

  // ── Placement ──────────────────────────────────────────────────────────────

  it("sets data-side to the requested placement", () => {
    renderTooltip({ placement: "bottom", defaultOpen: true });
    expect(screen.getByTestId("tooltip-content")).toHaveAttribute("data-side", "bottom");
  });

  it("defaults placement to top", () => {
    renderTooltip({ defaultOpen: true });
    expect(screen.getByTestId("tooltip-content")).toHaveAttribute("data-side", "top");
  });

  it.each([["left"], ["right"]] as const)(
    "accepts placement '%s'",
    (placement) => {
      renderTooltip({ placement, defaultOpen: true });
      expect(screen.getByTestId("tooltip-content")).toHaveAttribute(
        "data-side",
        placement,
      );
    },
  );

  // ── Custom className ───────────────────────────────────────────────────────

  it("forwards a custom className to the content bubble", () => {
    renderTooltip({ className: "custom-class", defaultOpen: true });
    expect(screen.getByTestId("tooltip-content")).toHaveClass("custom-class");
  });

  it("preserves base classes alongside a custom className", () => {
    renderTooltip({ className: "my-override", defaultOpen: true });
    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveClass("rounded-lg", "my-override");
  });

  // ── ReactNode content ──────────────────────────────────────────────────────

  it("renders ReactNode content with nested elements", () => {
    renderTooltip({
      content: (
        <span>
          Press <kbd>Shift</kbd> to multi-select
        </span>
      ),
      defaultOpen: true,
    });
    // Radix duplicates the content in a visually-hidden a11y span, so query
    // scoped to the visible content bubble to avoid ambiguous matches.
    const content = screen.getByTestId("tooltip-content");
    expect(content.querySelector("kbd")).toBeInTheDocument();
    expect(content).toHaveTextContent("Press Shift to multi-select");
  });

  it("renders plain string content in the accessible tooltip span", () => {
    renderTooltip({ content: "Plain string tip", defaultOpen: true });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Plain string tip");
  });

  // ── Base layout classes ────────────────────────────────────────────────────

  it("applies the base structural classes to the content bubble", () => {
    renderTooltip({ defaultOpen: true });
    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveClass("z-50", "rounded-lg", "px-3", "py-2", "text-xs");
  });

  it("applies the enter animation class", () => {
    renderTooltip({ defaultOpen: true });
    expect(screen.getByTestId("tooltip-content")).toHaveClass("animate-in");
  });
});