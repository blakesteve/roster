import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "rst:font-ui rst:flex rst:w-full rst:rounded-md rst:border rst:py-2.5 rst:px-4 rst:text-sm rst:ring-offset-background rst:file:border-0 rst:file:bg-transparent rst:file:text-sm rst:file:font-medium rst:focus-visible:outline-none rst:focus-visible:ring-2 rst:focus-visible:ring-primary-500 rst:dark:focus-visible:ring-primary-400 rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:transition-all",
  {
    variants: {
      variant: {
        white:
          "rst:border-gray-300 rst:bg-white rst:text-gray-900 rst:placeholder:text-gray-400 rst:focus-visible:border-primary-500 rst:dark:border-gray-700 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500",
        soft:
          "rst:border-transparent rst:bg-gray-100 rst:text-gray-900 rst:placeholder:text-gray-400 rst:focus-visible:bg-white rst:focus-visible:border-primary-500 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500 rst:dark:focus-visible:bg-gray-900",
        slate:
          "rst:border-transparent rst:bg-gray-700 rst:text-gray-100 rst:placeholder:text-gray-400 rst:focus-visible:bg-gray-600 rst:dark:bg-gray-900 rst:dark:placeholder:text-gray-500 rst:dark:focus-visible:bg-gray-800",
        outline:
          "rst:border-gray-300 rst:bg-transparent rst:text-gray-900 rst:placeholder:text-gray-400 rst:focus-visible:border-primary-500 rst:dark:border-gray-700 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500",
        ghost:
          "rst:border-transparent rst:bg-transparent rst:text-gray-900 rst:placeholder:text-gray-400 rst:hover:bg-gray-100 rst:focus-visible:bg-gray-100 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500 rst:dark:hover:bg-gray-800 rst:dark:focus-visible:bg-gray-800",
      },
      error: {
        true: "rst:border-error-500 rst:focus-visible:ring-error-500 rst:text-error-600 rst:placeholder:text-error-300 rst:dark:border-error-500 rst:dark:text-error-400 rst:dark:placeholder:text-error-800 rst:dark:focus-visible:ring-error-400",
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
  "rst:absolute rst:top-1/2 rst:-translate-y-1/2 rst:transition-colors",
  {
    variants: {
      variant: {
        white: "rst:text-gray-400 rst:dark:text-gray-500",
        soft: "rst:text-gray-500 rst:dark:text-gray-400",
        slate: "rst:text-gray-300 rst:dark:text-gray-500",
        outline: "rst:text-gray-400 rst:dark:text-gray-500",
        ghost: "rst:text-gray-500 rst:dark:text-gray-400",
      },
      error: {
        true: "rst:text-error-500 rst:dark:text-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);