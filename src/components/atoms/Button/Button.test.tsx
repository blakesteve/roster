import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Button } from "./Button";

import "@testing-library/jest-dom";

describe("Button Component", () => {
  it("renders children correctly", () => {
    // We get 'getByRole' directly from the render result
    const { getByRole } = render(<Button>Click Me</Button>);

    expect(getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles onClick events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = render(
      <Button onClick={handleClick}>Click Me</Button>,
    );

    const button = getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows spinner and disables button when isLoading is true", () => {
    const { getByRole, queryByText } = render(
      <Button isLoading>Submit</Button>,
    );

    const button = getByRole("button");

    expect(button).toBeDisabled();

    // queryByText returns null if not found (instead of throwing error)
    expect(queryByText(/submit/i)).not.toBeInTheDocument();

    expect(button).not.toBeEmptyDOMElement();
  });

  it("respects the disabled prop", () => {
    const { getByRole } = render(<Button disabled>Can't Click</Button>);

    const button = getByRole("button", { name: /can't click/i });
    expect(button).toBeDisabled();
  });

  it("applies variant classes correctly", () => {
    const { getByRole } = render(
      <Button variant="outline">Outline Button</Button>,
    );

    const button = getByRole("button");
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("bg-transparent");
  });

  it("forwards refs to the HTML element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Test</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
