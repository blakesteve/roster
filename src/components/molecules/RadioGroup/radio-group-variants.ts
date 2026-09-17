import { cva } from "class-variance-authority";

/**
 * The radio control itself.
 *
 * Deliberately the same shape as `checkboxVariants`: the same three sizes, the
 * same eight color schemes, the same `--roster-control-border` hairline when
 * unchecked and the same `-ink` token on the mark. A radio and a checkbox on
 * one form should differ in what they mean, not in how heavy their edges look.
 *
 * Two things differ. `rounded-full`, and the mark is a dot rather than a
 * glyph — it reads `currentColor`, so the `-ink` token that guarantees
 * contrast on each fill does the work here too. There is also no `soft`
 * variant: `Checkbox` carries eight more compound rows for one, and
 * `CheckboxGroup` surfaces only `colorScheme` to its consumers, so this
 * follows the group rather than the atom.
 *
 * The 44x44 target is built in rather than left to the consumer. Same
 * pseudo-element technique as `Checkbox`, for the same reason and with the
 * same two consequences: `before:` generates no layout box, so the circle
 * keeps its exact dimensions, and the target overhangs the box on all four
 * sides, which means an `overflow: hidden` ancestor clips it and a tightly
 * spaced column overlaps it. The size is stated as `size-11` rather than as a
 * negative inset per size, because `inset` on an absolutely positioned
 * pseudo-element resolves against the PADDING box: an inset measured from each
 * circle's outer width lands 2px short at every size, once for each 1px of
 * border, and looks correct in the source while measuring 42.
 */
