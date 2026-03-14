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
      { variant: "solid", colorScheme: "primary", className: "bg-primary-600 text-white hover:bg-primary-700" },
      { variant: "solid", colorScheme: "orange",  className: "bg-orange-500 text-white hover:bg-orange-600" },
      { variant: "solid", colorScheme: "teal",    className: "bg-teal-500 text-white hover:bg-teal-600" },
      { variant: "solid", colorScheme: "purple",  className: "bg-purple-500 text-white hover:bg-purple-600" },
      { variant: "solid", colorScheme: "amber",   className: "bg-amber-400 text-black hover:bg-amber-500" },
      { variant: "solid", colorScheme: "success", className: "bg-success-600 text-white hover:bg-success-700" },
      { variant: "solid", colorScheme: "error",   className: "bg-error-600 text-white hover:bg-error-700" },
      { variant: "solid", colorScheme: "neutral", className: "bg-gray-600 text-white hover:bg-gray-700" },

      // --- SOFT VARIANTS (Transparent Background Tints + Adaptive Text) ---
      { variant: "soft", colorScheme: "primary", className: "bg-primary-500/15 text-primary-700 dark:text-primary-300 hover:bg-primary-500/25" },
      { variant: "soft", colorScheme: "orange",  className: "bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/25" },
      { variant: "soft", colorScheme: "teal",    className: "bg-teal-500/15 text-teal-700 dark:text-teal-300 hover:bg-teal-500/25" },
      { variant: "soft", colorScheme: "purple",  className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25" },
      { variant: "soft", colorScheme: "amber",   className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25" },
      { variant: "soft", colorScheme: "success", className: "bg-success-500/15 text-success-700 dark:text-success-300 hover:bg-success-500/25" },
      { variant: "soft", colorScheme: "error",   className: "bg-error-500/15 text-error-700 dark:text-error-300 hover:bg-error-500/25" },
      { variant: "soft", colorScheme: "neutral", className: "bg-gray-500/15 text-gray-700 dark:text-gray-300 hover:bg-gray-500/25" },

      // --- OUTLINE VARIANTS (Borders + Colored Adaptive Text + Transparent Hover) ---
      { variant: "outline", colorScheme: "primary", className: "border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-500/10" },
      { variant: "outline", colorScheme: "orange",  className: "border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10" },
      { variant: "outline", colorScheme: "teal",    className: "border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10" },
      { variant: "outline", colorScheme: "purple",  className: "border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10" },
      { variant: "outline", colorScheme: "amber",   className: "border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10" },
      { variant: "outline", colorScheme: "success", className: "border-success-500 text-success-600 dark:text-success-400 hover:bg-success-500/10" },
      { variant: "outline", colorScheme: "error",   className: "border-error-500 text-error-600 dark:text-error-400 hover:bg-error-500/10" },
      { variant: "outline", colorScheme: "neutral", className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-500/10" },

      // --- GHOST VARIANTS (Adaptive Text + Transparent Hover) ---
      { variant: "ghost", colorScheme: "primary", className: "text-primary-600 dark:text-primary-400 hover:bg-primary-500/10" },
      { variant: "ghost", colorScheme: "orange",  className: "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10" },
      { variant: "ghost", colorScheme: "teal",    className: "text-teal-600 dark:text-teal-400 hover:bg-teal-500/10" },
      { variant: "ghost", colorScheme: "purple",  className: "text-purple-600 dark:text-purple-400 hover:bg-purple-500/10" },
      { variant: "ghost", colorScheme: "amber",   className: "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10" },
      { variant: "ghost", colorScheme: "success", className: "text-success-600 dark:text-success-400 hover:bg-success-500/10" },
      { variant: "ghost", colorScheme: "error",   className: "text-error-600 dark:text-error-400 hover:bg-error-500/10" },
      { variant: "ghost", colorScheme: "neutral", className: "text-gray-600 dark:text-gray-400 hover:bg-gray-500/10" },

      // --- LINK VARIANTS (Adaptive Text Only + Underline) ---
      { variant: "link", colorScheme: "primary", className: "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300" },
      { variant: "link", colorScheme: "orange",  className: "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300" },
      { variant: "link", colorScheme: "teal",    className: "text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300" },
      { variant: "link", colorScheme: "purple",  className: "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300" },
      { variant: "link", colorScheme: "amber",   className: "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300" },
      { variant: "link", colorScheme: "success", className: "text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300" },
      { variant: "link", colorScheme: "error",   className: "text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300" },
      { variant: "link", colorScheme: "neutral", className: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "default",
    },
  }
);