import React from "react";
import {
  Input as HeadlessInput,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { inputVariants, iconVariants } from "./input-variants";

export interface InputProps
  extends
    /* `size` is shadowed on purpose. The native attribute is a character count
       on a text input, it is effectively obsolete, and none of the 63 `Input`
       usages across the five apps passes one. Keeping it would have forced this
       prop to be called something other than `size`, which would break the
       parity with Button that is the entire point of adding it. */
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /**
   * Classes for the `<input>` itself.
   *
   * `className` lands on the outer `Field` wrapper, which is right for layout
   * and useless for anything else: a consumer could not reach the control to
   * change its height, border or background. `size` covers the common case;
   * this is the escape hatch for the rest.
   */
  inputClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      helperText,
      errorMessage,
      variant,
      size,
      error,
      startIcon,
      endIcon,
      disabled,
      inputClassName,
      ...props
    },
    ref,
  ) => {
    const hasError = !!errorMessage || error;

    return (
      /* No `space-y-*` here, deliberately. Headless UI's Field appends a
          hidden zero-height <span> after the control, and Tailwind v4 applies
          space-y as `margin-block-end` on `:not(:last-child)` — so the input's
          wrapper stopped being the last child and picked up a stray 6px bottom
          margin. The Field's box then ended 6px below the control, and any
          `items-end` row aligned a neighbouring Button to that phantom edge
          rather than to the field. Measured in Storybook: 6px off at every
          size, while both were the correct height. Spacing is set explicitly on
          the label and the description instead. */
      <Field className={cn("rst:w-full", className)}>
        {label && (
          <Label
            className={cn(
              "rst:block rst:text-sm rst:font-medium rst:leading-none rst:text-left rst:mb-1.5 rst:transition-colors",
              "rst:text-gray-900 rst:dark:text-gray-100",
              "rst:peer-disabled:cursor-not-allowed rst:peer-disabled:opacity-70",
            )}
          >
            {label}
          </Label>
        )}

        <div className="rst:relative">
          {startIcon && (
            <div
              className={cn(
                iconVariants({ variant, error: hasError }),
                "rst:left-3",
              )}
            >
              {startIcon}
            </div>
          )}

          <HeadlessInput
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              inputVariants({ variant, size, error: hasError }),
              /* Icon inset tracks the size's own padding: sm is px-3, so it
                 needs one step less clearance than the 16px sizes. */
              startIcon && (size === "sm" ? "rst:pl-9" : "rst:pl-10"),
              endIcon && (size === "sm" ? "rst:pr-9" : "rst:pr-10"),
              inputClassName,
            )}
            {...props}
          />

          {endIcon && (
            <div
              className={cn(
                iconVariants({ variant, error: hasError }),
                "rst:right-3",
              )}
            >
              {endIcon}
            </div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <Description
            className={cn(
              "rst:text-xs rst:text-left rst:mt-1.5",
              hasError
                ? "rst:text-error-600 rst:dark:text-error-400 rst:font-medium"
                : "rst:text-gray-500 rst:dark:text-gray-400",
            )}
          >
            {errorMessage || helperText}
          </Description>
        )}
      </Field>
    );
  },
);

Input.displayName = "Input";

export { Input };
