import { cva } from "class-variance-authority";

/* The ink of every icon inside a field: the icon slot's start and end icons,
   and the chevron Combobox, Select and MultiSelect draw. One table, so a
   field's icons can't drift apart: the chevrons kept 5.20's gray-400 after
   the slot moved on, 2.31:1 on a `soft` field.

   Each variant's ink is the one it gives its placeholder. An icon in a field
   is often all there is of a control (a reveal toggle, a chevron that's the
   only sign the field opens a list), so it needs 3:1 (WCAG 1.4.11). gray-400
   painted 2.52:1 on a white field; `outline`'s ink follows whatever surface
   the field's text was chosen for, as its placeholder does. In an error, the
   error's ink, a step quieter than the typed text. `slate` is a dark surface
   in both themes, so in an error it takes the dark-surface red in light too:
   error-500 all but vanishes on its gray-700 (1.61:1). Measured on each
   field's own fill, src/components/atoms/Input/Input.checks.stories.tsx and
   src/fields-in-an-error.checks.stories.tsx. */
export const SLOT_INK = {
  white: "rst:text-gray-500 rst:dark:text-gray-400",
  soft: "rst:text-gray-500 rst:dark:text-gray-400",
  slate: "rst:text-gray-300 rst:dark:text-gray-400",
  outline: "rst:text-[color-mix(in_srgb,var(--roster-control-text)_65%,transparent)]",
  ghost: "rst:text-gray-500 rst:dark:text-gray-400",
} as const;

export const SLOT_INK_ERROR = {
  true: "rst:text-error-500 rst:dark:text-error-400",
  false: "",
} as const;

export const SLOT_INK_COMPOUNDS = [{ variant: "slate", error: true, class: "rst:text-error-400" }] as const;

/** The slot's ink alone, for an icon that brings its own positioning. */
export const slotInkVariants = /* @__PURE__ */ cva("", {
  variants: { variant: SLOT_INK, error: SLOT_INK_ERROR },
  compoundVariants: [...SLOT_INK_COMPOUNDS],
  defaultVariants: { variant: "outline", error: false },
});
