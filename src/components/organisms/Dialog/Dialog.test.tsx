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

  it("applies the correct default classes (Light + Default Variant)", async () => {
    render(<Dialog {...defaultProps} />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl"); // Find the DialogPanel wrapper

    expect(panel).toHaveClass("bg-white");
    expect(panel).toHaveClass("border-gray-200");
    expect(title).toHaveClass("text-gray-900");
  });

  it("applies the correct compound classes for Dark + Destructive Variant", async () => {
    render(<Dialog {...defaultProps} variant="destructive" themeMode="dark" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl");

    // Check panel compound classes
    expect(panel).toHaveClass("bg-slate-800");
    expect(panel).toHaveClass("border-t-error-500");

    // Check title text color for dark mode
    expect(title).toHaveClass("text-white");
  });

  it("applies the correct compound classes for the Glass Variant", async () => {
    render(<Dialog {...defaultProps} variant="glass" themeMode="light" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rounded-2xl");

    // The panel should have the blur and semi-transparent background
    expect(panel).toHaveClass("backdrop-blur-xl");
    expect(panel).toHaveClass("bg-white/80");
  });
});
