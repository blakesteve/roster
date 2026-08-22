import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Alert } from "./Alert";
import "@testing-library/jest-dom";

describe("Alert Component", () => {
  it("renders its message", () => {
    render(<Alert>Something went wrong</Alert>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders an optional title above the message", () => {
    render(<Alert title="Upload failed">The file was too large</Alert>);
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    expect(screen.getByText("The file was too large")).toBeInTheDocument();
  });

  // Errors interrupt; everything else waits its turn.
  it("announces errors assertively", () => {
    render(<Alert colorScheme="error">Boom</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("announces non-errors politely", () => {
    render(<Alert colorScheme="success">Saved</Alert>);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("applies the color scheme classes", () => {
    const { container } = render(<Alert colorScheme="success">Saved</Alert>);
    expect(container.firstChild).toHaveClass("rst:border-success-500", "rst:bg-success-50");
  });

  it("renders no dismiss button unless onDismiss is provided", () => {
    render(<Alert>No dismiss</Alert>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>Dismiss me</Alert>);

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // `icon={null}` has to mean "no icon", distinct from omitting the prop.
  it("omits the icon when icon is null", () => {
    const { container } = render(<Alert icon={null}>No icon</Alert>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a custom icon when provided", () => {
    render(<Alert icon={<span data-testid="custom" />}>Custom</Alert>);
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  /**
   * `current` and `surface` exist so a consuming app can stop hand-rolling a
   * labeled accent callout beside this one. Game Verdict had built exactly
   * that — a gradient panel with a title row, tinted to whichever answer won —
   * because Alert could only take colors from Roster's own ramps.
   */
  describe("current colorScheme", () => {
    it("inherits the page's color for stripe, text and fill", () => {
      const { container } = render(<Alert colorScheme="current">Tinted</Alert>);
      expect(container.firstChild).toHaveClass("rst:border-current");
      expect(container.firstChild).toHaveClass("rst:text-current");
      /* The fill is the half that is easy to leave out, and an Alert with a
         stripe and no wash just looks like a mistake. */
      expect(container.firstChild).toHaveClass("rst:bg-current/10");
    });

    // A lookup miss here renders an empty icon box rather than no icon.
    it("still renders a default icon", () => {
      const { container } = render(<Alert colorScheme="current">Tinted</Alert>);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    // Only `error` is assertive; a page-tinted note should not interrupt.
    it("announces politely", () => {
      render(<Alert colorScheme="current">Tinted</Alert>);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("surface", () => {
    it("holds a flat tint by default, so existing alerts are unchanged", () => {
      const { container } = render(<Alert colorScheme="error">Flat</Alert>);
      expect(container.firstChild).toHaveClass("rst:bg-error-50");
      expect(container.firstChild).not.toHaveClass("rst:bg-gradient-to-r");
    });

    it("fades the fill out when asked", () => {
      const { container } = render(
        <Alert colorScheme="error" surface="gradient">Faded</Alert>,
      );
      expect(container.firstChild).toHaveClass("rst:bg-gradient-to-r");
      expect(container.firstChild).toHaveClass("rst:from-error-500/10");
    });

    /*
     * This shipped broken for one build. Clearing the flat fill with `bg-none`
     * targets background-IMAGE, which is the gradient itself — both classes
     * survived the merge and which one won came down to stylesheet order, so
     * the gradient simply did not appear. The fill is a background-COLOR.
     */
    it("clears the flat fill without cancelling the gradient", () => {
      const { container } = render(
        <Alert colorScheme="error" surface="gradient">Faded</Alert>,
      );
      expect(container.firstChild).not.toHaveClass("rst:bg-none");
      expect(container.firstChild).not.toHaveClass("rst:bg-error-50");
      expect(container.firstChild).not.toHaveClass("rst:dark:bg-error-500/10");
    });

    it("clears it for a page-supplied color too, in both themes", () => {
      const { container } = render(
        <Alert colorScheme="current" surface="gradient">Faded</Alert>,
      );
      expect(container.firstChild).not.toHaveClass("rst:bg-current/10");
      expect(container.firstChild).toHaveClass("rst:dark:bg-transparent");
    });

    it("fades a page-supplied color too", () => {
      const { container } = render(
        <Alert colorScheme="current" surface="gradient">Faded</Alert>,
      );
      expect(container.firstChild).toHaveClass("rst:bg-gradient-to-r");
      expect(container.firstChild).toHaveClass("rst:border-current");
    });
  });
});
