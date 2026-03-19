import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import { Badge } from "./Badge";

describe("Badge Component", () => {
  it("renders children correctly and applies truncation protections", () => {
    const { getByText } = render(<Badge>New Feature</Badge>);
    const textNode = getByText("New Feature");

    expect(textNode).toBeInTheDocument();
    // Ensures the text is wrapped in the truncation span
    expect(textNode).toHaveClass("truncate", "min-w-0");
  });

  it("applies the default solid variant classes", () => {
    const { container } = render(<Badge variant="primary">Default</Badge>);
    // Grabbing the root element to check the variant classes
    const badge = container.firstChild as HTMLElement;

    // Testing default fill: solid
    expect(badge).toHaveClass("bg-primary-500", "text-white");
  });

  it("applies light variant classes with the new crisp colors", () => {
    const { container } = render(
      <Badge fill="light" variant="success">
        Light Mode
      </Badge>,
    );
    const badge = container.firstChild as HTMLElement;

    // Testing the new crisp pastel light variant (no more /30 opacity)
    expect(badge).toHaveClass(
      "bg-success-100",
      "border-success-300",
      "text-success-800",
    );
  });

  it("applies solid variant classes", () => {
    const { container } = render(
      <Badge fill="solid" variant="error">
        Critical
      </Badge>,
    );
    const badge = container.firstChild as HTMLElement;

    expect(badge).toHaveClass("bg-error-500", "text-white");
  });

  it("applies outline variant classes", () => {
    const { container } = render(
      <Badge fill="outline" variant="neutral">
        Ghost
      </Badge>,
    );
    const badge = container.firstChild as HTMLElement;

    // ✨ Verifying neutral outline colors
    expect(badge).toHaveClass(
      "bg-transparent",
      "border-gray-500",
      "text-gray-600",
    );
  });

  it("renders icons with shrink-0 protection when provided", () => {
    const { getByTestId } = render(
      <Badge leftIcon={<span data-testid="icon">👋</span>}>Hello</Badge>,
    );
    const iconElement = getByTestId("icon");

    expect(iconElement).toBeInTheDocument();
    // Check that the icon wrapper has shrink-0 to prevent crushing
    expect(iconElement.parentElement).toHaveClass(
      "shrink-0",
      "flex",
      "items-center",
    );
  });

  it("renders as a status badge (pill shape)", () => {
    const { container } = render(<Badge statusBadge>99</Badge>);
    const badge = container.firstChild as HTMLElement;

    expect(badge).toHaveClass("rounded-full", "justify-center");
  });
});
