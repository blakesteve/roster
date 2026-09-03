import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { Input, type InputProps } from "../Input/Input";

export interface PasswordInputProps
  extends Omit<InputProps, "type" | "endIcon"> {
  /**
   * Whether to render the reveal toggle at all. Turn it off where policy
   * forbids showing the value on screen.
   */
  revealable?: boolean;
  /** Starts revealed. Uncontrolled; pair with `onRevealChange` to observe. */
  defaultRevealed?: boolean;
  /** Controls the reveal state. Pass with `onRevealChange` for a controlled field. */
  revealed?: boolean;
  /** Fires whenever the reveal state changes, controlled or not. */
  onRevealChange?: (revealed: boolean) => void;
  /** Accessible label for the toggle while the value is hidden. */
  showLabel?: string;
  /** Accessible label for the toggle while the value is visible. */
  hideLabel?: string;
}

/**
 * A password field with a reveal toggle: the pattern every sign-in form needs
 * and nobody should rewrite.
 *
 * Wraps `Input`, so labels, helper and error text, and every variant behave
 * exactly as they do everywhere else. The toggle is a real button: keyboard
 * reachable, `type="button"` so it never submits the form, and disabled
 * alongside the field.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      revealable = true,
      defaultRevealed = false,
      revealed: revealedProp,
      onRevealChange,
      showLabel = "Show password",
      hideLabel = "Hide password",
      disabled,
      variant,
      error,
      errorMessage,
      className,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultRevealed);
    const isControlled = revealedProp !== undefined;
    const revealed = isControlled ? revealedProp : uncontrolled;

    const toggle = () => {
      const next = !revealed;
      if (!isControlled) setUncontrolled(next);
      onRevealChange?.(next);
    };

    return (
      <Input
        ref={ref}
        // The whole point: swapping the type is what reveals the value.
        type={revealed ? "text" : "password"}
        disabled={disabled}
        variant={variant}
        error={error}
        errorMessage={errorMessage}
        /* Edge renders its own reveal control, which would sit next to ours.
           `className` MUST be destructured out above rather than read off
           `props`: `{...props}` is spread after this line, so leaving it in
           there meant a consumer-supplied className overwrote this composed
           value and silently took the Edge fix with it. */
        className={cn("rst:[&_input::-ms-reveal]:hidden", className)}
        endIcon={
          revealable ? (
            <button
              type="button"
              onClick={toggle}
              disabled={disabled}
              aria-label={revealed ? hideLabel : showLabel}
              aria-pressed={revealed}
              className={cn(
                "rst:-m-1 rst:flex rst:items-center rst:rounded rst:p-1 rst:transition-opacity",
                "rst:opacity-70 rst:hover:opacity-100",
                "rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring",
                disabled && "rst:cursor-not-allowed rst:opacity-40 rst:hover:opacity-40",
              )}
            >
              <FontAwesomeIcon
                icon={revealed ? faEyeSlash : faEye}
                className="rst:h-4 rst:w-4"
                aria-hidden="true"
              />
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
