import { cva } from "class-variance-authority";

/**
 * Inline notice strip. Deliberately lighter than ErrorState, which is a full
 * empty-state panel. Alert is for "this action failed" feedback sitting in
 * the flow of a page or a form.
 *
 * The left stripe carries the color weight so the fill can stay quiet enough
 * to sit inside a form without shouting.
 *
 * Two additions let this absorb the summary callouts apps were hand-rolling
 * beside it — a labeled, accent-keyed panel carrying a sentence of prose is
 * this component with a `title`, not a different component:
 *
 * - `colorScheme: "current"` inherits `currentColor` for the stripe, the text
 *   and the fill, so a page can tint an Alert with an accent Roster has never
 *   heard of. Pullquote, Stat and InlineCode already work this way; Alert was
 *   the one that could not, which is what pushed a consumer to build its own.
 * - `surface: "gradient"` fades the fill out to the right instead of holding a
 *   flat tint, which is the treatment those hand-rolled callouts used.
 *
 * Both default to the previous behavior, so neither changes an existing Alert.
 */
export const alertVariants = cva(
  "rst:flex rst:items-start rst:gap-2.5 rst:rounded-lg rst:border-l-4 rst:px-4 rst:py-3 rst:text-sm",
  {
    variants: {
      colorScheme: {
        error:
          "rst:border-error-500 rst:bg-error-50 rst:text-error-800 rst:dark:border-error-400 rst:dark:bg-error-500/10 rst:dark:text-error-200",
        success:
          "rst:border-success-500 rst:bg-success-50 rst:text-success-800 rst:dark:border-success-400 rst:dark:bg-success-500/10 rst:dark:text-success-200",
        amber:
          "rst:border-amber-500 rst:bg-amber-50 rst:text-amber-900 rst:dark:border-amber-400 rst:dark:bg-amber-500/10 rst:dark:text-amber-200",
        info: "rst:border-info-500 rst:bg-info-50 rst:text-info-800 rst:dark:border-info-400 rst:dark:bg-info-500/10 rst:dark:text-info-200",
        primary:
          "rst:border-primary-500 rst:bg-primary-50 rst:text-primary-800 rst:dark:border-primary-400 rst:dark:bg-primary-500/10 rst:dark:text-primary-200",
        neutral:
          "rst:border-gray-400 rst:bg-gray-50 rst:text-gray-800 rst:dark:border-gray-500 rst:dark:bg-gray-500/10 rst:dark:text-gray-200",
        /*
         * The fill is a wash of `currentColor` rather than a step off a ramp,
         * because there is no ramp to reach for: the color arrives from the
         * consuming page. One value serves both themes — 10% of whatever the
         * text color is reads correctly on paper and on a dark ground, where a
         * fixed tint would have to be declared twice and guessed at both times.
         */
        current:
          "rst:border-current rst:text-current rst:bg-current/10",
      },
      surface: {
        /* The existing flat tint, and still the default. */
        tint: "",
        /*
         * Set per scheme below: a gradient needs the color, not just a switch.
         * Each one clears the flat fill with `bg-transparent` in both themes —
         * a background-COLOR, since that is what the tint is. Clearing
         * `background-image` instead cancels the gradient itself, which is the
         * bug this shipped with for one build.
         */
        gradient: "",
      },
    },
    compoundVariants: [
      {
        surface: "gradient",
        colorScheme: "error",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-error-500/10 rst:to-transparent rst:dark:from-error-500/15",
      },
      {
        surface: "gradient",
        colorScheme: "success",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-success-500/10 rst:to-transparent rst:dark:from-success-500/15",
      },
      {
        surface: "gradient",
        colorScheme: "amber",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-amber-500/10 rst:to-transparent rst:dark:from-amber-500/15",
      },
      {
        surface: "gradient",
        colorScheme: "info",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-info-500/10 rst:to-transparent rst:dark:from-info-500/15",
      },
      {
        surface: "gradient",
        colorScheme: "primary",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-primary-500/10 rst:to-transparent rst:dark:from-primary-500/15",
      },
      {
        surface: "gradient",
        colorScheme: "neutral",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-gray-500/10 rst:to-transparent rst:dark:from-gray-500/15",
      },
      {
        surface: "gradient",
        colorScheme: "current",
        class:
          "rst:bg-transparent rst:dark:bg-transparent rst:bg-gradient-to-r rst:from-current/15 rst:to-transparent",
      },
    ],
    defaultVariants: {
      colorScheme: "error",
      surface: "tint",
    },
  },
);
