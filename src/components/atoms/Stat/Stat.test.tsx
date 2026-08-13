import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Stat } from "./Stat";
import "@testing-library/jest-dom";

describe("Stat Component", () => {
  it("renders the value and label", () => {
    render(<Stat value="1,573" label="Games tracked" />);
    expect(screen.getByText("1,573")).toBeInTheDocument();
    expect(screen.getByText("Games tracked")).toBeInTheDocument();
  });

  it("renders no source line unless given one", () => {
    const { container } = render(<Stat value="42" label="Things" />);
    expect(container.querySelectorAll("span")).toHaveLength(1); // the Eyebrow only
  });

  it("renders the source when provided", () => {
    render(<Stat value="42" label="Things" source="GitHub API" />);
    expect(screen.getByText("GitHub API")).toBeInTheDocument();
  });

  // dd/dt so a row of Stats can live in a dl and announce as pairs.
  it("uses definition markup", () => {
    const { container } = render(<Stat value="42" label="Things" />);
    expect(container.querySelector("dd")).toHaveTextContent("42");
    expect(container.querySelector("dt")).toHaveTextContent("Things");
  });

  // A row of figures that does not line up on the digits looks broken.
  it("uses tabular numerals", () => {
    const { container } = render(<Stat value="42" label="Things" />);
    expect(container.querySelector("dd")).toHaveClass("tabular-nums");
  });

  it("applies the color scheme to the value", () => {
    const { container } = render(<Stat value="42" label="Things" colorScheme="primary" />);
    expect(container.querySelector("dd")).toHaveClass("text-primary-600");
  });

  it("applies sizes", () => {
    const { container } = render(<Stat value="42" label="Things" size="sm" />);
    expect(container.querySelector("dd")).toHaveClass("text-xl");
  });

  it("accepts nodes for value and label", () => {
    render(<Stat value={<em>42</em>} label={<b>Things</b>} />);
    expect(screen.getByText("42").tagName).toBe("EM");
    expect(screen.getByText("Things").tagName).toBe("B");
  });
});
