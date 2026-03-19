import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex max-w-full items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
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
        light: "",
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
      // --- SOFT (Crisp pastels in light mode, translucent in dark mode) ---
      { fill: "soft", variant: "primary", className: "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800/50 dark:text-primary-300" },
      { fill: "soft", variant: "orange",  className: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-300" },
      { fill: "soft", variant: "teal",    className: "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-800/50 dark:text-teal-300" },
      { fill: "soft", variant: "purple",  className: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-300" },
      { fill: "soft", variant: "amber",   className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-300" },
      { fill: "soft", variant: "success", className: "bg-success-50 border-success-200 text-success-700 dark:bg-success-900/30 dark:border-success-800/50 dark:text-success-300" },
      { fill: "soft", variant: "error",   className: "bg-error-50 border-error-200 text-error-700 dark:bg-error-900/30 dark:border-error-800/50 dark:text-error-300" },
      { fill: "soft", variant: "neutral", className: "bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-300" },

      // --- LIGHT (Slightly more vibrant middle ground) ---
      { fill: "light", variant: "primary", className: "bg-primary-100 border-primary-300 text-primary-800 dark:bg-primary-800/40 dark:border-primary-700/50 dark:text-primary-200" },
      { fill: "light", variant: "orange",  className: "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-800/40 dark:border-orange-700/50 dark:text-orange-200" },
      { fill: "light", variant: "teal",    className: "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-800/40 dark:border-teal-700/50 dark:text-teal-200" },
      { fill: "light", variant: "purple",  className: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-800/40 dark:border-purple-700/50 dark:text-purple-200" },
      { fill: "light", variant: "amber",   className: "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-800/40 dark:border-amber-700/50 dark:text-amber-200" },
      { fill: "light", variant: "success", className: "bg-success-100 border-success-300 text-success-800 dark:bg-success-800/40 dark:border-success-700/50 dark:text-success-200" },
      { fill: "light", variant: "error",   className: "bg-error-100 border-error-300 text-error-800 dark:bg-error-800/40 dark:border-error-700/50 dark:text-error-200" },
      { fill: "light", variant: "neutral", className: "bg-gray-200 border-gray-300 text-gray-800 dark:bg-gray-700/50 dark:border-gray-600/50 dark:text-gray-200" },

      // --- OUTLINE (Beefed up the dark mode borders) ---
      { fill: "outline", variant: "primary", className: "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400" },
      { fill: "outline", variant: "orange",  className: "border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-400" },
      { fill: "outline", variant: "teal",    className: "border-teal-600 text-teal-600 dark:border-teal-500 dark:text-teal-400" },
      { fill: "outline", variant: "purple",  className: "border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400" },
      { fill: "outline", variant: "amber",   className: "border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-400" },
      { fill: "outline", variant: "success", className: "border-success-600 text-success-600 dark:border-success-500 dark:text-success-400" },
      { fill: "outline", variant: "error",   className: "border-error-600 text-error-600 dark:border-error-500 dark:text-error-400" },
      { fill: "outline", variant: "neutral", className: "border-gray-500 text-gray-600 dark:border-gray-500 dark:text-gray-400" },

      // --- SOLID ---
      { fill: "solid", variant: "primary", className: "border-transparent bg-primary-500 hover:bg-primary-600 text-white dark:bg-primary-600 dark:hover:bg-primary-500" },
      { fill: "solid", variant: "orange",  className: "border-transparent bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-500" },
      { fill: "solid", variant: "teal",    className: "border-transparent bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-600 dark:hover:bg-teal-500" },
      { fill: "solid", variant: "purple",  className: "border-transparent bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-500" },
      { fill: "solid", variant: "amber",   className: "border-transparent bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-gray-900" },
      { fill: "solid", variant: "success", className: "border-transparent bg-success-500 hover:bg-success-600 text-white dark:bg-success-600 dark:hover:bg-success-500" },
      { fill: "solid", variant: "error",   className: "border-transparent bg-error-500 hover:bg-error-600 text-white dark:bg-error-600 dark:hover:bg-error-500" },
      { fill: "solid", variant: "neutral", className: "border-transparent bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500" },

      // --- STATUS PILL SIZES ---
      { statusBadge: true, size: "xs", className: "min-w-[1.25rem] h-5 px-1" },
      { statusBadge: true, size: "sm", className: "min-w-[1.5rem] h-6 px-1.5" },
      { statusBadge: true, size: "md", className: "min-w-[1.75rem] h-7 px-2" },
    ],
    defaultVariants: {
      variant: "primary",
      fill: "solid",
      size: "sm",
      statusBadge: false,
    },
  }
);