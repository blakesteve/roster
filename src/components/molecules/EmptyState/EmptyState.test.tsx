import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "./EmptyState";
import { Button } from "../../atoms/Button/Button";
import "@testing-library/jest-dom";

describe("EmptyState Molecule", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No Data" description="Try refreshing the page." />,
    );
    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(screen.getByText("Try refreshing the page.")).toBeInTheDocument();
  });

  it("renders the action slot", () => {
    render(<EmptyState title="Empty" action={<Button>Create Item</Button>} />);
    const button = screen.getByRole("button", { name: "Create Item" });
    expect(button).toBeInTheDocument();
  });

  it("renders the icon slot", () => {
    render(
      <EmptyState title="Empty" icon={<span data-testid="icon">🔍</span>} />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(<EmptyState title="Test" variant="dashed" />);
    // Check for the border-dashed class on the container
    expect(container.firstChild).toHaveClass("rst:border-dashed");
  });

  /**
   * EmptyState and ErrorState were the only two components in the library with
   * no dark handling at all — every surface, title and description was painted
   * light-only. On a dark page the default `dashed` variant rendered as a white
   * panel, which is how it was found: the admin queue in BB's Grove.
   *
   * Asserted on the class list rather than a rendered colour because jsdom does
   * not resolve the cascade, so this is the only layer that can catch it before
   * a consumer does.
   */
  it("paints a dark surface, not a white panel, in dark mode", () => {
    const { container } = render(<EmptyState title="Test" variant="dashed" />);
    expect(container.firstChild).toHaveClass("rst:dark:bg-gray-500/10");
    expect(container.firstChild).toHaveClass("rst:dark:border-gray-700");
  });

  it("lifts the title and description for dark backgrounds", () => {
    render(<EmptyState title="Queue is clear" description="Nothing waiting." />);
    expect(screen.getByText("Queue is clear")).toHaveClass("rst:dark:text-gray-100");
    expect(screen.getByText("Nothing waiting.")).toHaveClass("rst:dark:text-gray-400");
  });
});
