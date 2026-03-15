import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Accordion } from "./Accordion";
import "@testing-library/jest-dom";

const items = [
  { id: 1, title: "Section 1", content: "Content 1" },
  { id: 2, title: "Section 2", content: "Content 2" },
  { id: 3, title: "Section 3", content: "Content 3" }, // Added a 3rd item for divider testing
];

describe("Accordion Molecule", () => {
  it("renders all items", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getByText("Section 3")).toBeInTheDocument();
  });

  it("enforces single-open behavior by default", async () => {
    render(<Accordion items={items} allowMultiple={false} />);

    const btn1 = screen.getByRole("button", { name: /section 1/i });
    const btn2 = screen.getByRole("button", { name: /section 2/i });

    fireEvent.click(btn1);
    await waitFor(() => expect(screen.getByText("Content 1")).toBeVisible());

    fireEvent.click(btn2);
    await waitFor(() => expect(screen.getByText("Content 2")).toBeVisible());

    await waitFor(() =>
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument(),
    );
  });

  it("allows multiple open when allowMultiple is true", async () => {
    render(<Accordion items={items} allowMultiple={true} />);

    const btn1 = screen.getByRole("button", { name: /section 1/i });
    const btn2 = screen.getByRole("button", { name: /section 2/i });

    // Open both
    fireEvent.click(btn1);
    fireEvent.click(btn2);

    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeVisible();
      expect(screen.getByText("Content 2")).toBeVisible();
    });
  });

  it("renders dividers with correct dark mode classes when showDividers is true", () => {
    const { container } = render(
      <Accordion items={items} showDividers={true} />,
    );

    // For 3 items, there should be exactly 2 dividers
    const dividers = container.querySelectorAll(".h-px");
    expect(dividers.length).toBe(2);

    // Verify our new dark mode implementation is present
    expect(dividers[0]).toHaveClass("bg-gray-200/50", "dark:bg-gray-700/50");
  });

  it("opens specific items on initial render via defaultOpenIds", () => {
    render(
      <Accordion items={items} allowMultiple={true} defaultOpenIds={[1, 3]} />,
    );

    const btn1 = screen.getByRole("button", { name: /section 1/i });
    const btn2 = screen.getByRole("button", { name: /section 2/i });
    const btn3 = screen.getByRole("button", { name: /section 3/i });

    // Sections 1 and 3 should be open, Section 2 should be closed
    expect(btn1).toHaveAttribute("aria-expanded", "true");
    expect(btn2).toHaveAttribute("aria-expanded", "false");
    expect(btn3).toHaveAttribute("aria-expanded", "true");
  });
});
