import { cva } from "class-variance-authority";

/**
 * Pill vs Badge.
 *
 * Badge is a compact label attached to something else: a count on an avatar,
 * a status on a table row. It is sized to sit in a corner.
 *
 * Pill is standalone inline chrome carrying a short phrase: social proof
 * ("3 friends voted"), live state ("Live now"), or a filter that reads as a
 * sentence fragment. It is always fully rounded, has roomier horizontal
 * padding so words breathe, and can lead with a status dot.
 */
export const pillVariants = cva(
  "inline-flex items-center rounded-full font-medium whitespace-nowrap align-middle",
  {
    variants: {
      colorScheme: {
        primary: "",
        success: "",
        error: "",
        amber: "",
        info: "",
        neutral: "",
      },
      variant: {
        soft: "",
        outline: "bg-transparent border",
        solid: "",
      },
      size: {
        sm: "text-xs px-2.5 py-0.5 gap-1.5",
        md: "text-sm px-3 py-1 gap-2",
      },
    },
    compoundVariants: [
      // Soft is the default. Quiet enough to sit inside body copy.
      { variant: "soft", colorScheme: "primary", className: "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" },
      { variant: "soft", colorScheme: "success", className: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300" },
      { variant: "soft", colorScheme: "error",   className: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300" },
      { variant: "soft", colorScheme: "amber",   className: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
      { variant: "soft", colorScheme: "info",    className: "bg-info-50 text-info-700 dark:bg-info-500/15 dark:text-info-300" },
      { variant: "soft", colorScheme: "neutral", className: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300" },

      // Outline suits dense rows where a fill would add too much weight.
      { variant: "outline", colorScheme: "primary", className: "border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300" },
      { variant: "outline", colorScheme: "success", className: "border-success-300 text-success-700 dark:border-success-700 dark:text-success-300" },
      { variant: "outline", colorScheme: "error",   className: "border-error-300 text-error-700 dark:border-error-700 dark:text-error-300" },
      { variant: "outline", colorScheme: "amber",   className: "border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300" },
      { variant: "outline", colorScheme: "info",    className: "border-info-300 text-info-700 dark:border-info-700 dark:text-info-300" },
      { variant: "outline", colorScheme: "neutral", className: "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300" },

      // Solid is for when the pill is the loudest thing in its row on purpose.
      { variant: "solid", colorScheme: "primary", className: "bg-primary-500 text-white" },
      { variant: "solid", colorScheme: "success", className: "bg-success-500 text-white" },
      { variant: "solid", colorScheme: "error",   className: "bg-error-500 text-white" },
      { variant: "solid", colorScheme: "amber",   className: "bg-amber-500 text-amber-950" },
      { variant: "solid", colorScheme: "info",    className: "bg-info-500 text-white" },
      { variant: "solid", colorScheme: "neutral", className: "bg-gray-600 text-white dark:bg-gray-500" },
    ],
    defaultVariants: {
      colorScheme: "neutral",
      variant: "soft",
      size: "sm",
    },
  },
);

/**
 * The leading status dot. On solid pills it borrows the text color so it
 * stays legible against the filled background; elsewhere it takes the scheme.
 */
export const pillDotVariants = cva("shrink-0 rounded-full", {
  variants: {
    colorScheme: {
      primary: "bg-primary-500 dark:bg-primary-400",
      success: "bg-success-500 dark:bg-success-400",
      error: "bg-error-500 dark:bg-error-400",
      amber: "bg-amber-500 dark:bg-amber-400",
      info: "bg-info-500 dark:bg-info-400",
      neutral: "bg-gray-500 dark:bg-gray-400",
    },
    variant: {
      soft: "",
      outline: "",
      solid: "bg-current dark:bg-current",
    },
    size: {
      sm: "size-1.5",
      md: "size-2",
    },
  },
  defaultVariants: {
    colorScheme: "neutral",
    variant: "soft",
    size: "sm",
  },
});
