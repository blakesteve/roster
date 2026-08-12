import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { Pill } from "./Pill";
import "@testing-library/jest-dom";

describe("Pill Component", () => {
  describe("rendering", () => {
    it("renders its children", () => {
      render(<Pill>3 friends voted</Pill>);
      expect(screen.getByText("3 friends voted")).toBeInTheDocument();
    });

    it("renders as a span so it can sit inline in body copy", () => {
      const { container } = render(<Pill>Inline</Pill>);
      expect(container.firstChild?.nodeName).toBe("SPAN");
    });

    it("forwards a ref to the root element", () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Pill ref={ref}>Ref</Pill>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it("merges a custom className with the variant classes", () => {
      const { container } = render(<Pill className="ml-4">Spaced</Pill>);
      expect(container.firstChild).toHaveClass("ml-4", "rounded-full");
    });

    it("passes arbitrary props through to the root", () => {
      render(<Pill data-testid="pill" title="tooltip">Props</Pill>);
      expect(screen.getByTestId("pill")).toHaveAttribute("title", "tooltip");
    });
  });

  describe("defaults", () => {
    // Neutral / soft / sm is the quietest combination, since a Pill most often
    // sits inside running text.
    it("defaults to the neutral soft small combination", () => {
      const { container } = render(<Pill>Default</Pill>);
      expect(container.firstChild).toHaveClass(
        "bg-gray-100",
        "text-gray-700",
        "text-xs",
      );
    });

    it("is always fully rounded", () => {
      const { container } = render(<Pill variant="solid" size="md">Round</Pill>);
      expect(container.firstChild).toHaveClass("rounded-full");
    });
  });

  describe("color schemes", () => {
    const schemes = [
      ["primary", "bg-primary-50"],
      ["success", "bg-success-50"],
      ["error", "bg-error-50"],
      ["amber", "bg-amber-50"],
      ["info", "bg-info-50"],
      ["neutral", "bg-gray-100"],
    ] as const;

    it.each(schemes)("applies the %s soft scheme", (scheme, expected) => {
      const { container } = render(<Pill colorScheme={scheme}>Scheme</Pill>);
      expect(container.firstChild).toHaveClass(expected);
    });
  });

  describe("variants", () => {
    it("gives the outline variant a border and no fill", () => {
      const { container } = render(
        <Pill variant="outline" colorScheme="success">Outline</Pill>,
      );
      expect(container.firstChild).toHaveClass(
        "bg-transparent",
        "border",
        "border-success-300",
      );
    });

    it("fills the solid variant", () => {
      const { container } = render(
        <Pill variant="solid" colorScheme="error">Solid</Pill>,
      );
      expect(container.firstChild).toHaveClass("bg-error-500", "text-white");
    });

    // Amber is light enough that white text on it fails contrast.
    it("uses dark text on solid amber", () => {
      const { container } = render(
        <Pill variant="solid" colorScheme="amber">Warning</Pill>,
      );
      expect(container.firstChild).toHaveClass("text-amber-950");
    });
  });

  describe("sizes", () => {
    it("applies small sizing by default", () => {
      const { container } = render(<Pill>Small</Pill>);
      expect(container.firstChild).toHaveClass("text-xs", "px-2.5");
    });

    it("applies medium sizing", () => {
      const { container } = render(<Pill size="md">Medium</Pill>);
      expect(container.firstChild).toHaveClass("text-sm", "px-3");
    });
  });

  describe("dot", () => {
    it("renders no dot by default", () => {
      const { container } = render(<Pill>No dot</Pill>);
      expect(container.querySelectorAll("span.rounded-full")).toHaveLength(1);
    });

    it("renders a dot in the scheme color when dot is set", () => {
      const { container } = render(
        <Pill dot colorScheme="success">Live</Pill>,
      );
      expect(container.querySelector(".bg-success-500")).toBeInTheDocument();
    });

    // On a filled pill the scheme color would disappear into the background.
    it("borrows the text color for the dot on solid pills", () => {
      const { container } = render(
        <Pill dot variant="solid" colorScheme="success">Live</Pill>,
      );
      expect(container.querySelector(".bg-current")).toBeInTheDocument();
    });

    it("scales the dot with the pill size", () => {
      const { container } = render(<Pill dot size="md">Live</Pill>);
      expect(container.querySelector(".size-2")).toBeInTheDocument();
    });

    it("hides the dot from assistive tech", () => {
      const { container } = render(<Pill dot>Live</Pill>);
      expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    });
  });

  describe("pulse", () => {
    it("renders a pulsing ring alongside the dot", () => {
      const { container } = render(<Pill dot pulse>Live now</Pill>);
      expect(container.querySelector(".motion-safe\\:animate-ping")).toBeInTheDocument();
    });

    // Motion is gated on motion-safe so reduced-motion users get a static dot
    // rather than no indicator at all.
    it("still renders the dot itself when pulsing", () => {
      const { container } = render(
        <Pill dot pulse colorScheme="error">Live now</Pill>,
      );
      expect(container.querySelectorAll(".bg-error-500").length).toBeGreaterThanOrEqual(1);
    });

    it("does not pulse without a dot", () => {
      const { container } = render(<Pill pulse>No dot</Pill>);
      expect(container.querySelector(".motion-safe\\:animate-ping")).toBeNull();
    });
  });

  describe("leading icon", () => {
    it("renders a leading icon", () => {
      render(<Pill leadingIcon={<span data-testid="icon" />}>With icon</Pill>);
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    // Two leading indicators would be visual noise; the dot wins.
    it("ignores the leading icon when a dot is set", () => {
      render(
        <Pill dot leadingIcon={<span data-testid="icon" />}>
          Dot wins
        </Pill>,
      );
      expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    });

    it("hides the leading icon from assistive tech", () => {
      const { container } = render(
        <Pill leadingIcon={<span data-testid="icon" />}>With icon</Pill>,
      );
      expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    });
  });
});
