import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { chipVariants } from "./chip-variants";

export interface ChipProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "onSelect">,
    Omit<VariantProps<typeof chipVariants>, "disabled"> {
  children: React.ReactNode;
  /** Leading icon or avatar. */
  leadingIcon?: React.ReactNode;
  /**
   * Presence makes the chip removable, adding a dismiss control.
   *
   * This is what Multi-select consumes for its selected values, and the reason
   * Chip exists as a component rather than a prop on Badge.
   */
  onRemove?: () => void;
  /**
   * Accessible name for the dismiss control.
   *
   * Defaults to `Remove {children}` when `children` is a string, because eight
   * chips in a row all named "Remove" is a list a screen reader user cannot
   * navigate. Pass this explicitly whenever the label is not plain text.
   */
  removeLabel?: string;
  /** Presence makes the body of the chip a toggle. */
  onSelectedChange?: (selected: boolean) => void;
  /**
   * Pressed state for a selectable chip.
   *
   * Requires `onSelectedChange`. On its own it does nothing at all — the chip
   * stays a plain span with no `aria-pressed` — because a chip that reports a
   * pressed state and cannot be pressed is worse than one that reports
   * nothing. Chip never styles this itself either; color is the consumer's
   * call, as in the `Selectable` story.
   */
  selected?: boolean;
  disabled?: boolean;
}

/**
 * Everything that makes an element read as a control, applied to each button
 * Chip renders and to none of the spans.
 *
 * `cursor-pointer` is in here rather than in the variants, because the variants
 * are shared with the non-interactive case — a chip with no handlers is a
 * `<span>`, and a pointer cursor over something that does nothing when clicked
 * is a lie. Tailwind v4's preflight dropped the UA default `cursor: pointer`
 * on buttons, so every control in this library states it: `Button` does, and
 * these do now.
 *
 * `disabled:cursor-not-allowed` is here rather than only on the shell because
 * a button sets its own cursor, so the shell's would never reach it. Pointer
 * events stay live on a disabled chip so the refusal is visible at all; the
 * native `disabled` attribute is what actually stops the click.
 */
const CONTROL =
  "rst:cursor-pointer rst:disabled:cursor-not-allowed rst:rounded-full rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:ring-offset-background rst:focus-visible:ring-offset-2";

/**
 * A chip: a label that does something. Removable, selectable, or both.
 *
 * The element it renders depends on what it can do, because that is what
 * decides how it is announced and whether it can be reached:
 *
 * - neither  -> `<span>`, and you probably wanted `Pill`
 * - select   -> the whole chip is a `<button aria-pressed>`
 * - remove   -> a `<span>` wrapping the label and a dismiss `<button>`
 * - both     -> a `<span>` wrapping TWO sibling buttons
 *
 * The last case is why the body is not simply made clickable when a dismiss
 * button is present: a button inside a button is invalid HTML, and browsers
 * resolve it by dropping one of them. Two siblings in a styled wrapper is the
 * only structure that gives both actions a name, a focus ring and a tab stop.
 */
const Chip = React.forwardRef<HTMLElement, ChipProps>(
  (
    {
      className,
      colorScheme,
      variant,
      size,
      leadingIcon,
      onRemove,
      removeLabel,
      onSelectedChange,
      selected,
      disabled = false,
      children,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const selectable = !!onSelectedChange;
    const removable = !!onRemove;
    const shell = cn(
      chipVariants({ colorScheme, variant, size, disabled }),
      className,
    );

    const label = (
      <>
        {leadingIcon && (
          /* `aria-hidden`, like Pill's leading slot. Without it a
             non-decorative icon — an Avatar, an `<img alt>` — joins the
             toggle's accessible name and not the dismiss button's, so the two
             halves of one chip disagree about what the chip is called and a
             filter list stops being navigable by name. */
          <span
            aria-hidden="true"
            className="rst:flex rst:shrink-0 rst:items-center rst:justify-center"
          >
            {leadingIcon}
          </span>
        )}
        {children}
      </>
    );

    const dismiss = removable && (
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={
          removeLabel ??
          (typeof children === "string" ? `Remove ${children}` : "Remove")
        }
        className={cn(
          "rst:-mr-1 rst:flex rst:shrink-0 rst:items-center rst:justify-center rst:opacity-70 rst:hover:opacity-100 rst:disabled:hover:opacity-70",
          CONTROL,
        )}
      >
        <FontAwesomeIcon icon={faXmark} className="rst:h-3 rst:w-3" aria-hidden="true" />
      </button>
    );

    /* Selectable and removable: two sibling buttons in a non-interactive
       wrapper. The wrapper carries the chip's shape so the pair reads as one
       object. */
    if (selectable && removable) {
      return (
        <span
          {...rest}
          onClick={onClick}
          ref={ref as React.Ref<HTMLSpanElement>}
          className={shell}
        >
          <button
            type="button"
            disabled={disabled}
            aria-pressed={!!selected}
            onClick={() => onSelectedChange(!selected)}
            className={cn("rst:inline-flex rst:items-center rst:gap-1.5", CONTROL)}
          >
            {label}
          </button>
          {dismiss}
        </span>
      );
    }

    if (selectable) {
      /* `...rest` FIRST, then everything this component owns.
      
         Spread last, a consumer's `onClick` replaced the toggle outright and
         the chip silently stopped selecting — and `role`, `aria-pressed` and
         `tabIndex` went the same way, so `role="switch"` produced a switch
         still reporting `aria-pressed`, which is announced wrong. It also made
         identical props behave differently depending on which capability flags
         were set, because the other two branches spread onto a wrapper where a
         consumer `onClick` merely coexists.
      
         `onClick` is composed rather than dropped: a consumer who wants to
         know about the click still hears about it, and the toggle still
         happens. */
      return (
        <button
          {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          disabled={disabled}
          aria-pressed={!!selected}
          onClick={(event) => {
            onClick?.(event as React.MouseEvent<HTMLSpanElement>);
            onSelectedChange(!selected);
          }}
          className={cn(shell, CONTROL)}
        >
          {label}
        </button>
      );
    }

    return (
      <span
        {...rest}
        onClick={onClick}
        ref={ref as React.Ref<HTMLSpanElement>}
        className={shell}
      >
        {label}
        {dismiss}
      </span>
    );
  },
);

Chip.displayName = "Chip";

export { Chip };
