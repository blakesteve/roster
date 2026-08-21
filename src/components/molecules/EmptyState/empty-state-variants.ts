import { cva } from "class-variance-authority";

export const emptyStateVariants = cva(
  "rst:flex rst:flex-col rst:items-center rst:justify-center rst:text-center rst:p-8 rst:rounded-lg rst:transition-colors",
  {
    variants: {
      variant: {
        dashed: "rst:border-2 rst:border-dashed rst:border-gray-300 rst:bg-gray-50 rst:hover:bg-gray-100/50",
        simple: "rst:border-transparent rst:bg-transparent rst:p-0",
      },
    },
    defaultVariants: {
      variant: "dashed",
    },
  }
);