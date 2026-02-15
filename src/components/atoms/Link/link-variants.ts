import { cva } from "class-variance-authority";

export const linkVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm cursor-pointer",
  {
    variants: {
      variant: {
        primary: "text-primary-500 hover:text-primary-600",
        neutral: "text-gray-600 hover:text-gray-900",
        danger:  "text-error-600 hover:text-error-700",
        white:   "text-gray-200 hover:text-white", // MegaLink style
      },
      underline: {
        always: "underline underline-offset-4",
        hover:  "no-underline hover:underline underline-offset-4",
        none:   "no-underline",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      underline: "hover",
      size: "md",
    },
  }
);