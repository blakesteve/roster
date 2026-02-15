import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "./Textarea";
import "@testing-library/jest-dom";

describe("Textarea Component", () => {
  it("renders label correctly", () => {
    render(<Textarea label="Bio" />);
    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<Textarea helperText="Max 500 chars" />);
    expect(screen.getByText("Max 500 chars")).toBeInTheDocument();
  });

  it("renders error message and applies error styles", () => {
    render(<Textarea errorMessage="Field required" />);
    expect(screen.getByText("Field required")).toBeInTheDocument();

    // Check if error class is applied
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("border-error-500");
  });

  it("applies resize classes", () => {
    render(<Textarea resize="none" />);
    expect(screen.getByRole("textbox")).toHaveClass("resize-none");
  });

  it("disables input when disabled prop is set", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
