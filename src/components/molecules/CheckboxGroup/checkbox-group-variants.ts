import { cva } from "class-variance-authority";

/**
 * The container the options sit in.
 *
 * `plain` is the default because a checkbox group is not inherently a box: a
 * short list of three options wants to sit on the form the way a Select's
 * label and trigger do, with no chrome of its own.
 *
 * `panel` is the long-list case — the grouped, scrollable list mega-squad
 * hand-rolled for its sports picker. It deliberately does NOT read
 * `--roster-popover-*`: that family is documented as "a panel that floats over
 * the page", and this one is in the flow.
 *
 * Its fill is `Card`'s `soft` exactly. Its border is deliberately two ramp
 * steps heavier than that card's — `gray-200` against the card's `gray-100`,
 * and no `/50` in dark. A card's hairline separates one block of content from
 * the page; this one has to read as the wall a scroll region ends at, and at
 * `gray-100` it did not.
 */
export const checkboxGroupPanelVariants = cva("rst:flex rst:flex-col rst:text-left", {
  variants: {
    variant: {
      plain: "",
      panel:
        "rst:rounded-md rst:border rst:p-3 rst:border-gray-200 rst:bg-gray-50 rst:dark:border-gray-800 rst:dark:bg-gray-900/40",
    },
    /* Gap between categories, not between options — those are the grid's, below. */
    size: {
      sm: "rst:gap-3",
      md: "rst:gap-4",
      lg: "rst:gap-5",
    },
    error: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      /* Only `panel` has a boundary to repaint. In `plain` the message text is
         the entire error state, which is stated in the README rather than left
         for someone to discover. */
      variant: "panel",
      error: true,
      class: "rst:border-error-500 rst:dark:border-error-500",
    },
  ],
  defaultVariants: { variant: "plain", size: "md", error: false },
});

/**
 * The options themselves.
 *
 * Every column count starts at one and widens at a breakpoint. A two-column
 * checkbox list on a 320px screen is two columns of truncated labels, which is
 * the layout this exists to avoid.
 */
export const checkboxGroupOptionsVariants = cva("rst:grid", {
  variants: {
    columns: {
      1: "rst:grid-cols-1",
      2: "rst:grid-cols-1 rst:sm:grid-cols-2",
      3: "rst:grid-cols-1 rst:sm:grid-cols-2 rst:lg:grid-cols-3",
    },
    /* The row gaps are a touch-target constraint, not only a rhythm.
       `Checkbox` extends its hit area with a 44x44 pseudo-element, so an
       option's target reaches `22 - (2 + box / 2)` above its own row: 12, 10
       and 8px. Let it reach far enough and it covers the option above, and a
       click there operates the wrong control.

       The thing it has to clear is the LABEL, not the checkbox. The label is a
       hit target of its own, it is what a user actually clicks, and it is both
       taller than the box and 2px lower: `py-0.5` puts its bottom edge at the
       row's bottom while the checkbox stops 2px short of it. Measuring against
       the box instead said `gap-y-2.5` was enough, and at `sm` it left the
       bottom-left 12px of every label belonging to the next option, confirmed
       by clicking it.

       So the gap is exactly the overhang plus 2px of margin, which is why it
       runs the opposite way to the size scale: a smaller box overhangs
       further. `RadioGroup` avoids the inversion by giving each option a row
       tall enough to contain its own target; doing that here would re-space
       every checkbox list in every consumer, which is a bigger change than
       this release should make.

       This keeps a click on a control working on that control. It does NOT
       stop the targets overlapping in the overhang itself, which would take
       44px of pitch and `RadioGroup`'s row model. */
    size: {
      sm: "rst:gap-x-4 rst:gap-y-3.5",
      md: "rst:gap-x-4 rst:gap-y-3",
      lg: "rst:gap-x-6 rst:gap-y-2.5",
    },
  },
  defaultVariants: { columns: 1, size: "md" },
});
