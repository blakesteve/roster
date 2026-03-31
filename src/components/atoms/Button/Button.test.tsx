import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Button } from "./Button";
import "@testing-library/jest-dom";

describe("Button Component", () => {
  it("renders children correctly", () => {
    render(<Button>Click Me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("handles onClick events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows spinner with 'current' variant and shrink-0 protection when isLoading is true", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button isLoading onClick={handleClick}>
        Submit
      </Button>,
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(screen.getByText(/submit/i)).toBeInTheDocument();

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("border-current");

    expect(spinner.parentElement).toHaveClass(
      "shrink-0",
      "flex",
      "items-center",
    );

    try {
      await user.click(button);
    } catch {
      // Ignore error expecting interaction with disabled element
    }
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Can't Click</Button>);
    const button = screen.getByRole("button", { name: /can't click/i });
    expect(button).toBeDisabled();
  });

  it("renders startIcon and endIcon correctly with shrink-0 protection", () => {
    render(
      <Button
        startIcon={<span data-testid="start-icon">Start</span>}
        endIcon={<span data-testid="end-icon">End</span>}
      >
        Content
      </Button>,
    );

    const startIcon = screen.getByTestId("start-icon");
    const endIcon = screen.getByTestId("end-icon");

    expect(startIcon).toBeInTheDocument();
    expect(endIcon).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();

    expect(startIcon.parentElement).toHaveClass("shrink-0", "inline-flex");
    expect(endIcon.parentElement).toHaveClass("shrink-0", "inline-flex");
  });

  it("applies outline variant and color scheme classes correctly", () => {
    render(
      <Button variant="outline" colorScheme="error">
        Error Button
      </Button>,
    );

    const button = screen.getByRole("button", { name: /error button/i });

    expect(button).toHaveClass("border", "border-error-600", "text-error-600");
  });

  it("applies soft variant classes with the light mode colors", () => {
    render(
      <Button variant="soft" colorScheme="teal">
        Soft Teal
      </Button>,
    );

    const button = screen.getByRole("button", { name: /soft teal/i });

    expect(button).toHaveClass("bg-teal-100", "text-teal-800");
  });

  it("applies the correct scale classes for the xs size", () => {
    render(<Button size="xs">Tiny Button</Button>);

    const button = screen.getByRole("button", { name: /tiny button/i });

    expect(button).toHaveClass("h-7", "px-2", "text-xs");
  });

  it("forwards refs to the HTML element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Test</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
