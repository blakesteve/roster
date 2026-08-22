import { cva } from "class-variance-authority";

export const errorStateVariants = cva(
  "rst:flex rst:flex-col rst:items-center rst:justify-center rst:text-center rst:p-8 rst:rounded-lg rst:transition-colors",
  {
    variants: {
      variant: {
        card:
          "rst:border rst:border-error-200 rst:bg-error-50 rst:text-error-900 " +
          "rst:dark:border-error-800 rst:dark:bg-error-500/10 rst:dark:text-error-100",
        page:
          "rst:bg-transparent rst:text-gray-900 rst:max-w-lg rst:mx-auto rst:py-16 " +
          "rst:dark:text-gray-100",
      },
    },
    defaultVariants: {
      variant: "card",
    },
  }
);