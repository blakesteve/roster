import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CallToAction } from "./CallToAction";
import { Button } from "../../atoms/Button/Button";
import "@testing-library/jest-dom";

describe("CallToAction Molecule", () => {
  it("renders title and standard string description correctly", () => {
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

  it("renders a complex ReactNode injected into the title prop", () => {
    render(
      <CallToAction
        title={
          <span data-testid="rich-title">
            <span data-testid="badge-in-title">New</span>
            {" "}Quick Vote
          </span>
        }
      />,
    );

    expect(screen.getByTestId("rich-title")).toBeInTheDocument();
    expect(screen.getByTestId("badge-in-title")).toBeInTheDocument();
    expect(screen.getByText("Quick Vote", { exact: false })).toBeInTheDocument();
  });

  it("renders a complex ReactNode injected into the description prop", () => {
    render(
      <CallToAction
        title="Embedded Component"
        description={
          <div data-testid="complex-node">
            <span className="font-bold">Rich Text</span>
            <button>Embedded Button</button>
          </div>
        }
      />,
    );

    expect(screen.getByTestId("complex-node")).toBeInTheDocument();
    expect(screen.getByText("Rich Text")).toBeInTheDocument();
    expect(screen.getByText("Embedded Button")).toBeInTheDocument();
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
    expect(screen.getByTestId("test-icon").parentElement).toHaveClass(
      "shrink-0",
      "text-current",
    );
  });

  it("applies primary and error variant styling including rich dark mode support", () => {
    const { container, rerender } = render(
      <CallToAction title="Primary Test" variant="primary" />,
    );

    // Light mode check
    expect(container.firstChild).toHaveClass(
      "bg-primary-50",
      "text-primary-900",
    );

    expect(container.firstChild).toHaveClass(
      "dark:bg-primary-900/30",
      "dark:text-primary-200",
    );

    rerender(<CallToAction title="Error Test" variant="error" />);
    expect(container.firstChild).toHaveClass(
      "bg-error-50",
      "dark:bg-error-900/30",
    );
  });

  it("applies the warning variant properly", () => {
    const { container } = render(
      <CallToAction title="Warning" variant="warning" />,
    );

    expect(container.firstChild).toHaveClass(
      "bg-amber-50",
      "dark:bg-amber-900/30",
    );
  });

  // success variant test
  it("applies the new success variant properly", () => {
    const { container } = render(
      <CallToAction title="Success" variant="success" />,
    );

    expect(container.firstChild).toHaveClass(
      "bg-success-50",
      "dark:bg-success-900/30",
    );
  });

  // info variant test
  it("applies the new info variant properly", () => {
    const { container } = render(<CallToAction title="Info" variant="info" />);

    expect(container.firstChild).toHaveClass(
      "bg-blue-50",
      "dark:bg-blue-900/30",
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
