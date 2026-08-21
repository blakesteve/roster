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
    expect(container.firstChild).toHaveClass("rst:uppercase", "rst:font-mono");
  });

  it("defaults to the faint tone at the smallest size", () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("rst:text-gray-500", "rst:tracking-[0.16em]");
  });

  it("applies the primary tone", () => {
    const { container } = render(<Eyebrow tone="primary">Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("rst:text-primary-600");
  });

  it("applies sizes", () => {
    const { container } = render(<Eyebrow size="md">Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("rst:text-xs");
  });

  it("merges a custom className", () => {
    const { container } = render(<Eyebrow className="rst:mb-2">Label</Eyebrow>);
    expect(container.firstChild).toHaveClass("rst:mb-2", "rst:uppercase");
  });

  it("passes props through", () => {
    render(<Eyebrow data-testid="eb" title="hint">Label</Eyebrow>);
    expect(screen.getByTestId("eb")).toHaveAttribute("title", "hint");
  });
});

describe("Eyebrow polymorphism", () => {
  // The whole point of `as`: props follow the element. Before this, `as="a"`
  // typechecked but `href` did not, so consumers wrapped an Eyebrow in an
  // anchor and moved the hover to a `group`.
  it("renders an anchor with an href", () => {
    render(
      <Eyebrow as="a" href="/work">
        Work
      </Eyebrow>,
    );
    const link = screen.getByRole("link", { name: "Work" });
    expect(link).toHaveAttribute("href", "/work");
    expect(link).toHaveClass("rst:font-mono", "rst:uppercase");
  });

  it("carries element-specific props through", () => {
    render(
      <Eyebrow as="a" href="https://example.com" target="_blank" rel="noreferrer">
        External
      </Eyebrow>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
  });

  it("renders a label with htmlFor", () => {
    const { container } = render(
      <Eyebrow as="label" htmlFor="field">
        Field
      </Eyebrow>,
    );
    expect(container.querySelector("label")).toHaveAttribute("for", "field");
  });

  it("keeps variants working on a swapped element", () => {
    render(
      <Eyebrow as="a" href="/x" tone="primary" size="md">
        Tinted
      </Eyebrow>,
    );
    expect(screen.getByRole("link")).toHaveClass("rst:text-primary-600", "rst:text-xs");
  });
})
