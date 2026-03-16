import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "flex w-full min-h-[80px] rounded-md border py-2.5 px-4 text-sm ring-offset-white dark:ring-offset-gray-950 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors custom-scrollbar",
  {
    variants: {
      variant: {
        outline:
          "border-gray-300 bg-white text-gray-900 focus-visible:border-primary-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus-visible:border-primary-400",
        soft: 
          "border-transparent bg-gray-100 text-gray-900 focus-visible:bg-white focus-visible:border-primary-500 dark:bg-gray-800/50 dark:text-gray-100 dark:focus-visible:bg-gray-900 dark:focus-visible:border-primary-400",
        ghost:
          "border-transparent bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 dark:focus-visible:bg-gray-800",
        white:
          "border-gray-200 bg-white text-gray-900 focus-visible:border-primary-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus-visible:border-primary-400",
      },
      error: {
        true: "border-error-500 focus-visible:ring-error-500 text-error-900 placeholder:text-error-300 dark:border-error-500 dark:focus-visible:ring-error-500 dark:text-error-100 dark:placeholder:text-error-400/50",
        false: "",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
      resize: "vertical",
    },
  }
);