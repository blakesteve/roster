import { cva } from "class-variance-authority";

export const navbarVariants = cva(
  "w-full z-30 border-b transition-colors duration-200",
  {
    variants: {
      variant: {
        // White in light mode, deep gray-950 in dark mode.
        default:
          "bg-white border-gray-200 text-gray-900 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100",
          
        // Slate: A solid mid-dark gray in light mode, drops to a moody gray in dark mode
        slate: 
          "bg-gray-700 border-gray-600 text-gray-100 dark:bg-gray-900 dark:border-gray-800", 
        
        // Primary: Bold brand color in light mode, deep rich brand color in dark mode
        primary: 
          "bg-primary-700 border-primary-600 text-white dark:bg-primary-950 dark:border-primary-900", 
        
        // White: Crisp white in light mode, elevated surface gray in dark mode
        white: 
          "bg-white border-gray-200 text-gray-900 dark:bg-gray-600 dark:border-gray-700 dark:text-gray-100",
        
        // Transparent: Stays invisible, adapts text for standard readability
        transparent: 
          "bg-transparent border-transparent text-gray-900 dark:text-white",
      },
      position: {
        fixed: "fixed top-0 left-0 right-0",
        sticky: "sticky top-0",
        static: "static",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "sticky",
    },
  }
);