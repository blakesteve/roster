import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActionBar } from "./ActionBar";

describe("ActionBar Component", () => {
  it("renders without crashing when no props are provided", () => {
    const { container } = render(<ActionBar />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the title and subtitle correctly", () => {
    render(<ActionBar title="My Title" subtitle="My Subtitle" />);

    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My Subtitle")).toBeInTheDocument();
  });

  it("renders the badge and actions slots correctly", () => {
    render(
      <ActionBar
        badge={<div data-testid="mock-badge">Badge</div>}
        actions={<button data-testid="mock-action">Action</button>}
      />,
    );

    expect(screen.getByTestId("mock-badge")).toBeInTheDocument();
    expect(screen.getByTestId("mock-action")).toBeInTheDocument();
  });

  it("renders the bottom tray (children) when provided", () => {
    render(
      <ActionBar>
        <div data-testid="bottom-tray-content">Tray Content</div>
      </ActionBar>,
    );

    expect(screen.getByTestId("bottom-tray-content")).toBeInTheDocument();
  });

  it('applies the correct CSS classes for position="top" (default)', () => {
    render(<ActionBar data-testid="action-bar" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("rst:sticky", "rst:top-0", "rst:border-b");
  });

  it('applies the correct CSS classes for position="bottom"', () => {
    render(<ActionBar data-testid="action-bar" position="bottom" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("rst:sticky", "rst:bottom-0", "rst:border-t");
  });

  /* Primary is Dialog primary's solid surface, with its ink token, not a
     translucent fill under a hardcoded white. */
  it('applies the correct CSS classes for variant="primary"', () => {
    render(<ActionBar data-testid="action-bar" variant="primary" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("rst:bg-primary-700", "rst:text-primary-700-ink");
    expect(actionBar).toHaveClass("rst:dark:bg-primary-950", "rst:dark:text-white");
    expect(actionBar).not.toHaveClass("rst:text-white", "rst:bg-primary-700/50");
  });

  /* Default and soft are at 90%, so their text holds over whatever scrolls
     under the sticky bar. */
  it.each([
    ["default", "rst:bg-white/90", "rst:dark:bg-gray-950/90"],
    ["soft", "rst:bg-gray-50/90", "rst:dark:bg-gray-900/90"],
  ] as const)('fills variant="%s" at 90%%', (variant, light, dark) => {
    render(<ActionBar data-testid="action-bar" variant={variant} />);
    expect(screen.getByTestId("action-bar")).toHaveClass(light, dark);
  });

  /* The subtitle is a quieter ink, not a fade; on primary, the bar's own. */
  it.each([
    ["default", true],
    ["soft", true],
    ["transparent", true],
    ["primary", false],
  ] as const)('inks the subtitle on variant="%s"', (variant, quiet) => {
    render(<ActionBar variant={variant} subtitle="Under the title" />);
    const subtitle = screen.getByText("Under the title");
    expect(subtitle.className).not.toMatch(/opacity/);
    if (quiet) expect(subtitle).toHaveClass("rst:text-gray-700", "rst:dark:text-gray-300");
    else expect(subtitle.className).not.toMatch(/text-gray/);
  });

  // test for the transparent variant to ensure background drops out
  it('applies the correct CSS classes for variant="transparent"', () => {
    render(<ActionBar data-testid="action-bar" variant="transparent" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass(
      "rst:bg-transparent",
      "rst:border-transparent",
      "rst:shadow-none",
    );
  });

  it("merges custom classNames correctly", () => {
    render(
      <ActionBar data-testid="action-bar" className="rst:custom-test-class" />,
    );

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("rst:custom-test-class");
    // Ensure default base classes are still there
    expect(actionBar).toHaveClass("rst:z-40", "rst:w-full", "rst:backdrop-blur-md");
  });
});
