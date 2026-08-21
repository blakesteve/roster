import { cva } from "class-variance-authority";

export const disclosureTriggerVariants = cva(
  "rst:group rst:flex rst:w-full rst:items-center rst:justify-between rst:px-4 rst:py-3 rst:text-left rst:text-sm rst:font-medium rst:transition-all rst:focus:outline-none rst:focus-visible:ring-2 rst:focus-visible:ring-primary-500/75 rst:cursor-pointer rst:z-10 rst:relative",
  {
    variants: {
      variant: {
        white:
          "rst:bg-white rst:text-gray-900 rst:hover:bg-gray-50 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:hover:bg-gray-700",
        soft: 
          "rst:bg-gray-100 rst:text-gray-900 rst:hover:bg-gray-200 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:hover:bg-gray-700",
        slate:
          "rst:bg-gray-700 rst:text-gray-100 rst:hover:bg-gray-600 rst:dark:bg-gray-900 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800",
        outline:
          "rst:bg-transparent rst:border rst:border-gray-200 rst:text-gray-900 rst:hover:bg-gray-50 rst:dark:border-gray-700 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800/50",
        ghost:
          "rst:bg-transparent rst:text-gray-700 rst:hover:bg-gray-100 rst:hover:text-gray-900 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800 rst:dark:hover:text-gray-100",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);

export const disclosureContentVariants = cva(
  "rst:px-4 rst:pb-4 rst:pt-2 rst:text-sm rst:transition-colors",
  {
    variants: {
      variant: {
        white: "rst:bg-white rst:text-gray-700 rst:dark:bg-gray-800 rst:dark:text-gray-300",
        soft: "rst:bg-gray-100 rst:text-gray-700 rst:dark:bg-gray-800/50 rst:dark:text-gray-300",
        slate: "rst:bg-gray-700 rst:text-gray-200 rst:dark:bg-gray-900 rst:dark:text-gray-300",
        outline:
          "rst:bg-transparent rst:border-x rst:border-b rst:border-gray-200 rst:text-gray-600 rst:dark:border-gray-700 rst:dark:text-gray-400",
        ghost: "rst:bg-transparent rst:text-gray-600 rst:dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);