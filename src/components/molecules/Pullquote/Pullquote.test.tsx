import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Pullquote } from "./Pullquote";
import "@testing-library/jest-dom";

describe("Pullquote Component", () => {
  it("renders the quote", () => {
    render(<Pullquote>The failure mode was not an error.</Pullquote>);
    expect(screen.getByText("The failure mode was not an error.")).toBeInTheDocument();
  });

  // figure + blockquote + figcaption is the spec's pairing for
  // quote-with-attribution, and it keeps the two associated for screen readers.
  it("uses figure and blockquote markup", () => {
    const { container } = render(<Pullquote cite="Source">Quote</Pullquote>);
    expect(container.firstChild?.nodeName).toBe("FIGURE");
    expect(container.querySelector("blockquote")).toHaveTextContent("Quote");
    expect(container.querySelector("figcaption")).toHaveTextContent("Source");
  });

  it("omits the caption when there is no cite", () => {
    const { container } = render(<Pullquote>Quote</Pullquote>);
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("passes citeUrl to the blockquote", () => {
    const { container } = render(
      <Pullquote citeUrl="https://example.com">Quote</Pullquote>,
    );
    expect(container.querySelector("blockquote")).toHaveAttribute(
      "cite",
      "https://example.com",
    );
  });

  it("defaults to a primary rule", () => {
    const { container } = render(<Pullquote>Quote</Pullquote>);
    expect(container.firstChild).toHaveClass("border-l-2", "border-primary-500");
  });

  it("drops the rule in the plain variant", () => {
    const { container } = render(<Pullquote variant="plain">Quote</Pullquote>);
    expect(container.firstChild).not.toHaveClass("border-l-2");
  });

  it("centers in the centered variant", () => {
    const { container } = render(<Pullquote variant="centered">Quote</Pullquote>);
    expect(container.firstChild).toHaveClass("text-center");
  });

  // `text-center` centers the lines, not the box. The blockquote is capped at
  // 48ch, so without this it stays pinned left while the figcaption centers on
  // the figure — measured 87px apart in a 672px container before the fix.
  it("centers the quote box too, not just its lines", () => {
    const { container } = render(<Pullquote variant="centered">Quote</Pullquote>);
    expect(container.firstChild).toHaveClass("[&>blockquote]:mx-auto");
  });

  it("leaves the quote box left-aligned in the other variants", () => {
    for (const variant of ["rule", "plain"] as const) {
      const { container } = render(<Pullquote variant={variant}>Quote</Pullquote>);
      expect(container.firstChild).not.toHaveClass("[&>blockquote]:mx-auto");
    }
  });

  it("can inherit the surrounding color", () => {
    const { container } = render(<Pullquote colorScheme="current">Quote</Pullquote>);
    expect(container.firstChild).toHaveClass("border-current");
  });
});
