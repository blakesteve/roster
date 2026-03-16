import { cva } from "class-variance-authority";

export const breadcrumbVariants = cva(
  "flex items-center text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100", 
        primary: "text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300",
        inverse: "text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);