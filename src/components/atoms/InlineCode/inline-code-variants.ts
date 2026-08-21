import { cva } from "class-variance-authority";

/**
 * Inline `<code>` for identifiers in running prose.
 *
 * Sized at 0.8125rem rather than 1em on purpose: a monospace face at the same
 * nominal size as the surrounding text always reads a notch too large.
 */
export const inlineCodeVariants = cva("rst:font-mono rst:text-[0.8125rem]", {
  variants: {
    colorScheme: {
      primary: "rst:text-primary-600 rst:dark:text-primary-400",
      neutral: "rst:text-gray-800 rst:dark:text-gray-200",
      current: "rst:text-current",
    },
    surface: {
      none: "",
      soft: "rst:rounded rst:bg-gray-100 rst:px-1 rst:py-0.5 rst:dark:bg-gray-800",
    },
  },
  defaultVariants: { colorScheme: "primary", surface: "none" },
});
