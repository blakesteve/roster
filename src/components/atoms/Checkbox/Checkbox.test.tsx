import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { Checkbox, type CheckboxProps } from "./Checkbox";
import "@testing-library/jest-dom";

const InteractiveWrapper = (props: Partial<CheckboxProps>) => {
  const [checked, setChecked] = useState(false);
  return <Checkbox checked={checked} onChange={setChecked} {...props} />;
};

describe("Checkbox Component", () => {
  it("renders correctly in its default unchecked state", () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("toggles the checked state when clicked", async () => {
    const user = userEvent.setup();
    render(<InteractiveWrapper />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("calls the onChange handler with the correct value", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox checked={false} onChange={handleChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("applies the disabled state and prevents interaction", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox disabled checked={false} onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-disabled", "true");
    expect(checkbox).toHaveClass("opacity-50");

    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("respects the indeterminate prop", () => {
    render(<Checkbox indeterminate checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("applies solid variant classes correctly when checked", () => {
    render(
      <Checkbox
        checked={true}
        variant="solid"
        colorScheme="error"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveClass(
      "bg-error-600",
      "border-error-600",
    );
  });

  it("applies soft variant classes correctly when checked", () => {
    render(
      <Checkbox
        checked={true}
        variant="soft"
        colorScheme="teal"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveClass(
      "bg-teal-100",
      "border-teal-300",
    );
  });

  it("applies the correct scale classes for the lg size", () => {
    render(<Checkbox size="lg" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveClass("h-6", "w-6");
  });
});
