import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "border border-transparent shadow-sm",
        soft: "border-transparent shadow-none",
        outline: "border bg-transparent shadow-sm",
        ghost: "border border-transparent bg-transparent",
        link: "bg-transparent underline-offset-4 hover:underline",
      },
      colorScheme: {
        primary: "",
        orange: "",
        teal: "",
        purple: "",
        amber: "",
        success: "",
        error: "",
        neutral: "",
      },
      size: {
        xs: "h-7 rounded px-2 text-xs",
        sm: "h-9 rounded-md px-3",
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      // --- SOLID VARIANTS (Bold Backgrounds) ---
      { variant: "solid", colorScheme: "primary", className: "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500" },
      { variant: "solid", colorScheme: "orange",  className: "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500" },
      { variant: "solid", colorScheme: "teal",    className: "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500" },
      { variant: "solid", colorScheme: "purple",  className: "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500" },
      { variant: "solid", colorScheme: "amber",   className: "bg-amber-400 text-black hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-gray-900" },
      { variant: "solid", colorScheme: "success", className: "bg-success-600 text-white hover:bg-success-700 dark:bg-success-600 dark:hover:bg-success-500" },
      { variant: "solid", colorScheme: "error",   className: "bg-error-600 text-white hover:bg-error-700 dark:bg-error-600 dark:hover:bg-error-500" },
      { variant: "solid", colorScheme: "neutral", className: "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500" },

      // --- SOFT VARIANTS (Crisp Light Mode, Translucent Dark Mode) ---
      { variant: "soft", colorScheme: "primary", className: "bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60" },
      { variant: "soft", colorScheme: "orange",  className: "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50" },
      { variant: "soft", colorScheme: "teal",    className: "bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50" },
      { variant: "soft", colorScheme: "purple",  className: "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50" },
      { variant: "soft", colorScheme: "amber",   className: "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50" },
      { variant: "soft", colorScheme: "success", className: "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-300 dark:hover:bg-success-900/50" },
      { variant: "soft", colorScheme: "error",   className: "bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-900/30 dark:text-error-300 dark:hover:bg-error-900/50" },
      { variant: "soft", colorScheme: "neutral", className: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800" },

      // --- OUTLINE VARIANTS (Borders + Colored Adaptive Text + Transparent Hover) ---
      { variant: "outline", colorScheme: "primary", className: "border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-500/10" },
      { variant: "outline", colorScheme: "orange",  className: "border-orange-600 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-500/10" },
      { variant: "outline", colorScheme: "teal",    className: "border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-500/10" },
      { variant: "outline", colorScheme: "purple",  className: "border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-500/10" },
      { variant: "outline", colorScheme: "amber",   className: "border-amber-600 text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-500/10" },
      { variant: "outline", colorScheme: "success", className: "border-success-600 text-success-600 hover:bg-success-50 dark:border-success-500 dark:text-success-400 dark:hover:bg-success-500/10" },
      { variant: "outline", colorScheme: "error",   className: "border-error-600 text-error-600 hover:bg-error-50 dark:border-error-500 dark:text-error-400 dark:hover:bg-error-500/10" },
      { variant: "outline", colorScheme: "neutral", className: "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/50" },

      // --- GHOST VARIANTS (Adaptive Text + Transparent Hover) ---
      { variant: "ghost", colorScheme: "primary", className: "text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10" },
      { variant: "ghost", colorScheme: "orange",  className: "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10" },
      { variant: "ghost", colorScheme: "teal",    className: "text-teal-600 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-teal-500/10" },
      { variant: "ghost", colorScheme: "purple",  className: "text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10" },
      { variant: "ghost", colorScheme: "amber",   className: "text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-500/10" },
      { variant: "ghost", colorScheme: "success", className: "text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10" },
      { variant: "ghost", colorScheme: "error",   className: "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10" },
      { variant: "ghost", colorScheme: "neutral", className: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50" },

      // --- LINK VARIANTS (Adaptive Text Only + Underline) ---
      { variant: "link", colorScheme: "primary", className: "text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300" },
      { variant: "link", colorScheme: "orange",  className: "text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300" },
      { variant: "link", colorScheme: "teal",    className: "text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300" },
      { variant: "link", colorScheme: "purple",  className: "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300" },
      { variant: "link", colorScheme: "amber",   className: "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300" },
      { variant: "link", colorScheme: "success", className: "text-success-600 hover:text-success-700 dark:text-success-400 dark:hover:text-success-300" },
      { variant: "link", colorScheme: "error",   className: "text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300" },
      { variant: "link", colorScheme: "neutral", className: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "default",
    },
  }
);
