import { cva } from "class-variance-authority";

export const disclosureTriggerVariants = cva(
  "group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/75 cursor-pointer",
  {
    variants: {
      variant: {
        soft: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        filled: "bg-gray-300 text-gray-900 hover:bg-gray-400/80 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
        outline: "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
      },
      rounded: {
        true: "rounded-md",
        false: "",
      },
    },
    defaultVariants: {
      variant: "soft",
      rounded: true,
    },
  }
);

export const disclosureContentVariants = cva(
  "px-4 pb-4 pt-1 text-sm",
  {
    variants: {
      variant: {
        soft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        filled: "bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
        outline: "bg-white border-x border-b border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400",
        ghost: "bg-transparent text-gray-600 dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);