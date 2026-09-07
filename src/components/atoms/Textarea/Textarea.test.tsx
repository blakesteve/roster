import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "./Textarea";
import { Input } from "../Input/Input";
import "@testing-library/jest-dom";

describe("Textarea Component", () => {
  // 1. Basic Rendering
  it("renders label correctly", () => {
    // Headless UI handles the htmlFor/id wire-up automatically
    render(<Textarea label="Bio" />);
    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
  });

  // 2. Helper Text & Dark Mode Typography
  it("renders helper text with correct light and dark mode styles", () => {
    render(<Textarea helperText="Max 500 chars" />);
    const helperText = screen.getByText("Max 500 chars");

    expect(helperText).toBeInTheDocument();
    // Verify standard helper text colors
    expect(helperText).toHaveClass("rst:text-gray-500", "rst:dark:text-gray-400");
  });

  // 3. Error State & Dark Mode Integration
  it("renders error message and applies light/dark error styles", () => {
    render(<Textarea errorMessage="Field required" />);
    const errorMsg = screen.getByText("Field required");

    expect(errorMsg).toBeInTheDocument();
    // Verify error text colors
    expect(errorMsg).toHaveClass(
      "rst:text-error-600",
      "rst:dark:text-error-400",
      "rst:font-medium",
    );

    // Check if error border classes are applied to the textarea
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("rst:border-error-500", "rst:dark:border-error-500");
  });

  // 4. Prop Priority
  it("displays errorMessage instead of helperText when both are provided", () => {
    render(
      <Textarea helperText="Helpful info" errorMessage="Critical error" />,
    );

    expect(screen.getByText("Critical error")).toBeInTheDocument();
    // The helper text should not render if there's an active error
    expect(screen.queryByText("Helpful info")).not.toBeInTheDocument();
  });

  // 5. Variant Testing
  it("applies the 'white' variant classes correctly", () => {
    render(<Textarea variant="white" />);
    const textarea = screen.getByRole("textbox");

    // Verify the specific light and dark mode combo for the white variant
    expect(textarea).toHaveClass(
      "rst:bg-white",
      "rst:dark:bg-gray-900",
      "rst:dark:border-gray-800",
    );
  });

  // 6. Resize Controls
  it("applies resize classes based on props", () => {
    const { rerender } = render(<Textarea resize="none" />);
    let textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("rst:resize-none");

    // Default behavior test
    rerender(<Textarea />);
    textarea = screen.getByRole("textbox");
    // Our CVA default is 'vertical', which maps to 'resize-y'
    expect(textarea).toHaveClass("rst:resize-y");
  });

  // 7. Disabled State
  it("disables input when disabled prop is set", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

describe("Textarea spacing and escape hatch", () => {
  it("does not space its Field with space-y", () => {
    /* The bug this guards is invisible and has now shipped twice in this
       codebase. Headless UI's Field always renders a trailing hidden element,
       and Tailwind v4 applies `space-y-*` as `margin-block-end` on
       `:not(:last-child)` — so the control stopped being the last child and
       took a stray 6px bottom margin against a sibling nobody can see. In a
       flex or grid parent the Field's box really does end 6px below the
       control, and an `items-end` row aligns its neighbours to that phantom
       edge. Input carried the same bug and the same fix; this is the assertion
       Textarea shipped without. */
    const { container } = render(<Textarea />);
    expect(container.firstElementChild!.className).not.toMatch(/space-y/);
  });

  it("spaces the label and description explicitly instead", () => {
    /* The other half: without these, removing space-y just deletes the gap.
       Negative assertions alone would pass on a Field with no spacing at all. */
    render(<Textarea label="Bio" helperText="Keep it short" />);
    expect(screen.getByText("Bio")).toHaveClass("rst:mb-1.5");
    expect(screen.getByText("Keep it short")).toHaveClass("rst:mt-1.5");
  });

  it("sends className to the wrapper and textareaClassName to the control", () => {
    /* `<Textarea className="rst:h-40" />` sized the wrapper and left the
       control alone, with no way to reach it. Three game-verdict sites are
       working around this with inline `style` and comments explaining it.
       Both directions asserted so neither can quietly start going to the
       other place. */
    const { container } = render(
      <Textarea className="rst:max-w-xs" textareaClassName="rst:font-mono" />,
    );
    const wrapper = container.firstElementChild!;
    const control = screen.getByRole("textbox");

    expect(wrapper).toHaveClass("rst:max-w-xs");
    expect(wrapper).not.toHaveClass("rst:font-mono");
    expect(control).toHaveClass("rst:font-mono");
    expect(control).not.toHaveClass("rst:max-w-xs");
  });

  it("lets textareaClassName beat the variant's own resize rule", () => {
    /* Absence, not ordering: `cn` is tailwind-merge and DELETES the loser, so
       if it ever degraded to concatenation both classes would be present and an
       ordering assertion would still pass. */
    render(<Textarea resize="none" textareaClassName="rst:resize-y" />);
    const control = screen.getByRole("textbox");
    expect(control).toHaveClass("rst:resize-y");
    expect(control).not.toHaveClass("rst:resize-none");
  });

  describe("theming the outline variant", () => {
    it("reads its surface from the same tokens Input and Select read", () => {
      /* 4.8.0 migrated `Input` and `Select` and skipped this one, so a form
         holding both showed two different fields: different border in light,
         and in dark a transparent Input beside a gray-950 Textarea, which on a
         gray-800 Dialog was a near-black box. */
      render(<Textarea />);
      const textarea = screen.getByRole("textbox");

      expect(textarea).toHaveClass(
        "rst:border-[var(--roster-control-border)]",
        "rst:bg-[var(--roster-control-bg)]",
        "rst:text-[var(--roster-control-text)]",
        "rst:focus-visible:border-[var(--roster-control-border-focus)]",
      );
      expect(textarea).not.toHaveClass("rst:border-gray-300");
      /* The fill is the one that mattered: hardcoded, it punched a hole in
         whatever surface it was drawn on. */
      expect(textarea).not.toHaveClass("rst:bg-white");
      expect(textarea).not.toHaveClass("rst:dark:bg-gray-950");
    });

    it("agrees with Input class for class on the tokens", () => {
      /* The parity is the point, and asserting it here means the next variant
         change to one of them fails loudly rather than drifting quietly. */
      render(
        <>
          <Textarea aria-label="ta" />
          <Input variant="outline" aria-label="in" />
        </>,
      );
      const tokenClasses = (el: HTMLElement) =>
        el.className
          .split(/\s+/)
          .filter((c) => c.includes("--roster-control-"))
          .sort();

      expect(tokenClasses(screen.getByLabelText("ta"))).toEqual(
        tokenClasses(screen.getByLabelText("in")),
      );
    });

    it("draws its label from the surface token, with a working default", () => {
      /* Two failures, one line. Hardcoded gray-900 / dark:gray-100 tracks the
         PAGE, so inside an inverting panel it was gray-900 on gray-700 —
         1.70:1, found by eye in the `FieldsOnAnInvertedPanel` story. Plain
         `text-inherit` fixed that and broke every dark page instead, falling
         to the UA default black because Roster sets no body color: 1.06:1 on
         gray-950. The token has the right default AND follows the surface. */
      render(<Textarea label="Name" />);
      const label = screen.getByText("Name");

      expect(label).toHaveClass("rst:text-[var(--roster-control-text)]");
      expect(label).not.toHaveClass("rst:text-gray-900");
      expect(label).not.toHaveClass("rst:text-inherit");
    });

    it("gives soft the border token, and only the border", () => {
      render(<Textarea variant="soft" />);
      const textarea = screen.getByRole("textbox");

      expect(textarea).toHaveClass("rst:border-[var(--roster-control-border)]");
      expect(textarea).not.toHaveClass("rst:border-transparent");
    });

    it("does not restate the placeholder color the base already sets", () => {
      /* Input's `outline` carries `dark:placeholder:text-gray-500` because
         Input's base sets no placeholder rule. This base sets gray-400, so
         copying that line across darkened the placeholder to 3.30:1 — under
         the 4.5:1 placeholder text needs. Caught in review, not by eye. */
      render(<Textarea />);
      expect(screen.getByRole("textbox")).not.toHaveClass(
        "rst:dark:placeholder:text-gray-500",
      );
    });

    it("leaves the opinionated variants alone", () => {
      /* `soft`, `ghost` and `white` each name a surface, same call as Input. */
      render(<Textarea variant="soft" />);
      expect(screen.getByRole("textbox")).not.toHaveClass(
        "rst:bg-[var(--roster-control-bg)]",
      );
    });
  });
});
