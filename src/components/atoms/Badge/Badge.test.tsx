import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import { Badge } from "./Badge";

describe("Badge Component", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<Badge>New Feature</Badge>);
    expect(getByText("New Feature")).toBeInTheDocument();
  });

  it("applies the default solid variant classes", () => {
    const { getByText } = render(<Badge variant="primary">Default</Badge>);
    const badge = getByText("Default");

    // Testing default fill: solid
    expect(badge).toHaveClass("bg-primary-500");
    expect(badge).toHaveClass("text-white");
  });

  it("applies light variant classes", () => {
    const { getByText } = render(
      <Badge fill="light" variant="success">
        Light Mode
      </Badge>,
    );
    const badge = getByText("Light Mode");

    // Testing the light middle-ground variant
    expect(badge).toHaveClass("bg-success-500/30");
    expect(badge).toHaveClass("border-success-400");
    expect(badge).toHaveClass("text-success-800");
  });

  it("applies solid variant classes", () => {
    const { getByText } = render(
      <Badge fill="solid" variant="error">
        Critical
      </Badge>,
    );
    const badge = getByText("Critical");

    expect(badge).toHaveClass("bg-error-500");
    expect(badge).toHaveClass("text-white");
  });

  it("applies outline variant classes", () => {
    const { getByText } = render(
      <Badge fill="outline" variant="neutral">
        Ghost
      </Badge>,
    );
    const badge = getByText("Ghost");

    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("border-gray-500");
  });

  it("renders icons when provided", () => {
    const { getByTestId } = render(
      <Badge leftIcon={<span data-testid="icon">👋</span>}>Hello</Badge>,
    );
    expect(getByTestId("icon")).toBeInTheDocument();
  });

  it("renders as a status badge (pill shape)", () => {
    const { getByText } = render(<Badge statusBadge>99</Badge>);
    const badge = getByText("99");

    expect(badge).toHaveClass("rounded-full");
    expect(badge).toHaveClass("justify-center");
  });
});
