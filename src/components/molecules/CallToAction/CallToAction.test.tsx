import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CallToAction } from "./CallToAction";
import { Button } from "../../atoms/Button/Button";
import "@testing-library/jest-dom";

describe("CallToAction Molecule", () => {
  it("renders title and description correctly", () => {
    render(
      <CallToAction
        title="Welcome Back"
        description="Don't forget to check your picks."
      />,
    );

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByText("Don't forget to check your picks."),
    ).toBeInTheDocument();
  });

  it("renders the action element when provided", () => {
    render(<CallToAction title="Test" action={<Button>Click Me</Button>} />);

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", () => {
    const handleDismiss = vi.fn();

    render(<CallToAction title="Dismiss Me" onDismiss={handleDismiss} />);

    // LabelText check for accessibility compliance
    const closeBtn = screen.getByLabelText("Dismiss");
    fireEvent.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does NOT render the close button if onDismiss is missing", () => {
    render(<CallToAction title="Permanent Banner" />);

    const closeBtn = screen.queryByLabelText("Dismiss");
    expect(closeBtn).not.toBeInTheDocument();
  });

  it("renders the icon when provided", () => {
    render(
      <CallToAction
        title="Icon Test"
        icon={<span data-testid="test-icon">🚀</span>}
      />,
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    // Verify icon container has the expected opacity/utility classes
    expect(screen.getByTestId("test-icon").parentElement).toHaveClass(
      "opacity-80",
    );
  });

  it("applies variant-specific styling including dark mode support", () => {
    const { container, rerender } = render(
      <CallToAction title="Primary Test" variant="primary" />,
    );

    // Light mode check
    expect(container.firstChild).toHaveClass(
      "bg-primary-50",
      "text-primary-900",
    );
    // Dark mode check
    expect(container.firstChild).toHaveClass(
      "dark:bg-primary-900/10",
      "dark:text-primary-100",
    );

    rerender(<CallToAction title="Error Test" variant="error" />);
    expect(container.firstChild).toHaveClass("bg-red-50", "dark:bg-red-900/10");
  });

  it("applies the warning variant properly", () => {
    const { container } = render(
      <CallToAction title="Warning" variant="warning" />,
    );

    expect(container.firstChild).toHaveClass(
      "bg-amber-50",
      "dark:bg-amber-900/10",
    );
  });

  it("passes additional HTML attributes through", () => {
    render(
      <CallToAction title="Attrs" data-testid="cta-wrapper" id="custom-id" />,
    );

    const wrapper = screen.getByTestId("cta-wrapper");
    expect(wrapper).toHaveAttribute("id", "custom-id");
  });

  it("merges custom classNames with variants", () => {
    const { container } = render(
      <CallToAction title="Custom" className="my-custom-class" />,
    );

    expect(container.firstChild).toHaveClass("my-custom-class");
    // Should still have base variants
    expect(container.firstChild).toHaveClass("relative", "flex", "rounded-lg");
  });
});
