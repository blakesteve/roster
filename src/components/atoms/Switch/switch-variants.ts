import { cva } from "class-variance-authority";

export const switchTrackVariants = cva(
  "group relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-gray-200 data-[checked]:bg-primary-500 focus-visible:ring-primary-500",
        success: "bg-gray-200 data-[checked]:bg-green-500 focus-visible:ring-green-500",
        danger:  "bg-gray-200 data-[checked]:bg-error-500 focus-visible:ring-error-500",
        neutral: "bg-gray-200 data-[checked]:bg-gray-600 focus-visible:ring-gray-600",
      },
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const switchThumbVariants = cva(
  "pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out transform",
  {
    variants: {
      size: {
        sm: "h-4 w-4 translate-x-0 group-data-[checked]:translate-x-4",
        md: "h-5 w-5 translate-x-0 group-data-[checked]:translate-x-5",
        lg: "h-6 w-6 translate-x-0 group-data-[checked]:translate-x-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);