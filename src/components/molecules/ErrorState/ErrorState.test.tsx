import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorState } from "./ErrorState";
import { Button } from "../../atoms/Button/Button";
import "@testing-library/jest-dom";

describe("ErrorState Molecule", () => {
  it("renders title and description", () => {
    render(<ErrorState title="Crash!" description="Something broke." />);
    expect(screen.getByText("Crash!")).toBeInTheDocument();
    expect(screen.getByText("Something broke.")).toBeInTheDocument();
  });

  it("renders the default Retry button when onRetry is provided", () => {
    const handleRetry = vi.fn();
    render(<ErrorState description="Error" onRetry={handleRetry} />);

    const button = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a custom action instead of the default button", () => {
    render(
      <ErrorState
        description="Error"
        onRetry={() => {}}
        action={<Button>Custom Action</Button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Custom Action" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(
      <ErrorState description="test" variant="card" />,
    );
    // Check for the error background color
    expect(container.firstChild).toHaveClass("rst:bg-error-50");
  });

  /* Same gap as EmptyState: no dark handling anywhere in the component. */
  it("paints a dark surface in dark mode", () => {
    const { container } = render(<ErrorState title="Failed" description="Try again." variant="card" />);
    expect(container.firstChild).toHaveClass("rst:dark:bg-error-500/10");
    expect(container.firstChild).toHaveClass("rst:dark:text-error-100");
  });

  it("lifts the page variant's title for dark backgrounds", () => {
    const { container } = render(<ErrorState title="Failed" description="Try again." variant="page" />);
    expect(container.firstChild).toHaveClass("rst:dark:text-gray-100");
  });
});
