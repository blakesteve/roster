import { cva } from "class-variance-authority";

export const disclosureTriggerVariants = cva(
  "group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/75 cursor-pointer z-10 relative",
  {
    variants: {
      variant: {
        white:
          "bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        soft: 
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        slate:
          "bg-gray-700 text-gray-100 hover:bg-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
        outline:
          "bg-transparent border border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800/50",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);

export const disclosureContentVariants = cva(
  "px-4 pb-4 pt-2 text-sm transition-colors",
  {
    variants: {
      variant: {
        white: "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        soft: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
        slate: "bg-gray-700 text-gray-200 dark:bg-gray-900 dark:text-gray-300",
        outline:
          "bg-transparent border-x border-b border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400",
        ghost: "bg-transparent text-gray-600 dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);