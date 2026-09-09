import { cva } from "class-variance-authority";

export const ctaVariants = cva(
  /* `@container` on the card itself, with the flex layout moved to an inner
     element. The row/column switch is a CONTAINER query, not `md:`: `md:`
     asks how wide the WINDOW is, so a 228px card on a 1200px page laid itself
     out as a row, put the action beside the content, and squeezed the text
     column until it overflowed the `overflow-hidden` here.

     An element cannot query itself, which is why the layout is one level in
     rather than on this element. An earlier pass wrapped the card in a
     container instead — that worked, and made the card a grandchild, so a
     consumer's `className` with `col-span-2` or `flex-1` landed on something
     that was no longer the grid or flex item. */
  "rst:@container rst:font-ui rst:relative rst:overflow-hidden rst:rounded-lg rst:border rst:p-6 rst:shadow-sm rst:transition-all",
  {
    variants: {
      /* Light-mode fills moved -50 -> -100 and borders -200 -> -600.
         Reported as "light mode is too white", and measured: the old surface
         was primary-50 on a gray-50 page at 1.03:1, with a 1.30:1 border. A
         call to action that cannot be seen as a distinct block is not one.

         The fill is the smaller half. Nothing in the -50 to -100 range
         separates from a near-white page by ratio — -100 only reaches 1.12:1 —
         so it buys colour, and the BORDER is what makes the surface exist.

         Why -600 rather than the -200/-300 the rest of the library uses on
         filled surfaces: NOT 1.4.11, which does not reach a tinted banner any
         more than it reaches `Pill`. This is a prominence decision. A call to
         action is the one component whose job is to be looked at first, so it
         is deliberately the most defined bordered block on the page, and being
         louder than `Card` or `ErrorState` is the intent rather than a
         drift. -500 was the alternative and was rejected for being uneven
         across schemes: amber lands at 2.06 there while primary is at 6.10.

         Measured against the gray-50 page, every figure read from
         `src/tokens.css` rather than assumed — an earlier pass quoted
         Tailwind's ramp for `error` and `success` and was wrong by a third:

           border -600   primary 8.34  error 7.96  gray 7.30
                         success 4.80  info 3.92   amber 3.05
           text -900 on its own -100 fill
                         gray 16.03  primary 14.02  error 13.22
                         success 8.30  info 8.24   amber 8.15

         `neutral` keeps `bg-white`. Deepening it to gray-100 measured 1.04:1
         against the page — exactly what white already measured — so it changed
         the "raised white card" reading for no contrast at all.

         `info` takes `info-*`, not Tailwind's stock `blue-*` it used before.
         Roster ships `--roster-info-600`, and the old classes resolved to a
         palette a consumer cannot retheme through `--roster-*`, which is the
         one thing every other variant here allows.

         Dark mode is untouched. The complaint was specific to light, and the
         dark surfaces already separate from a dark page. */
      variant: {
        primary: 
          "rst:border-primary-600 rst:bg-primary-100 rst:text-primary-900 rst:dark:border-primary-800 rst:dark:bg-primary-900/30 rst:dark:text-primary-200", 
        neutral: 
          "rst:border-gray-600 rst:bg-white rst:text-gray-900 rst:dark:border-gray-700 rst:dark:bg-gray-800 rst:dark:text-gray-100", 
        warning: 
          "rst:border-amber-600 rst:bg-amber-100 rst:text-amber-900 rst:dark:border-amber-800 rst:dark:bg-amber-900/30 rst:dark:text-amber-200", 
        error: 
          "rst:border-error-600 rst:bg-error-100 rst:text-error-900 rst:dark:border-error-800 rst:dark:bg-error-900/30 rst:dark:text-error-200", 
        success:
          "rst:border-success-600 rst:bg-success-100 rst:text-success-900 rst:dark:border-success-800 rst:dark:bg-success-900/30 rst:dark:text-success-200",
        info:
          "rst:border-info-600 rst:bg-info-100 rst:text-info-900 rst:dark:border-info-800 rst:dark:bg-info-900/30 rst:dark:text-info-200",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);