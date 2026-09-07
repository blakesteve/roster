import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Chip } from "./Chip";
import "@testing-library/jest-dom";

describe("Chip", () => {
  it("is a plain span when it does nothing", () => {
    /* A chip with no handlers is decoration, and decoration must not be a tab
       stop announcing itself as a control. That case is what `Pill` is for. */
    render(<Chip>Static</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Static").tagName).toBe("SPAN");
  });

  describe("removable", () => {
    it("names the dismiss control after the thing it removes", () => {
      /* Eight chips in a row all named "Remove" is a list a screen reader user
         cannot navigate, so a string label is used to build a real name. */
      render(<Chip onRemove={() => {}}>Baseball</Chip>);
      expect(
        screen.getByRole("button", { name: "Remove Baseball" }),
      ).toBeInTheDocument();
    });

    it("falls back when the label is not plain text, and takes an override", () => {
      render(
        <Chip onRemove={() => {}}>
          <span>Rich</span>
        </Chip>,
      );
      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();

      cleanup();
      render(
        <Chip onRemove={() => {}} removeLabel="Clear the era filter">
          <span>Rich</span>
        </Chip>,
      );
      expect(
        screen.getByRole("button", { name: "Clear the era filter" }),
      ).toBeInTheDocument();
    });

    it("fires onRemove, and the chip body is not itself a control", () => {
      const onRemove = vi.fn();
      render(<Chip onRemove={onRemove}>Baseball</Chip>);

      expect(screen.getAllByRole("button")).toHaveLength(1);
      fireEvent.click(screen.getByRole("button"));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("selectable", () => {
    it("is a toggle button that reports its pressed state", () => {
      const onSelectedChange = vi.fn();
      render(
        <Chip selected onSelectedChange={onSelectedChange}>
          Fishing
        </Chip>,
      );
      const chip = screen.getByRole("button", { name: "Fishing" });

      expect(chip).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(chip);
      expect(onSelectedChange).toHaveBeenCalledWith(false);
    });

    it("reports not-pressed rather than omitting the state", () => {
      /* `aria-pressed` absent means "not a toggle"; absent-when-false would
         make an unselected filter announce as a plain button. */
      render(<Chip onSelectedChange={() => {}}>Fishing</Chip>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("both at once", () => {
    it("renders two sibling buttons, not a button inside a button", () => {
      /* A button inside a button is invalid HTML and browsers resolve it by
         dropping one, which silently loses either the toggle or the dismiss.
         Two siblings in a styled wrapper is the only structure that gives both
         a name, a focus ring and a tab stop. */
      const onRemove = vi.fn();
      const onSelectedChange = vi.fn();
      render(
        <Chip selected={false} onSelectedChange={onSelectedChange} onRemove={onRemove}>
          Outdoors
        </Chip>,
      );

      const body = screen.getByRole("button", { name: "Outdoors" });
      const dismiss = screen.getByRole("button", { name: "Remove Outdoors" });
      expect(body.contains(dismiss)).toBe(false);
      expect(dismiss.contains(body)).toBe(false);

      fireEvent.click(body);
      expect(onSelectedChange).toHaveBeenCalledWith(true);
      fireEvent.click(dismiss);
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores selected when there is no handler to make it real", () => {
    /* A chip that reports a pressed state and cannot be pressed is worse than
       one that reports nothing, so `selected` alone is deliberately inert.
       Pinned because the silent version of this is a consumer marking a
       removable chip selected and seeing nothing happen. */
    render(
      <Chip selected onRemove={() => {}}>
        Baseball
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove Baseball" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
  });

  it("keeps a consumer onClick working instead of replacing it", () => {
    /* Spread last, a consumer's `onClick` overwrote the toggle and the chip
       silently stopped selecting. Both run now. */
    const onClick = vi.fn();
    const onSelectedChange = vi.fn();
    render(
      <Chip selected={false} onSelectedChange={onSelectedChange} onClick={onClick}>
        Fishing
      </Chip>,
    );
    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it("keeps the state it owns when a consumer passes the same prop", () => {
    /* Spread last, a consumer's `aria-pressed` or `type` replaced the
       component's own. Spread first, the component wins for everything it
       sets. `role` is deliberately NOT in that set — a consumer overriding it
       is a real escape hatch, and one they own the consequences of. */
    render(
      <Chip selected onSelectedChange={() => {}} aria-pressed={false}>
        Fishing
      </Chip>,
    );
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("aria-pressed", "true");
    /* `type` cannot even be passed: `ChipProps` is span-typed, so the build's
       stricter pass rejects button-only props. That is a real limit of the
       current signature, noted rather than worked around. */
    expect(chip).toHaveAttribute("type", "button");
  });

  it("forwards a ref in every shape it renders", () => {
    /* The selectable-only branch never attached it, so `ref.current` was null
       for the most common interactive chip and a consumer measuring or
       focusing it got nothing, with no type error to warn them. */
    const selectableRef = React.createRef<HTMLElement>();
    const removableRef = React.createRef<HTMLElement>();
    render(
      <>
        <Chip ref={selectableRef} selected onSelectedChange={() => {}}>
          A
        </Chip>
        <Chip ref={removableRef} onRemove={() => {}}>
          B
        </Chip>
      </>,
    );
    expect(selectableRef.current?.tagName).toBe("BUTTON");
    expect(removableRef.current?.tagName).toBe("SPAN");
  });

  it("hides a leading icon from the accessible name", () => {
    /* An Avatar or an `<img alt>` would otherwise join the toggle's name and
       not the dismiss button's, so the two halves of one chip disagree about
       what the chip is called. */
    render(
      <Chip onRemove={() => {}} leadingIcon={<img alt="Ada Lovelace" src="a.png" />}>
        Fishing
      </Chip>,
    );
    /* The image is still in the DOM — it is hidden from the accessibility
       tree, not deleted — so the assertion is on the wrapper's `aria-hidden`
       and on the name the dismiss button ends up with. */
    expect(screen.getByAltText("Ada Lovelace").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Remove Fishing" }),
    ).toBeInTheDocument();
  });

  it("disables both controls together", () => {
    render(
      <Chip disabled selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
        Outdoors
      </Chip>,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("shows a pointer on every control, and on nothing else", () => {
    /* Tailwind v4's preflight dropped the UA `cursor: pointer` on buttons, so
       a control that does not say it renders an arrow and reads as inert. The
       second half matters as much: a pointer over a chip that does nothing
       when clicked promises an interaction that is not there. */
    const { rerender } = render(
      <Chip selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
        Outdoors
      </Chip>,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("rst:cursor-pointer");
    }

    rerender(<Chip>Static</Chip>);
    expect(screen.getByText("Static").className).not.toContain("rst:cursor-pointer");
  });

  it("refuses visibly when disabled rather than going inert", () => {
    /* `pointer-events-none` would hide the cursor entirely, so there would be
       nothing to see: a disabled chip and a broken one would look identical.
       The buttons need their own `disabled:` rule because a button sets its
       own cursor and the shell's never reaches it. */
    render(
      <Chip disabled selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
        Outdoors
      </Chip>,
    );
    const shell = screen.getByText("Outdoors").closest("span[class*='cursor']");

    expect(shell?.className).toContain("rst:cursor-not-allowed");
    expect(shell?.className).not.toContain("rst:pointer-events-none");
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("rst:disabled:cursor-not-allowed");
    }
  });

  it("carries a focus ring on every control it renders", () => {
    /* 4.6.0 gave every control a visible ring; a new one arriving without it
       would be a step back on the newest component in the library. */
    render(
      <Chip selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
        Outdoors
      </Chip>,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("rst:focus-visible:ring-2");
      expect(button.className).toContain("rst:focus-visible:ring-ring");
    }
  });
});
