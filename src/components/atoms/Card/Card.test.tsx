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

    const topStripe = container.querySelector(".bg-orange-500");
    const bottomStripe = container.querySelector(".bg-primary-500");

    expect(topStripe).toBeInTheDocument();
    expect(topStripe).toHaveClass("absolute", "top-0", "inset-x-0", "h-1");

    expect(bottomStripe).toBeInTheDocument();
    expect(bottomStripe).toHaveClass(
      "absolute",
      "bottom-0",
      "inset-x-0",
      "h-1",
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

    const topStripe = container.querySelector(".absolute.top-0");
    const bottomStripe = container.querySelector(".absolute.bottom-0");

    expect(topStripe).toHaveStyle({ backgroundColor: customTop });
    expect(bottomStripe).toHaveStyle({ backgroundColor: customBottom });
  });

  it("applies white (default) variant classes including native dark mode", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass(
      "bg-white",
      "dark:bg-gray-800",
      "text-gray-900",
    );
  });

  it("applies soft variant classes (replacing filled)", () => {
    const { container } = render(<Card variant="soft">Content</Card>);
    expect(container.firstChild).toHaveClass(
      "bg-gray-100",
      "dark:bg-gray-900/50",
    );
  });

  it("applies slate variant classes", () => {
    const { container } = render(<Card variant="slate">Content</Card>);
    expect(container.firstChild).toHaveClass(
      "bg-gray-700",
      "dark:bg-gray-900",
      "text-gray-100",
    );
  });

  it("applies padding classes correctly", () => {
    const { container } = render(<Card padding="lg">Big Padding</Card>);
    expect(container.firstChild).toHaveClass("p-8");
  });
});
