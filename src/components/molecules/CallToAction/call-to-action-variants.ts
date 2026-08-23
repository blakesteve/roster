import { cva } from "class-variance-authority";

export const ctaVariants = cva(
  "rst:font-ui rst:relative rst:flex rst:flex-col rst:gap-4 rst:overflow-hidden rst:rounded-lg rst:border rst:p-6 rst:shadow-sm rst:transition-all rst:md:flex-row rst:md:items-center rst:md:justify-between",
  {
    variants: {
      variant: {
        primary: 
          "rst:border-primary-200 rst:bg-primary-50 rst:text-primary-900 rst:dark:border-primary-800 rst:dark:bg-primary-900/30 rst:dark:text-primary-200", 
        neutral: 
          "rst:border-gray-200 rst:bg-white rst:text-gray-900 rst:dark:border-gray-700 rst:dark:bg-gray-800 rst:dark:text-gray-100", 
        warning: 
          "rst:border-amber-200 rst:bg-amber-50 rst:text-amber-900 rst:dark:border-amber-800 rst:dark:bg-amber-900/30 rst:dark:text-amber-200", 
        error: 
          "rst:border-error-200 rst:bg-error-50 rst:text-error-900 rst:dark:border-error-800 rst:dark:bg-error-900/30 rst:dark:text-error-200", 
        success:
          "rst:border-success-200 rst:bg-success-50 rst:text-success-900 rst:dark:border-success-800 rst:dark:bg-success-900/30 rst:dark:text-success-200",
        info:
          "rst:border-blue-200 rst:bg-blue-50 rst:text-blue-900 rst:dark:border-blue-800 rst:dark:bg-blue-900/30 rst:dark:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);