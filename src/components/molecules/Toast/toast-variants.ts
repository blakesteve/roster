import { cva } from "class-variance-authority";

/**
 * Toast vs Alert.
 *
 * Alert is an inline notice strip: it sits in the flow of a page or a form,
 * stays as long as the condition does, and the reader finds it by looking at
 * the thing it is about. Toast is transient chrome floating over everything,
 * announced rather than found, and gone in a few seconds.
 *
 * They share a color language on purpose — the same six schemes and the same
 * icons — because "this failed" should not be two different reds depending on
 * where it is said. What Toast adds is elevation and an opaque surface: it is
 * drawn over arbitrary page content, so a tint that reads correctly inside a
 * form can disappear over an image.
 *
 * The left stripe is Alert's. Toast borders on all sides instead, because a
 * floating object needs a complete edge to read as detached from the page
 * rather than as something that fell out of the layout.
 */
export const toastVariants = cva(
  "rst:font-ui rst:pointer-events-auto rst:flex rst:items-start rst:gap-2.5 rst:rounded-lg rst:border rst:px-4 rst:py-3 rst:text-sm rst:shadow-lg",
  {
    variants: {
      colorScheme: {
        success: "",
        error: "",
        amber: "",
        info: "",
        primary: "",
        neutral: "",
      },
      variant: {
        soft: "",
        solid: "",
        /* The surface is neutral and the tone lives on the border and icon;
           see the compound variants for why a colored fill could not work.
           60%, which is as far as the neutral ink allows: the worst case is
           4.69:1 in dark over a white backdrop, and 55% takes that to 4.00.
           The blur is what makes even this safe, by muddying the backdrop
           before it shows through. */
        glass:
          "rst:bg-white/60 rst:text-gray-900 rst:backdrop-blur-xl rst:shadow-2xl rst:dark:bg-slate-900/60 rst:dark:text-white",
      },
    },
    compoundVariants: [
      /* Soft: the tinted fill, the same language `Alert` speaks. Quiet enough
         that a stack of them does not shout, which is the common case. */
      { variant: "soft", colorScheme: "success", className: "rst:border-success-300 rst:bg-success-50 rst:text-success-800 rst:dark:border-success-500/40 rst:dark:bg-success-900 rst:dark:text-success-200" },
      { variant: "soft", colorScheme: "error",   className: "rst:border-error-300 rst:bg-error-50 rst:text-error-800 rst:dark:border-error-500/40 rst:dark:bg-error-900 rst:dark:text-error-200" },
      { variant: "soft", colorScheme: "amber",   className: "rst:border-amber-300 rst:bg-amber-50 rst:text-amber-900 rst:dark:border-amber-500/40 rst:dark:bg-amber-900 rst:dark:text-amber-200" },
      { variant: "soft", colorScheme: "info",    className: "rst:border-info-300 rst:bg-info-50 rst:text-info-800 rst:dark:border-info-500/40 rst:dark:bg-info-900 rst:dark:text-info-200" },
      { variant: "soft", colorScheme: "primary", className: "rst:border-primary-300 rst:bg-primary-50 rst:text-primary-800 rst:dark:border-primary-500/40 rst:dark:bg-primary-900 rst:dark:text-primary-200" },
      /* Neutral soft takes the floating-surface tokens rather than a gray
         step, because a toast with no semantic color IS the popover surface,
         and a consumer who has themed their menus expects this to follow. */
      { variant: "soft", colorScheme: "neutral", className: "rst:border-[var(--roster-popover-border)] rst:bg-[var(--roster-popover-bg)] rst:text-[var(--roster-popover-text)]" },

      /* Solid: the `-500` fills and per-fill ink tokens, step for step with
         Pill and Chip, so the three do not disagree about what a solid
         success looks like. The border matches the fill so the shape stays
         one object rather than a fill inside a ring.

         Worth having because a tint is a gamble over arbitrary page content:
         `bg-success-50` on a white page is a whisper, and over a photograph
         it is illegible. Solid is the choice for a toast that has to land. */
      { variant: "solid", colorScheme: "success", className: "rst:border-success-500 rst:bg-success-500 rst:text-success-500-ink" },
      { variant: "solid", colorScheme: "error",   className: "rst:border-error-500 rst:bg-error-500 rst:text-error-500-ink" },
      { variant: "solid", colorScheme: "amber",   className: "rst:border-amber-500 rst:bg-amber-500 rst:text-amber-500-ink" },
      { variant: "solid", colorScheme: "info",    className: "rst:border-info-500 rst:bg-info-500 rst:text-info-500-ink" },
      { variant: "solid", colorScheme: "primary", className: "rst:border-primary-500 rst:bg-primary-500 rst:text-primary-500-ink" },
      { variant: "solid", colorScheme: "neutral", className: "rst:border-gray-600 rst:bg-gray-600 rst:text-gray-600-ink rst:dark:border-gray-500 rst:dark:bg-gray-500 rst:dark:text-gray-500-ink" },

      /* Glass: a neutral translucent surface, with the tone on the border and
         NOTHING else.

         The text stays neutral for every scheme, which is the correction that
         matters. A colored fill was the first attempt and measured 2.60:1;
         replacing it with colored TEXT on a neutral fill reproduced the same
         failure one layer over — `text-info-700` on `bg-white/70` above a dark
         backdrop is 2.81:1, worse than the number that condemned the original.
         Under glass, anything whose contrast depends on the backdrop is a
         guess, and only the neutral ink is safe in both directions: 17.49 over
         white, 8.29 over black, 10.96 over a brand color, and 6.64 / 18.98 /
         13.87 in dark.

         So the border is the whole tone signal. That is less than `soft` and
         `solid` carry, and it is the honest cost of a surface that does not
         know what is behind it. */
      { variant: "glass", colorScheme: "success", className: "rst:border-success-400/60" },
      { variant: "glass", colorScheme: "error",   className: "rst:border-error-400/60" },
      { variant: "glass", colorScheme: "amber",   className: "rst:border-amber-400/60" },
      { variant: "glass", colorScheme: "info",    className: "rst:border-info-400/60" },
      { variant: "glass", colorScheme: "primary", className: "rst:border-primary-400/60" },
      { variant: "glass", colorScheme: "neutral", className: "rst:border-white/30 rst:dark:border-slate-700/50" },
    ],
    defaultVariants: {
      colorScheme: "neutral",
      variant: "soft",
    },
  },
);
