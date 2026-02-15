import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full rounded-md border py-2.5 px-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
  {
    variants: {
      variant: {
        outline: "border-gray-300 bg-white placeholder:text-gray-400 focus-visible:border-primary-500",
        soft:    "border-transparent bg-gray-100 text-gray-900 placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-primary-500",
        ghost:   "border-transparent bg-transparent text-gray-900 placeholder:text-gray-400 hover:bg-gray-100 focus-visible:bg-gray-100",
        filled:  "border-transparent bg-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:bg-white focus-visible:border-primary-500", // MegaSquad Dark
      },
      error: {
        true: "border-error-500 focus-visible:ring-error-500 text-error-600 placeholder:text-error-300",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);