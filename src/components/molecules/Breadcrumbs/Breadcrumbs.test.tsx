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

  it("renders all items", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("renders links for parent items and text for the current item", () => {
    render(<Breadcrumbs items={items} />);

    // Parents should be links
    expect(screen.getByRole("link", { name: "Level 1" })).toHaveAttribute(
      "href",
      "/1",
    );

    // Current item should NOT be a link (it's a span)
    const current = screen.getByText("Current");
    expect(current.tagName).toBe("SPAN");
    // Accessibility check
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders the home icon when requested", () => {
    render(<Breadcrumbs items={items} showHomeIcon />);
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
  });

  it("renders custom separators", () => {
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
