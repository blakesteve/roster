import { cva } from "class-variance-authority";

export const ctaVariants = cva(
  "relative flex flex-col gap-4 overflow-hidden rounded-lg border p-6 shadow-sm transition-all md:flex-row md:items-center md:justify-between",
  {
    variants: {
      variant: {
        primary: 
          "border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200", 
        neutral: 
          "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100", 
        warning: 
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200", 
        error: 
          "border-error-200 bg-error-50 text-error-900 dark:border-error-800 dark:bg-error-900/30 dark:text-error-200", 
        success:
          "border-success-200 bg-success-50 text-success-900 dark:border-success-800 dark:bg-success-900/30 dark:text-success-200",
        info:
          "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);