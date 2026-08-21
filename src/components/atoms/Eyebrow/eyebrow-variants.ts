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
  "rst:font-mono rst:uppercase rst:leading-none",
  {
    variants: {
      size: {
        xs: "rst:text-[0.625rem] rst:tracking-[0.16em]",
        sm: "rst:text-[0.6875rem] rst:tracking-[0.14em]",
        md: "rst:text-xs rst:tracking-[0.12em]",
      },
      tone: {
        faint: "rst:text-gray-500 rst:dark:text-gray-400",
        default: "rst:text-gray-700 rst:dark:text-gray-300",
        strong: "rst:text-gray-900 rst:dark:text-gray-100",
        primary: "rst:text-primary-600 rst:dark:text-primary-400",
      },
      weight: {
        normal: "rst:font-normal",
        medium: "rst:font-medium",
        semibold: "rst:font-semibold",
      },
    },
    defaultVariants: { size: "xs", tone: "faint", weight: "normal" },
  },
);
