import { cva } from "class-variance-authority";

export const ctaVariants = cva(
  "relative flex flex-col gap-4 overflow-hidden rounded-lg border p-6 shadow-sm transition-all md:flex-row md:items-center md:justify-between",
  {
    variants: {
      variant: {
        primary: 
          "border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-900/50 dark:bg-primary-900/10 dark:text-primary-100", 
        neutral: 
          "border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100", 
        warning: 
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-100", 
        error: 
          "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-100", 
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);