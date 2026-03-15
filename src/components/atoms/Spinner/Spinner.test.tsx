import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "./Spinner";

import "@testing-library/jest-dom";

describe("Spinner Component", () => {
  // 1. Basic Rendering & Accessibility
  it("renders correctly with accessible role", () => {
    render(<Spinner />);

    // The component has role="status" and aria-label="loading"
    const spinner = screen.getByRole("status", { name: /loading/i });

    expect(spinner).toBeInTheDocument();
    // Verify the base animation class is present
    expect(spinner).toHaveClass("animate-spin");
  });

  // 2. Default Props (Testing the CVA defaults)
  it("applies primary, medium, classic styles by default", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");

    // Default Size (md)
    expect(spinner).toHaveClass("h-6", "w-6", "border-[3px]");

    // Default Variant (primary) - Checks both light and dark mode classes
    expect(spinner).toHaveClass(
      "border-primary-600",
      "dark:border-primary-500",
    );

    // Default Animation (classic)
    expect(spinner).toHaveClass("border-solid", "border-r-transparent");
  });

  // 3. Size Variants
  it("applies small size classes correctly", () => {
    render(<Spinner size="sm" />);
    const spinner = screen.getByRole("status");

    // 'sm' maps to h-4 w-4 border-2
    expect(spinner).toHaveClass("h-4", "w-4", "border-2");
  });

  it("applies large size classes correctly", () => {
    render(<Spinner size="lg" />);
    const spinner = screen.getByRole("status");

    // 'lg' maps to h-8 w-8 border-4
    expect(spinner).toHaveClass("h-8", "w-8", "border-4");
  });

  // 4. Color Variants & Dark Mode
  it("applies danger variant classes with dark mode support", () => {
    render(<Spinner variant="danger" />);
    const spinner = screen.getByRole("status");

    expect(spinner).toHaveClass("border-error-600", "dark:border-error-500");
  });

  it("applies white variant classes", () => {
    render(<Spinner variant="white" />);
    const spinner = screen.getByRole("status");

    expect(spinner).toHaveClass("border-white");
  });

  // 5. Animation Variants
  it("applies the dashed animation correctly", () => {
    render(<Spinner animation="dashed" />);
    const spinner = screen.getByRole("status");

    expect(spinner).toHaveClass("border-dashed");
  });

  it("applies the half animation correctly", () => {
    render(<Spinner animation="half" />);
    const spinner = screen.getByRole("status");

    // The half animation makes the bottom transparent as well
    expect(spinner).toHaveClass(
      "border-b-transparent",
      "dark:border-b-transparent",
    );
  });

  // 6. Custom ClassNames
  it("merges custom classNames without breaking base styles", () => {
    render(<Spinner className="absolute top-0 opacity-50" />);
    const spinner = screen.getByRole("status");

    // Custom classes applied
    expect(spinner).toHaveClass("absolute", "top-0", "opacity-50");
    // Base classes still intact
    expect(spinner).toHaveClass("animate-spin", "rounded-full");
  });
});
