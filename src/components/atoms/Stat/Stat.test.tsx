import { createRef } from "react";
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

  // dt/dd so a row of Stats can live in a dl and announce as pairs.
  it("uses definition markup", () => {
    const { container } = render(<Stat value="42" label="Things" />);
    expect(container.querySelector("dd")).toHaveTextContent("42");
    expect(container.querySelector("dt")).toHaveTextContent("Things");
  });

  describe("inside a dl (the default)", () => {
    it("puts the term before the details, as a dl group must be", () => {
      /* A group in a <dl> is one or more dt followed by one or more dd. The
         value used to come first in the DOM, which made every row invalid. */
      const { container } = render(<Stat value="42" label="Things" source="live" />);
      const group = container.firstElementChild!;
      expect(group.tagName).toBe("DIV");
      expect(Array.from(group.children).map((c) => c.tagName)).toEqual(["DT", "DD"]);
    });

    it("keeps the source inside the dd it describes", () => {
      const { container } = render(<Stat value="42" label="Things" source="GitHub API" />);
      const dd = container.querySelector("dd")!;
      expect(dd).toHaveTextContent("42");
      expect(dd).toHaveTextContent("GitHub API");
      expect(container.querySelector("dt")).not.toHaveTextContent("GitHub API");
    });

    it("still shows the value first, then the label, then the source", () => {
      /* By grid placement, since the DOM order is now dt, dd. */
      const { container } = render(<Stat value="42" label="Things" source="live" />);
      expect(container.querySelector("dd")).toHaveClass("rst:row-start-1", "rst:row-span-3", "rst:grid-rows-subgrid");
      expect(container.querySelector("dt")).toHaveClass("rst:row-start-2", "rst:col-start-1", "rst:relative");
      expect(container.querySelector("dd")).toHaveClass("rst:col-start-1");
      expect(screen.getByText("live")).toHaveClass("rst:row-start-3");
    });

    it("keeps its rows at their own height when a row stretches it", () => {
      /* A grid shares extra height among its auto rows; the flex column it
         replaced did not, so a Stat beside a taller one kept its label put. */
      const { container } = render(<Stat value="42" label="Things" />);
      expect(container.firstElementChild).toHaveClass("rst:grid", "rst:content-start");
    });

    it("places the value first without a source too", () => {
      const { container } = render(<Stat value="42" label="Things" />);
      expect(container.querySelector("dd")).toHaveClass("rst:row-start-1");
      expect(container.querySelector("dd")).not.toHaveClass("rst:row-span-3");
      expect(container.querySelector("dt")).toHaveClass("rst:row-start-2", "rst:col-start-1", "rst:relative");
      expect(container.querySelector("dd")).toHaveClass("rst:col-start-1");
    });

    it("keeps the dd a direct child, so a `[&>dd]` selector still reaches it", () => {
      /* A consumer sets its display face on the value this way. */
      const { container } = render(<Stat value="42" label="Things" source="live" />);
      const dd = container.querySelector(":scope > div > dd");
      expect(dd).not.toBeNull();
      expect(dd).toHaveClass("rst:tabular-nums");
    });

    it("does not let the source inherit the value's weight and figures", () => {
      render(<Stat value="42" label="Things" source="live" />);
      expect(screen.getByText("live")).toHaveClass("rst:font-normal", "rst:normal-nums", "rst:font-mono");
    });
  });

  describe("standalone", () => {
    it("renders no dt or dd, which are invalid outside a dl", () => {
      const { container } = render(
        <Stat semantics="standalone" value="42" label="Things" source="live" />,
      );
      expect(container.querySelector("dt, dd")).toBeNull();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Things")).toBeInTheDocument();
      expect(screen.getByText("live")).toBeInTheDocument();
    });

    it("keeps the value's size, color and figures", () => {
      render(<Stat semantics="standalone" value="42" label="Things" size="sm" colorScheme="primary" />);
      expect(screen.getByText("42")).toHaveClass("rst:text-xl", "rst:text-primary-600", "rst:tabular-nums");
    });

    it("keeps the visual order in the DOM: value, label, source", () => {
      const { container } = render(
        <Stat semantics="standalone" value="42" label="Things" source="live" />,
      );
      expect(container.firstElementChild!.textContent).toBe("42Thingslive");
    });
  });

  // A row of figures that does not line up on the digits looks broken.
  it("uses tabular numerals", () => {
    const { container } = render(<Stat value="42" label="Things" />);
    expect(container.querySelector("dd")).toHaveClass("rst:tabular-nums");
  });

  it("applies the color scheme to the value", () => {
    const { container } = render(<Stat value="42" label="Things" colorScheme="primary" />);
    expect(container.querySelector("dd")).toHaveClass("rst:text-primary-600");
  });

  it("applies sizes", () => {
    const { container } = render(<Stat value="42" label="Things" size="sm" />);
    expect(container.querySelector("dd")).toHaveClass("rst:text-xl");
  });

  it("accepts nodes for value and label", () => {
    render(<Stat value={<em>42</em>} label={<b>Things</b>} />);
    expect(screen.getByText("42").tagName).toBe("EM");
    expect(screen.getByText("Things").tagName).toBe("B");
  });

  it("forwards its ref to the outer element in both markups", () => {
    for (const semantics of ["definition", "standalone"] as const) {
      const ref = createRef<HTMLDivElement>();
      const { container, unmount } = render(<Stat ref={ref} semantics={semantics} value="42" label="Things" />);
      expect(ref.current).toBe(container.firstElementChild);
      unmount();
    }
  });
});
