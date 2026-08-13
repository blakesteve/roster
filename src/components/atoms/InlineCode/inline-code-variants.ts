import { cva } from "class-variance-authority";

/**
 * Inline `<code>` for identifiers in running prose.
 *
 * Sized at 0.8125rem rather than 1em on purpose: a monospace face at the same
 * nominal size as the surrounding text always reads a notch too large.
 */
export const inlineCodeVariants = cva("font-mono text-[0.8125rem]", {
  variants: {
    colorScheme: {
      primary: "text-primary-600 dark:text-primary-400",
      neutral: "text-gray-800 dark:text-gray-200",
      current: "text-current",
    },
    surface: {
      none: "",
      soft: "rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800",
    },
  },
  defaultVariants: { colorScheme: "primary", surface: "none" },
});
