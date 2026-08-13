import { cva } from "class-variance-authority";

/**
 * A line lifted out of running prose and given room.
 *
 * The scheme colors the rule only; the quote text stays at full contrast in
 * every case. A pullquote is body copy that has been promoted, and tinting it
 * would demote it again.
 */
export const pullquoteVariants = cva("my-1", {
  variants: {
    variant: {
      /** Accent rule down the left. The quiet default. */
      rule: "border-l-2 pl-4 py-[2px]",
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
      centered: "text-center py-4 [&>blockquote]:mx-auto",
    },
    colorScheme: {
      primary: "border-primary-500 dark:border-primary-400",
      success: "border-success-500 dark:border-success-400",
      error: "border-error-500 dark:border-error-400",
      amber: "border-amber-500 dark:border-amber-400",
      neutral: "border-gray-300 dark:border-gray-700",
      current: "border-current",
    },
  },
  defaultVariants: { variant: "rule", colorScheme: "primary" },
});
