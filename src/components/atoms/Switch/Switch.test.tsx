import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Switch } from "./Switch";

describe("Switch Component", () => {
  it("renders correctly with a label", () => {
    render(
      <Switch
        checked={false}
        onChange={vi.fn()}
        label="Enable Notifications"
      />,
    );

    expect(screen.getByText("Enable Notifications")).toBeInTheDocument();

    const switchElement = screen.getByRole("switch", {
      name: /enable notifications/i,
    });
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute("aria-checked", "false");
  });

  it("renders a description when provided", () => {
    render(
      <Switch
        checked={false}
        onChange={vi.fn()}
        label="Airplane Mode"
        description="Disables all wireless connections."
      />,
    );

    expect(
      screen.getByText("Disables all wireless connections."),
    ).toBeInTheDocument();
  });

  it("calls onChange with the toggled value when clicked", () => {
    const handleChange = vi.fn();
    render(
      <Switch checked={false} onChange={handleChange} label="Dark Mode" />,
    );

    const switchElement = screen.getByRole("switch", { name: /dark mode/i });

    fireEvent.click(switchElement);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("reflects the checked state accurately", () => {
    const { rerender } = render(
      <Switch checked={true} onChange={vi.fn()} label="Feature Toggle" />,
    );

    const switchElement = screen.getByRole("switch", {
      name: /feature toggle/i,
    });
    expect(switchElement).toHaveAttribute("aria-checked", "true");

    rerender(
      <Switch checked={false} onChange={vi.fn()} label="Feature Toggle" />,
    );
    expect(switchElement).toHaveAttribute("aria-checked", "false");
  });

  it("does not trigger onChange when disabled is true", () => {
    const handleChange = vi.fn();
    render(
      <Switch
        checked={false}
        onChange={handleChange}
        label="Locked Setting"
        disabled={true}
      />,
    );

    const switchElement = screen.getByRole("switch", {
      name: /locked setting/i,
    });

    expect(switchElement).toBeDisabled();

    fireEvent.click(switchElement);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("uses ariaLabel for screen readers when no visible label is provided", () => {
    render(
      <Switch
        checked={false}
        onChange={vi.fn()}
        ariaLabel="Hidden accessibility label"
      />,
    );

    const switchElement = screen.getByRole("switch", {
      name: /hidden accessibility label/i,
    });
    expect(switchElement).toBeInTheDocument();
  });
});
