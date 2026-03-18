import { cva } from "class-variance-authority";

export const actionBarVariants = cva(
  "w-full z-40 shadow-lg backdrop-blur-md transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-white/50 border-gray-200 text-gray-900 dark:bg-gray-950/50 dark:border-gray-800 dark:text-gray-100",
        soft: 
          "bg-gray-50/50 border-gray-200 text-gray-900 dark:bg-gray-900/50 dark:border-gray-800 dark:text-gray-100",
        primary:
          "bg-primary-700/50 border-primary-800 text-white dark:bg-primary-950/50 dark:border-primary-900 dark:text-primary-50",
        transparent:
          "bg-transparent border-transparent text-gray-900 dark:text-gray-100 shadow-none",
      },
      position: {
        top: "sticky top-0 border-b",
        bottom: "sticky bottom-0 border-t", 
        static: "relative border-y",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "top",
    },
  }
);