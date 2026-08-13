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
    expect(container.firstChild).toHaveClass("text-primary-600", "font-mono");
    expect(container.firstChild).not.toHaveClass("bg-gray-100");
  });

  it("applies the soft surface", () => {
    const { container } = render(<InlineCode surface="soft">x</InlineCode>);
    expect(container.firstChild).toHaveClass("bg-gray-100", "rounded");
  });

  it("can inherit the surrounding color", () => {
    const { container } = render(<InlineCode colorScheme="current">x</InlineCode>);
    expect(container.firstChild).toHaveClass("text-current");
  });
});
