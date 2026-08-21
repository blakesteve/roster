import { cva } from "class-variance-authority";

/**
 * Inline notice strip. Deliberately lighter than ErrorState, which is a full
 * empty-state panel. Alert is for "this action failed" feedback sitting in
 * the flow of a page or a form.
 *
 * The left stripe carries the color weight so the fill can stay quiet enough
 * to sit inside a form without shouting.
 */
export const alertVariants = cva(
  "rst:flex rst:items-start rst:gap-2.5 rst:rounded-lg rst:border-l-4 rst:px-4 rst:py-3 rst:text-sm",
  {
    variants: {
      colorScheme: {
        error:
          "rst:border-error-500 rst:bg-error-50 rst:text-error-800 rst:dark:border-error-400 rst:dark:bg-error-500/10 rst:dark:text-error-200",
        success:
          "rst:border-success-500 rst:bg-success-50 rst:text-success-800 rst:dark:border-success-400 rst:dark:bg-success-500/10 rst:dark:text-success-200",
        amber:
          "rst:border-amber-500 rst:bg-amber-50 rst:text-amber-900 rst:dark:border-amber-400 rst:dark:bg-amber-500/10 rst:dark:text-amber-200",
        info: "rst:border-info-500 rst:bg-info-50 rst:text-info-800 rst:dark:border-info-400 rst:dark:bg-info-500/10 rst:dark:text-info-200",
        primary:
          "rst:border-primary-500 rst:bg-primary-50 rst:text-primary-800 rst:dark:border-primary-400 rst:dark:bg-primary-500/10 rst:dark:text-primary-200",
        neutral:
          "rst:border-gray-400 rst:bg-gray-50 rst:text-gray-800 rst:dark:border-gray-500 rst:dark:bg-gray-500/10 rst:dark:text-gray-200",
      },
    },
    defaultVariants: {
      colorScheme: "error",
    },
  },
);
