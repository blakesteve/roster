import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InlineCode } from "./InlineCode";
import "@testing-library/jest-dom";

describe("InlineCode Component", () => {
  it("renders a code element", () => {
    const { container } = render(<InlineCode>getAllGames()</InlineCode>);
    expect(container.firstChild?.nodeName).toBe("CODE");
    expect(screen.getByText("getAllGames()")).toBeInTheDocument();
  });

  it("defaults to primary with no surface", () => {
    const { container } = render(<InlineCode>x</InlineCode>);
    expect(container.firstChild).toHaveClass("rst:text-primary-600", "rst:font-mono");
    expect(container.firstChild).not.toHaveClass("rst:bg-gray-100");
  });

  it("applies the soft surface", () => {
    const { container } = render(<InlineCode surface="soft">x</InlineCode>);
    expect(container.firstChild).toHaveClass("rst:bg-gray-100", "rst:rounded");
  });

  it("can inherit the surrounding color", () => {
    const { container } = render(<InlineCode colorScheme="current">x</InlineCode>);
    expect(container.firstChild).toHaveClass("rst:text-current");
  });
});
