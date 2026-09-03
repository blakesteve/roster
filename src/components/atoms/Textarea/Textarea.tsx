import React from "react";
import {
  Textarea as HeadlessTextarea,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { textareaVariants } from "./textarea-variants";

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  /**
   * Classes for the `<textarea>` itself.
   *
   * `className` lands on the outer `Field` wrapper, so `<Textarea
   * className="rst:h-40" />` has always sized the wrapper and left the control
   * alone. Mirrors `Input`'s `inputClassName` and `Select`'s
   * `triggerClassName`: the hatch is named for the element it reaches.
   */
  textareaClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      variant,
      error,
      resize,
      disabled,
      textareaClassName,
      ...props
    },
    ref,
  ) => {
    const hasError = !!errorMessage || error;

    return (
      /* No `space-y-*` here, for the reason documented on Input: Headless UI's
          Field always renders a trailing hidden element, and Tailwind v4
          applies space-y as `margin-block-end` on `:not(:last-child)`, so the
          control stopped being the last child and picked up a stray 6px bottom
          margin against a sibling nobody can see. Spacing is set explicitly on
          the label and description instead. Select is immune to the same trap
          only because it spaces with `gap`, and the hidden element is
          `display: none` so it is not a flex item. */
      <Field className={cn("rst:w-full", className)}>
        {label && (
          <Label className="rst:block rst:text-sm rst:font-medium rst:leading-none rst:text-gray-900 rst:dark:text-gray-100 rst:peer-disabled:cursor-not-allowed rst:peer-disabled:opacity-70 rst:text-left rst:mb-1.5">
            {label}
          </Label>
        )}

        <HeadlessTextarea
          ref={ref}
          disabled={disabled}
          className={cn(
            textareaVariants({ variant, resize, error: hasError }),
            textareaClassName,
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";

export { Textarea };
