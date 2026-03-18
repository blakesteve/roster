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
    expect(actionBar).toHaveClass("sticky", "top-0", "border-b");
  });

  it('applies the correct CSS classes for position="bottom"', () => {
    render(<ActionBar data-testid="action-bar" position="bottom" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("sticky", "bottom-0", "border-t");
  });

  // verifying the /50 opacities
  it('applies the correct CSS classes for variant="primary"', () => {
    render(<ActionBar data-testid="action-bar" variant="primary" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("bg-primary-700/50", "text-white");
    expect(actionBar).toHaveClass(
      "dark:bg-primary-950/50",
      "dark:text-primary-50",
    );
  });

  // test for the transparent variant to ensure background drops out
  it('applies the correct CSS classes for variant="transparent"', () => {
    render(<ActionBar data-testid="action-bar" variant="transparent" />);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass(
      "bg-transparent",
      "border-transparent",
      "shadow-none",
    );
  });

  it("merges custom classNames correctly", () => {
    render(
      <ActionBar data-testid="action-bar" className="custom-test-class" />,
    );

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveClass("custom-test-class");
    // Ensure default base classes are still there
    expect(actionBar).toHaveClass("z-40", "w-full", "backdrop-blur-md");
  });
});
