import { cva } from "class-variance-authority";

export const switchTrackVariants = cva(
  "rst:group rst:relative rst:inline-flex rst:shrink-0 rst:cursor-pointer rst:rounded-full rst:border-2 rst:border-transparent rst:transition-colors rst:duration-200 rst:ease-in-out rst:focus:outline-none rst:focus-visible:ring-2 rst:focus-visible:ring-offset-2 rst:disabled:cursor-not-allowed rst:disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-primary-500 rst:focus-visible:ring-primary-500",
        success: "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-green-500 rst:focus-visible:ring-green-500",
        danger:  "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-error-500 rst:focus-visible:ring-error-500",
        neutral: "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-gray-600 rst:dark:data-[checked]:bg-gray-500 rst:focus-visible:ring-gray-600",
      },
      size: {
        xs: "rst:h-4 rst:w-7",
        sm: "rst:h-5 rst:w-9",
        md: "rst:h-6 rst:w-11",
        lg: "rst:h-7 rst:w-14",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const switchThumbVariants = cva(
  "rst:pointer-events-none rst:inline-block rst:rounded-full rst:bg-white rst:shadow rst:ring-0 rst:transition rst:duration-200 rst:ease-in-out rst:transform",
  {
    variants: {
      size: {
        xs: "rst:h-3 rst:w-3 rst:translate-x-0 rst:group-data-[checked]:translate-x-3",
        sm: "rst:h-4 rst:w-4 rst:translate-x-0 rst:group-data-[checked]:translate-x-4",
        md: "rst:h-5 rst:w-5 rst:translate-x-0 rst:group-data-[checked]:translate-x-5",
        lg: "rst:h-6 rst:w-6 rst:translate-x-0 rst:group-data-[checked]:translate-x-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);