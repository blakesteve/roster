import { cva } from "class-variance-authority";

export const selectTriggerVariants = cva(
  "rst:font-ui rst:relative rst:w-full rst:cursor-pointer rst:rounded-md rst:py-2.5 rst:pl-4 rst:pr-10 rst:text-left rst:text-sm rst:font-medium rst:shadow-sm rst:ring-1 rst:ring-inset rst:transition-all rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:sm:leading-6",
  {
    variants: {
      variant: {
        white:
          "rst:bg-white rst:text-gray-900 rst:ring-gray-300 rst:hover:bg-gray-50 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:ring-gray-700 rst:dark:hover:bg-gray-700",
        soft:
          "rst:bg-gray-100 rst:text-gray-900 rst:ring-transparent rst:hover:bg-gray-200 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:hover:bg-gray-700",
        slate:
          "rst:bg-gray-700 rst:text-gray-100 rst:ring-transparent rst:hover:bg-gray-600 rst:dark:bg-gray-900 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800",
        outline:
          "rst:bg-transparent rst:text-gray-900 rst:ring-gray-300 rst:hover:bg-gray-50 rst:dark:ring-gray-700 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800/50",
        ghost:
          "rst:bg-transparent rst:text-gray-700 rst:ring-transparent rst:hover:bg-gray-100 rst:hover:text-gray-900 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800 rst:dark:hover:text-gray-100",
      },
      error: {
        true: "rst:ring-error-500 rst:text-error-600 rst:focus:ring-error-500 rst:dark:ring-error-500 rst:dark:text-error-400 rst:dark:focus:ring-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);