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
    expect(checkbox).toHaveClass("rst:opacity-50");

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
      "rst:bg-error-600",
      "rst:border-error-600",
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
      "rst:bg-teal-100",
      "rst:border-teal-300",
    );
  });

  it("applies the correct scale classes for the lg size", () => {
    render(<Checkbox size="lg" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveClass("rst:h-6", "rst:w-6");
  });

  describe("touch target", () => {
    /* jsdom computes no layout, so none of this measures 44px — it asserts the
       classes that produce it, for the same reason Input.test.tsx asserts the
       cause rather than the symptom. The measurement was done in a browser:
       44x44, with the box at 16, 20 and 24.

       The classes matter individually and are asserted individually.
       `before:size-11` with no `relative` anchors the pseudo-element to
       whatever ancestor happens to be positioned, and `before:absolute` with
       no `content` renders nothing at all — both fail silently and neither
       changes anything a snapshot would catch. */
    it("extends the hit area to 44x44", () => {
      /* One test rather than one per size: every class that builds the target
         is in the cva's BASE and identical at all three. A parameterized
         version read as three cases and was one assertion billed as three —
         hard-coding `size="sm"` left all three green.

         The classes are asserted individually because they fail independently
         and silently. `before:size-11` without `relative` anchors the
         pseudo-element to whatever ancestor happens to be positioned, and
         `before:absolute` without `content` renders nothing at all. Neither
         changes anything a snapshot would catch. */
      render(<Checkbox checked={false} onChange={() => {}} />);
      expect(screen.getByRole("checkbox")).toHaveClass(
        "rst:relative",
        "rst:before:absolute",
        "rst:before:size-11",
        "rst:before:top-1/2",
        "rst:before:left-1/2",
        "rst:before:-translate-x-1/2",
        "rst:before:-translate-y-1/2",
        "rst:before:content-['']",
      );
    });

    /* The regression the pseudo-element approach exists to prevent, and so the
       one assertion that has to be here. Padding would have reached 44 just as
       well and grown the box the user sees at every size; a pseudo-element
       generates no layout box, so these three numbers can not move. */
    it.each([
      ["sm", "rst:h-4", "rst:w-4"],
      ["md", "rst:h-5", "rst:w-5"],
      ["lg", "rst:h-6", "rst:w-6"],
    ] as const)("keeps the box at its own dimensions at size %s", (size, h, w) => {
      render(<Checkbox size={size} checked={false} onChange={() => {}} />);
      const box = screen.getByRole("checkbox");

      expect(box).toHaveClass(h, w);
      /* Not "has no padding class" — `p-0` would pass that and so would a
         padding applied through `className`. The resolved class list is what
         reaches the browser, so that is what is read.

         `s` and `e` are in the character class for the logical properties.
         Nothing in `src/` uses `ps-*` or `pe-*` today, which is exactly why a
         regex without them would sit here looking thorough: adding `ps-1` to a
         size grew the box and passed. */
      expect(box.className).not.toMatch(/rst:p[xytrblse]?-/);
      expect(box.className).not.toMatch(/rst:-?m[xytrblse]?-/);
    });
  });

  it("draws its unchecked box from the shared control border token", () => {
    /* It was gray-300 / gray-700 — 1.49:1 on white, 1.70:1 on gray-900 — the
       same hairline the 1.4.11 pass raised on the text fields, on a control
       1.4.11 covers at least as squarely. Left alone it would have sat beside
       an `outline` Input with a visibly lighter edge. */
    render(<Checkbox checked={false} onChange={() => {}} />);
    const box = document.querySelector('[class*="border-"]');

    expect(box?.className).toContain("rst:border-[var(--roster-control-border)]");
    expect(box?.className).not.toContain("rst:border-gray-300");
    expect(box?.className).not.toContain("rst:dark:border-gray-700");
  });
});
