import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import { Badge } from "./Badge";

describe("Badge Component", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<Badge>New Feature</Badge>);
    expect(getByText("New Feature")).toBeInTheDocument();
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
    expect(badge).toHaveClass("border-gray-200");
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
