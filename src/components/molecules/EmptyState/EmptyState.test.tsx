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
    expect(container.firstChild).toHaveClass("border-dashed");
  });
});
