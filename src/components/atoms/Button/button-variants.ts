import { cva } from "class-variance-authority";
import { TONE } from "../../../internal/tone";

/**
 * Every module-scope `cva(...)` in the library carries a PURE annotation, and
 * this is the note explaining why rather than 54 copies of it.
 *
 * A bundler has to assume a top-level function call might do something, so an
 * unannotated one pins the module it sits in, and with it the component that
 * imports it. That cost is charged to every consumer, including the ones that
 * never render the component. The annotation is what says otherwise: `cva`
 * closes over its arguments and touches nothing outside itself, so dropping
 * the call when nothing reads the result changes no behavior.
 *
 * Written by hand rather than produced by a plugin, so it is visible at the
 * call site and costs no build dependency. If a variant table ever needs a
 * call that is genuinely not pure, leave that one unannotated.
 */
/* A label wraps when it can't fit, centered and balanced, and the button
   grows to hold it: `min-height: fit-content` over each size's fixed height,
   so a one-line button keeps its exact size and an app's own `h-auto` isn't
   floored. `whitespace-nowrap` made a label longer than its room spill out of
   the button and its column, at 200% text on a phone. */

/* `min-width: fit-content` (`layout`, below) keeps a Button at its one-line
   width beside a neighbor that can wrap; without it a Button beside a wrapping
   heading wrapped at 100% text.

   In a grid it needs `w-full` beside it, for WebKit: a grid item that fills
   its column but not its row (a Button has a height) gets its minimum from the
   width of the whole grid, not of its column
   (`RenderGrid::stretchInlineSizeForGridItem`), so a label longer than its
   column overlaps the next one. Nothing on the item says its parent is a grid,
   and nothing but a minimum holds that width beside a `flex-1` or a `w-full`
   neighbor, so it can't be right for both from here. A tile is made for a
   grid, so it doesn't take it. */

/* Looks that keep the browser's own focus outline, not Roster's ring: their
   edge is a box-shadow, and the ring is a box-shadow too, so it would
   replace the edge and focus would nearly vanish. `outline: revert` gives
   the outline back over the base's `outline-hidden`. The ring and its offset
   are zeroed by an arbitrary variant, which the stylesheet orders after the
   base's `focus-visible:ring-2`, so the classes hold on a link styled with
   `buttonVariants` too, where nothing merges them. */
const FOCUS_NATIVE =
  "rst:focus-visible:[outline:revert] rst:[&:is(:focus-visible,[data-key-focus])]:ring-0 rst:[&:is(:focus-visible,[data-key-focus])]:ring-offset-0";

/* What these looks animate, and for how long: what `transition-all` animates
   on them, and no more. */
const LOOK_MOTION = "rst:transition-[color,background-color,border-color,box-shadow,opacity] rst:duration-150";

/* The looks whose `size` sets a height. */
const CLASSIC = ["solid", "soft", "outline", "ghost", "link"] as const;
const LOOKS_WITH_PADDING = ["tint", "tint-subtle"] as const;

/* The sizes, in the compounds: a classic Button keeps its height on one line
   (28, 36, 40 and 44px; two lines, 44, 56, 60 and 64; `compact` 30 and 46),
   and `tint` and `tint-subtle` keep the text and padding without the height.
   `plain` keeps only the text. A tile takes none of it.

   Vertical padding is half the height less one line, less the border, so one
   line is exactly the height and a wrapped label keeps the same space above
   and below. The line is `1lh`, through `--rst-line`, so an app that changes
   a Button's text size keeps its height; a browser without `lh` uses the
   size's own line in rem. The border is `--rst-edge`, which `Button` sets to
   zero on the looks that draw none, since it takes its height from the padding
   where a link keeps the fixed one. `icon` holds no label, so it keeps its
   square and no padding. */
