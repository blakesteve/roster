import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LiquidTabs, type TabItem } from "./LiquidTabs";
import "@testing-library/jest-dom";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const THREE_TABS: TabItem[] = [
  { id: "alpha", label: "Alpha" },
  { id: "beta",  label: "Beta" },
  { id: "gamma", label: "Gamma" },
];

const TWO_TABS: TabItem[] = [
  { id: "card",  label: "Card" },
  { id: "badge", label: "Badge" },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LiquidTabs", () => {
  // ── Structure ──────────────────────────────────────────────────────────────

  it("renders the tablist container", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders a tab button for each item", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("renders tab labels as text", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Badge")).toBeInTheDocument();
  });

  it("renders the pill element", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tabs-pill")).toBeInTheDocument();
  });

  it("renders individual tab test ids", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-card")).toBeInTheDocument();
    expect(screen.getByTestId("liquid-tab-badge")).toBeInTheDocument();
  });

  // ── ARIA ──────────────────────────────────────────────────────────────────

  it("marks the active tab as selected", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-beta")).toHaveAttribute("aria-selected", "true");
  });

  it("marks inactive tabs as not selected", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("liquid-tab-gamma")).toHaveAttribute("aria-selected", "false");
  });

  it("updates aria-selected when activeTab prop changes", () => {
    const { rerender } = render(
      <LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("aria-selected", "true");
    rerender(<LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("liquid-tab-gamma")).toHaveAttribute("aria-selected", "true");
  });

  // ── Interaction ────────────────────────────────────────────────────────────

  it("calls onChange with the clicked tab id", () => {
    const onChange = vi.fn();
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("liquid-tab-badge"));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("badge");
  });

  it("does not call onChange when clicking the already-active tab", () => {
    const onChange = vi.fn();
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("liquid-tab-card"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange for each different tab clicked", () => {
    const onChange = vi.fn();
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("liquid-tab-beta"));
    fireEvent.click(screen.getByTestId("liquid-tab-gamma"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "beta");
    expect(onChange).toHaveBeenNthCalledWith(2, "gamma");
  });

  // ── Active tab styling ─────────────────────────────────────────────────────

  it("applies text-white to the active tab", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-beta")).toHaveClass("rst:text-white");
  });

  it("applies muted text color to inactive tabs", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveClass("rst:text-(--roster-lt-text-inactive)");
    expect(screen.getByTestId("liquid-tab-gamma")).toHaveClass("rst:text-(--roster-lt-text-inactive)");
  });

  // ── Variant: pill (default) ────────────────────────────────────────────────

  it("applies pill container classes by default", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    const container = screen.getByTestId("liquid-tabs");
    expect(container).toHaveClass("rst:rounded-xl");
    expect(container).toHaveClass("rst:p-1");
  });

  it("defaults to w-fit in pill variant", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tabs")).toHaveClass("rst:w-fit");
  });

  it("applies w-full when fullWidth is true in pill variant", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} fullWidth />,
    );
    expect(screen.getByTestId("liquid-tabs")).toHaveClass("rst:w-full");
  });

  it("applies flex-1 to pill buttons when fullWidth is true", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} fullWidth />,
    );
    screen.getAllByRole("tab").forEach((btn) => {
      expect(btn).toHaveClass("rst:flex-1");
    });
  });

  it("applies px-4 to pill buttons when fullWidth is false", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    screen.getAllByRole("tab").forEach((btn) => {
      expect(btn).toHaveClass("rst:px-4");
    });
  });

  // ── Variant: filled ────────────────────────────────────────────────────────

  it("applies filled container classes for filled variant", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} variant="filled" />,
    );
    const container = screen.getByTestId("liquid-tabs");
    expect(container).toHaveClass("rst:w-full");
    expect(container).toHaveClass("rst:overflow-hidden");
    expect(container).toHaveClass("rst:rounded-lg");
  });

  it("does not apply pill padding in filled variant", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} variant="filled" />,
    );
    expect(screen.getByTestId("liquid-tabs")).not.toHaveClass("rst:p-1");
  });

  it("applies flex-1 to filled buttons", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} variant="filled" />,
    );
    screen.getAllByRole("tab").forEach((btn) => {
      expect(btn).toHaveClass("rst:flex-1");
    });
  });

  // ── className ──────────────────────────────────────────────────────────────

  it("applies className to the container", () => {
    render(
      <LiquidTabs
        tabs={TWO_TABS}
        activeTab="card"
        onChange={vi.fn()}
        className="rst:my-custom-class"
      />,
    );
    expect(screen.getByTestId("liquid-tabs")).toHaveClass("rst:my-custom-class");
  });

  // ── Label render function ──────────────────────────────────────────────────

  it("calls label render function with true for the active tab", () => {
    const labelFn = vi.fn((isActive: boolean) => (isActive ? "Active" : "Inactive"));
    const tabs: TabItem[] = [{ id: "a", label: labelFn }];
    render(<LiquidTabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(labelFn).toHaveBeenCalledWith(true);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls label render function with false for inactive tabs", () => {
    const labelFn = vi.fn((isActive: boolean) => (isActive ? "Active" : "Inactive"));
    const tabs: TabItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: labelFn },
    ];
    render(<LiquidTabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(labelFn).toHaveBeenCalledWith(false);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("renders a single tab correctly", () => {
    const single: TabItem[] = [{ id: "only", label: "Only" }];
    render(<LiquidTabs tabs={single} activeTab="only" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByTestId("liquid-tab-only")).toHaveAttribute("aria-selected", "true");
  });

  it("renders many tabs without errors", () => {
    const many: TabItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      label: `Tab ${i}`,
    }));
    render(<LiquidTabs tabs={many} activeTab="t0" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });
});