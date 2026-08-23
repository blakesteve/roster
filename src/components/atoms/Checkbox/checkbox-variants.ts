import { cva } from "class-variance-authority";

export const checkboxVariants = cva(
  "rst:font-ui rst:flex rst:items-center rst:justify-center rst:shrink-0 rst:transition-colors rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        sm: "rst:h-4 rst:w-4 rst:rounded-sm rst:border",
        md: "rst:h-5 rst:w-5 rst:rounded rst:border",
        lg: "rst:h-6 rst:w-6 rst:rounded-md rst:border",
      },
      variant: {
        solid: "",
        soft: "",
      },
      checked: {
        true: "",
        false: "rst:bg-white rst:border-gray-300 rst:dark:bg-gray-900 rst:dark:border-gray-700 rst:text-transparent",
      },
      colorScheme: {
        primary: "", orange: "", teal: "", purple: "", amber: "", success: "", error: "", neutral: "",
      },
    },
    compoundVariants: [
      // --- SOLID VARIANTS ---
      { checked: true, variant: "solid", colorScheme: "primary", className: "rst:bg-primary-600 rst:border-primary-600 rst:text-white rst:dark:bg-primary-600 rst:dark:border-primary-500" },
      { checked: true, variant: "solid", colorScheme: "orange",  className: "rst:bg-orange-600 rst:border-orange-600 rst:text-white rst:dark:bg-orange-600 rst:dark:border-orange-500" },
      { checked: true, variant: "solid", colorScheme: "teal",    className: "rst:bg-teal-600 rst:border-teal-600 rst:text-white rst:dark:bg-teal-600 rst:dark:border-teal-500" },
      { checked: true, variant: "solid", colorScheme: "purple",  className: "rst:bg-purple-600 rst:border-purple-600 rst:text-white rst:dark:bg-purple-600 rst:dark:border-purple-500" },
      { checked: true, variant: "solid", colorScheme: "amber",   className: "rst:bg-amber-400 rst:border-amber-400 rst:text-black rst:dark:bg-amber-500 rst:dark:border-amber-500 rst:dark:text-gray-900" },
      { checked: true, variant: "solid", colorScheme: "success", className: "rst:bg-success-600 rst:border-success-600 rst:text-white rst:dark:bg-success-600 rst:dark:border-success-500" },
      { checked: true, variant: "solid", colorScheme: "error",   className: "rst:bg-error-600 rst:border-error-600 rst:text-white rst:dark:bg-error-600 rst:dark:border-error-500" },
      { checked: true, variant: "solid", colorScheme: "neutral", className: "rst:bg-gray-600 rst:border-gray-600 rst:text-white rst:dark:bg-gray-600 rst:dark:border-gray-500" },

      // --- SOFT VARIANTS ---
      { checked: true, variant: "soft", colorScheme: "primary", className: "rst:bg-primary-50 rst:border-primary-200 rst:text-primary-700 rst:dark:bg-primary-900/40 rst:dark:border-primary-800/50 rst:dark:text-primary-300" },
      { checked: true, variant: "soft", colorScheme: "orange",  className: "rst:bg-orange-50 rst:border-orange-200 rst:text-orange-700 rst:dark:bg-orange-900/30 rst:dark:border-orange-800/50 rst:dark:text-orange-300" },
      { checked: true, variant: "soft", colorScheme: "teal",    className: "rst:bg-teal-100 rst:border-teal-300 rst:text-teal-800 rst:dark:bg-teal-900/30 rst:dark:border-teal-800/50 rst:dark:text-teal-300" },
      { checked: true, variant: "soft", colorScheme: "purple",  className: "rst:bg-purple-50 rst:border-purple-200 rst:text-purple-700 rst:dark:bg-purple-900/30 rst:dark:border-purple-800/50 rst:dark:text-purple-300" },
      { checked: true, variant: "soft", colorScheme: "amber",   className: "rst:bg-amber-50 rst:border-amber-200 rst:text-amber-800 rst:dark:bg-amber-900/30 rst:dark:border-amber-800/50 rst:dark:text-amber-300" },
      { checked: true, variant: "soft", colorScheme: "success", className: "rst:bg-success-50 rst:border-success-200 rst:text-success-700 rst:dark:bg-success-900/30 rst:dark:border-success-800/50 rst:dark:text-success-300" },
      { checked: true, variant: "soft", colorScheme: "error",   className: "rst:bg-error-50 rst:border-error-200 rst:text-error-700 rst:dark:bg-error-900/30 rst:dark:border-error-800/50 rst:dark:text-error-300" },
      { checked: true, variant: "soft", colorScheme: "neutral", className: "rst:bg-gray-100 rst:border-gray-200 rst:text-gray-700 rst:dark:bg-gray-800/50 rst:dark:border-gray-700/50 rst:dark:text-gray-300" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "md",
      checked: false,
    },
  }
);