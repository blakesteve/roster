import { cva } from "class-variance-authority";

export const footerVariants = cva(
  "rst:w-full rst:py-6 rst:mt-auto rst:transition-colors rst:duration-200",
  {
    variants: {
      variant: {
        // Standard elevated surface that matches the app's default backgrounds.
        // Driven by --roster-footer-* so themed apps can retint it; the tokens
        // flip under `.dark` and reproduce the previous gray-50 / gray-900/50
        // pair, alpha included.
        default:
          "rst:bg-[var(--roster-footer-bg)] rst:text-[var(--roster-footer-text)] rst:border-t rst:border-[var(--roster-footer-border)]",
        
        // Deep brand color for high contrast
        primary: 
          "rst:bg-primary-900 rst:text-primary-200 rst:dark:bg-primary-950 rst:dark:text-primary-400",
        
        // No background or border, text adapts to whatever surface it's placed on
        transparent: 
          "rst:bg-transparent rst:text-gray-500 rst:dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);