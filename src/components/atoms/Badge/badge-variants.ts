import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
  {
    variants: {
      variant: {
        primary: "border-primary-200 text-primary-700",
        orange:  "border-orange-200 text-orange-700",
        teal:    "border-teal-200 text-teal-700",
        purple:  "border-purple-200 text-purple-700",
        amber:   "border-amber-200 text-amber-700",
        success: "border-success-200 text-success-700",
        error:   "border-error-200 text-error-700",
        neutral: "border-gray-200 text-gray-700",
      },
      fill: {
        soft: "", // Background color handled by compound variants
        solid: "border-transparent text-white",
        outline: "bg-transparent",
      },
      statusBadge: {
        true: "rounded-full justify-center",
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
      // Using /15 opacity on 500 for perfect tint matching
      { fill: "soft", variant: "primary", className: "bg-primary-500/15" },
      { fill: "soft", variant: "orange",  className: "bg-orange-500/15" },
      { fill: "soft", variant: "teal",    className: "bg-teal-500/15" },
      { fill: "soft", variant: "purple",  className: "bg-purple-500/15" },
      { fill: "soft", variant: "amber",   className: "bg-amber-500/15" },
      { fill: "soft", variant: "success", className: "bg-success-500/15" },
      { fill: "soft", variant: "error",   className: "bg-error-500/15" },
      { fill: "soft", variant: "neutral", className: "bg-gray-500/15" },

      // --- SOLID ---
      { fill: "solid", variant: "primary", className: "bg-primary-500 hover:bg-primary-600" },
      { fill: "solid", variant: "orange",  className: "bg-orange-500 hover:bg-orange-600" },
      { fill: "solid", variant: "teal",    className: "bg-teal-500 hover:bg-teal-600" },
      { fill: "solid", variant: "purple",  className: "bg-purple-500 hover:bg-purple-600" },
      { fill: "solid", variant: "amber",   className: "bg-amber-500 hover:bg-amber-600" },
      { fill: "solid", variant: "success", className: "bg-success-500 hover:bg-success-600" },
      { fill: "solid", variant: "error",   className: "bg-error-500 hover:bg-error-600" },
      { fill: "solid", variant: "neutral", className: "bg-gray-500 hover:bg-gray-600 text-white" },

      // --- STATUS PILL SIZES ---
      { statusBadge: true, size: "xs", className: "min-w-[1.25rem] h-5 px-1" },
      { statusBadge: true, size: "sm", className: "min-w-[1.5rem] h-6 px-1.5" },
      { statusBadge: true, size: "md", className: "min-w-[1.75rem] h-7 px-2" },
    ],
    defaultVariants: {
      variant: "primary",
      fill: "soft",
      size: "sm",
      statusBadge: false,
    },
  }
);