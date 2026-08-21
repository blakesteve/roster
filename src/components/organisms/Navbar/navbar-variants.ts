import { cva } from "class-variance-authority";

export const navbarVariants = cva(
  "rst:w-full rst:z-30 rst:border-b rst:transition-colors rst:duration-200",
  {
    variants: {
      variant: {
        // Driven by --roster-nav-* so a themed app can retint the bar without
        // selector overrides. The tokens themselves flip under `.dark`, so no
        // dark: variants are needed here. Defaults match the previous
        // white / gray-950 pair exactly.
        default:
          "rst:bg-[var(--roster-nav-bg)] rst:border-[var(--roster-nav-border)] rst:text-[var(--roster-nav-text)]",
          
        // Slate: A solid mid-dark gray in light mode, drops to a moody gray in dark mode
        slate: 
          "rst:bg-gray-700 rst:border-gray-600 rst:text-gray-100 rst:dark:bg-gray-900 rst:dark:border-gray-800", 
        
        // Primary: Bold brand color in light mode, deep rich brand color in dark mode
        primary: 
          "rst:bg-primary-700 rst:border-primary-600 rst:text-white rst:dark:bg-primary-950 rst:dark:border-primary-900", 
        
        // White: Crisp white in light mode, elevated surface gray in dark mode
        white: 
          "rst:bg-white rst:border-gray-200 rst:text-gray-900 rst:dark:bg-gray-600 rst:dark:border-gray-700 rst:dark:text-gray-100",
        
        // Transparent: Stays invisible, adapts text for standard readability
        transparent: 
          "rst:bg-transparent rst:border-transparent rst:text-gray-900 rst:dark:text-white",
      },
      position: {
        fixed: "rst:fixed rst:top-0 rst:left-0 rst:right-0",
        sticky: "rst:sticky rst:top-0",
        static: "rst:static",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "sticky",
    },
  }
);