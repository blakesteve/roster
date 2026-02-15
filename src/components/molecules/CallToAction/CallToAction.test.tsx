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
  });

  it("applies warning styles correctly", () => {
    const { container } = render(
      <CallToAction title="Warning" variant="warning" />,
    );

    expect(container.firstChild).toHaveClass("bg-amber-50");
  });
});
