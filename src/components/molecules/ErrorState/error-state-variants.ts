import { cva } from "class-variance-authority";

export const errorStateVariants = cva(
  "rst:flex rst:flex-col rst:items-center rst:justify-center rst:text-center rst:p-8 rst:rounded-lg rst:transition-colors",
  {
    variants: {
      variant: {
        card: "rst:border rst:border-error-200 rst:bg-error-50 rst:text-error-900",
        page: "rst:bg-transparent rst:text-gray-900 rst:max-w-lg rst:mx-auto rst:py-16",
      },
    },
    defaultVariants: {
      variant: "card",
    },
  }
);