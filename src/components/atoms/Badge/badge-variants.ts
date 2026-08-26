import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "rst:font-ui rst:inline-flex rst:max-w-full rst:items-center rst:justify-center rst:font-medium rst:transition-colors rst:focus:outline-hidden rst:focus:ring-2 rst:focus:ring-ring rst:focus:ring-offset-2 rst:ring-offset-background rst:border",
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
        outline: "rst:bg-transparent",
      },
      statusBadge: {
        true: "rst:rounded-full rst:justify-center",
        false: "rst:rounded-md",
      },
      size: {
        xs: "rst:text-[10px] rst:px-1.5 rst:py-0.5 rst:h-5 rst:gap-x-1",
        sm: "rst:text-xs rst:px-2.5 rst:py-0.5 rst:h-6 rst:gap-x-1.5",
        md: "rst:text-sm rst:px-3 rst:py-1 rst:h-7 rst:gap-x-2",
      },
    },
    compoundVariants: [
      // --- SOFT (Crisp pastels in light mode, translucent in dark mode) ---
      { fill: "soft", variant: "primary", className: "rst:bg-primary-50 rst:border-primary-200 rst:text-primary-700 rst:dark:bg-primary-900/30 rst:dark:border-primary-800/50 rst:dark:text-primary-300" },
      { fill: "soft", variant: "orange",  className: "rst:bg-orange-50 rst:border-orange-200 rst:text-orange-700 rst:dark:bg-orange-900/30 rst:dark:border-orange-800/50 rst:dark:text-orange-300" },
      { fill: "soft", variant: "teal",    className: "rst:bg-teal-50 rst:border-teal-200 rst:text-teal-700 rst:dark:bg-teal-900/30 rst:dark:border-teal-800/50 rst:dark:text-teal-300" },
      { fill: "soft", variant: "purple",  className: "rst:bg-purple-50 rst:border-purple-200 rst:text-purple-700 rst:dark:bg-purple-900/30 rst:dark:border-purple-800/50 rst:dark:text-purple-300" },
      { fill: "soft", variant: "amber",   className: "rst:bg-amber-50 rst:border-amber-200 rst:text-amber-800 rst:dark:bg-amber-900/30 rst:dark:border-amber-800/50 rst:dark:text-amber-300" },
      { fill: "soft", variant: "success", className: "rst:bg-success-50 rst:border-success-200 rst:text-success-700 rst:dark:bg-success-900/30 rst:dark:border-success-800/50 rst:dark:text-success-300" },
      { fill: "soft", variant: "error",   className: "rst:bg-error-50 rst:border-error-200 rst:text-error-700 rst:dark:bg-error-900/30 rst:dark:border-error-800/50 rst:dark:text-error-300" },
      { fill: "soft", variant: "neutral", className: "rst:bg-gray-100 rst:border-gray-200 rst:text-gray-700 rst:dark:bg-gray-800/50 rst:dark:border-gray-700/50 rst:dark:text-gray-300" },

      // --- LIGHT (Slightly more vibrant middle ground) ---
      { fill: "light", variant: "primary", className: "rst:bg-primary-100 rst:border-primary-300 rst:text-primary-800 rst:dark:bg-primary-800/40 rst:dark:border-primary-700/50 rst:dark:text-primary-200" },
      { fill: "light", variant: "orange",  className: "rst:bg-orange-100 rst:border-orange-300 rst:text-orange-800 rst:dark:bg-orange-800/40 rst:dark:border-orange-700/50 rst:dark:text-orange-200" },
      { fill: "light", variant: "teal",    className: "rst:bg-teal-100 rst:border-teal-300 rst:text-teal-800 rst:dark:bg-teal-800/40 rst:dark:border-teal-700/50 rst:dark:text-teal-200" },
      { fill: "light", variant: "purple",  className: "rst:bg-purple-100 rst:border-purple-300 rst:text-purple-800 rst:dark:bg-purple-800/40 rst:dark:border-purple-700/50 rst:dark:text-purple-200" },
      { fill: "light", variant: "amber",   className: "rst:bg-amber-100 rst:border-amber-300 rst:text-amber-900 rst:dark:bg-amber-800/40 rst:dark:border-amber-700/50 rst:dark:text-amber-200" },
      { fill: "light", variant: "success", className: "rst:bg-success-100 rst:border-success-300 rst:text-success-800 rst:dark:bg-success-800/40 rst:dark:border-success-700/50 rst:dark:text-success-200" },
      { fill: "light", variant: "error",   className: "rst:bg-error-100 rst:border-error-300 rst:text-error-800 rst:dark:bg-error-800/40 rst:dark:border-error-700/50 rst:dark:text-error-200" },
      { fill: "light", variant: "neutral", className: "rst:bg-gray-200 rst:border-gray-300 rst:text-gray-800 rst:dark:bg-gray-700/50 rst:dark:border-gray-600/50 rst:dark:text-gray-200" },

      // --- OUTLINE (Beefed up the dark mode borders) ---
      { fill: "outline", variant: "primary", className: "rst:border-primary-600 rst:text-primary-600 rst:dark:border-primary-500 rst:dark:text-primary-400" },
      { fill: "outline", variant: "orange",  className: "rst:border-orange-600 rst:text-orange-600 rst:dark:border-orange-500 rst:dark:text-orange-400" },
      { fill: "outline", variant: "teal",    className: "rst:border-teal-600 rst:text-teal-600 rst:dark:border-teal-500 rst:dark:text-teal-400" },
      { fill: "outline", variant: "purple",  className: "rst:border-purple-600 rst:text-purple-600 rst:dark:border-purple-500 rst:dark:text-purple-400" },
      { fill: "outline", variant: "amber",   className: "rst:border-amber-600 rst:text-amber-600 rst:dark:border-amber-500 rst:dark:text-amber-400" },
      { fill: "outline", variant: "success", className: "rst:border-success-600 rst:text-success-600 rst:dark:border-success-500 rst:dark:text-success-400" },
      { fill: "outline", variant: "error",   className: "rst:border-error-600 rst:text-error-600 rst:dark:border-error-500 rst:dark:text-error-400" },
      { fill: "outline", variant: "neutral", className: "rst:border-gray-500 rst:text-gray-600 rst:dark:border-gray-500 rst:dark:text-gray-400" },

      // --- SOLID ---
      { fill: "solid", variant: "primary", className: "rst:border-transparent rst:bg-primary-500 rst:hover:bg-primary-600 rst:text-white rst:dark:bg-primary-600 rst:dark:hover:bg-primary-500" },
      { fill: "solid", variant: "orange",  className: "rst:border-transparent rst:bg-orange-500 rst:hover:bg-orange-400 rst:text-gray-950 rst:dark:bg-orange-600 rst:dark:hover:bg-orange-700 rst:dark:text-white" },
      { fill: "solid", variant: "teal",    className: "rst:border-transparent rst:bg-teal-500 rst:hover:bg-teal-600 rst:text-gray-950 rst:dark:bg-teal-600 rst:dark:hover:bg-teal-500" },
      { fill: "solid", variant: "purple",  className: "rst:border-transparent rst:bg-purple-500 rst:hover:bg-purple-400 rst:text-gray-950 rst:dark:bg-purple-600 rst:dark:hover:bg-purple-700 rst:dark:text-white" },
      { fill: "solid", variant: "amber",   className: "rst:border-transparent rst:bg-amber-400 rst:hover:bg-amber-500 rst:text-gray-950 rst:dark:bg-amber-500 rst:dark:hover:bg-amber-400" },
      { fill: "solid", variant: "success", className: "rst:border-transparent rst:bg-success-500 rst:hover:bg-success-400 rst:text-gray-950 rst:dark:bg-success-600 rst:dark:hover:bg-success-700 rst:dark:text-white" },
      { fill: "solid", variant: "error",   className: "rst:border-transparent rst:bg-error-500 rst:hover:bg-error-600 rst:text-white rst:dark:bg-error-600 rst:dark:hover:bg-error-500" },
      { fill: "solid", variant: "neutral", className: "rst:border-transparent rst:bg-gray-500 rst:hover:bg-gray-600 rst:text-white rst:dark:bg-gray-600 rst:dark:hover:bg-gray-500" },

      // --- STATUS PILL SIZES ---
      { statusBadge: true, size: "xs", className: "rst:min-w-[1.25rem] rst:h-5 rst:px-1" },
      { statusBadge: true, size: "sm", className: "rst:min-w-[1.5rem] rst:h-6 rst:px-1.5" },
      { statusBadge: true, size: "md", className: "rst:min-w-[1.75rem] rst:h-7 rst:px-2" },
    ],
    defaultVariants: {
      variant: "primary",
      fill: "solid",
      size: "sm",
      statusBadge: false,
    },
  }
);