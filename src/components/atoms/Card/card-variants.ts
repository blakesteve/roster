import { cva } from "class-variance-authority";

export const cardVariants = cva(
  // Base: relative and overflow-hidden are crucial for the branded stripes to clip.
  // `isolate` makes the card its own stacking context, so children stay beneath
  // the z-10 stripes without needing a wrapper element around them. See Card.tsx.
  "relative isolate w-full overflow-hidden rounded-xl transition-all",
  {
    variants: {
      variant: {
        // Driven by --roster-card-* so a themed app can retint the default
        // surface without per-usage overrides. The tokens flip under `.dark`,
        // so no dark: variants are needed. Defaults match the previous
        // white / gray-900 pair exactly.
        white:
          "bg-[var(--roster-card-bg)] border border-[var(--roster-card-border)] text-[var(--roster-card-text)] shadow-sm",
        
        // crisp light mode (gray-50) and translucent stained-glass dark mode
        soft:  
          "bg-gray-50 border border-gray-100 text-gray-900 dark:bg-gray-900/40 dark:border-gray-800/50 dark:text-gray-100",
        
        // Moody slate, baby.
        slate: 
          "bg-gray-700 border border-gray-600 text-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
        
        // Primary: Fully drenched in brand color.
        primary: 
          "bg-primary-600 border border-primary-700 text-white shadow-sm dark:bg-primary-900 dark:border-primary-800 dark:text-primary-50",
        
        // Outline: Transparent background, just the structural border.
        outline:
          "bg-transparent border border-gray-200 text-gray-900 dark:border-gray-800 dark:text-gray-100",
        
        // Ghost: Completely invisible structure until hovered (great for clickable cards).
        ghost:   
          "bg-transparent border border-transparent text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/50",
        
        // Upgraded to match the ActionBar's exact /50 frosted glass formula
        glass:
          "bg-white/50 border border-white/20 backdrop-blur-md text-gray-900 shadow-sm dark:bg-gray-950/50 dark:border-white/10 dark:text-gray-100 dark:shadow-black/50",
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