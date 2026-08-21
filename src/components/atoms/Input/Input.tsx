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
      <Field className={cn("rst:w-full rst:space-y-1.5", className)}>
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
              inputVariants({ variant, error: hasError }),
              startIcon && "rst:pl-10",
              endIcon && "rst:pr-10",
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
              "rst:text-xs rst:text-left rst:mt-1",
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