export const buttonVariants = /* @__PURE__ */ cva(
  // Base styles
  "rst:font-ui rst:inline-flex rst:items-center rst:justify-center rst:cursor-pointer rst:whitespace-normal rst:text-center rst:text-balance rst:min-h-fit rst:supports-[height:1lh]:[--rst-line:1lh] rst:rounded-md rst:text-sm rst:font-medium rst:ring-offset-background rst:transition-colors rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:disabled:pointer-events-none rst:disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "rst:border rst:border-transparent rst:elevation-control",
        // `border-0`, here and on `link`: a <button> draws the browser's own
        // border unless told otherwise, and an app without a reset would see
        // it. Zero rather than the 1px the others have, because zero is what
        // every app with a reset already draws: none of them moves.
        soft: "rst:border-0 rst:shadow-none",
        outline: "rst:border rst:bg-transparent rst:elevation-control",
        ghost: "rst:border rst:border-transparent rst:bg-transparent",
        link: "rst:border-0 rst:bg-transparent rst:underline-offset-4 rst:hover:underline",
        /* A fill at 10% of the 500 step and a 1px ring in it. The ring is a
           box-shadow set through `--tw-shadow`, not a `ring-*`, so it stands
           apart from Roster's focus ring; it's the browser's own outline that
           shows focus. `border-0`, as on `link`. */
        tint: `rst:border-0 rst:bg-[color-mix(in_oklab,var(--rst-tone)_10%,transparent)] rst:hover:bg-[color-mix(in_oklab,var(--rst-tone)_20%,transparent)] rst:active:bg-[color-mix(in_oklab,var(--rst-tone)_30%,transparent)] rst:text-(color:--rst-tone-ink) rst:shadow-[0_0_0_1px_var(--rst-tone-edge)] rst:[--rst-tone-edge:var(--rst-tone)] rst:hover:[--rst-tone-edge:var(--rst-tone-strong)] ${LOOK_MOTION} ${FOCUS_NATIVE}`,
        /* The quieter look: a 1px border and a 1px ring, both at 40% of the
           500 step, over a 5% fill. Pressed, the ring goes and the border is
           full. */
        "tint-subtle": `rst:border ${LOOK_MOTION} ${FOCUS_NATIVE}`,
        /* Text only, at the normal weight: no fill, border, radius, underline,
           padding or height. Icons sit 4px from the label. */
        plain: `rst:border-0 rst:rounded-none rst:bg-transparent rst:gap-1 rst:font-normal ${LOOK_MOTION} ${FOCUS_NATIVE}`,
      },
      colorScheme: {
        primary: "",
        orange: "",
        teal: "",
        purple: "",
        amber: "",
        success: "",
        error: "",
        neutral: "",
      },
      /* `size` is applied by the compounds below, because what it sets depends
         on the look: a height for the five classic looks, text and padding
         only for `tint` and `tint-subtle`, text only for `plain`, and nothing
         on a tile, which has its own. */
      size: {
        xs: "",
        sm: "",
        default: "",
        lg: "",
        icon: "",
        compact: "",
      },
      /* A tile: an icon over a label in a column, centered, filling its grid
         cell. It sets its own padding, radius and text, and no height.
         `py-2.5` is for a tile with no icon; `Button` gives one with an icon
         `py-3`. No one-line floor: its label wraps in its cell. Before
         `singleLine`, whose own minimum replaces the floor. */
      layout: {
        inline: "rst:min-w-fit",
        tile: "rst:flex-col rst:gap-1.5 rst:rounded-xl rst:px-2 rst:py-2.5 rst:text-xs rst:font-semibold",
      },
      /* One line at the size's height, cut with an ellipsis when there's no
         room (`Button` wraps text children in a `truncate` span), shrinking
         to its container. */
      singleLine: {
        true: "rst:whitespace-nowrap rst:max-w-full rst:min-w-0",
        false: "",
      },
      /* Sets only `tint-subtle`'s and `plain`'s look (`Button` sets
         `aria-pressed` for every variant): the compounds below. */
      pressed: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // --- SIZES ---
      { variant: [...CLASSIC], layout: "inline", size: "xs", className: "rst:h-7 rst:rounded-sm rst:px-2 rst:text-xs rst:py-[calc((--spacing(7)-var(--rst-line,1rem))/2-var(--rst-edge,var(--roster-border-width,1px)))]" },
      { variant: [...CLASSIC], layout: "inline", size: "sm", className: "rst:h-9 rst:rounded-md rst:px-3 rst:py-[calc((--spacing(9)-var(--rst-line,1.25rem))/2-var(--rst-edge,var(--roster-border-width,1px)))]" },
      { variant: [...CLASSIC], layout: "inline", size: "default", className: "rst:h-10 rst:px-4 rst:py-[calc((--spacing(10)-var(--rst-line,1.25rem))/2-var(--rst-edge,var(--roster-border-width,1px)))]" },
      { variant: [...CLASSIC], layout: "inline", size: "lg", className: "rst:h-11 rst:rounded-md rst:px-8 rst:py-[calc((--spacing(11)-var(--rst-line,1.25rem))/2-var(--rst-edge,var(--roster-border-width,1px)))]" },
      { variant: [...CLASSIC], layout: "inline", size: "icon", className: "rst:h-10 rst:w-10" },
      { variant: [...CLASSIC], layout: "inline", size: "compact", className: "rst:h-7.5 rst:px-3 rst:text-xs rst:py-[calc((--spacing(7.5)-var(--rst-line,1rem))/2-var(--rst-edge,var(--roster-border-width,1px)))]" },
      { variant: [...LOOKS_WITH_PADDING], layout: "inline", size: "xs", className: "rst:rounded-sm rst:px-2 rst:text-xs rst:py-[calc((--spacing(7)-var(--rst-line,1rem))/2-var(--roster-border-width,1px))]" },
      { variant: [...LOOKS_WITH_PADDING], layout: "inline", size: "sm", className: "rst:rounded-md rst:px-3 rst:py-[calc((--spacing(9)-var(--rst-line,1.25rem))/2-var(--roster-border-width,1px))]" },
      { variant: [...LOOKS_WITH_PADDING], layout: "inline", size: "default", className: "rst:px-4 rst:py-[calc((--spacing(10)-var(--rst-line,1.25rem))/2-var(--roster-border-width,1px))]" },
      { variant: [...LOOKS_WITH_PADDING], layout: "inline", size: "lg", className: "rst:rounded-md rst:px-8 rst:py-[calc((--spacing(11)-var(--rst-line,1.25rem))/2-var(--roster-border-width,1px))]" },
      { variant: [...LOOKS_WITH_PADDING], layout: "inline", size: "icon", className: "rst:h-10 rst:w-10" },
      /* Its 30px height like the other sizes', so `tint-subtle`'s border sits
         inside it. */
      { variant: [...LOOKS_WITH_PADDING], layout: "inline", size: "compact", className: "rst:h-7.5 rst:px-3 rst:text-xs rst:py-[calc((--spacing(7.5)-var(--rst-line,1rem))/2-var(--rst-edge,var(--roster-border-width,1px)))]" },
      { variant: "plain", layout: "inline", size: ["xs", "compact"], className: "rst:text-xs" },

      // --- THE TONES the three quieter looks read, a set per scheme (tone.ts) ---
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "primary", className: TONE.primary },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "orange", className: TONE.orange },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "teal", className: TONE.teal },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "purple", className: TONE.purple },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "amber", className: TONE.amber },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "success", className: TONE.success },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "error", className: TONE.error },
      { variant: ["tint", "tint-subtle", "plain"], colorScheme: "neutral", className: TONE.neutral },

      // --- TINT-SUBTLE AND PLAIN, at rest, hovered and pressed ---
      { variant: "tint-subtle", pressed: false, className: "rst:border-[color-mix(in_oklab,var(--rst-tone)_40%,transparent)] rst:bg-[color-mix(in_oklab,var(--rst-tone)_5%,transparent)] rst:hover:bg-[color-mix(in_oklab,var(--rst-tone)_15%,transparent)] rst:text-(color:--rst-tone-ink) rst:shadow-[0_0_0_1px_var(--rst-tone-edge)] rst:[--rst-tone-edge:color-mix(in_oklab,var(--rst-tone)_40%,transparent)] rst:hover:[--rst-tone-edge:var(--rst-tone-strong)]" },
      { variant: "tint-subtle", pressed: true, className: "rst:border-(--rst-tone-strong) rst:bg-[color-mix(in_oklab,var(--rst-tone)_20%,transparent)] rst:dark:bg-[color-mix(in_oklab,var(--rst-tone)_40%,transparent)] rst:text-(color:--rst-tone-ink-2) rst:dark:text-white rst:font-semibold" },
      { variant: "plain", pressed: false, className: "rst:text-(color:--rst-tone-ink) rst:dark:text-(color:--rst-tone-plain) rst:hover:text-(color:--rst-tone-ink-2)" },
      { variant: "plain", pressed: true, className: "rst:text-(color:--rst-tone-ink-2)" },

      // --- SOLID VARIANTS (Bold Backgrounds) ---
      { variant: "solid", colorScheme: "primary", className: "rst:bg-primary-600 rst:hover:bg-primary-700 rst:dark:bg-primary-600 rst:dark:hover:bg-primary-500 rst:text-primary-600-ink rst:hover:text-primary-700-ink rst:dark:hover:text-primary-500-ink" },
      { variant: "solid", colorScheme: "orange",  className: "rst:bg-orange-600 rst:hover:bg-orange-700 rst:dark:bg-orange-600 rst:dark:hover:bg-orange-700 rst:text-orange-600-ink rst:hover:text-orange-700-ink rst:dark:hover:text-orange-700-ink" },
      { variant: "solid", colorScheme: "teal",    className: "rst:bg-teal-600 rst:hover:bg-teal-500 rst:dark:bg-teal-600 rst:dark:hover:bg-teal-500 rst:text-teal-600-ink rst:hover:text-teal-500-ink rst:dark:hover:text-teal-500-ink" },
      { variant: "solid", colorScheme: "purple",  className: "rst:bg-purple-600 rst:hover:bg-purple-700 rst:dark:bg-purple-600 rst:dark:hover:bg-purple-700 rst:text-purple-600-ink rst:hover:text-purple-700-ink rst:dark:hover:text-purple-700-ink" },
      { variant: "solid", colorScheme: "amber",   className: "rst:bg-amber-400 rst:hover:bg-amber-500 rst:dark:bg-amber-500 rst:dark:hover:bg-amber-400 rst:text-amber-400-ink rst:hover:text-amber-500-ink rst:dark:text-amber-500-ink rst:dark:hover:text-amber-400-ink" },
      { variant: "solid", colorScheme: "success", className: "rst:bg-success-600 rst:hover:bg-success-700 rst:dark:bg-success-600 rst:dark:hover:bg-success-700 rst:text-success-600-ink rst:hover:text-success-700-ink rst:dark:hover:text-success-700-ink" },
      { variant: "solid", colorScheme: "error",   className: "rst:bg-error-600 rst:hover:bg-error-700 rst:dark:bg-error-600 rst:dark:hover:bg-error-500 rst:text-error-600-ink rst:hover:text-error-700-ink rst:dark:hover:text-error-500-ink" },
      { variant: "solid", colorScheme: "neutral", className: "rst:bg-gray-600 rst:hover:bg-gray-700 rst:dark:bg-gray-600 rst:dark:hover:bg-gray-500 rst:text-gray-600-ink rst:hover:text-gray-700-ink rst:dark:hover:text-gray-500-ink" },

      // --- SOFT VARIANTS (Crisp Light Mode, Translucent Dark Mode) ---
      { variant: "soft", colorScheme: "primary", className: "rst:bg-primary-50 rst:text-primary-700 rst:hover:bg-primary-100 rst:dark:bg-primary-900/40 rst:dark:text-primary-300 rst:dark:hover:bg-primary-900/60" },
      { variant: "soft", colorScheme: "orange",  className: "rst:bg-orange-50 rst:text-orange-700 rst:hover:bg-orange-100 rst:dark:bg-orange-900/30 rst:dark:text-orange-300 rst:dark:hover:bg-orange-900/50" },
      { variant: "soft", colorScheme: "teal",    className: "rst:bg-teal-100 rst:text-teal-800 rst:hover:bg-teal-200 rst:dark:bg-teal-900/30 rst:dark:text-teal-300 rst:dark:hover:bg-teal-900/50" },
      { variant: "soft", colorScheme: "purple",  className: "rst:bg-purple-50 rst:text-purple-700 rst:hover:bg-purple-100 rst:dark:bg-purple-900/30 rst:dark:text-purple-300 rst:dark:hover:bg-purple-900/50" },
      { variant: "soft", colorScheme: "amber",   className: "rst:bg-amber-50 rst:text-amber-800 rst:hover:bg-amber-100 rst:dark:bg-amber-900/30 rst:dark:text-amber-300 rst:dark:hover:bg-amber-900/50" },
      { variant: "soft", colorScheme: "success", className: "rst:bg-success-50 rst:text-success-700 rst:hover:bg-success-100 rst:dark:bg-success-900/30 rst:dark:text-success-300 rst:dark:hover:bg-success-900/50" },
      { variant: "soft", colorScheme: "error",   className: "rst:bg-error-50 rst:text-error-700 rst:hover:bg-error-100 rst:dark:bg-error-900/30 rst:dark:text-error-300 rst:dark:hover:bg-error-900/50" },
      { variant: "soft", colorScheme: "neutral", className: "rst:bg-gray-100 rst:text-gray-700 rst:hover:bg-gray-200 rst:dark:bg-gray-800/50 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800" },

      // --- OUTLINE VARIANTS (Borders + Colored Adaptive Text + Transparent Hover) ---
      { variant: "outline", colorScheme: "primary", className: "rst:border-primary-600 rst:text-primary-600 rst:hover:bg-primary-50 rst:dark:border-primary-500 rst:dark:text-primary-400 rst:dark:hover:bg-primary-500/10" },
      { variant: "outline", colorScheme: "orange",  className: "rst:border-orange-600 rst:text-orange-600 rst:hover:bg-orange-50 rst:dark:border-orange-500 rst:dark:text-orange-400 rst:dark:hover:bg-orange-500/10" },
      { variant: "outline", colorScheme: "teal",    className: "rst:border-teal-600 rst:text-teal-600 rst:hover:bg-teal-50 rst:dark:border-teal-500 rst:dark:text-teal-400 rst:dark:hover:bg-teal-500/10" },
      { variant: "outline", colorScheme: "purple",  className: "rst:border-purple-600 rst:text-purple-600 rst:hover:bg-purple-50 rst:dark:border-purple-500 rst:dark:text-purple-400 rst:dark:hover:bg-purple-500/10" },
      { variant: "outline", colorScheme: "amber",   className: "rst:border-amber-600 rst:text-amber-600 rst:hover:bg-amber-50 rst:dark:border-amber-500 rst:dark:text-amber-400 rst:dark:hover:bg-amber-500/10" },
      { variant: "outline", colorScheme: "success", className: "rst:border-success-600 rst:text-success-600 rst:hover:bg-success-50 rst:dark:border-success-500 rst:dark:text-success-400 rst:dark:hover:bg-success-500/10" },
      { variant: "outline", colorScheme: "error",   className: "rst:border-error-600 rst:text-error-600 rst:hover:bg-error-50 rst:dark:border-error-500 rst:dark:text-error-400 rst:dark:hover:bg-error-500/10" },
      { variant: "outline", colorScheme: "neutral", className: "rst:border-gray-300 rst:text-gray-700 rst:hover:bg-gray-50 rst:dark:border-gray-600 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800/50" },

      // --- GHOST VARIANTS (Adaptive Text + Translucent Hover) ---
      // Translucent rather than a solid tint step. A ghost button sits directly
      // on the host's own background, and a solid `bg-*-50` silently disappears
      // wherever that background happens to equal the step it names — which is
      // exactly what happened to one app, whose paper is the same value it
      // maps `--roster-gray-100` to. An alpha wash darkens or lightens whatever
      // is actually behind it, so it reads on any surface.
      { variant: "ghost", colorScheme: "primary", className: "rst:text-primary-600 rst:hover:bg-primary-500/10 rst:dark:text-primary-400 rst:dark:hover:bg-primary-400/15" },
      { variant: "ghost", colorScheme: "orange",  className: "rst:text-orange-600 rst:hover:bg-orange-500/10 rst:dark:text-orange-400 rst:dark:hover:bg-orange-400/15" },
      { variant: "ghost", colorScheme: "teal",    className: "rst:text-teal-600 rst:hover:bg-teal-500/10 rst:dark:text-teal-400 rst:dark:hover:bg-teal-400/15" },
      { variant: "ghost", colorScheme: "purple",  className: "rst:text-purple-600 rst:hover:bg-purple-500/10 rst:dark:text-purple-400 rst:dark:hover:bg-purple-400/15" },
      { variant: "ghost", colorScheme: "amber",   className: "rst:text-amber-600 rst:hover:bg-amber-500/10 rst:dark:text-amber-400 rst:dark:hover:bg-amber-400/15" },
      { variant: "ghost", colorScheme: "success", className: "rst:text-success-600 rst:hover:bg-success-500/10 rst:dark:text-success-400 rst:dark:hover:bg-success-400/15" },
      { variant: "ghost", colorScheme: "error",   className: "rst:text-error-600 rst:hover:bg-error-500/10 rst:dark:text-error-400 rst:dark:hover:bg-error-400/15" },
      { variant: "ghost", colorScheme: "neutral", className: "rst:text-gray-600 rst:hover:bg-gray-500/10 rst:dark:text-gray-400 rst:dark:hover:bg-gray-400/15" },

      // --- LINK VARIANTS (Adaptive Text Only + Underline) ---
      { variant: "link", colorScheme: "primary", className: "rst:text-primary-600 rst:hover:text-primary-700 rst:dark:text-primary-400 rst:dark:hover:text-primary-300" },
      { variant: "link", colorScheme: "orange",  className: "rst:text-orange-600 rst:hover:text-orange-700 rst:dark:text-orange-400 rst:dark:hover:text-orange-300" },
      { variant: "link", colorScheme: "teal",    className: "rst:text-teal-600 rst:hover:text-teal-700 rst:dark:text-teal-400 rst:dark:hover:text-teal-300" },
      { variant: "link", colorScheme: "purple",  className: "rst:text-purple-600 rst:hover:text-purple-700 rst:dark:text-purple-400 rst:dark:hover:text-purple-300" },
      { variant: "link", colorScheme: "amber",   className: "rst:text-amber-600 rst:hover:text-amber-700 rst:dark:text-amber-400 rst:dark:hover:text-amber-300" },
      { variant: "link", colorScheme: "success", className: "rst:text-success-600 rst:hover:text-success-700 rst:dark:text-success-400 rst:dark:hover:text-success-300" },
      { variant: "link", colorScheme: "error",   className: "rst:text-error-600 rst:hover:text-error-700 rst:dark:text-error-400 rst:dark:hover:text-error-300" },
      { variant: "link", colorScheme: "neutral", className: "rst:text-gray-600 rst:hover:text-gray-900 rst:dark:text-gray-400 rst:dark:hover:text-gray-100" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "default",
      singleLine: false,
      layout: "inline",
      pressed: false,
    },
  }
);
