import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Eyebrow } from "./Eyebrow";
import "@testing-library/jest-dom";

describe("Eyebrow Component", () => {
  it("renders its children", () => {
    render(<Eyebrow>Instances</Eyebrow>);
    expect(screen.getByText("Instances")).toBeInTheDocument();
  });

  // A span by default: an eyebrow labels a section, it is not the heading.
  it("renders a span by default", () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });

  it("renders as another element when asked", () => {
    const { container } = render(<Eyebrow as="p">Label</Eyebrow>);
    expect(container.firstChild?.nodeName).toBe("P");
  });

  it("is uppercase and monospace", () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("uppercase", "font-mono");
  });

  it("defaults to the faint tone at the smallest size", () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("text-gray-500", "tracking-[0.16em]");
  });

  it("applies the primary tone", () => {
    const { container } = render(<Eyebrow tone="primary">Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("text-primary-600");
  });

  it("applies sizes", () => {
    const { container } = render(<Eyebrow size="md">Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("text-xs");
  });

  it("merges a custom className", () => {
    const { container } = render(<Eyebrow className="mb-2">Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("mb-2", "uppercase");
  });

  it("passes props through", () => {
    render(<Eyebrow data-testid="eb" title="hint">Label</Eyebrow>);
    expect(screen.getByTestId("eb")).toHaveAttribute("title", "hint");
  });
});
