import React from "react";
import {
  Input as HeadlessInput,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { inputVariants } from "./input-variants";

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
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
      error,
      startIcon,
      endIcon,
      disabled,
      ...props
    },
    ref,
  ) => {
    const hasError = !!errorMessage || error;

    return (
      <Field className={cn("w-full space-y-1.5", className)}>
        {/* LABEL */}
        {label && (
          <Label className="block text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </Label>
        )}

        {/* INPUT WRAPPER (For positioning icons) */}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {startIcon}
            </div>
          )}

          <HeadlessInput
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              inputVariants({ variant, error: hasError }),
              // Adjust padding if icons are present so text doesn't overlap
              startIcon && "pl-10",
              endIcon && "pr-10",
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {endIcon}
            </div>
          )}
        </div>

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

Input.displayName = "Input";

export { Input };
