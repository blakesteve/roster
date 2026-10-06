import { cva } from "class-variance-authority";

export const textareaVariants = /* @__PURE__ */ cva(
  "rst:font-ui rst:flex rst:w-full rst:min-h-[80px] rst:rounded-md rst:border rst:py-2.5 rst:px-4 rst:text-sm rst:ring-offset-background rst:focus-visible:ring-offset-2 rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:transition-colors rst:custom-scrollbar",
  {
    variants: {
      variant: {
        /* Reads `--roster-control-*`, the same four `Input` and `Select` read.
           4.8.0 migrated those two and not this one, so an `Input` above a
           `Textarea` in the same form disagreed twice: light, the Input took
           the consumer's border token while this stayed gray-300; dark, the
           Input was transparent and followed its surface while this was
           gray-950, a near-black box on a gray-800 dialog. Both were reported
           by eye before anyone read the variants.

           The placeholder is the field's own text color at 65%, the same rule
           Input's `outline` uses, so it reaches 4.5:1 on whatever surface the
           text token was chosen for: 5.46:1 on a white page, 7.76 on the dark
           one, 5.02 inside the `slate` Dialog, measured rendered. The base used to set gray-400
           for every variant and scheme, which is 2.52:1 on white, and
           Input's old dark gray-500 is 3.30:1 on the dark page; neither is a
           step that passes in both. The other variants name their surface, so
           they name a step for each scheme instead: gray-500 light, gray-400
           dark. An error no longer recolors the placeholder: red at a
           readable contrast is too close to the typed text's own red to tell
           apart, and the border and message already say what's wrong.

           The border and text defaults are the values this variant already
           used. The fill does change,
           from `bg-white` / `dark:bg-gray-950` to the token's `transparent` —
           which is invisible on the default page surfaces those two named, and
           is the entire point everywhere else: a field drawn inside a Dialog
           now takes the Dialog's surface instead of punching a white or
           near-black hole in it. */
        outline:
          "rst:border-[var(--roster-control-border)] rst:bg-[var(--roster-control-bg)] rst:text-[var(--roster-control-text)] rst:placeholder:text-[color-mix(in_srgb,var(--roster-control-text)_65%,transparent)] rst:focus-visible:border-[var(--roster-control-border-focus)]",
        /* A boundary that does not depend on what is behind it. `soft` used
           `border-transparent` and leaned on its fill alone, which fails the
           moment the fill matches the surface — exactly 1.00:1 inside a
           `white` Dialog in dark mode, where both are gray-800, so the field
           vanished until focus. Reported twice in one app before anyone read
           the variant. The border is the same token `outline` reads, so a
           consumer repaints both at once. */
        soft:
          "rst:border-[var(--roster-control-border)] rst:bg-gray-100 rst:text-gray-900 rst:placeholder:text-gray-500 rst:dark:placeholder:text-gray-400 rst:focus-visible:bg-white rst:focus-visible:border-primary-500 rst:dark:bg-gray-800/50 rst:dark:text-gray-100 rst:dark:focus-visible:bg-gray-900 rst:dark:focus-visible:border-primary-400",
        ghost:
          "rst:border-transparent rst:bg-transparent rst:text-gray-900 rst:placeholder:text-gray-500 rst:dark:placeholder:text-gray-400 rst:hover:bg-gray-100 rst:focus-visible:bg-gray-100 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800 rst:dark:focus-visible:bg-gray-800",
        white:
          "rst:border-gray-200 rst:bg-white rst:text-gray-900 rst:placeholder:text-gray-500 rst:dark:placeholder:text-gray-400 rst:focus-visible:border-primary-500 rst:dark:border-gray-800 rst:dark:bg-gray-900 rst:dark:text-gray-100 rst:dark:focus-visible:border-primary-400",
      },
      error: {
        true: "rst:border-error-500 rst:focus-visible:ring-error-500 rst:text-error-900 rst:dark:border-error-500 rst:dark:focus-visible:ring-error-500 rst:dark:text-error-100",
        false: "",
      },
      resize: {
        none: "rst:resize-none",
        vertical: "rst:resize-y",
        horizontal: "rst:resize-x",
        both: "rst:resize",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
      resize: "vertical",
    },
  }
);