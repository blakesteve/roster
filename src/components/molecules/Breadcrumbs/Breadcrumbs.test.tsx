import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";
import "@testing-library/jest-dom";

describe("Breadcrumbs Molecule", () => {
  const items = [
    { label: "Level 1", href: "/1" },
    { label: "Level 2", href: "/2" },
    { label: "Current", href: "/3" },
  ];

  // 1. Basic Structure & Accessibility
  it("renders all items within an accessible navigation landmark", () => {
    render(<Breadcrumbs items={items} />);

    // Ensure the <nav> element has the correct aria-label
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  // 2. Interactive vs. Static States
  it("renders links for parent items and bold text for the current item", () => {
    render(<Breadcrumbs items={items} />);

    // Parents should be links
    expect(screen.getByRole("link", { name: "Level 1" })).toHaveAttribute(
      "href",
      "/1",
    );

    // Current item should NOT be a link (it's a span)
    const current = screen.getByText("Current");
    expect(current.tagName).toBe("SPAN");

    // Accessibility & styling checks for the active page
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass(
      "font-semibold",
      "text-gray-900",
      "dark:text-gray-100",
    );
  });

  // 3. Variant Styling & Dark Mode
  it("applies primary variant classes correctly to links", () => {
    render(<Breadcrumbs items={items} variant="primary" />);

    const level1Link = screen.getByRole("link", { name: "Level 1" });
    // Verify the primary light and dark mode classes from CVA
    expect(level1Link).toHaveClass("text-primary-600", "dark:text-primary-400");
  });

  it("applies inverse variant classes correctly to the active page", () => {
    render(<Breadcrumbs items={items} variant="inverse" />);

    const current = screen.getByText("Current");
    // The inverse active page should be pure white, not the default gray-900
    expect(current).toHaveClass("text-white");
    expect(current).not.toHaveClass("text-gray-900");
  });

  // 4. Feature Flags (Home Icon)
  it("renders the home icon when requested", () => {
    render(<Breadcrumbs items={items} showHomeIcon />);
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
  });

  // 5. Custom Separators
  it("renders custom separators instead of the default slash", () => {
    render(
      <Breadcrumbs
        items={items}
        separator={<span data-testid="custom-sep">|</span>}
      />,
    );
    // Should appear between items (2 times for 3 items)
    expect(screen.getAllByTestId("custom-sep")).toHaveLength(2);
  });
});
