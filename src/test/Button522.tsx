import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button as HeadlessButton } from "@headlessui/react";
import { cn } from "../lib/utils";
import { Spinner } from "../components/atoms/Spinner/Spinner";

/**
 * `Button` as 5.22 drew it, for checks that compare the wrapping Button with
 * it in the same page, engine and fonts: the base, variants and sizes copied
 * from `button-variants.ts` at 5.22.0, and the markup from `Button.tsx`, with
 * the color compounds left out, since a color can't move a box. Test-only:
 * `src/test` is outside the package.
 */
const buttonVariants522 = cva(
  "rst:font-ui rst:inline-flex rst:items-center rst:justify-center rst:cursor-pointer rst:whitespace-nowrap rst:rounded-md rst:text-sm rst:font-medium rst:ring-offset-background rst:transition-colors rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:disabled:pointer-events-none rst:disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "rst:border rst:border-transparent rst:elevation-control",
        soft: "rst:border-0 rst:shadow-none",
        outline: "rst:border rst:bg-transparent rst:elevation-control",
        ghost: "rst:border rst:border-transparent rst:bg-transparent",
        link: "rst:border-0 rst:bg-transparent rst:underline-offset-4 rst:hover:underline",
      },
      size: {
        xs: "rst:h-7 rst:rounded-sm rst:px-2 rst:text-xs",
        sm: "rst:h-9 rst:rounded-md rst:px-3",
        default: "rst:h-10 rst:px-4 rst:py-2",
        lg: "rst:h-11 rst:rounded-md rst:px-8",
        icon: "rst:h-10 rst:w-10",
      },
    },
    defaultVariants: { variant: "solid", size: "default" },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants522> & { isLoading?: boolean; startIcon?: React.ReactNode; endIcon?: React.ReactNode };

export function Button522({ className, variant, size, isLoading = false, startIcon, endIcon, children, ...props }: Props) {
  return (
    <HeadlessButton className={cn(buttonVariants522({ variant, size }), className)} {...props}>
      {isLoading && (
        <span className="rst:mr-2 rst:flex rst:shrink-0 rst:items-center">
          <Spinner size="sm" variant="current" />
        </span>
      )}
      {!isLoading && startIcon && <span className="rst:mr-2 rst:inline-flex rst:shrink-0 rst:items-center">{startIcon}</span>}
      {children}
      {!isLoading && endIcon && <span className="rst:ml-2 rst:inline-flex rst:shrink-0 rst:items-center">{endIcon}</span>}
    </HeadlessButton>
  );
}
