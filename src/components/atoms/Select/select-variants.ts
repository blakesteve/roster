import { cva } from "class-variance-authority";

export const selectTriggerVariants = cva(
  "relative w-full cursor-pointer rounded-md py-2.5 pl-4 pr-10 text-left text-sm font-medium shadow-sm ring-1 ring-inset transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:leading-6",
  {
    variants: {
      variant: {
        white:
          "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-700",
        soft:
          "bg-gray-100 text-gray-900 ring-transparent hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-100 dark:hover:bg-gray-800",
        slate:
          "bg-gray-700 text-gray-100 ring-transparent hover:bg-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
        outline:
          "bg-transparent text-gray-900 ring-gray-300 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-100 dark:hover:bg-gray-800/50",
        ghost:
          "bg-transparent text-gray-700 ring-transparent hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
      },
      error: {
        true: "ring-error-500 text-error-600 focus:ring-error-500 dark:ring-error-500 dark:text-error-400 dark:focus:ring-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);