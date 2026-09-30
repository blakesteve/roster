import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  describe("the label", () => {
    it("toggles the switch when clicked, once", () => {
      const onChange = vi.fn();
      render(<Switch checked={false} onChange={onChange} label="Show seconds" />);
      fireEvent.click(screen.getByText("Show seconds"));
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("is a real label for the switch", () => {
      render(<Switch checked={false} onChange={vi.fn()} label="Show seconds" />);
      const label = screen.getByText("Show seconds");
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveAttribute("for", screen.getByRole("switch").id);
    });

    it("shows a pointer over a label that toggles, and only then", () => {
      const { rerender } = render(<Switch checked={false} onChange={vi.fn()} label="Show seconds" />);
      expect(screen.getByText("Show seconds")).toHaveClass("rst:cursor-pointer");
      rerender(<Switch checked={false} onChange={vi.fn()} label="Show seconds" labelClickable={false} />);
      expect(screen.getByText("Show seconds").className).not.toMatch(/cursor-pointer/);
      rerender(<Switch checked={false} onChange={vi.fn()} label="Show seconds" disabled />);
      expect(screen.getByText("Show seconds").className).not.toMatch(/cursor-pointer/);
    });

    it("does not toggle a disabled switch", () => {
      const onChange = vi.fn();
      render(<Switch checked={false} onChange={onChange} label="Show seconds" disabled />);
      fireEvent.click(screen.getByText("Show seconds"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("can opt out with labelClickable={false}", () => {
      const onChange = vi.fn();
      render(
        <Switch checked={false} onChange={onChange} label="Show seconds" labelClickable={false} />,
      );
      const label = screen.getByText("Show seconds");
      fireEvent.click(label);
      expect(onChange).not.toHaveBeenCalled();
      expect(label).not.toHaveAttribute("for");
      // Still the switch's name.
      expect(screen.getByRole("switch", { name: "Show seconds" })).toBeInTheDocument();
    });

    it("double-toggles a row with its own handler, unless opted out", () => {
      /* The case the opt-out exists for. One click on the label reaches a
         row's own handler TWICE (the label's click bubbling, then the click
         Headless UI forwards to the switch, bubbling too) and the switch's
         onChange once. A row that toggles in its handler and ignores
         onChange, as Navbar's theme row does, flips twice and lands where it
         started. Pinned both ways, so the hazard is on record. */
      const toggles = vi.fn();
      const row = (labelClickable: boolean) => (
        <div onClick={toggles}>
          <Switch checked={false} onChange={toggles} label="Show seconds" labelClickable={labelClickable} />
        </div>
      );
      const { rerender } = render(row(true));
      fireEvent.click(screen.getByText("Show seconds"));
      expect(toggles).toHaveBeenCalledTimes(3);

      toggles.mockClear();
      rerender(row(false));
      fireEvent.click(screen.getByText("Show seconds"));
      expect(toggles).toHaveBeenCalledTimes(1);
    });
  });

  describe("the 44px target", () => {
    const TARGET = [
      "rst:relative",
      "rst:before:absolute",
      "rst:before:top-1/2",
      "rst:before:left-1/2",
      "rst:before:size-11",
      "rst:before:-translate-x-1/2",
      "rst:before:-translate-y-1/2",
      "rst:before:content-['']",
    ];

    it.each(["xs", "sm", "md", "lg"] as const)(
      "is 44x44 and centered at size %s",
      (size) => {
        render(<Switch checked={false} onChange={vi.fn()} ariaLabel="Toggle" size={size} />);
        expect(screen.getByRole("switch")).toHaveClass(...TARGET);
      },
    );

    it("is centered, never inset, because the track's border would take 4px off", () => {
      /* An absolutely positioned pseudo-element resolves `inset` against the
         padding box, inside the track's `border-2`. Checkbox measured 42x42
         from an inset that read as 44 in source. */
      render(<Switch checked={false} onChange={vi.fn()} ariaLabel="Toggle" />);
      const classes = screen.getByRole("switch").className;
      expect(classes).not.toMatch(/before:-?inset/);
      expect(screen.getByRole("switch")).toHaveClass("rst:border-2");
    });
  });

  it("wires the description as the switch's accessible description", () => {
    render(
      <Switch checked={false} onChange={vi.fn()} label="Airplane Mode" description="Turns off every radio." />,
    );
    expect(screen.getByRole("switch", { name: "Airplane Mode" })).toHaveAccessibleDescription(
      "Turns off every radio.",
    );
  });

  it("falls back to a generic name with neither label nor ariaLabel", () => {
    render(<Switch checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Toggle setting" })).toBeInTheDocument();
  });

  it("toggles with Space from the keyboard", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Show seconds" />);
    screen.getByRole("switch").focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
