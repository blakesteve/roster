import { cva } from "class-variance-authority";

export const footerVariants = cva(
  "w-full py-6 mt-auto transition-colors duration-200",
  {
    variants: {
      variant: {
        // Standard elevated surface that matches the app's default backgrounds.
        // Driven by --roster-footer-* so themed apps can retint it; the tokens
        // flip under `.dark` and reproduce the previous gray-50 / gray-900/50
        // pair, alpha included.
        default:
          "bg-[var(--roster-footer-bg)] text-[var(--roster-footer-text)] border-t border-[var(--roster-footer-border)]",
        
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