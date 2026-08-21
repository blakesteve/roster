import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";
import "@testing-library/jest-dom";

describe("Card Component", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <span data-testid="child">Inside Content</span>
      </Card>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders brand stripes when branded prop is true", () => {
    const { container } = render(<Card branded>Content</Card>);

    const topStripe = container.querySelector(".rst\\:bg-orange-500");
    const bottomStripe = container.querySelector(".rst\\:bg-primary-500");

    expect(topStripe).toBeInTheDocument();
    expect(topStripe).toHaveClass("rst:absolute", "rst:top-0", "rst:inset-x-0", "rst:h-1");

    expect(bottomStripe).toBeInTheDocument();
    expect(bottomStripe).toHaveClass(
      "rst:absolute",
      "rst:bottom-0",
      "rst:inset-x-0",
      "rst:h-1",
    );
  });

  it("applies custom hex colors to brand stripes", () => {
    const customTop = "#FF0000";
    const customBottom = "#0000FF";

    const { container } = render(
      <Card branded brandColorTop={customTop} brandColorBottom={customBottom}>
        Content
      </Card>,
    );

    const topStripe = container.querySelector(".rst\\:absolute.rst\\:top-0");
    const bottomStripe = container.querySelector(".rst\\:absolute.rst\\:bottom-0");

    expect(topStripe).toHaveStyle({ backgroundColor: customTop });
    expect(bottomStripe).toHaveStyle({ backgroundColor: customBottom });
  });

  // Surfaces are token-driven so themed apps can retint them; the token
  // defaults resolve to the previous white / gray-900 pair.
  it("applies token-driven white (default) variant classes", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass(
      "rst:bg-[var(--roster-card-bg)]",
      "rst:border-[var(--roster-card-border)]",
      "rst:text-[var(--roster-card-text)]",
    );
  });

  it("applies soft variant classes with crisp light mode and translucent dark mode", () => {
    const { container } = render(<Card variant="soft">Content</Card>);
    expect(container.firstChild).toHaveClass(
      "rst:bg-gray-50",
      "rst:dark:bg-gray-900/40",
    );
  });

  it("applies slate variant classes", () => {
    const { container } = render(<Card variant="slate">Content</Card>);
    expect(container.firstChild).toHaveClass(
      "rst:bg-gray-700",
      "rst:dark:bg-gray-800",
      "rst:text-gray-100",
    );
  });

  it("applies primary variant classes matching solid buttons", () => {
    const { container } = render(<Card variant="primary">Content</Card>);
    expect(container.firstChild).toHaveClass(
      "rst:bg-primary-600",
      "rst:border-primary-700",
    );
  });

  it("applies glass variant classes correctly", () => {
    const { container } = render(<Card variant="glass">Content</Card>);
    expect(container.firstChild).toHaveClass(
      "rst:bg-white/50",
      "rst:backdrop-blur-md",
      "rst:dark:bg-gray-950/50",
    );
  });

  it("applies padding classes correctly", () => {
    const { container } = render(<Card padding="lg">Big Padding</Card>);
    expect(container.firstChild).toHaveClass("rst:p-8");
  });

  // Regression: children used to render inside a `relative z-0` wrapper, so
  // layout classes passed via className landed on the outer div and silently
  // did nothing. Children must be direct descendants of the styled root.
  it("renders children directly on the root so layout classes reach them", () => {
    const { container } = render(
      <Card className="rst:flex rst:gap-4">
        <span data-testid="first">One</span>
        <span data-testid="second">Two</span>
      </Card>,
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("rst:flex", "rst:gap-4");
    expect(screen.getByTestId("first").parentElement).toBe(root);
    expect(screen.getByTestId("second").parentElement).toBe(root);
  });

  // The stripes are absolutely positioned at z-10 and the root is `isolate`,
  // which is what keeps content beneath them now that the wrapper is gone.
  it("keeps branded stripes above content without a wrapper", () => {
    const { container } = render(
      <Card branded>
        <span data-testid="content">Body</span>
      </Card>,
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("rst:isolate");
    expect(screen.getByTestId("content").parentElement).toBe(root);
    expect(root.querySelectorAll("div.rst\\:absolute.rst\\:z-10")).toHaveLength(2);
  });
});
