import { cva } from "class-variance-authority";

export const cardVariants = cva(
  // Base: relative and overflow-hidden are crucial for the branded stripes to clip.
  // `isolate` makes the card its own stacking context, so children stay beneath
  // the z-10 stripes without needing a wrapper element around them. See Card.tsx.
  "rst:relative rst:isolate rst:w-full rst:overflow-hidden rst:rounded-xl rst:transition-all",
  {
    variants: {
      variant: {
        // Driven by --roster-card-* so a themed app can retint the default
        // surface without per-usage overrides. The tokens flip under `.dark`,
        // so no dark: variants are needed. Defaults match the previous
        // white / gray-900 pair exactly.
        white:
          "rst:bg-[var(--roster-card-bg)] rst:border rst:border-[var(--roster-card-border)] rst:text-[var(--roster-card-text)] rst:shadow-sm",
        
        // crisp light mode (gray-50) and translucent stained-glass dark mode
        soft:  
          "rst:bg-gray-50 rst:border rst:border-gray-100 rst:text-gray-900 rst:dark:bg-gray-900/40 rst:dark:border-gray-800/50 rst:dark:text-gray-100",
        
        // Moody slate, baby.
        slate: 
          "rst:bg-gray-700 rst:border rst:border-gray-600 rst:text-gray-100 rst:shadow-sm rst:dark:bg-gray-800 rst:dark:border-gray-700 rst:dark:text-gray-100",
        
        // Primary: Fully drenched in brand color.
        primary: 
          "rst:bg-primary-600 rst:border rst:border-primary-700 rst:text-white rst:shadow-sm rst:dark:bg-primary-900 rst:dark:border-primary-800 rst:dark:text-primary-50",
        
        // Outline: Transparent background, just the structural border.
        outline:
          "rst:bg-transparent rst:border rst:border-gray-200 rst:text-gray-900 rst:dark:border-gray-800 rst:dark:text-gray-100",
        
        // Ghost: Completely invisible structure until hovered (great for clickable cards).
        ghost:   
          "rst:bg-transparent rst:border rst:border-transparent rst:text-gray-900 rst:hover:bg-gray-50 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800/50",
        
        // Upgraded to match the ActionBar's exact /50 frosted glass formula
        glass:
          "rst:bg-white/50 rst:border rst:border-white/20 rst:backdrop-blur-md rst:text-gray-900 rst:shadow-sm rst:dark:bg-gray-950/50 rst:dark:border-white/10 rst:dark:text-gray-100 rst:dark:shadow-black/50",
      },
      padding: {
        none: "rst:p-0",
        sm: "rst:p-4",
        md: "rst:p-6",
        lg: "rst:p-8",
      },
    },
    defaultVariants: {
      variant: "white",
      padding: "md",
    },
  }
);