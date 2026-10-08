import React from "react";
import { type VariantProps } from "class-variance-authority";
import { Button as HeadlessButton } from "@headlessui/react";
import { cn } from "../../../lib/utils";
import { Spinner } from "../Spinner/Spinner";

import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Shows a spinner and ignores presses while something the button started is
   * in flight. Unlike `disabled`, it keeps the button focusable: a native
   * `disabled` drops focus to the page the moment it lands, so a keyboard or
   * screen reader user who just pressed Save is thrown back to the top. A
   * loading button stays where it is, says it's busy (`aria-busy`) and
   * unavailable (`aria-disabled`), and swallows clicks, Enter and Space, which
   * also stops a submit button sending its form twice.
   */
  isLoading?: boolean;
  /** What a screen reader hears for the spinner while loading: "loading" by default. */
  loadingLabel?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /**
   * Which surface the button sits on.
   *
   * Roster's dark styling keys off an ancestor carrying `.dark`, so a button
   * placed on a hard-coded dark panel that never carries that class (a
   * campfire overlay, a lantern-night backdrop) falls back to the LIGHT
   * styles and flashes a near-white hover. Pass `surface="dark"` to force the
   * dark treatment regardless of the app's theme.
   */
  surface?: "auto" | "dark";
}

/* The handlers a press runs through, capture phase included. Not enter,
   leave or move, which a tooltip needs whether the button is busy or not. */
const PRESS = /^on(?:Click|DoubleClick|AuxClick|(?:Pointer|Mouse)(?:Down|Up)|Key(?:Down|Up|Press)|Touch(?:Start|End))(?:Capture)?$/;

/**
 * A loading button's props without the app's press handlers, plus a click
 * handler that cancels the press. Canceling the click is what stops a submit
 * button sending its form; the keys are covered because Enter and Space on a
 * button arrive as that same click.
 *
 * Headless UI already cancels presses on an `aria-disabled` element, but by
 * swapping every key handler for one that cancels the key, Tab included. An
 * app's own `onKeyDown` would then trap focus on a loading button, so the
 * app's handlers are dropped here instead and the keys left alone.
 */
function withoutPresses(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) if (!PRESS.test(key)) rest[key] = value;
  return { ...rest, onClick: (e: React.MouseEvent) => e.preventDefault() };
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      colorScheme,
      variant,
      size,
      isLoading = false,
      loadingLabel,
      startIcon,
      endIcon,
      surface = "auto",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    /* `disabled` wins: a disabled button that's also loading is disabled. */
    const busy = isLoading && !disabled;
    const pressProps = busy ? withoutPresses(props) : props;

    return (
      <HeadlessButton
        className={cn(
          buttonVariants({ colorScheme, variant, size }),
          // Roster's dark variant is `&:where(.dark, .dark *)`, so an element
          // carrying `.dark` itself satisfies it. That is all forcing the
          // dark surface requires.
          surface === "dark" && "dark",
          busy && "rst:cursor-progress",
          className,
        )}
        ref={ref}
        disabled={disabled}
        {...pressProps}
        aria-disabled={busy ? true : props["aria-disabled"]}
        aria-busy={busy ? true : props["aria-busy"]}
      >
        {isLoading && (
          <span className="rst:mr-2 rst:flex rst:shrink-0 rst:items-center">
            <Spinner size="sm" variant="current" label={loadingLabel} />
          </span>
        )}

        {!isLoading && startIcon && (
          <span className="rst:mr-2 rst:inline-flex rst:shrink-0 rst:items-center">
            {startIcon}
          </span>
        )}

        {children}

        {!isLoading && endIcon && (
          <span className="rst:ml-2 rst:inline-flex rst:shrink-0 rst:items-center">
            {endIcon}
          </span>
        )}
      </HeadlessButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
