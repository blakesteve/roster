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
      <Field className={cn("w-full space-y-1.5", className)}>
        {label && (
          <Label className="block text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-left">
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
              "text-xs text-left",
              hasError
                ? "text-error-600 dark:text-error-400 font-medium"
                : "text-gray-500 dark:text-gray-400",
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
