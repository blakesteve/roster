import { cva } from "class-variance-authority";

export const errorStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-lg transition-colors",
  {
    variants: {
      variant: {
        card: "border border-error-200 bg-error-50 text-error-900",
        page: "bg-transparent text-gray-900 max-w-lg mx-auto py-16",
      },
    },
    defaultVariants: {
      variant: "card",
    },
  }
);