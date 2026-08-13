import { cva } from "class-variance-authority";

/**
 * The small uppercase label that sits above a heading, beside a rule, or as a
 * column head. Extracted from blakeb.dev, where it was hand-rolled as a CSS
 * class and used 26 times before anyone noticed it was a component.
 *
 * Monospace on purpose: at this size, tracked-out uppercase reads as chrome
 * rather than prose, which is the whole job.
 */
export const eyebrowVariants = cva(
  "font-mono uppercase leading-none",
  {
    variants: {
      size: {
        xs: "text-[0.625rem] tracking-[0.16em]",
        sm: "text-[0.6875rem] tracking-[0.14em]",
        md: "text-xs tracking-[0.12em]",
      },
      tone: {
        faint: "text-gray-500 dark:text-gray-400",
        default: "text-gray-700 dark:text-gray-300",
        strong: "text-gray-900 dark:text-gray-100",
        primary: "text-primary-600 dark:text-primary-400",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
      },
    },
    defaultVariants: { size: "xs", tone: "faint", weight: "normal" },
  },
);