export const radioVariants = /* @__PURE__ */ cva(
  "rst:font-ui rst:relative rst:flex rst:items-center rst:justify-center rst:shrink-0 rst:rounded-full rst:border rst:transition-colors rst:before:absolute rst:before:top-1/2 rst:before:left-1/2 rst:before:size-11 rst:before:-translate-x-1/2 rst:before:-translate-y-1/2 rst:before:content-[''] rst:focus:outline-hidden rst:focus-visible:ring-ring rst:focus-visible:ring-2 rst:focus-visible:ring-offset-2 rst:ring-offset-background",
  {
    variants: {
      size: {
        sm: "rst:h-4 rst:w-4",
        md: "rst:h-5 rst:w-5",
        lg: "rst:h-6 rst:w-6",
      },
      checked: {
        true: "",
        false:
          "rst:bg-white rst:border-[var(--roster-control-border)] rst:dark:bg-gray-900 rst:text-transparent",
      },
      colorScheme: {
        primary: "", orange: "", teal: "", purple: "", amber: "", success: "", error: "", neutral: "",
      },
    },
    compoundVariants: [
      { checked: true, colorScheme: "primary", className: "rst:bg-primary-600 rst:border-primary-600 rst:dark:bg-primary-600 rst:dark:border-primary-500 rst:text-primary-600-ink" },
      { checked: true, colorScheme: "orange",  className: "rst:bg-orange-600 rst:border-orange-600 rst:dark:bg-orange-600 rst:dark:border-orange-500 rst:text-orange-600-ink" },
      { checked: true, colorScheme: "teal",    className: "rst:bg-teal-600 rst:border-teal-600 rst:dark:bg-teal-600 rst:dark:border-teal-500 rst:text-teal-600-ink" },
      { checked: true, colorScheme: "purple",  className: "rst:bg-purple-600 rst:border-purple-600 rst:dark:bg-purple-600 rst:dark:border-purple-500 rst:text-purple-600-ink" },
      { checked: true, colorScheme: "amber",   className: "rst:bg-amber-400 rst:border-amber-400 rst:dark:bg-amber-500 rst:dark:border-amber-500 rst:text-amber-400-ink rst:dark:text-amber-500-ink" },
      { checked: true, colorScheme: "success", className: "rst:bg-success-600 rst:border-success-600 rst:dark:bg-success-600 rst:dark:border-success-500 rst:text-success-600-ink" },
      { checked: true, colorScheme: "error",   className: "rst:bg-error-600 rst:border-error-600 rst:dark:bg-error-600 rst:dark:border-error-500 rst:text-error-600-ink" },
      { checked: true, colorScheme: "neutral", className: "rst:bg-gray-600 rst:border-gray-600 rst:dark:bg-gray-600 rst:dark:border-gray-500 rst:text-gray-600-ink" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      size: "md",
      checked: false,
    },
  },
);

/**
 * The dot inside the circle.
 *
 * `bg-current` rather than a color of its own, so it inherits the `-ink` token
 * the control resolved for whichever fill it is sitting on. Sized to roughly
 * 40% of the circle at every size — 6/16, 8/20, 10/24 — which is where a radio
 * reads as a radio rather than as a filled dot or a faint speck.
 */
export const radioDotVariants = /* @__PURE__ */ cva(
  "rst:pointer-events-none rst:rounded-full rst:bg-current rst:transition-opacity rst:duration-200",
  {
    variants: {
      size: {
        sm: "rst:size-1.5",
        md: "rst:size-2",
        lg: "rst:size-2.5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * One option.
 *
 * The rule the spacing rests on: **an option's box contains its own target.** A
 * 44px target that can not reach past the option it belongs to can not reach
 * into the one beside it either, at any gap, including zero. That is what lets
 * the gaps be small.
 *
 * One layout covers every case, and the arithmetic is why. The radio is
 * `self-start`, so it sits on the label's first line, and it needs no nudge to
 * land there: the type scale and the size scale agree at every step — 16px
 * line-height against a 16px circle at `sm`, 20 against 20 at `md`, 24 against
 * 24 at `lg` — so the top of the circle and the top of the first line are the
 * same edge. The padding is then whatever closes the gap to 44,
 * `(44 - line-height) / 2`, which puts the radio's center at exactly 22px from
 * the row's top at every size. The target spans the row and nothing else.
 *
 * That single rule holds for a one-line option, an option whose label wraps,
 * and an option with a description, which is why there is no longer a branch
 * for the last of those. Two earlier versions had one and both were wrong in a
 * case they did not cover: a symmetric padding let a described row's target
 * overhang its own top edge by 2 to 6px, and centering a plain row floated the
 * radio into the middle of a two-line label — correct for one line, visibly
 * wrong for two, on text a consumer supplies and can not control the width of.
 *
 * `horizontal` applies the same rule across instead of down, where the binding
 * constraint is width rather than height: two radios less than 44px apart
 * overlap however tall their boxes are. `min-w-11` guarantees it even for a
 * one-character label.
 */
export const radioOptionVariants = /* @__PURE__ */ cva(
  "rst:flex rst:items-start rst:gap-2 rst:min-h-11",
  {
    variants: {
      orientation: {
        vertical: "",
        horizontal: "rst:min-w-11",
      },
      size: {
        sm: "rst:py-3.5",
        md: "rst:py-3",
        lg: "rst:py-2.5",
      },
    },
    defaultVariants: { orientation: "vertical", size: "md" },
  },
);

/**
 * The options' container.
 *
 * `vertical` is the default because a radio group holds one answer, and options
 * read as alternatives to each other when they are stacked. `horizontal` is for
 * the short scannable set, two or three one-word answers that would otherwise
 * spend three rows of a wide form, and it wraps rather than overflowing:
 * a row of options that runs off the side of a phone is worse than the column
 * it replaced.
 *
 * There is no `columns` prop. `CheckboxGroup` has one because it is the
 * long-list control and a filter list of twenty wants the width; a radio group
 * with that many options wants a `Select`.
 *
 * The gaps are small, and can be, because each option already contains its own
 * target and its own padding. Across, they are larger than down: a horizontal
 * gap separates two whole options rather than two stacked rows, and at the
 * vertical scale two options sat 0 to 4px apart and read as one control.
 */
export const radioGroupOptionsVariants = /* @__PURE__ */ cva("rst:flex", {
  variants: {
    orientation: {
      vertical: "rst:flex-col",
      horizontal: "rst:flex-row rst:flex-wrap rst:items-start",
    },
    size: {
      sm: "rst:gap-0",
      md: "rst:gap-0.5",
      lg: "rst:gap-1",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", size: "sm", class: "rst:gap-x-4" },
    { orientation: "horizontal", size: "md", class: "rst:gap-x-5" },
    { orientation: "horizontal", size: "lg", class: "rst:gap-x-6" },
  ],
  defaultVariants: { orientation: "vertical", size: "md" },
});
