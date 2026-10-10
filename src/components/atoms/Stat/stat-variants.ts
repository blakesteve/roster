import { cva } from "class-variance-authority";

/**
 * A single figure with its label. Distinct from Badge and Pill: those carry a
 * word, a Stat carries a magnitude and is meant to be scanned in a row of
 * siblings. Digits are tabular so a row of them lines up on the decimal.
 */
export const statValueVariants = /* @__PURE__ */ cva(
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

/* The source line's classes, shared with SkeletonStat so a skeleton's source
   row is the same height as the real one.

   `font-normal` and `normal-nums` because in the definition markup the source
   sits inside the value's `dd` and would otherwise inherit its bold, tabular
   figures. In both markups this also means the source no longer inherits a
   weight from outside the Stat: it is always regular. */
export const statSourceClass =
  "rst:block rst:font-mono rst:text-[0.53125rem] rst:font-normal rst:normal-nums rst:leading-none rst:tracking-[0.06em] rst:text-gray-500 rst:opacity-75 rst:dark:text-gray-400";
