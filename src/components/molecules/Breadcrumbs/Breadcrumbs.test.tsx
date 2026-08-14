import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Breadcrumbs, type BreadcrumbLinkProps } from "./Breadcrumbs";
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

describe("Breadcrumbs flexibility", () => {
  // The blocker for every router-based consumer: rendering plain anchors turns
  // each hop into a full page load. blakeb.dev kept a hand-rolled breadcrumb
  // rather than lose client-side navigation.
  it("renders crumbs through a supplied link component", async () => {
    const navigate = vi.fn();
    function RouterLink({ href, children, ...rest }: BreadcrumbLinkProps) {
      return (
        <a
          href={href}
          onClick={(event) => {
            event.preventDefault();
            navigate(href);
          }}
          {...rest}
        >
          {children}
        </a>
      );
    }

    render(
      <Breadcrumbs
        linkComponent={RouterLink}
        items={[
          { label: "Work", href: "/work" },
          { label: "Game Verdict", href: "/work/game-verdict" },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("link", { name: "Work" }));
    expect(navigate).toHaveBeenCalledWith("/work");
  });

  it("routes the home icon through the same component", () => {
    const RouterLink = vi.fn(({ href, children }: BreadcrumbLinkProps) => (
      <a href={href}>{children}</a>
    ));

    render(
      <Breadcrumbs
        showHomeIcon
        linkComponent={RouterLink}
        items={[{ label: "Work", href: "/work" }]}
      />,
    );
    expect(RouterLink).toHaveBeenCalled();
  });

  it("points the home icon wherever homeHref says", () => {
    render(
      <Breadcrumbs showHomeIcon homeHref="/dashboard" items={[{ label: "Now" }]} />,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("still uses a plain anchor when no link component is given", () => {
    render(<Breadcrumbs items={[{ label: "Work", href: "/work" }, { label: "Now" }]} />);
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/work");
  });

  it("accepts a node for a label", () => {
    render(<Breadcrumbs items={[{ label: <em>Italic</em>, href: "/x" }, { label: "Now" }]} />);
    expect(screen.getByText("Italic").tagName).toBe("EM");
  });

  it("renders a crumb without an href as plain text", () => {
    render(
      <Breadcrumbs
        items={[{ label: "Unlinked" }, { label: "Work", href: "/work" }, { label: "Now" }]}
      />,
    );
    expect(screen.queryByRole("link", { name: "Unlinked" })).toBeNull();
    expect(screen.getByText("Unlinked")).toBeInTheDocument();
  });

  it("marks only the last crumb as the current page", () => {
    const { container } = render(
      <Breadcrumbs items={[{ label: "Unlinked" }, { label: "Now" }]} />,
    );
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Now");
  });

  it("tints the current crumb with currentClassName", () => {
    render(
      <Breadcrumbs
        currentClassName="text-[var(--world)]"
        items={[{ label: "Work", href: "/work" }, { label: "Now" }]}
      />,
    );
    expect(screen.getByText("Now")).toHaveClass("text-[var(--world)]");
  });

  it("applies a per-item className", () => {
    render(
      <Breadcrumbs
        items={[{ label: "Work", href: "/work", className: "custom" }, { label: "Now" }]}
      />,
    );
    expect(screen.getByRole("link", { name: "Work" })).toHaveClass("custom");
  });

  // The old implementation keyed on href, which is now optional and may repeat.
  it("renders repeated and missing hrefs without collapsing crumbs", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "A", href: "/x" },
          { label: "B", href: "/x" },
          { label: "C" },
        ]}
      />,
    );
    ["A", "B", "C"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });
})
