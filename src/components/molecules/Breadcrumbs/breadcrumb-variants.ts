import { cva } from "class-variance-authority";

export const breadcrumbVariants = cva(
  "rst:font-ui rst:flex rst:items-center rst:text-sm rst:font-medium rst:transition-colors",
  {
    variants: {
      variant: {
        default: "rst:text-gray-500 rst:hover:text-gray-900 rst:dark:text-gray-400 rst:dark:hover:text-gray-100", 
        primary: "rst:text-primary-600 rst:hover:text-primary-800 rst:dark:text-primary-400 rst:dark:hover:text-primary-300",
        inverse: "rst:text-gray-300 rst:hover:text-white rst:dark:text-gray-400 rst:dark:hover:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);