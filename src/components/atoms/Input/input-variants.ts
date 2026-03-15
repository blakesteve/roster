import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full rounded-md border py-2.5 px-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
  {
    variants: {
      variant: {
        white:
          "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
        soft:
          "border-transparent bg-gray-100 text-gray-900 placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-primary-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:bg-gray-900",
        slate:
          "border-transparent bg-gray-700 text-gray-100 placeholder:text-gray-400 focus-visible:bg-gray-600 dark:bg-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:bg-gray-800",
        outline:
          "border-gray-300 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:border-primary-500 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500",
        ghost:
          "border-transparent bg-transparent text-gray-900 placeholder:text-gray-400 hover:bg-gray-100 focus-visible:bg-gray-100 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:bg-gray-800 dark:focus-visible:bg-gray-800",
      },
      error: {
        true: "border-error-500 focus-visible:ring-error-500 text-error-600 placeholder:text-error-300 dark:border-error-500 dark:text-error-400 dark:placeholder:text-error-800 dark:focus-visible:ring-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);

export const iconVariants = cva(
  "absolute top-1/2 -translate-y-1/2 transition-colors",
  {
    variants: {
      variant: {
        white: "text-gray-400 dark:text-gray-500",
        soft: "text-gray-500 dark:text-gray-400",
        slate: "text-gray-300 dark:text-gray-500",
        outline: "text-gray-400 dark:text-gray-500",
        ghost: "text-gray-500 dark:text-gray-400",
      },
      error: {
        true: "text-error-500 dark:text-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);