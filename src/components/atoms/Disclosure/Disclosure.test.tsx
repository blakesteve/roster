import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(button).toHaveClass("bg-gray-700", "dark:bg-gray-900");

    rerender(
      <Disclosure title="Variant Test" variant="soft">
        Content
      </Disclosure>,
    );
    expect(button).toHaveClass("bg-gray-100", "dark:bg-gray-800");
  });

  it("merges custom classNames correctly", () => {
    const { container } = render(
      <Disclosure title="Class Merge" className="my-custom-wrapper-class">
        Content
      </Disclosure>,
    );

    expect(container.firstChild).toHaveClass(
      "my-custom-wrapper-class",
      "w-full",
      "flex",
      "flex-col",
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
      "border-b-transparent",
      "dark:border-b-transparent",
    );
  });
});
