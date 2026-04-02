import { cva } from "class-variance-authority";

export const checkboxVariants = cva(
  "flex items-center justify-center shrink-0 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        sm: "h-4 w-4 rounded-sm border",
        md: "h-5 w-5 rounded border",
        lg: "h-6 w-6 rounded-md border-[1.5px]",
      },
      variant: {
        solid: "",
        soft: "",
      },
      checked: {
        true: "",
        false: "bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-700 text-transparent",
      },
      colorScheme: {
        primary: "", orange: "", teal: "", purple: "", amber: "", success: "", error: "", neutral: "",
      },
    },
    compoundVariants: [
      // --- SOLID VARIANTS ---
      { checked: true, variant: "solid", colorScheme: "primary", className: "bg-primary-600 border-primary-600 text-white dark:bg-primary-600 dark:border-primary-500" },
      { checked: true, variant: "solid", colorScheme: "orange",  className: "bg-orange-600 border-orange-600 text-white dark:bg-orange-600 dark:border-orange-500" },
      { checked: true, variant: "solid", colorScheme: "teal",    className: "bg-teal-600 border-teal-600 text-white dark:bg-teal-600 dark:border-teal-500" },
      { checked: true, variant: "solid", colorScheme: "purple",  className: "bg-purple-600 border-purple-600 text-white dark:bg-purple-600 dark:border-purple-500" },
      { checked: true, variant: "solid", colorScheme: "amber",   className: "bg-amber-400 border-amber-400 text-black dark:bg-amber-500 dark:border-amber-500 dark:text-gray-900" },
      { checked: true, variant: "solid", colorScheme: "success", className: "bg-success-600 border-success-600 text-white dark:bg-success-600 dark:border-success-500" },
      { checked: true, variant: "solid", colorScheme: "error",   className: "bg-error-600 border-error-600 text-white dark:bg-error-600 dark:border-error-500" },
      { checked: true, variant: "solid", colorScheme: "neutral", className: "bg-gray-600 border-gray-600 text-white dark:bg-gray-600 dark:border-gray-500" },

      // --- SOFT VARIANTS ---
      { checked: true, variant: "soft", colorScheme: "primary", className: "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/40 dark:border-primary-800/50 dark:text-primary-300" },
      { checked: true, variant: "soft", colorScheme: "orange",  className: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-300" },
      { checked: true, variant: "soft", colorScheme: "teal",    className: "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/30 dark:border-teal-800/50 dark:text-teal-300" },
      { checked: true, variant: "soft", colorScheme: "purple",  className: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-300" },
      { checked: true, variant: "soft", colorScheme: "amber",   className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-300" },
      { checked: true, variant: "soft", colorScheme: "success", className: "bg-success-50 border-success-200 text-success-700 dark:bg-success-900/30 dark:border-success-800/50 dark:text-success-300" },
      { checked: true, variant: "soft", colorScheme: "error",   className: "bg-error-50 border-error-200 text-error-700 dark:bg-error-900/30 dark:border-error-800/50 dark:text-error-300" },
      { checked: true, variant: "soft", colorScheme: "neutral", className: "bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-300" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "md",
      checked: false,
    },
  }
);