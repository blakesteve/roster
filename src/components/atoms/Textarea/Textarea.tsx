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
          <Label className="block text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
              "text-xs",
              hasError ? "text-error-600 font-medium" : "text-gray-500",
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
