import { cva } from "class-variance-authority";

export const linkVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 rounded-sm cursor-pointer",
  {
    variants: {
      variant: {
        primary: "text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300",
        neutral: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        danger:  "text-error-600 hover:text-error-700 dark:text-error-500 dark:hover:text-error-400",
        white:   "text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white",
      },
      underline: {
        always: "underline underline-offset-4",
        hover:  "no-underline hover:underline underline-offset-4",
        none:   "no-underline",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      underline: "hover",
      size: "md",
    },
  }
);