import { cva } from "class-variance-authority";

export const cardVariants = cva(
  // Base: relative and overflow-hidden are crucial for the branded stripes to clip.
  "relative w-full overflow-hidden rounded-xl transition-all",
  {
    variants: {
      variant: {
        // White: The standard clean card. White in light mode, elevated gray in dark mode.
        white: 
          "bg-white border border-gray-200 text-gray-900 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
        
        // A subtle gray background without a heavy border.
        soft:  
          "bg-gray-200 border border-transparent text-gray-900 dark:bg-gray-900/50 dark:border-gray-800 dark:text-gray-100",
        
        // Moody slate, baby.
        slate: 
          "bg-gray-700 border border-gray-600 text-gray-100 shadow-sm dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
        
        // Primary: Fully drenched in brand color.
        primary: 
          "bg-primary-700 border border-primary-600 text-white shadow-sm dark:bg-primary-950 dark:border-primary-900",
        
        // Outline: Transparent background, just the structural border.
        outline:
          "bg-transparent border border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-100",
        
        // Ghost: Completely invisible structure until hovered (great for clickable cards).
        ghost:   
          "bg-transparent border border-transparent text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/50",
        
        // Glass: The premium frosted look.
        glass:
          "bg-white/80 border border-white/20 backdrop-blur-xl text-gray-900 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/50 dark:text-white dark:shadow-black/50",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "white",
      padding: "md",
    },
  }
);