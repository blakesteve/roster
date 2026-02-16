import { cva } from "class-variance-authority";

export const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-lg transition-colors",
  {
    variants: {
      variant: {
        dashed: "border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100/50",
        simple: "border-transparent bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "dashed",
    },
  }
);