import { cva } from "class-variance-authority";

export const linkVariants = cva(
  "rst:inline-flex rst:items-center rst:gap-1.5 rst:font-semibold rst:transition-colors rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:rounded-sm rst:cursor-pointer",
  {
    variants: {
      variant: {
        primary: "rst:text-primary-600 rst:hover:text-primary-700 rst:dark:text-primary-400 rst:dark:hover:text-primary-300",
        neutral: "rst:text-gray-600 rst:hover:text-gray-900 rst:dark:text-gray-400 rst:dark:hover:text-gray-100",
        danger:  "rst:text-error-600 rst:hover:text-error-700 rst:dark:text-error-500 rst:dark:hover:text-error-400",
        white:   "rst:text-gray-200 rst:hover:text-white rst:dark:text-gray-300 rst:dark:hover:text-white",
      },
      underline: {
        always: "rst:underline rst:underline-offset-4",
        hover:  "rst:no-underline rst:hover:underline rst:underline-offset-4",
        none:   "rst:no-underline",
      },
      size: {
        sm: "rst:text-xs",
        md: "rst:text-sm",
        lg: "rst:text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      underline: "hover",
      size: "md",
    },
  }
);