import { cva } from "class-variance-authority";

export const footerVariants = /* @__PURE__ */ cva(
  "rst:font-ui rst:w-full rst:py-6 rst:mt-auto rst:transition-colors rst:duration-200",
  {
    variants: {
      variant: {
        // Standard elevated surface that matches the app's default backgrounds.
        // Driven by --roster-footer-* so themed apps can retint it; the tokens
        // flip under `.dark` and reproduce the previous gray-50 / gray-900/50
        // pair, alpha included.
        default:
          "rst:bg-[var(--roster-footer-bg)] rst:text-[var(--roster-footer-text)] rst:border-t rst:border-[var(--roster-footer-border)]",
        
        // Deep brand color for high contrast. Dark in both themes, so it
        // carries its own ring, as Dialog's `primary` does: the page's light
        // ring, primary-500, is 2.56:1 on primary-900, and primary-400 is
        // 6.04. The offset is the footer's own fill.
        primary:
          "rst:bg-primary-900 rst:text-primary-200 rst:dark:bg-primary-950 rst:dark:text-primary-400 rst:[--roster-ring:var(--roster-primary-400,#5ea3de)] rst:[--roster-ring-offset:var(--roster-primary-900,#042235)] rst:dark:[--roster-ring-offset:var(--roster-primary-950,#021724)]",
        
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