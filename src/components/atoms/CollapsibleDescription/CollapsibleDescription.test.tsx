import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { CollapsibleDescription } from "./CollapsibleDescription";
import "@testing-library/jest-dom";

// ─── Scroll mock helpers ──────────────────────────────────────────────────────
// JSDOM does not compute layout, so scrollHeight / clientHeight are always 0.
// We mock HTMLElement.prototype before render so the useEffect sees real values.

const ORIGINAL_SCROLL_HEIGHT = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollHeight",
);
const ORIGINAL_CLIENT_HEIGHT = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight",
);

function mockOverflow() {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => 300,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 96,
  });
}

function mockNoOverflow() {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => 40,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 96,
  });
}

afterEach(() => {
  // Restore original descriptors so mocks don't leak between tests
  if (ORIGINAL_SCROLL_HEIGHT) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollHeight",
      ORIGINAL_SCROLL_HEIGHT,
    );
  }
  if (ORIGINAL_CLIENT_HEIGHT) {
    Object.defineProperty(
      HTMLElement.prototype,
      "clientHeight",
      ORIGINAL_CLIENT_HEIGHT,
    );
  }
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LONG = "A".repeat(600);
const SHORT = "Short.";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CollapsibleDescription", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders children correctly", () => {
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);
    expect(screen.getByText(LONG)).toBeInTheDocument();
  });

  it("renders ReactNode children", () => {
    render(
      <CollapsibleDescription>
        <p>Paragraph one</p>
        <p>Paragraph two</p>
      </CollapsibleDescription>,
    );
    expect(screen.getByText("Paragraph one")).toBeInTheDocument();
    expect(screen.getByText("Paragraph two")).toBeInTheDocument();
  });

  it("applies className to the outer wrapper", () => {
    const { container } = render(
      <CollapsibleDescription className="custom-wrapper">{SHORT}</CollapsibleDescription>,
    );
    expect(container.firstChild).toHaveClass("custom-wrapper");
  });

  // ── No overflow ────────────────────────────────────────────────────────────

  it("does not render a toggle when content fits within the clamped height", () => {
    mockNoOverflow();
    render(<CollapsibleDescription>{SHORT}</CollapsibleDescription>);
    expect(screen.queryByTestId("collapsible-toggle")).not.toBeInTheDocument();
  });

  it("does not apply mask-image when content fits", () => {
    mockNoOverflow();
    render(<CollapsibleDescription>{SHORT}</CollapsibleDescription>);
    const content = screen.getByTestId("collapsible-content");
    expect(content.style.maskImage).toBeFalsy();
  });

  // ── Overflow / clamped state ───────────────────────────────────────────────

  it("renders the expand toggle when content overflows", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);
    expect(screen.getByTestId("collapsible-toggle")).toBeInTheDocument();
  });

  it("shows the expandLabel text by default", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Read more");
  });

  it("applies the max-height class when collapsed", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-24");
  });

  it("applies mask-image style when clamped and collapsed", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);
    const content = screen.getByTestId("collapsible-content");
    expect(content.style.maskImage).toContain("linear-gradient");
  });

  // ── Expand / collapse toggle ───────────────────────────────────────────────

  it("expands the content when the toggle is clicked", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);

    fireEvent.click(screen.getByTestId("collapsible-toggle"));

    expect(screen.getByTestId("collapsible-content")).not.toHaveClass("max-h-24");
  });

  it("removes the mask-image when expanded", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);

    fireEvent.click(screen.getByTestId("collapsible-toggle"));

    expect(screen.getByTestId("collapsible-content").style.maskImage).toBeFalsy();
  });

  it("switches the toggle label to collapseLabel when expanded", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);

    fireEvent.click(screen.getByTestId("collapsible-toggle"));

    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show less");
  });

  it("collapses back when the toggle is clicked again", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);

    fireEvent.click(screen.getByTestId("collapsible-toggle")); // expand
    fireEvent.click(screen.getByTestId("collapsible-toggle")); // collapse

    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-24");
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Read more");
  });

  // ── Custom labels ──────────────────────────────────────────────────────────

  it("uses a custom expandLabel", () => {
    mockOverflow();
    render(
      <CollapsibleDescription expandLabel="See full review">{LONG}</CollapsibleDescription>,
    );
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("See full review");
  });

  it("uses a custom collapseLabel after expanding", () => {
    mockOverflow();
    render(
      <CollapsibleDescription collapseLabel="Hide review">{LONG}</CollapsibleDescription>,
    );
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Hide review");
  });

  // ── Size prop ──────────────────────────────────────────────────────────────

  it("applies max-h-16 for size='sm'", () => {
    mockOverflow();
    render(<CollapsibleDescription size="sm">{LONG}</CollapsibleDescription>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-16");
  });

  it("applies max-h-24 for size='md' (default)", () => {
    mockOverflow();
    render(<CollapsibleDescription>{LONG}</CollapsibleDescription>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-24");
  });

  it("applies max-h-36 for size='lg'", () => {
    mockOverflow();
    render(<CollapsibleDescription size="lg">{LONG}</CollapsibleDescription>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-36");
  });

  it("re-evaluates overflow when size changes", () => {
    // Start overflowing at sm, then switch to lg where the same content fits
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      // sm clamps at 64px (max-h-16), lg clamps at 144px (max-h-36)
      // We'll return the clamped height based on the rendered class
      get() {
        return (this as HTMLElement).classList.contains("max-h-16") ? 64 : 144;
      },
    });

    const { rerender } = render(
      <CollapsibleDescription size="sm">{LONG}</CollapsibleDescription>,
    );
    expect(screen.getByTestId("collapsible-toggle")).toBeInTheDocument();

    // At lg, scrollHeight (100) < clientHeight (144) → no overflow
    act(() => {
      rerender(<CollapsibleDescription size="lg">{LONG}</CollapsibleDescription>);
    });
    expect(screen.queryByTestId("collapsible-toggle")).not.toBeInTheDocument();
  });

  // ── Overflow re-check on children change ───────────────────────────────────

  it("re-evaluates overflow when children change from long to short", () => {
    mockOverflow();
    const { rerender } = render(
      <CollapsibleDescription>{LONG}</CollapsibleDescription>,
    );
    expect(screen.getByTestId("collapsible-toggle")).toBeInTheDocument();

    mockNoOverflow();
    act(() => {
      rerender(<CollapsibleDescription>{SHORT}</CollapsibleDescription>);
    });
    expect(screen.queryByTestId("collapsible-toggle")).not.toBeInTheDocument();
  });
});