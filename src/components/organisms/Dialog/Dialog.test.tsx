import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dialog } from "./Dialog";

// Headless UI requires ResizeObserver, which JSDOM lacks
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("Dialog Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: "Test Dialog",
    children: <div data-testid="modal-content">Content</div>,
  };

  it("renders nothing when isOpen is false", () => {
    render(<Dialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
  });

  it("renders the title, optional description, and children when isOpen is true", async () => {
    render(<Dialog {...defaultProps} description="A test description" />);

    // Use findByRole to wait for Headless UI's Transition to mount the component
    const dialogElement = await screen.findByRole("dialog");

    expect(dialogElement).toBeInTheDocument();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("A test description")).toBeInTheDocument();
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onCloseMock = vi.fn();
    render(<Dialog {...defaultProps} onClose={onCloseMock} />);

    const closeButton = await screen.findByRole("button", {
      name: /close dialog/i,
    });
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("applies the correct default classes (White Variant + Default Status)", async () => {
    render(<Dialog {...defaultProps} />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl");

    // Checks base light mode and native dark mode classes
    expect(panel).toHaveClass("bg-white", "dark:bg-gray-800");

    // Checks that typography correctly uses inheritance now instead of hardcoded colors
    expect(title).toHaveClass("text-inherit");
  });

  it("applies the correct classes for the Destructive Status", async () => {
    render(<Dialog {...defaultProps} status="destructive" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl");

    // Check for the semantic top border
    expect(panel).toHaveClass("border-t-error-500");

    // Typography should still inherit from the base variant
    expect(title).toHaveClass("text-inherit");
  });

  it("applies the correct classes for the Slate Variant", async () => {
    render(<Dialog {...defaultProps} variant="slate" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl");

    expect(panel).toHaveClass("bg-gray-700", "dark:bg-gray-900");
  });

  it("applies the correct classes for the Glass Variant", async () => {
    render(<Dialog {...defaultProps} variant="glass" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl");

    // The panel should have the blur and semi-transparent backgrounds for both themes
    expect(panel).toHaveClass("backdrop-blur-xl");
    expect(panel).toHaveClass("bg-white/80", "dark:bg-slate-900/80");
  });
});
