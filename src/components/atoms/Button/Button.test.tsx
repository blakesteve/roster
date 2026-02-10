import { render, screen, fireEvent } from "@testing-library/react";
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

  it("shows spinner and disables button when isLoading is true", async () => {
    const handleClick = vi.fn();

    render(
      <Button isLoading onClick={handleClick}>
        Submit
      </Button>,
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(screen.queryByText(/submit/i)).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Can't Click</Button>);
    const button = screen.getByRole("button", { name: /can't click/i });
    expect(button).toBeDisabled();
  });

  it("applies variant and color scheme classes correctly", () => {
    render(
      <Button variant="outline" colorScheme="error">
        Error Button
      </Button>,
    );

    const button = screen.getByRole("button", { name: /error button/i });

    expect(button).toHaveClass("border");
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("border-error-500");
    expect(button).toHaveClass("text-error-600");
  });

  it("forwards refs to the HTML element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Test</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
