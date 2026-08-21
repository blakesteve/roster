import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const spinnerVariants = cva("rst:animate-spin rst:rounded-full rst:transition-colors", {
  variants: {
    variant: {
      primary: "rst:border-primary-600 rst:dark:border-primary-500",
      neutral: "rst:border-gray-600 rst:dark:border-gray-400",
      danger: "rst:border-error-600 rst:dark:border-error-500",
      white: "rst:border-white",
      current: "rst:border-current",
    },
    size: {
      sm: "rst:h-4 rst:w-4 rst:border-2",
      md: "rst:h-6 rst:w-6 rst:border-[3px]",
      lg: "rst:h-8 rst:w-8 rst:border-4",
    },
    animation: {
      // The standard "C" shape spin (highly visible)
      classic: "rst:border-solid rst:border-r-transparent rst:dark:border-r-transparent",
      // A rigid half-circle that flings around
      half: "rst:border-solid rst:border-r-transparent rst:border-b-transparent rst:dark:border-r-transparent rst:dark:border-b-transparent",
      // A spinning dashed line
      dashed: "rst:border-dashed",
      // A dotted line with a gap so you can track the rotation
      dotted: "rst:border-dotted rst:border-r-transparent rst:dark:border-r-transparent",
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
