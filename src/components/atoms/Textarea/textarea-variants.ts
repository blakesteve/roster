import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "rst:flex rst:w-full rst:min-h-[80px] rst:rounded-md rst:border rst:py-2.5 rst:px-4 rst:text-sm rst:ring-offset-white rst:dark:ring-offset-gray-950 rst:placeholder:text-gray-400 rst:focus-visible:outline-none rst:focus-visible:ring-2 rst:focus-visible:ring-primary-500 rst:dark:focus-visible:ring-primary-400 rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:transition-colors rst:custom-scrollbar",
  {
    variants: {
      variant: {
        outline:
          "rst:border-gray-300 rst:bg-white rst:text-gray-900 rst:focus-visible:border-primary-500 rst:dark:border-gray-700 rst:dark:bg-gray-950 rst:dark:text-gray-100 rst:dark:focus-visible:border-primary-400",
        soft: 
          "rst:border-transparent rst:bg-gray-100 rst:text-gray-900 rst:focus-visible:bg-white rst:focus-visible:border-primary-500 rst:dark:bg-gray-800/50 rst:dark:text-gray-100 rst:dark:focus-visible:bg-gray-900 rst:dark:focus-visible:border-primary-400",
        ghost:
          "rst:border-transparent rst:bg-transparent rst:text-gray-900 rst:hover:bg-gray-100 rst:focus-visible:bg-gray-100 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800 rst:dark:focus-visible:bg-gray-800",
        white:
          "rst:border-gray-200 rst:bg-white rst:text-gray-900 rst:focus-visible:border-primary-500 rst:dark:border-gray-800 rst:dark:bg-gray-900 rst:dark:text-gray-100 rst:dark:focus-visible:border-primary-400",
      },
      error: {
        true: "rst:border-error-500 rst:focus-visible:ring-error-500 rst:text-error-900 rst:placeholder:text-error-300 rst:dark:border-error-500 rst:dark:focus-visible:ring-error-500 rst:dark:text-error-100 rst:dark:placeholder:text-error-400/50",
        false: "",
      },
      resize: {
        none: "rst:resize-none",
        vertical: "rst:resize-y",
        horizontal: "rst:resize-x",
        both: "rst:resize",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
      resize: "vertical",
    },
  }
);