import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "./Input";
import "@testing-library/jest-dom";

describe("Input Component", () => {
  it("renders label correctly", () => {
    render(<Input label="Test Label" />);
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<Input helperText="Helpful info" />);
    expect(screen.getByText("Helpful info")).toBeInTheDocument();
  });

  it("renders error message and applies error styles", () => {
    render(<Input errorMessage="Invalid input" />);
    expect(screen.getByText("Invalid input")).toBeInTheDocument();

    // Check if error class is applied (border-error-500)
    // Headless UI might wrap things, so we check the input element
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-error-500");
  });

  it("renders icons when provided", () => {
    render(<Input startIcon={<span data-testid="icon">🔍</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("disables input when disabled prop is set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
