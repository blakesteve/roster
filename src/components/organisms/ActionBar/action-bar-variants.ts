import { cva } from "class-variance-authority";

export const actionBarVariants = cva(
  "rst:font-ui rst:w-full rst:z-40 rst:shadow-lg rst:backdrop-blur-md rst:transition-all",
  {
    variants: {
      variant: {
        default:
          "rst:bg-white/50 rst:border-gray-200 rst:text-gray-900 rst:dark:bg-gray-950/50 rst:dark:border-gray-800 rst:dark:text-gray-100",
        soft: 
          "rst:bg-gray-50/50 rst:border-gray-200 rst:text-gray-900 rst:dark:bg-gray-900/50 rst:dark:border-gray-800 rst:dark:text-gray-100",
        primary:
          "rst:bg-primary-700/50 rst:border-primary-800 rst:text-white rst:dark:bg-primary-950/50 rst:dark:border-primary-900 rst:dark:text-primary-50",
        transparent:
          "rst:bg-transparent rst:border-transparent rst:text-gray-900 rst:dark:text-gray-100 rst:shadow-none",
      },
      position: {
        top: "rst:sticky rst:top-0 rst:border-b",
        bottom: "rst:sticky rst:bottom-0 rst:border-t", 
        static: "rst:relative rst:border-y",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "top",
    },
  }
);