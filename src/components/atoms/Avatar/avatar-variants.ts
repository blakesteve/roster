import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden font-semibold border transition-colors focus:outline-none select-none shrink-0 shadow-sm",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-xl",
      },
      colorScheme: {
        primary: "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800/50 dark:text-primary-300",
        orange:  "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-300",
        teal:    "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-800/50 dark:text-teal-300",
        purple:  "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-300",
        amber:   "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-300",
        success: "bg-success-50 border-success-200 text-success-700 dark:bg-success-900/30 dark:border-success-800/50 dark:text-success-300",
        error:   "bg-error-50 border-error-200 text-error-700 dark:bg-error-900/30 dark:border-error-800/50 dark:text-error-300",
        neutral: "bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-300",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      size: "md",
      colorScheme: "primary",
      shape: "circle",
    },
  }
);