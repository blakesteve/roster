import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
  {
    variants: {
      variant: {
        primary: "",
        orange:  "",
        teal:    "",
        purple:  "",
        amber:   "",
        success: "",
        error:   "",
        neutral: "",
      },
      fill: {
        soft: "",
        solid: "",
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
      // --- SOFT ---
      // Changed text to 600 to guarantee it renders using the known palette values
      { fill: "soft", variant: "primary", className: "bg-primary-500/15 border-primary-500/20 text-primary-600 dark:text-primary-300" },
      { fill: "soft", variant: "orange",  className: "bg-orange-500/15 border-orange-500/20 text-orange-600 dark:text-orange-300" },
      { fill: "soft", variant: "teal",    className: "bg-teal-500/15 border-teal-500/20 text-teal-600 dark:text-teal-300" },
      { fill: "soft", variant: "purple",  className: "bg-purple-500/15 border-purple-500/20 text-purple-600 dark:text-purple-300" },
      { fill: "soft", variant: "amber",   className: "bg-amber-500/15 border-amber-500/20 text-amber-700 dark:text-amber-300" },
      { fill: "soft", variant: "success", className: "bg-success-500/15 border-success-500/20 text-success-600 dark:text-success-300" },
      { fill: "soft", variant: "error",   className: "bg-error-500/15 border-error-500/20 text-error-600 dark:text-error-300" },
      { fill: "soft", variant: "neutral", className: "bg-gray-500/15 border-gray-500/20 text-gray-700 dark:text-gray-300" },

      // --- OUTLINE ---
      // Synced text AND border to the 600 level to match the intensity of the Solid variants
      { fill: "outline", variant: "primary", className: "border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400" },
      { fill: "outline", variant: "orange",  className: "border-orange-600 text-orange-600 dark:text-orange-400 dark:border-orange-400" },
      { fill: "outline", variant: "teal",    className: "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400" },
      { fill: "outline", variant: "purple",  className: "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400" },
      { fill: "outline", variant: "amber",   className: "border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400" },
      { fill: "outline", variant: "success", className: "border-success-600 text-success-600 dark:text-success-400 dark:border-success-400" },
      { fill: "outline", variant: "error",   className: "border-error-600 text-error-600 dark:text-error-400 dark:border-error-400" },
      { fill: "outline", variant: "neutral", className: "border-gray-500 text-gray-600 dark:text-gray-400 dark:border-gray-400" },

      // --- SOLID ---
      { fill: "solid", variant: "primary", className: "border-transparent bg-primary-500 hover:bg-primary-600 text-white" },
      { fill: "solid", variant: "orange",  className: "border-transparent bg-orange-500 hover:bg-orange-600 text-white" },
      { fill: "solid", variant: "teal",    className: "border-transparent bg-teal-500 hover:bg-teal-600 text-white" },
      { fill: "solid", variant: "purple",  className: "border-transparent bg-purple-500 hover:bg-purple-600 text-white" },
      { fill: "solid", variant: "amber",   className: "border-transparent bg-amber-500 hover:bg-amber-600 text-black dark:text-black" },
      { fill: "solid", variant: "success", className: "border-transparent bg-success-500 hover:bg-success-600 text-white" },
      { fill: "solid", variant: "error",   className: "border-transparent bg-error-500 hover:bg-error-600 text-white" },
      { fill: "solid", variant: "neutral", className: "border-transparent bg-gray-500 hover:bg-gray-600 text-white" },

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