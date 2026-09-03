import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "./Input";
import { inputVariants } from "./input-variants";
import { buttonVariants } from "../Button/button-variants";
import { cn } from "../../../lib/utils";
import "@testing-library/jest-dom";

describe("Input Component", () => {
  it("renders label correctly", () => {
    render(<Input label="Test Label" />);
    // Headless UI v2 automatically links the <Label> to the <Input> via the <Field> context
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<Input helperText="Helpful info" />);
    expect(screen.getByText("Helpful info")).toBeInTheDocument();
  });

  it("renders error message and applies error styles", () => {
    render(<Input errorMessage="Invalid input" />);
    expect(screen.getByText("Invalid input")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("rst:border-error-500", "rst:dark:border-error-500");
  });

  it("applies error styles when the boolean error prop is true", () => {
    render(<Input error={true} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("rst:border-error-500", "rst:dark:border-error-500");
  });

  it("renders icons when provided and applies correct icon variants", () => {
    const { container } = render(
      <Input variant="slate" startIcon={<span data-testid="icon">🔍</span>} />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();

    const iconWrapper = container.querySelector(".rst\\:left-3");
    expect(iconWrapper).toHaveClass("rst:text-gray-300", "rst:dark:text-gray-500");
  });

  it("applies variant classes correctly to the input", () => {
    const { rerender } = render(<Input variant="soft" />);
    let input = screen.getByRole("textbox");

    // Checks the soft variant (including dark mode)
    expect(input).toHaveClass("rst:bg-gray-100", "rst:dark:bg-gray-800");

    rerender(<Input variant="slate" />);
    input = screen.getByRole("textbox");

    // Checks our new slate variant (including dark mode)
    expect(input).toHaveClass("rst:bg-gray-700", "rst:dark:bg-gray-900");
  });

  it("disables input when disabled prop is set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  describe("sizing", () => {
    /** The height utility that actually survives, e.g. "rst:h-10".
     *
     * Run through `cn` first. The base carries `h-10` as a floor for a null
     * size, so the raw variant string holds two height utilities and only
     * tailwind-merge decides which one reaches the DOM. Reading the raw string
     * would compare a class the browser never sees. */
    const heightOf = (classes: string) =>
      cn(classes)
        .split(/\s+/)
        .find((c) => /^rst:h-\d+$/.test(c));

    it.each(["sm", "default", "lg"] as const)(
      "is the same height as Button at size %s",
      (size) => {
        const input = heightOf(inputVariants({ size }));
        const button = heightOf(buttonVariants({ size }));

        /* Asserted rather than assumed: if either component stops emitting a
           height utility, both lookups return undefined and a plain equality
           check would pass on nothing. */
        expect(input).toBeDefined();
        expect(button).toBeDefined();
        expect(input).toBe(button);
      },
    );

    it("defaults to the same height as a default Button", () => {
      /* The bug this closes: Input was a fixed 42px from py-2.5, Button is 40px
         at default and 44px at lg, so there was no size at which a field and a
         submit button lined up. */
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveClass("rst:h-10");
    });

    it.each([
      ["sm", "rst:h-9"],
      ["default", "rst:h-10"],
      ["lg", "rst:h-11"],
    ] as const)("renders size %s as %s", (size, height) => {
      /* Through the component, not the variant function. `defaultVariants`
         pins size to "default", so dropping the prop on the way to
         `inputVariants` still produced a correct-looking h-10 and every other
         test passed. This is the one that fails when the prop stops arriving. */
      render(<Input size={size} />);
      expect(screen.getByRole("textbox")).toHaveClass(height);
    });

    it("still has geometry when size is explicitly null", () => {
      /* `VariantProps` admits null, so `size={fieldSize ?? null}` typechecks
         and `defaultVariants` cannot catch it. Because padding moved out of the
         base and into the size scale, a null size briefly produced a field with
         no height and no horizontal padding — text flush against the border.
         The base carries both as floors now. */
      render(<Input size={null} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("rst:h-10");
      expect(input).toHaveClass("rst:px-4");
    });

    it("moves the icon inset in with the padding at sm", () => {
      /* sm is px-3 rather than px-4, so an icon needs one step less clearance
         or the text sits too far from it. */
      const { rerender } = render(<Input size="sm" startIcon={<span>i</span>} />);
      expect(screen.getByRole("textbox")).toHaveClass("rst:pl-9");

      rerender(<Input size="lg" startIcon={<span>i</span>} />);
      expect(screen.getByRole("textbox")).toHaveClass("rst:pl-10");
    });
  });

  describe("the field's box ends where the control ends", () => {
    it("puts no space-y on the wrapper", () => {
      /* Measured in Storybook: with `space-y-1.5` on the Field, a Button in an
         `items-end` row sat exactly 6px below the input at every size, while
         both were the correct height.

         Cause: Headless UI's Field appends a hidden zero-height <span> after
         the control, and Tailwind v4 applies space-y as `margin-block-end` on
         `:not(:last-child)`. The input's wrapper stopped being the last child,
         took a 6px bottom margin, and the Field's box ended below the control.
         `items-end` then aligned to that phantom edge.

         jsdom computes no layout, so this asserts the cause rather than the
         symptom. Spacing lives on the label and the description instead. */
      const { container } = render(<Input label="L" helperText="H" />);
      const field = container.firstElementChild!;
      expect(field.className).not.toMatch(/space-y/);
    });

    it("keeps the label and description spacing it always had", () => {
      /* Both gaps measured 6px before and after. The description carries its
         own margin now rather than leaning on the wrapper's space-y. */
      render(<Input label="L" helperText="H" />);
      expect(screen.getByText("L")).toHaveClass("rst:mb-1.5");
      expect(screen.getByText("H")).toHaveClass("rst:mt-1.5");
    });
  });

  describe("reaching the input from outside", () => {
    it("puts className on the wrapper and inputClassName on the control", () => {
      /* `className` has always landed on the outer Field, which is right for
         layout and left the control unreachable. Both are asserted together so
         neither can quietly start going to the other place. */
      const { container } = render(
        <Input className="wrapper-only" inputClassName="control-only" />,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("control-only");
      expect(input).not.toHaveClass("wrapper-only");

      const field = container.firstElementChild;
      expect(field).toHaveClass("wrapper-only");
      expect(field).not.toHaveClass("control-only");
    });

    it("lets inputClassName win over the variant it overrides", () => {
      /* Asserted as absence, not as order. CSS ignores class-attribute order
         entirely; this works because `cn` is tailwind-merge and it DELETES the
         conflicting variant class. The previous version compared indexOf
         positions, which passes on -1 and would keep passing if merge ever
         degraded to plain concatenation — the exact failure `lib/utils.ts`
         warns about, asserted in a way that could not see it. */
      render(<Input inputClassName="rst:h-20" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("rst:h-20");
      expect(input).not.toHaveClass("rst:h-10");
    });
  });

  describe("theming the outline variant", () => {
    it("reads its border and background from tokens rather than hardcoding them", () => {
      /* Button's colors resolve through --roster-*, so remapping a palette
         carries. These did not, which is why retrospect could not give a field
         its gold hairline without abandoning the component. */
      render(<Input variant="outline" />);
      const input = screen.getByRole("textbox");

      expect(input).toHaveClass(
        "rst:border-[var(--roster-control-border)]",
        "rst:bg-[var(--roster-control-bg)]",
        "rst:text-[var(--roster-control-text)]",
        "rst:focus-visible:border-[var(--roster-control-border-focus)]",
      );
      expect(input).not.toHaveClass("rst:border-gray-300");
    });

    it("leaves the opinionated variants alone", () => {
      /* white, soft, slate and ghost each name a specific surface. A token that
         meant something different in each would not be a token. */
      render(<Input variant="soft" />);
      expect(screen.getByRole("textbox")).toHaveClass("rst:bg-gray-100");
    });
  });
});
