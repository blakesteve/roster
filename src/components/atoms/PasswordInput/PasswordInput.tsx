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
        // Edge renders its own reveal control, which would sit next to ours.
        className={cn("[&_input::-ms-reveal]:hidden", props.className)}
        endIcon={
          revealable ? (
            <button
              type="button"
              onClick={toggle}
              disabled={disabled}
              aria-label={revealed ? hideLabel : showLabel}
              aria-pressed={revealed}
              className={cn(
                "-m-1 flex items-center rounded p-1 transition-opacity",
                "opacity-70 hover:opacity-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400",
                disabled && "cursor-not-allowed opacity-40 hover:opacity-40",
              )}
            >
              <FontAwesomeIcon
                icon={revealed ? faEyeSlash : faEye}
                className="h-4 w-4"
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
