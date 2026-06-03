import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { CollapsibleSection } from "./CollapsibleSection";
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

const GENRES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation",
  "Horror", "Puzzle", "Racing", "Sports", "Platformer",
  "Fighting", "Shooter", "Stealth", "Survival", "Roguelike",
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CollapsibleSection", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders children correctly", () => {
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    expect(screen.getByText(LONG)).toBeInTheDocument();
  });

  it("renders ReactNode children — multiple paragraphs", () => {
    render(
      <CollapsibleSection>
        <p>Paragraph one</p>
        <p>Paragraph two</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText("Paragraph one")).toBeInTheDocument();
    expect(screen.getByText("Paragraph two")).toBeInTheDocument();
  });

  it("renders ReactNode children — chip buttons", () => {
    render(
      <CollapsibleSection size="xs">
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button key={g} type="button">{g}</button>
          ))}
        </div>
      </CollapsibleSection>,
    );
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Roguelike")).toBeInTheDocument();
  });

  it("applies className to the outer wrapper", () => {
    const { container } = render(
      <CollapsibleSection className="custom-wrapper">{SHORT}</CollapsibleSection>,
    );
    expect(container.firstChild).toHaveClass("custom-wrapper");
  });

  // ── No overflow ────────────────────────────────────────────────────────────

  it("does not render a toggle when content fits within the clamped height", () => {
    mockNoOverflow();
    render(<CollapsibleSection>{SHORT}</CollapsibleSection>);
    expect(screen.queryByTestId("collapsible-toggle")).not.toBeInTheDocument();
  });

  it("does not apply mask-image when content fits", () => {
    mockNoOverflow();
    render(<CollapsibleSection>{SHORT}</CollapsibleSection>);
    const content = screen.getByTestId("collapsible-content");
    expect(content.style.maskImage).toBeFalsy();
  });

  // ── Overflow / clamped state ───────────────────────────────────────────────

  it("renders the expand toggle when content overflows", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-toggle")).toBeInTheDocument();
  });

  it("shows the expandLabel text by default ('Show more')", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show more");
  });

  it("applies the max-height class when collapsed", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-24");
  });

  it("applies mask-image style when clamped and collapsed", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    const content = screen.getByTestId("collapsible-content");
    expect(content.style.maskImage).toContain("linear-gradient");
  });

  // ── Expand / collapse toggle ───────────────────────────────────────────────

  it("expands the content when the toggle is clicked", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-content")).not.toHaveClass("max-h-24");
  });

  it("removes the mask-image when expanded", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-content").style.maskImage).toBeFalsy();
  });

  it("switches the toggle label to collapseLabel when expanded", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show less");
  });

  it("collapses back when the toggle is clicked again", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    fireEvent.click(screen.getByTestId("collapsible-toggle")); // expand
    fireEvent.click(screen.getByTestId("collapsible-toggle")); // collapse
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-24");
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show more");
  });

  // ── Custom labels ──────────────────────────────────────────────────────────

  it("uses a custom expandLabel", () => {
    mockOverflow();
    render(
      <CollapsibleSection expandLabel="Show all genres">{LONG}</CollapsibleSection>,
    );
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show all genres");
  });

  it("uses a custom collapseLabel after expanding", () => {
    mockOverflow();
    render(
      <CollapsibleSection collapseLabel="Hide genres">{LONG}</CollapsibleSection>,
    );
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Hide genres");
  });

  // ── Size prop ──────────────────────────────────────────────────────────────

  it("applies max-h-8 for size='xs'", () => {
    mockOverflow();
    render(<CollapsibleSection size="xs">{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-8");
  });

  it("applies max-h-16 for size='sm'", () => {
    mockOverflow();
    render(<CollapsibleSection size="sm">{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-16");
  });

  it("applies max-h-24 for size='md' (default)", () => {
    mockOverflow();
    render(<CollapsibleSection>{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-24");
  });

  it("applies max-h-36 for size='lg'", () => {
    mockOverflow();
    render(<CollapsibleSection size="lg">{LONG}</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-36");
  });

  it("xs size works with chip children — toggle appears when chips overflow one row", () => {
    mockOverflow();
    render(
      <CollapsibleSection size="xs" expandLabel="Show all genres" collapseLabel="Show less">
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button key={g} type="button">{g}</button>
          ))}
        </div>
      </CollapsibleSection>,
    );
    expect(screen.getByTestId("collapsible-content")).toHaveClass("max-h-8");
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show all genres");
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-content")).not.toHaveClass("max-h-8");
    expect(screen.getByTestId("collapsible-toggle")).toHaveTextContent("Show less");
  });

  it("re-evaluates overflow when size changes", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return (this as HTMLElement).classList.contains("max-h-16") ? 64 : 144;
      },
    });

    const { rerender } = render(
      <CollapsibleSection size="sm">{LONG}</CollapsibleSection>,
    );
    expect(screen.getByTestId("collapsible-toggle")).toBeInTheDocument();

    act(() => {
      rerender(<CollapsibleSection size="lg">{LONG}</CollapsibleSection>);
    });
    expect(screen.queryByTestId("collapsible-toggle")).not.toBeInTheDocument();
  });

  it("re-evaluates overflow when children change from long to short", () => {
    mockOverflow();
    const { rerender } = render(
      <CollapsibleSection>{LONG}</CollapsibleSection>,
    );
    expect(screen.getByTestId("collapsible-toggle")).toBeInTheDocument();

    mockNoOverflow();
    act(() => {
      rerender(<CollapsibleSection>{SHORT}</CollapsibleSection>);
    });
    expect(screen.queryByTestId("collapsible-toggle")).not.toBeInTheDocument();
  });
});