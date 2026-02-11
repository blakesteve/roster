import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden font-semibold border transition-colors focus:outline-hidden select-none shrink-0",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-xl",
      },
      colorScheme: {
        primary: "bg-primary-100 text-primary-700 border-primary-200",
        orange:  "bg-orange-100 text-orange-700 border-orange-200",
        teal:    "bg-teal-100 text-teal-700 border-teal-200",
        purple:  "bg-purple-100 text-purple-700 border-purple-200",
        amber:   "bg-amber-100 text-amber-700 border-amber-200",
        success: "bg-success-100 text-success-700 border-success-200",
        error:   "bg-error-100 text-error-700 border-error-200",
        neutral: "bg-gray-100 text-gray-700 border-gray-200",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      size: "md",
      colorScheme: "primary",
      shape: "circle",
    },
  }
);
