import { cva } from "class-variance-authority";

/* The hit area is a `before:` pseudo-element, and the reason it is not padding
   is structural: this element IS the visible box. The border, the fill and the
   size classes all sit on it, so padding would grow the box the user sees, and
   a negative margin to cancel that would then fight the layout of every
   consumer that puts a checkbox in a row.

   A pseudo-element generates no layout box at all, so the control keeps its
   exact dimensions at every size while the target reaches 44x44 — WCAG 2.5.5,
   where the box alone gave 16, 20 and 24px. It needs `relative` to anchor to.

   Sized and centered rather than inset by a per-size amount, and the
   difference is 2px of silence. An absolutely positioned pseudo-element
   resolves `inset` against its originator's PADDING box, so a negative inset
   measured off each box's outer width lands 2px short at every size: the 1px
   border on each side is not in the box it counts from. Measured 42x42 in the
   browser and looked right in the source, which is the failure mode worth
   spending four classes to rule out. `size-11` states the number the rule is
   about, one class for every size, and it stays 44 whatever the border does.

   Two consequences worth knowing rather than discovering. The target extends
   past the box on all four sides, so in a tightly spaced column adjacent
   targets overlap and the one later in the DOM takes the overlap. And an
   ancestor with `overflow: hidden` clips the overhang, because clipping
   applies to hit testing and not only to painting. */
export const checkboxVariants = cva(
  "rst:font-ui rst:relative rst:flex rst:items-center rst:justify-center rst:shrink-0 rst:transition-colors rst:before:absolute rst:before:top-1/2 rst:before:left-1/2 rst:before:size-11 rst:before:-translate-x-1/2 rst:before:-translate-y-1/2 rst:before:content-[''] rst:focus:outline-hidden rst:focus-visible:ring-ring rst:focus-visible:ring-2 rst:focus-visible:ring-offset-2 rst:ring-offset-background",
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
        /* The unchecked box reads `--roster-control-border` like every other
           field. It was gray-300 / gray-700 — 1.49:1 on white and 1.70:1 on a
           gray-900 surface — which is the same hairline the 1.4.11 pass raised
           on Input, Textarea and Select, on a control 1.4.11 covers at least as
           squarely. Left alone it would have sat next to an `outline` field
           with a visibly lighter edge. */
        false: "rst:bg-white rst:border-[var(--roster-control-border)] rst:dark:bg-gray-900 rst:text-transparent",
      },
      colorScheme: {
        primary: "", orange: "", teal: "", purple: "", amber: "", success: "", error: "", neutral: "",
      },
    },
    compoundVariants: [
      // --- SOLID VARIANTS ---
      { checked: true, variant: "solid", colorScheme: "primary", className: "rst:bg-primary-600 rst:border-primary-600 rst:dark:bg-primary-600 rst:dark:border-primary-500 rst:text-primary-600-ink" },
      { checked: true, variant: "solid", colorScheme: "orange",  className: "rst:bg-orange-600 rst:border-orange-600 rst:dark:bg-orange-600 rst:dark:border-orange-500 rst:text-orange-600-ink" },
      { checked: true, variant: "solid", colorScheme: "teal",    className: "rst:bg-teal-600 rst:border-teal-600 rst:dark:bg-teal-600 rst:dark:border-teal-500 rst:text-teal-600-ink" },
      { checked: true, variant: "solid", colorScheme: "purple",  className: "rst:bg-purple-600 rst:border-purple-600 rst:dark:bg-purple-600 rst:dark:border-purple-500 rst:text-purple-600-ink" },
      { checked: true, variant: "solid", colorScheme: "amber",   className: "rst:bg-amber-400 rst:border-amber-400 rst:dark:bg-amber-500 rst:dark:border-amber-500 rst:text-amber-400-ink rst:dark:text-amber-500-ink" },
      { checked: true, variant: "solid", colorScheme: "success", className: "rst:bg-success-600 rst:border-success-600 rst:dark:bg-success-600 rst:dark:border-success-500 rst:text-success-600-ink" },
      { checked: true, variant: "solid", colorScheme: "error",   className: "rst:bg-error-600 rst:border-error-600 rst:dark:bg-error-600 rst:dark:border-error-500 rst:text-error-600-ink" },
      { checked: true, variant: "solid", colorScheme: "neutral", className: "rst:bg-gray-600 rst:border-gray-600 rst:dark:bg-gray-600 rst:dark:border-gray-500 rst:text-gray-600-ink" },

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