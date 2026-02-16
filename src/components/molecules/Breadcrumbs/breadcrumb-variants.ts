import { cva } from "class-variance-authority";

export const breadcrumbVariants = cva(
  "flex items-center text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-gray-500 hover:text-gray-900", 
        inverse: "text-gray-400 hover:text-white",     
        primary: "text-primary-600 hover:text-primary-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);