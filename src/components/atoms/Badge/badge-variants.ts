import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
  {
    variants: {
      // 1. COLORS only (The "What")
      variant: {
        primary: "border-primary-200 text-primary-700",
        accent: "border-accent-200 text-accent-700",
        accent2: "border-accent2-200 text-accent2-700",
        success: "border-success-200 text-success-700",
        error: "border-error-200 text-error-700",
        neutral: "border-slate-200 text-slate-700", // Renamed 'outline' to 'neutral'
      },
      // 2. STYLES (The "How")
      fill: {
        soft: "bg-opacity-100", // Uses the colors defined above
        solid: "border-transparent text-white", // Overrides text color for contrast
        outline: "bg-transparent", // Removes background
      },
      statusBadge: {
        true: "rounded-full aspect-square p-0 flex items-center justify-center",
        false: "rounded-md",
      },
      size: {
        xs: "text-[10px] px-1.5 py-0.5 h-5 gap-x-1",
        sm: "text-xs px-2.5 py-0.5 h-6 gap-x-1.5",
        md: "text-sm px-3 py-1 h-7 gap-x-2",
      },
    },
    compoundVariants: [
      // --- SOFT (Default) ---
      // Adds the subtle background color
      { fill: "soft", variant: "primary", className: "bg-primary-50" },
      { fill: "soft", variant: "accent", className: "bg-accent-50" },
      { fill: "soft", variant: "accent2", className: "bg-accent2-50" },
      { fill: "soft", variant: "success", className: "bg-success-50" },
      { fill: "soft", variant: "error", className: "bg-error-50" },
      { fill: "soft", variant: "neutral", className: "bg-slate-50" },

      // --- SOLID ---
      // Swaps bg to strong color, removes border color conflict
      { fill: "solid", variant: "primary", className: "bg-primary-600 hover:bg-primary-700" },
      { fill: "solid", variant: "accent", className: "bg-accent-600 hover:bg-accent-700" },
      { fill: "solid", variant: "accent2", className: "bg-accent2-600 hover:bg-accent2-700" },
      { fill: "solid", variant: "success", className: "bg-success-600 hover:bg-success-700" },
      { fill: "solid", variant: "error", className: "bg-error-600 hover:bg-error-700" },
      { fill: "solid", variant: "neutral", className: "bg-slate-600 hover:bg-slate-700 text-white" },

      // --- OUTLINE ---
      // Background is already transparent (from fill definition), 
      // just ensuring borders are visible (from variant definition).
      // No extra overrides needed here unless you want thicker borders.

      // --- STATUS PILL SIZES ---
      { statusBadge: true, size: "xs", className: "w-5 h-5" },
      { statusBadge: true, size: "sm", className: "w-6 h-6" },
      { statusBadge: true, size: "md", className: "w-8 h-8" },
    ],
    defaultVariants: {
      variant: "primary",
      fill: "soft", // New default
      size: "sm",
      statusBadge: false,
    },
  }
);