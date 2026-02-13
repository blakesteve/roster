import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Accordion } from "./Accordion";
import "@testing-library/jest-dom";

const items = [
  { id: 1, title: "Section 1", content: "Content 1" },
  { id: 2, title: "Section 2", content: "Content 2" },
];

describe("Accordion Molecule", () => {
  it("renders all items", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
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
});
