import { cva } from "class-variance-authority";

export const navbarVariants = cva(
  "w-full z-30 border-b transition-colors duration-200",
  {
    variants: {
      variant: {
        slate: "bg-gray-700 border-gray-600 text-gray-100", 
        primary: "bg-primary-900 border-primary-800 text-white", 
        white: "bg-white border-gray-200 text-gray-900",
        transparent: "bg-transparent border-transparent text-white",
      },
      position: {
        fixed: "fixed top-0 left-0 right-0",
        sticky: "sticky top-0",
        static: "static",
      },
    },
    defaultVariants: {
      variant: "slate",
      position: "fixed",
    },
  }
);