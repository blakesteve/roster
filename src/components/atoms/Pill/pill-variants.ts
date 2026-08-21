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
  "rst:inline-flex rst:items-center rst:rounded-full rst:font-medium rst:whitespace-nowrap rst:align-middle",
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
        outline: "rst:bg-transparent rst:border",
        solid: "",
      },
      size: {
        sm: "rst:text-xs rst:px-2.5 rst:py-0.5 rst:gap-1.5",
        md: "rst:text-sm rst:px-3 rst:py-1 rst:gap-2",
      },
    },
    compoundVariants: [
      // Soft is the default. Quiet enough to sit inside body copy.
      { variant: "soft", colorScheme: "primary", className: "rst:bg-primary-50 rst:text-primary-700 rst:dark:bg-primary-500/15 rst:dark:text-primary-300" },
      { variant: "soft", colorScheme: "success", className: "rst:bg-success-50 rst:text-success-700 rst:dark:bg-success-500/15 rst:dark:text-success-300" },
      { variant: "soft", colorScheme: "error",   className: "rst:bg-error-50 rst:text-error-700 rst:dark:bg-error-500/15 rst:dark:text-error-300" },
      { variant: "soft", colorScheme: "amber",   className: "rst:bg-amber-50 rst:text-amber-800 rst:dark:bg-amber-500/15 rst:dark:text-amber-300" },
      { variant: "soft", colorScheme: "info",    className: "rst:bg-info-50 rst:text-info-700 rst:dark:bg-info-500/15 rst:dark:text-info-300" },
      { variant: "soft", colorScheme: "neutral", className: "rst:bg-gray-100 rst:text-gray-700 rst:dark:bg-gray-500/15 rst:dark:text-gray-300" },

      // Outline suits dense rows where a fill would add too much weight.
      { variant: "outline", colorScheme: "primary", className: "rst:border-primary-300 rst:text-primary-700 rst:dark:border-primary-700 rst:dark:text-primary-300" },
      { variant: "outline", colorScheme: "success", className: "rst:border-success-300 rst:text-success-700 rst:dark:border-success-700 rst:dark:text-success-300" },
      { variant: "outline", colorScheme: "error",   className: "rst:border-error-300 rst:text-error-700 rst:dark:border-error-700 rst:dark:text-error-300" },
      { variant: "outline", colorScheme: "amber",   className: "rst:border-amber-300 rst:text-amber-800 rst:dark:border-amber-700 rst:dark:text-amber-300" },
      { variant: "outline", colorScheme: "info",    className: "rst:border-info-300 rst:text-info-700 rst:dark:border-info-700 rst:dark:text-info-300" },
      { variant: "outline", colorScheme: "neutral", className: "rst:border-gray-300 rst:text-gray-700 rst:dark:border-gray-600 rst:dark:text-gray-300" },

      // Solid is for when the pill is the loudest thing in its row on purpose.
      { variant: "solid", colorScheme: "primary", className: "rst:bg-primary-500 rst:text-white" },
      { variant: "solid", colorScheme: "success", className: "rst:bg-success-500 rst:text-white" },
      { variant: "solid", colorScheme: "error",   className: "rst:bg-error-500 rst:text-white" },
      { variant: "solid", colorScheme: "amber",   className: "rst:bg-amber-500 rst:text-amber-950" },
      { variant: "solid", colorScheme: "info",    className: "rst:bg-info-500 rst:text-white" },
      { variant: "solid", colorScheme: "neutral", className: "rst:bg-gray-600 rst:text-white rst:dark:bg-gray-500" },
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
export const pillDotVariants = cva("rst:shrink-0 rst:rounded-full", {
  variants: {
    colorScheme: {
      primary: "rst:bg-primary-500 rst:dark:bg-primary-400",
      success: "rst:bg-success-500 rst:dark:bg-success-400",
      error: "rst:bg-error-500 rst:dark:bg-error-400",
      amber: "rst:bg-amber-500 rst:dark:bg-amber-400",
      info: "rst:bg-info-500 rst:dark:bg-info-400",
      neutral: "rst:bg-gray-500 rst:dark:bg-gray-400",
    },
    variant: {
      soft: "",
      outline: "",
      solid: "rst:bg-current rst:dark:bg-current",
    },
    size: {
      sm: "rst:size-1.5",
      md: "rst:size-2",
    },
  },
  defaultVariants: {
    colorScheme: "neutral",
    variant: "soft",
    size: "sm",
  },
});
