import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SegmentBar, type SegmentBarSegment } from "./SegmentBar";
import "@testing-library/jest-dom";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const THREE_WAY: SegmentBarSegment[] = [
  { key: "kbm",        label: "Keyboard & Mouse", value: 50, color: "#6366f1" },
  { key: "controller", label: "Controller",        value: 30, color: "#10b981" },
  { key: "both",       label: "Both",              value: 20, color: "#f59e0b" },
];

const TWO_WAY: SegmentBarSegment[] = [
  { key: "yes", label: "Yes", value: 75, color: "#10b981" },
  { key: "no",  label: "No",  value: 25, color: "#ef4444" },
];

const WITH_ZERO: SegmentBarSegment[] = [
  { key: "a", label: "Option A", value: 80, color: "#6366f1" },
  { key: "b", label: "Option B", value: 0,  color: "#10b981" },
  { key: "c", label: "Option C", value: 20, color: "#f59e0b" },
];

const ALL_ZERO: SegmentBarSegment[] = [
  { key: "a", label: "Option A", value: 0, color: "#6366f1" },
  { key: "b", label: "Option B", value: 0, color: "#10b981" },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SegmentBar", () => {
  // ── Null / zero-total guard ────────────────────────────────────────────────

  it("renders nothing when all segment values are zero", () => {
    const { container } = render(<SegmentBar segments={ALL_ZERO} />);
    expect(container.firstChild).toBeNull();
  });

  // ── Bar track ─────────────────────────────────────────────────────────────

  it("renders the bar track", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    expect(screen.getByTestId("segment-bar-track")).toBeInTheDocument();
  });

  it("renders a segment element for each non-zero segment", () => {
    render(<SegmentBar segments={THREE_WAY} />);
    expect(screen.getByTestId("segment-kbm")).toBeInTheDocument();
    expect(screen.getByTestId("segment-controller")).toBeInTheDocument();
    expect(screen.getByTestId("segment-both")).toBeInTheDocument();
  });

  it("omits segments with value 0 from the bar", () => {
    render(<SegmentBar segments={WITH_ZERO} />);
    expect(screen.queryByTestId("segment-b")).not.toBeInTheDocument();
    expect(screen.getByTestId("segment-a")).toBeInTheDocument();
    expect(screen.getByTestId("segment-c")).toBeInTheDocument();
  });

  it("applies the segment color via inline backgroundColor style", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    expect(screen.getByTestId("segment-yes")).toHaveStyle({
      backgroundColor: "#10b981",
    });
    expect(screen.getByTestId("segment-no")).toHaveStyle({
      backgroundColor: "#ef4444",
    });
  });

  it("sets correct proportional widths on each segment", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    // yes = 75/100 = 75%, no = 25/100 = 25%
    expect(screen.getByTestId("segment-yes")).toHaveStyle({ width: "75%" });
    expect(screen.getByTestId("segment-no")).toHaveStyle({ width: "25%" });
  });

  it("sets a title attribute with label and rounded percentage", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    expect(screen.getByTestId("segment-yes")).toHaveAttribute(
      "title",
      "Yes: 75%",
    );
    expect(screen.getByTestId("segment-no")).toHaveAttribute(
      "title",
      "No: 25%",
    );
  });

  // ── Size prop ──────────────────────────────────────────────────────────────

  it("applies h-2 class for size='md' (default)", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    expect(screen.getByTestId("segment-bar-track")).toHaveClass("rst:h-2");
  });

  it("applies h-1.5 class for size='sm'", () => {
    render(<SegmentBar segments={TWO_WAY} size="sm" />);
    expect(screen.getByTestId("segment-bar-track")).toHaveClass("rst:h-1.5");
  });

  // ── Legend ────────────────────────────────────────────────────────────────

  it("renders the legend by default", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    expect(screen.getByTestId("segment-bar-legend")).toBeInTheDocument();
  });

  it("does not render the legend when showLegend is false", () => {
    render(<SegmentBar segments={TWO_WAY} showLegend={false} />);
    expect(screen.queryByTestId("segment-bar-legend")).not.toBeInTheDocument();
  });

  it("renders a legend entry for each non-zero segment", () => {
    render(<SegmentBar segments={THREE_WAY} />);
    expect(screen.getByText("Keyboard & Mouse")).toBeInTheDocument();
    expect(screen.getByText("Controller")).toBeInTheDocument();
    expect(screen.getByText("Both")).toBeInTheDocument();
  });

  it("omits zero-value segments from the legend", () => {
    render(<SegmentBar segments={WITH_ZERO} />);
    expect(screen.queryByText("Option B")).not.toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("shows rounded percentage values in the legend", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("applies the segment color to the legend dot", () => {
    render(<SegmentBar segments={TWO_WAY} />);
    const legend = screen.getByTestId("segment-bar-legend");
    const dots = legend.querySelectorAll("[aria-hidden='true']");
    expect(dots[0]).toHaveStyle({ backgroundColor: "#10b981" });
    expect(dots[1]).toHaveStyle({ backgroundColor: "#ef4444" });
  });

  // ── className ──────────────────────────────────────────────────────────────

  it("applies className to the outer wrapper", () => {
    const { container } = render(
      <SegmentBar segments={TWO_WAY} className="rst:my-custom-class" />,
    );
    expect(container.firstChild).toHaveClass("rst:my-custom-class");
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("handles a single segment filling the full bar", () => {
    const single: SegmentBarSegment[] = [
      { key: "only", label: "Only", value: 1, color: "#6366f1" },
    ];
    render(<SegmentBar segments={single} />);
    expect(screen.getByTestId("segment-only")).toHaveStyle({ width: "100%" });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders all segments when given a large dataset", () => {
    const many: SegmentBarSegment[] = Array.from({ length: 8 }, (_, i) => ({
      key: `s${i}`,
      label: `Segment ${i}`,
      value: i + 1,
      color: "#6366f1",
    }));
    render(<SegmentBar segments={many} />);
    many.forEach((s) => {
      expect(screen.getByTestId(`segment-${s.key}`)).toBeInTheDocument();
    });
  });
});