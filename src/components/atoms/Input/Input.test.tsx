import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "./Input";
import "@testing-library/jest-dom";

describe("Input Component", () => {
  it("renders label correctly", () => {
    render(<Input label="Test Label" />);
    // Headless UI v2 automatically links the <Label> to the <Input> via the <Field> context
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<Input helperText="Helpful info" />);
    expect(screen.getByText("Helpful info")).toBeInTheDocument();
  });

  it("renders error message and applies error styles", () => {
    render(<Input errorMessage="Invalid input" />);
    expect(screen.getByText("Invalid input")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-error-500", "dark:border-error-500");
  });

  it("applies error styles when the boolean error prop is true", () => {
    render(<Input error={true} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-error-500", "dark:border-error-500");
  });

  it("renders icons when provided and applies correct icon variants", () => {
    const { container } = render(
      <Input variant="slate" startIcon={<span data-testid="icon">🔍</span>} />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();

    const iconWrapper = container.querySelector(".left-3");
    expect(iconWrapper).toHaveClass("text-gray-300", "dark:text-gray-500");
  });

  it("applies variant classes correctly to the input", () => {
    const { rerender } = render(<Input variant="soft" />);
    let input = screen.getByRole("textbox");

    // Checks the soft variant (including dark mode)
    expect(input).toHaveClass("bg-gray-100", "dark:bg-gray-800");

    rerender(<Input variant="slate" />);
    input = screen.getByRole("textbox");

    // Checks our new slate variant (including dark mode)
    expect(input).toHaveClass("bg-gray-700", "dark:bg-gray-900");
  });

  it("disables input when disabled prop is set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
