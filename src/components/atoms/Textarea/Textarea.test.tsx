import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "./Textarea";
import "@testing-library/jest-dom";

describe("Textarea Component", () => {
  // 1. Basic Rendering
  it("renders label correctly", () => {
    // Headless UI handles the htmlFor/id wire-up automatically
    render(<Textarea label="Bio" />);
    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
  });

  // 2. Helper Text & Dark Mode Typography
  it("renders helper text with correct light and dark mode styles", () => {
    render(<Textarea helperText="Max 500 chars" />);
    const helperText = screen.getByText("Max 500 chars");

    expect(helperText).toBeInTheDocument();
    // Verify standard helper text colors
    expect(helperText).toHaveClass("text-gray-500", "dark:text-gray-400");
  });

  // 3. Error State & Dark Mode Integration
  it("renders error message and applies light/dark error styles", () => {
    render(<Textarea errorMessage="Field required" />);
    const errorMsg = screen.getByText("Field required");

    expect(errorMsg).toBeInTheDocument();
    // Verify error text colors
    expect(errorMsg).toHaveClass(
      "text-error-600",
      "dark:text-error-400",
      "font-medium",
    );

    // Check if error border classes are applied to the textarea
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("border-error-500", "dark:border-error-500");
  });

  // 4. Prop Priority
  it("displays errorMessage instead of helperText when both are provided", () => {
    render(
      <Textarea helperText="Helpful info" errorMessage="Critical error" />,
    );

    expect(screen.getByText("Critical error")).toBeInTheDocument();
    // The helper text should not render if there's an active error
    expect(screen.queryByText("Helpful info")).not.toBeInTheDocument();
  });

  // 5. Variant Testing
  it("applies the 'white' variant classes correctly", () => {
    render(<Textarea variant="white" />);
    const textarea = screen.getByRole("textbox");

    // Verify the specific light and dark mode combo for the white variant
    expect(textarea).toHaveClass(
      "bg-white",
      "dark:bg-gray-900",
      "dark:border-gray-800",
    );
  });

  // 6. Resize Controls
  it("applies resize classes based on props", () => {
    const { rerender } = render(<Textarea resize="none" />);
    let textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("resize-none");

    // Default behavior test
    rerender(<Textarea />);
    textarea = screen.getByRole("textbox");
    // Our CVA default is 'vertical', which maps to 'resize-y'
    expect(textarea).toHaveClass("resize-y");
  });

  // 7. Disabled State
  it("disables input when disabled prop is set", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
