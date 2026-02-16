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
    expect(container.firstChild).toHaveClass("bg-error-50");
  });
});
