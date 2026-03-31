import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const spinnerVariants = cva("animate-spin rounded-full transition-colors", {
  variants: {
    variant: {
      primary: "border-primary-600 dark:border-primary-500",
      neutral: "border-gray-600 dark:border-gray-400",
      danger: "border-error-600 dark:border-error-500",
      white: "border-white",
      current: "border-current",
    },
    size: {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-[3px]",
      lg: "h-8 w-8 border-4",
    },
    animation: {
      // The standard "C" shape spin (highly visible)
      classic: "border-solid border-r-transparent dark:border-r-transparent",
      // A rigid half-circle that flings around
      half: "border-solid border-r-transparent border-b-transparent dark:border-r-transparent dark:border-b-transparent",
      // A spinning dashed line
      dashed: "border-dashed",
      // A dotted line with a gap so you can track the rotation
      dotted: "border-dotted border-r-transparent dark:border-r-transparent",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    animation: "classic",
  },
});

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export const Spinner = ({
  variant,
  size,
  animation,
  className,
}: SpinnerProps) => {
  return (
    <div
      className={cn(spinnerVariants({ variant, size, animation }), className)}
      role="status"
      aria-label="loading"
    />
  );
};
