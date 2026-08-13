import { cva } from "class-variance-authority";

/**
 * Label and value pairs: a spec sheet, a metadata panel, a case study sidebar.
 *
 * `sm` is the default because this component's usual home is a sidebar panel,
 * where the list is reference material rather than reading material.
 */
export const descriptionListVariants = cva("m-0", {
  variants: {
    layout: {
      /** Term and description on one row, term column sized to content. */
      inline: "grid grid-cols-[auto_1fr] gap-x-3",
      /** Term above its description. Better for long values. */
      stacked: "flex flex-col",
      /** Term left, description right-aligned against it. Spec-sheet feel. */
      split: "flex flex-col",
    },
    size: {
      sm: "text-[0.65625rem] gap-y-[5px]",
      md: "text-xs gap-y-1.5",
    },
  },
  defaultVariants: { layout: "inline", size: "sm" },
});
