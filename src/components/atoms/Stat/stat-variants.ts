import { cva } from "class-variance-authority";

/**
 * A single figure with its label. Distinct from Badge and Pill: those carry a
 * word, a Stat carries a magnitude and is meant to be scanned in a row of
 * siblings. Digits are tabular so a row of them lines up on the decimal.
 */
export const statValueVariants = cva(
  "rst:block rst:font-bold rst:leading-none rst:tracking-[-0.04em] rst:tabular-nums",
  {
    variants: {
      size: {
        sm: "rst:text-xl",
        md: "rst:text-[clamp(1.5rem,3.6vw,2.25rem)]",
        lg: "rst:text-[clamp(2rem,5vw,3rem)]",
      },
      colorScheme: {
        primary: "rst:text-primary-600 rst:dark:text-primary-400",
        success: "rst:text-success-600 rst:dark:text-success-400",
        error: "rst:text-error-600 rst:dark:text-error-400",
        amber: "rst:text-amber-600 rst:dark:text-amber-400",
        neutral: "rst:text-gray-900 rst:dark:text-gray-100",
        current: "rst:text-current",
      },
    },
    defaultVariants: { size: "md", colorScheme: "neutral" },
  },
);
