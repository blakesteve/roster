import { cva } from "class-variance-authority";

/**
 * A single figure with its label. Distinct from Badge and Pill: those carry a
 * word, a Stat carries a magnitude and is meant to be scanned in a row of
 * siblings. Digits are tabular so a row of them lines up on the decimal.
 */
export const statValueVariants = cva(
  "block font-bold leading-none tracking-[-0.04em] tabular-nums",
  {
    variants: {
      size: {
        sm: "text-xl",
        md: "text-[clamp(1.5rem,3.6vw,2.25rem)]",
        lg: "text-[clamp(2rem,5vw,3rem)]",
      },
      colorScheme: {
        primary: "text-primary-600 dark:text-primary-400",
        success: "text-success-600 dark:text-success-400",
        error: "text-error-600 dark:text-error-400",
        amber: "text-amber-600 dark:text-amber-400",
        neutral: "text-gray-900 dark:text-gray-100",
        current: "text-current",
      },
    },
    defaultVariants: { size: "md", colorScheme: "neutral" },
  },
);
