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
      ...props
    },
    ref,
  ) => {
    const hasError = !!errorMessage || error;

    return (
      <Field className={cn("rst:w-full rst:space-y-1.5", className)}>
        {label && (
          <Label className="rst:block rst:text-sm rst:font-medium rst:leading-none rst:text-gray-900 rst:dark:text-gray-100 rst:peer-disabled:cursor-not-allowed rst:peer-disabled:opacity-70 rst:text-left">
            {label}
          </Label>
        )}

        <HeadlessTextarea
          ref={ref}
          disabled={disabled}
          className={cn(textareaVariants({ variant, resize, error: hasError }))}
          {...props}
        />

        {(helperText || errorMessage) && (
          <Description
            className={cn(
              "rst:text-xs rst:text-left",
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
