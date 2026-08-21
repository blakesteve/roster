import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  "rst:relative rst:inline-flex rst:items-center rst:justify-center rst:overflow-hidden rst:font-semibold rst:border rst:transition-colors rst:focus:outline-none rst:select-none rst:shrink-0 rst:shadow-sm",
  {
    variants: {
      size: {
        xs: "rst:h-6 rst:w-6 rst:text-[10px]",
        sm: "rst:h-8 rst:w-8 rst:text-xs",
        md: "rst:h-10 rst:w-10 rst:text-sm",
        lg: "rst:h-12 rst:w-12 rst:text-base",
        xl: "rst:h-16 rst:w-16 rst:text-xl",
      },
      colorScheme: {
        primary: "rst:bg-primary-50 rst:border-primary-200 rst:text-primary-700 rst:dark:bg-primary-900/30 rst:dark:border-primary-800/50 rst:dark:text-primary-300",
        orange:  "rst:bg-orange-50 rst:border-orange-200 rst:text-orange-700 rst:dark:bg-orange-900/30 rst:dark:border-orange-800/50 rst:dark:text-orange-300",
        teal:    "rst:bg-teal-50 rst:border-teal-200 rst:text-teal-700 rst:dark:bg-teal-900/30 rst:dark:border-teal-800/50 rst:dark:text-teal-300",
        purple:  "rst:bg-purple-50 rst:border-purple-200 rst:text-purple-700 rst:dark:bg-purple-900/30 rst:dark:border-purple-800/50 rst:dark:text-purple-300",
        amber:   "rst:bg-amber-50 rst:border-amber-200 rst:text-amber-800 rst:dark:bg-amber-900/30 rst:dark:border-amber-800/50 rst:dark:text-amber-300",
        success: "rst:bg-success-50 rst:border-success-200 rst:text-success-700 rst:dark:bg-success-900/30 rst:dark:border-success-800/50 rst:dark:text-success-300",
        error:   "rst:bg-error-50 rst:border-error-200 rst:text-error-700 rst:dark:bg-error-900/30 rst:dark:border-error-800/50 rst:dark:text-error-300",
        neutral: "rst:bg-gray-100 rst:border-gray-200 rst:text-gray-700 rst:dark:bg-gray-800/50 rst:dark:border-gray-700/50 rst:dark:text-gray-300",
      },
      shape: {
        circle: "rst:rounded-full",
        square: "rst:rounded-md",
      },
    },
    defaultVariants: {
      size: "md",
      colorScheme: "primary",
      shape: "circle",
    },
  }
);