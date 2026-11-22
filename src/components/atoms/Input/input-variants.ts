import { cva } from "class-variance-authority";
import { SLOT_INK, SLOT_INK_COMPOUNDS, SLOT_INK_ERROR } from "../../../internal/slot-ink";

export const inputVariants = /* @__PURE__ */ cva(
  /* `h-10 px-4` are floors, not defaults. `VariantProps` admits `null`, so
     `size={fieldSize ?? null}` typechecks and `defaultVariants` cannot catch it
     — and because padding moved out of this base into the size scale, a null
     size produced a field with no height AND no horizontal padding, text flush
     against the border. `cn()` is tailwind-merge, so a real size still wins. */
  "rst:font-ui rst:flex rst:w-full rst:rounded-md rst:border rst:h-10 rst:px-4 rst:text-sm rst:ring-offset-background rst:focus-visible:ring-offset-2 rst:file:border-0 rst:file:bg-transparent rst:file:text-sm rst:file:font-medium rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:transition-all",
  {
    variants: {
      variant: {
        /* Its edge reads the field-border tokens, as `outline`'s and
           `soft`'s do; its fill, text and placeholder stay named. A gray-300
           hairline was 1.49:1 on white, and a white field on a white Card has
           no fill edge either, so the line was all it had. In dark, gray-700
           was 1.70 on a Card, and the focus border was primary-500 with no
           dark step (2.75). The token also follows the surfaces that set it:
           the `primary` and `slate` Dialogs and ActionBar's `primary`. */
        white:
          "rst:border-[var(--roster-control-border)] rst:bg-white rst:text-gray-900 rst:placeholder:text-gray-500 rst:focus-visible:border-[var(--roster-control-border-focus)] rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-400",
        /* A boundary that does not depend on what is behind it. `soft` used
           `border-transparent` and leaned on its fill alone, which fails the
           moment the fill matches the surface — exactly 1.00:1 inside a
           `white` Dialog in dark mode, where both are gray-800, so the field
           vanished until focus. Reported twice in one app before anyone read
           the variant. The border is the same token `outline` reads, so a
           consumer repaints both at once. */
        soft:
          "rst:border-[var(--roster-control-border)] rst:bg-gray-100 rst:text-gray-900 rst:placeholder:text-gray-500 rst:focus-visible:bg-white rst:focus-visible:border-primary-500 rst:dark:focus-visible:border-primary-400 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-400 rst:dark:focus-visible:bg-gray-900",
        /* Light needs no line: the gray-700 fill is its edge on any light
           surface (10.27:1 on white). Dark's gray-900 fill had none, 1.00:1
           on a dark Card, so dark draws gray-400, the one step that clears
           3:1 on every dark surface. Named, not the token, because slate
           names its surface and the token would apply in one theme only. */
        slate:
          "rst:border-transparent rst:bg-gray-700 rst:text-gray-100 rst:placeholder:text-gray-300 rst:focus-visible:bg-gray-600 rst:dark:border-gray-400 rst:dark:bg-gray-900 rst:dark:placeholder:text-gray-400 rst:dark:focus-visible:bg-gray-800",
        /* The default variant, and the only one that reads tokens.
           `Button`'s colors resolve through `--roster-*`, so remapping a palette
           carries; these were hardcoded, so a consumer wanting a field border in
           their own accent had no variant for it and no token to point at.
           Three of the four still default to what this variant used before.
           `--roster-control-border` does not: the 1.4.11 pass raised it two
           ramp steps, because gray-300 was a 1.49:1 hairline rather than a
           boundary — so field borders DO get heavier on a bump, deliberately.

           `soft` and `white` read that one token too, and `white` its focus
           border's. It is the only thing they borrow: a filled field cannot
           supply its own boundary on a surface it does not know, and `soft`
           leaning on fill alone made it invisible at 1.00:1 inside a `white`
           Dialog in dark mode. Their fills, text and placeholders, and all of
           `slate` and `ghost`, stay opinionated: each names a specific
           surface, and a token that meant something different in each would
           not be a token.

           Placeholders have to reach 4.5:1; gray-400, which every variant
           used, is 2.52:1 on white. Here the placeholder is the text token at
           65%, so it follows whatever surface the text was chosen for (5.46:1
           on a white page, 7.76 on the dark one, 5.02 inside the `slate`
           Dialog, where a fixed gray-500 would fall to 1.71; measured
           rendered, src/fills-and-fields.checks.stories.tsx). The opinionated
           variants name a step per scheme instead, measured on their own
           fill. An error leaves the placeholder alone: a red that passes is
           too close to the typed text's red to tell them apart. */
        outline:
          "rst:border-[var(--roster-control-border)] rst:bg-[var(--roster-control-bg)] rst:text-[var(--roster-control-text)] rst:placeholder:text-[color-mix(in_srgb,var(--roster-control-text)_65%,transparent)] rst:focus-visible:border-[var(--roster-control-border-focus)]",
        ghost:
          "rst:border-transparent rst:bg-transparent rst:text-gray-900 rst:placeholder:text-gray-500 rst:hover:bg-gray-100 rst:focus-visible:bg-gray-100 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-400 rst:dark:hover:bg-gray-800 rst:dark:focus-visible:bg-gray-800",
      },
      /* Deliberately the same three heights as Button: h-9 / h-10 / h-11.
         Input was a fixed 42px, which agreed with Button at no size at all, so
         a field beside a submit button never lined up. One app gave up and
         kept a raw <input> pinned to h-11. */
      size: {
        sm: "rst:h-9 rst:px-3",
        default: "rst:h-10 rst:px-4",
        /* Heights mirror Button exactly. Padding does not at `lg`: Button is
           `px-8`, which centres a short label, while a field's text should
           start near its edge at every size. The alignment contract is the
           height, and that is what the parity test asserts. */
        lg: "rst:h-11 rst:px-4",
      },
      /* An error is the field's state until it's fixed, so the edge and the
         typed text keep their error inks at rest, hovered and focused: an
         edge that turned the variant's blue on focus said "fine" just as
         someone was fixing it. Focus shows by the ring, in the same ink. The
         dark edge is error-400, as the ring already was: error-500 read 2.74
         on a dark Card, where it's an `outline` field's only edge. */
      error: {
        true: "rst:border-error-500 rst:focus-visible:border-error-500 rst:focus-visible:ring-error-500 rst:text-error-600 rst:dark:border-error-400 rst:dark:focus-visible:border-error-400 rst:dark:text-error-400 rst:dark:focus-visible:ring-error-400",
        false: "",
      },
    },
    /* In an error, no field changes its fill on hover or focus: a lighter
       fill is what sank the red (error-600 on a focused light slate field read
       1.09:1). Each tinting variant holds its rest fill. `slate` also takes
       the dark-surface red in light, a step lighter, since its fill is dark
       in both themes. */
    compoundVariants: [
      { variant: "soft", error: true, class: "rst:focus-visible:bg-gray-100 rst:dark:focus-visible:bg-gray-800" },
      { variant: "ghost", error: true, class: "rst:hover:bg-transparent rst:focus-visible:bg-transparent rst:dark:hover:bg-transparent rst:dark:focus-visible:bg-transparent" },
      { variant: "slate", error: true, class: "rst:text-error-300 rst:focus-visible:bg-gray-700 rst:dark:text-error-400 rst:dark:focus-visible:bg-gray-900" },
    ],
    defaultVariants: {
      variant: "outline",
      size: "default",
      error: false,
    },
  }
);

/* The icon slot takes the ink its variant gives its placeholder. A slot can't
   tell a mark from a control, and an end icon is often a control (a reveal
   toggle, a clear button) whose icon is all there is of it, so it needs 3:1
   (WCAG 1.4.11). An icon fainter than the placeholder beside it also reads as
   disabled. The inks are shared with the chevrons in Combobox, Select and
   MultiSelect (src/internal/slot-ink.ts). */
export const iconVariants = /* @__PURE__ */ cva(
  "rst:absolute rst:top-1/2 rst:-translate-y-1/2 rst:transition-colors",
  {
    variants: {
      variant: SLOT_INK,
      error: SLOT_INK_ERROR,
    },
    compoundVariants: [...SLOT_INK_COMPOUNDS],
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);