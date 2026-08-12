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
  "flex items-start gap-2.5 rounded-lg border-l-4 px-4 py-3 text-sm",
  {
    variants: {
      colorScheme: {
        error:
          "border-error-500 bg-error-50 text-error-800 dark:border-error-400 dark:bg-error-500/10 dark:text-error-200",
        success:
          "border-success-500 bg-success-50 text-success-800 dark:border-success-400 dark:bg-success-500/10 dark:text-success-200",
        amber:
          "border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-200",
        info: "border-info-500 bg-info-50 text-info-800 dark:border-info-400 dark:bg-info-500/10 dark:text-info-200",
        primary:
          "border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-500/10 dark:text-primary-200",
        neutral:
          "border-gray-400 bg-gray-50 text-gray-800 dark:border-gray-500 dark:bg-gray-500/10 dark:text-gray-200",
      },
    },
    defaultVariants: {
      colorScheme: "error",
    },
  },
);
