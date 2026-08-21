import { cva } from "class-variance-authority";

/**
 * Label and value pairs: a spec sheet, a metadata panel, a case study sidebar.
 *
 * `sm` is the default because this component's usual home is a sidebar panel,
 * where the list is reference material rather than reading material.
 */
export const descriptionListVariants = cva("rst:m-0", {
  variants: {
    layout: {
      /** Term and description on one row, term column sized to content. */
      inline: "rst:grid rst:grid-cols-[auto_1fr] rst:gap-x-3",
      /** Term above its description. Better for long values. */
      stacked: "rst:flex rst:flex-col",
      /** Term left, description right-aligned against it. Spec-sheet feel. */
      split: "rst:flex rst:flex-col",
    },
    size: {
      sm: "rst:text-[0.65625rem] rst:gap-y-[5px]",
      md: "rst:text-xs rst:gap-y-1.5",
    },
  },
  defaultVariants: { layout: "inline", size: "sm" },
});
