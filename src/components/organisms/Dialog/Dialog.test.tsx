import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
    const panel = title.closest(".rst\\:rounded-2xl");

    /* The neutral surface reads `--roster-popover-*` rather than naming its
       own colors, so one class covers both schemes: the token is redefined
       under `.dark` instead of the class being swapped. The values it resolves
       to are unchanged — white on gray-800 — which is the point of the
       defaults. */
    expect(panel).toHaveClass(
      "rst:bg-[var(--roster-popover-bg)]",
      "rst:border-[var(--roster-popover-border)]",
      "rst:text-[var(--roster-popover-text)]",
    );

    // Checks that typography correctly uses inheritance now instead of hardcoded colors
    expect(title).toHaveClass("rst:text-inherit");
  });

  it("applies the correct classes for the Destructive Status", async () => {
    render(<Dialog {...defaultProps} status="destructive" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rst\\:rounded-2xl");

    // Check for the semantic top border
    expect(panel).toHaveClass("rst:border-t-error-500");

    // Typography should still inherit from the base variant
    expect(title).toHaveClass("rst:text-inherit");
  });

  it("applies the correct classes for the Slate Variant", async () => {
    render(<Dialog {...defaultProps} variant="slate" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rst\\:rounded-2xl");

    expect(panel).toHaveClass("rst:bg-gray-700", "rst:dark:bg-gray-900");
  });

  it("applies the correct classes for the Glass Variant", async () => {
    render(<Dialog {...defaultProps} variant="glass" />);

    const title = await screen.findByText("Test Dialog");
    const panel = title.closest(".rst\\:rounded-2xl");

    // The panel should have the blur and semi-transparent backgrounds for both themes
    expect(panel).toHaveClass("rst:backdrop-blur-xl");
    expect(panel).toHaveClass("rst:bg-white/80", "rst:dark:bg-slate-900/80");
  });

  describe("the ring on inverting variants", () => {
    it("gives slate its own ring and offset instead of the page's", () => {
      /* `--roster-ring` follows the page, and `slate` is dark regardless of
         the page. On a light page that meant primary-500 on gray-700 —
         1.61:1, no usable focus indicator — while the white offset behind it
         sat at 10.27:1, so the gap was the most visible part. */
      render(<Dialog {...defaultProps} variant="slate" />);
      const panel = screen.getByText("Test Dialog").closest(".rst\\:rounded-2xl");

      expect(panel).toHaveClass(
        "rst:[--roster-ring:var(--roster-primary-400,#5ea3de)]",
        "rst:[--roster-ring-offset:var(--roster-gray-700,#44403c)]",
        "rst:dark:[--roster-ring-offset:var(--roster-gray-900,#1c1917)]",
      );
    });

    it("gives primary its own too", () => {
      render(<Dialog {...defaultProps} variant="primary" />);
      const panel = screen.getByText("Test Dialog").closest(".rst\\:rounded-2xl");

      expect(panel).toHaveClass(
        "rst:[--roster-ring:var(--roster-primary-400,#5ea3de)]",
        "rst:[--roster-ring-offset:var(--roster-primary-700,#084063)]",
      );
    });

    it("inverts the control tokens too, not only the ring", () => {
      /* Fixing the ring alone would have been worse than fixing neither: an
         `outline` field on these panels draws `--roster-control-text`, which is
         `:root`'s gray-900 on a light page — 1.70:1 on slate. A correct focus
         ring around illegible text is not an improvement. */
      for (const variant of ["slate", "primary"] as const) {
        cleanup();
        render(<Dialog {...defaultProps} variant={variant} />);
        const panel = screen.getByText("Test Dialog").closest(".rst\\:rounded-2xl");
        expect(panel).toHaveClass(
          "rst:[--roster-control-text:var(--roster-gray-100,#f5f5f4)]",
          "rst:[--roster-control-border:var(--roster-gray-400,#a8a29e)]",
          "rst:[--roster-control-border-focus:var(--roster-primary-400,#5ea3de)]",
        );
      }
    });

    it("leaves the variants that follow the page alone", () => {
      /* `white` and `glass` are light on a light page and dark on a dark one,
         so the page-level tokens are already correct for them. Setting a ring
         here would be wrong half the time. */
      for (const variant of ["white", "glass"] as const) {
        cleanup();
        render(<Dialog {...defaultProps} variant={variant} />);
        const panel = screen.getByText("Test Dialog").closest(".rst\\:rounded-2xl");
        expect(panel?.className).not.toContain("--roster-ring");
        expect(panel?.className).not.toContain("--roster-control-");
      }
    });
  });
});
