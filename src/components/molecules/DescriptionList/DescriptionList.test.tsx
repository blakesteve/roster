import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DescriptionList } from "./DescriptionList";
import "@testing-library/jest-dom";

const items = [
  { term: "Framework", description: "Next.js 16" },
  { term: "Data", description: "Supabase" },
  { term: "Cache", description: "unstable_cache" },
];

describe("DescriptionList Component", () => {
  it("renders every term and description", () => {
    render(<DescriptionList items={items} />);
    items.forEach(({ term, description }) => {
      expect(screen.getByText(term)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });

  // The dl/dt/dd pairing is the point: screen readers announce
  // "Framework, Next.js 16" as one fact rather than two loose strings.
  it("uses real definition list markup", () => {
    const { container } = render(<DescriptionList items={items} />);
    expect(container.firstChild?.nodeName).toBe("DL");
    expect(container.querySelectorAll("dt")).toHaveLength(3);
    expect(container.querySelectorAll("dd")).toHaveLength(3);
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<DescriptionList items={[]} />);
    expect(container.querySelectorAll("dt")).toHaveLength(0);
  });

  it("defaults to the inline grid layout", () => {
    const { container } = render(<DescriptionList items={items} />);
    expect(container.firstChild).toHaveClass("rst:grid", "rst:grid-cols-[auto_1fr]");
  });

  // `contents` is what lets dt and dd act as direct grid children while
  // staying grouped in the markup.
  it("uses display:contents row wrappers in the inline layout", () => {
    const { container } = render(<DescriptionList items={items} />);
    expect(container.querySelectorAll(".rst\\:contents")).toHaveLength(3);
  });

  it("stacks terms above descriptions in the stacked layout", () => {
    const { container } = render(<DescriptionList items={items} layout="stacked" />);
    expect(container.firstChild).toHaveClass("rst:flex", "rst:flex-col");
    expect(container.querySelectorAll(".rst\\:contents")).toHaveLength(0);
  });

  it("right-aligns descriptions in the split layout", () => {
    const { container } = render(<DescriptionList items={items} layout="split" />);
    expect(container.querySelector("dd")).toHaveClass("rst:text-right", "rst:tabular-nums");
  });

  it("adds no dividers by default", () => {
    const { container } = render(<DescriptionList items={items} layout="stacked" />);
    expect(container.querySelectorAll(".rst\\:border-b")).toHaveLength(0);
  });

  // Every row but the last, so the list does not end on a stray rule.
  it("adds dividers between rows but not after the last", () => {
    const { container } = render(
      <DescriptionList items={items} layout="stacked" dividers />,
    );
    expect(container.querySelectorAll(".rst\\:border-b")).toHaveLength(2);
  });

  it("accepts nodes for terms and descriptions", () => {
    render(
      <DescriptionList items={[{ term: <b>Bold</b>, description: <em>Ital</em> }]} />,
    );
    expect(screen.getByText("Bold").tagName).toBe("B");
    expect(screen.getByText("Ital").tagName).toBe("EM");
  });
});
