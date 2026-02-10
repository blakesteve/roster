import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "./Spinner";

import "@testing-library/jest-dom";

describe("Spinner Component", () => {
  // 1. Basic Rendering & Accessibility
  it("renders correctly with accessible role", () => {
    const { getByRole } = render(<Spinner />);

    // The component has role="status" and aria-label="loading"
    const spinner = getByRole("status", { name: /loading/i });

    expect(spinner).toBeInTheDocument();
    // Verify the base animation class is present
    expect(spinner).toHaveClass("animate-spin");
  });

  // 2. Default Props
  it("applies medium size by default", () => {
    const { getByRole } = render(<Spinner />);

    const spinner = getByRole("status");

    // Default size 'md' maps to h-6 w-6 in your CVA config
    expect(spinner).toHaveClass("h-6");
    expect(spinner).toHaveClass("w-6");
  });

  // 3. Size Variants
  it("applies small size classes", () => {
    const { getByRole } = render(<Spinner size="sm" />);
    const spinner = getByRole("status");

    // 'sm' maps to h-4 w-4
    expect(spinner).toHaveClass("h-4");
    expect(spinner).toHaveClass("w-4");
  });

  it("applies large size classes", () => {
    const { getByRole } = render(<Spinner size="lg" />);
    const spinner = getByRole("status");

    // 'lg' maps to h-8 w-8
    expect(spinner).toHaveClass("h-8");
    expect(spinner).toHaveClass("w-8");
  });

  // 4. Custom ClassNames
  it("merges custom classNames correctly", () => {
    // Users often pass text-color classes to spinners
    const { getByRole } = render(
      <Spinner className="text-blue-500 opacity-50" />,
    );
    const spinner = getByRole("status");

    expect(spinner).toHaveClass("text-blue-500");
    expect(spinner).toHaveClass("opacity-50");
    // Ensure base classes are STILL there
    expect(spinner).toHaveClass("animate-spin");
  });
});
