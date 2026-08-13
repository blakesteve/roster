import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LabeledDivider } from "./LabeledDivider";
import "@testing-library/jest-dom";

describe("LabeledDivider Component", () => {
  it("renders its label", () => {
    render(<LabeledDivider label="Instances" />);
    expect(screen.getByText("Instances")).toBeInTheDocument();
  });

  it("renders trailing content when given", () => {
    render(<LabeledDivider label="Instances" trailing="04" />);
    expect(screen.getByText("04")).toBeInTheDocument();
  });

  it("omits trailing content by default", () => {
    render(<LabeledDivider label="Instances" />);
    expect(screen.queryByText("04")).not.toBeInTheDocument();
  });

  // The rule is decoration; the label carries the meaning on its own.
  it("hides the rule from the accessibility tree", () => {
    const { container } = render(<LabeledDivider label="Instances" />);
    expect(container.querySelector('[role="presentation"]')).toBeInTheDocument();
  });

  it("puts the rule after the label by default", () => {
    const { container } = render(<LabeledDivider label="A" />);
    const kids = Array.from(container.firstChild!.childNodes) as HTMLElement[];
    expect(kids[0]).toHaveTextContent("A");
    expect(kids[1]).toHaveAttribute("role", "presentation");
  });

  it("puts the rule before the label when aligned end", () => {
    const { container } = render(<LabeledDivider label="A" align="end" />);
    const kids = Array.from(container.firstChild!.childNodes) as HTMLElement[];
    expect(kids[0]).toHaveAttribute("role", "presentation");
    expect(kids[1]).toHaveTextContent("A");
  });
});
