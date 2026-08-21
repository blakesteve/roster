import { cva } from "class-variance-authority";

/**
 * A line lifted out of running prose and given room.
 *
 * The scheme colors the rule only; the quote text stays at full contrast in
 * every case. A pullquote is body copy that has been promoted, and tinting it
 * would demote it again.
 */
export const pullquoteVariants = cva("rst:my-1", {
  variants: {
    variant: {
      /** Accent rule down the left. The quiet default. */
      rule: "rst:border-l-2 rst:pl-4 rst:py-[2px]",
      /** No rule; the quote carries itself on size alone. */
      plain: "",
      /**
       * Centered, for a quote that gets a whole break in the page.
       *
       * `text-center` only centers the *lines*. The blockquote is a block box
       * capped at 48ch, so without `mx-auto` it stays pinned to the left edge
       * while the figcaption centers on the figure — the two land in visibly
       * different places on any container wider than the quote.
       */
      centered: "rst:text-center rst:py-4 rst:[&>blockquote]:mx-auto",
    },
    colorScheme: {
      primary: "rst:border-primary-500 rst:dark:border-primary-400",
      success: "rst:border-success-500 rst:dark:border-success-400",
      error: "rst:border-error-500 rst:dark:border-error-400",
      amber: "rst:border-amber-500 rst:dark:border-amber-400",
      neutral: "rst:border-gray-300 rst:dark:border-gray-700",
      current: "rst:border-current",
    },
  },
  defaultVariants: { variant: "rule", colorScheme: "primary" },
});
