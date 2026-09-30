import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Disclosure } from "./Disclosure";
import "@testing-library/jest-dom";

describe("Disclosure Atom", () => {
  it("renders the title and hides content by default", () => {
    render(
      <Disclosure title="Test Title">
        <p>Hidden Content</p>
      </Disclosure>,
    );

    const button = screen.getByRole("button", { name: "Test Title" });
    expect(button).toBeInTheDocument();

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
  });

  it("toggles the content visibility when clicked", () => {
    render(
      <Disclosure title="Toggle Me">
        <p>Revealed Content</p>
      </Disclosure>,
    );

    const button = screen.getByRole("button", { name: "Toggle Me" });

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Revealed Content")).toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("renders open initially when defaultOpen is true", () => {
    render(
      <Disclosure title="Always Open" defaultOpen={true}>
        <p>Visible Content</p>
      </Disclosure>,
    );

    const button = screen.getByRole("button", { name: "Always Open" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Visible Content")).toBeInTheDocument();
  });

  it("respects controlled state and calls onToggle", () => {
    const handleToggle = vi.fn();

    render(
      <Disclosure title="Controlled" isOpen={false} onToggle={handleToggle}>
        <p>Controlled Content</p>
      </Disclosure>,
    );

    const button = screen.getByRole("button", { name: "Controlled" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "false");

    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it("renders a custom icon when provided", () => {
    render(
      <Disclosure
        title="Custom Icon"
        icon={<span data-testid="custom-icon">🌟</span>}
      >
        Content
      </Disclosure>,
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("applies variant classes correctly including dark mode", () => {
    const { rerender } = render(
      <Disclosure title="Variant Test" variant="slate">
        Content
      </Disclosure>,
    );

    const button = screen.getByRole("button", { name: "Variant Test" });
    expect(button).toHaveClass("rst:bg-gray-700", "rst:dark:bg-gray-900");

    rerender(
      <Disclosure title="Variant Test" variant="soft">
        Content
      </Disclosure>,
    );
    expect(button).toHaveClass("rst:bg-gray-100", "rst:dark:bg-gray-800");
  });

  it("merges custom classNames correctly", () => {
    const { container } = render(
      <Disclosure title="Class Merge" className="rst:my-custom-wrapper-class">
        Content
      </Disclosure>,
    );

    expect(container.firstChild).toHaveClass(
      "rst:my-custom-wrapper-class",
      "rst:w-full",
      "rst:flex",
      "rst:flex-col",
    );
  });

  it("removes bottom border on outline variant when open", () => {
    render(
      <Disclosure title="Outline Open" variant="outline" defaultOpen={true}>
        Content
      </Disclosure>,
    );

    const button = screen.getByRole("button", { name: "Outline Open" });
    // Verifies the fix that prevents double-thick borders between trigger and content
    expect(button).toHaveClass(
      "rst:border-b-transparent",
      "rst:dark:border-b-transparent",
    );
  });

  describe("aria-controls", () => {
    it("points at the panel while it is open, and the panel is there", () => {
      render(
        <Disclosure title="Wired" defaultOpen>
          <p>Panel text</p>
        </Disclosure>,
      );
      const button = screen.getByRole("button", { name: "Wired" });
      const id = button.getAttribute("aria-controls");
      expect(id).toBeTruthy();
      const panel = document.getElementById(id!);
      expect(panel).not.toBeNull();
      expect(panel).toHaveTextContent("Panel text");
    });

    it("names nothing while the panel has never mounted", () => {
      render(<Disclosure title="Closed">Panel text</Disclosure>);
      expect(screen.getByRole("button", { name: "Closed" })).not.toHaveAttribute("aria-controls");
    });

    it("keeps naming the panel while it leaves, and stops once it has left", async () => {
      render(<Disclosure title="Toggle">Panel text</Disclosure>);
      const button = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(button);
      const id = button.getAttribute("aria-controls");
      expect(id).toBeTruthy();

      fireEvent.click(button);
      /* Closing, but the panel is still in the document for its leave
         transition, so it is still the panel this button controls. */
      expect(document.getElementById(id!)).not.toBeNull();
      expect(button).toHaveAttribute("aria-controls", id!);

      await waitFor(() => expect(screen.queryByText("Panel text")).not.toBeInTheDocument());
      expect(button).not.toHaveAttribute("aria-controls");
    });

    it("never names an id that is not in the document", async () => {
      render(<Disclosure title="Toggle">Panel text</Disclosure>);
      const button = screen.getByRole("button", { name: "Toggle" });
      const check = () => {
        const id = button.getAttribute("aria-controls");
        if (id) expect(document.getElementById(id)).not.toBeNull();
      };
      check();
      fireEvent.click(button);
      check();
      fireEvent.click(button);
      check();
      await waitFor(() => expect(button).not.toHaveAttribute("aria-controls"));
      check();
    });
  });

  describe("reduced motion", () => {
    it("scales the panel only when motion is allowed, and always fades", () => {
      render(
        <Disclosure title="Motion" defaultOpen>
          Panel text
        </Disclosure>,
      );
      const panel = screen.getByTestId("disclosure-panel");
      expect(panel).toHaveClass("rst:data-closed:opacity-0", "rst:motion-safe:data-closed:scale-95");
      /* Not a bare scale that a reduced-motion rule would have to win
         against. A pattern, not the class: every file here is scanned for
         classes, and a literal would ship the rule it says is absent. */
      expect(panel.className).not.toMatch(/(^|\s)rst:data-closed:scale-/);
    });

    it("flips the chevron without turning it under reduced motion", () => {
      render(<Disclosure title="Motion">Panel text</Disclosure>);
      const chevron = screen.getByRole("button", { name: "Motion" }).lastElementChild!;
      expect(chevron).toHaveClass("rst:transition-transform", "rst:motion-reduce:transition-none");
    });
  });
});
