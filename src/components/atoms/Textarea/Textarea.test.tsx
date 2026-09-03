import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "./Textarea";
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
});
