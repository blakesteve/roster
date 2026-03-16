import { cva } from "class-variance-authority";

export const footerVariants = cva(
  "w-full py-6 mt-auto transition-colors duration-200",
  {
    variants: {
      variant: {
        // Standard elevated surface that matches the app's default backgrounds
        default: 
          "bg-gray-50 text-gray-500 border-t border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800",
        
        // Deep brand color for high contrast
        primary: 
          "bg-primary-900 text-primary-200 dark:bg-primary-950 dark:text-primary-400",
        
        // No background or border, text adapts to whatever surface it's placed on
        transparent: 
          "bg-transparent text-gray-500 dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);