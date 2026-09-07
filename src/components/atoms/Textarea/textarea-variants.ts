import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "rst:font-ui rst:flex rst:w-full rst:min-h-[80px] rst:rounded-md rst:border rst:py-2.5 rst:px-4 rst:text-sm rst:ring-offset-background rst:focus-visible:ring-offset-2 rst:placeholder:text-gray-400 rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:transition-colors rst:custom-scrollbar",
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

           No `dark:placeholder:text-gray-500` here even though Input's
           `outline` carries one: Input has no placeholder rule in its base, so
           its variant supplies both scopes. This base already sets gray-400,
           and copying Input's line across darkened it to gray-500 — 3.30:1 on
           the page, under the 4.5:1 placeholder text needs.

           The border and text defaults are the values this variant already
           used. The fill does change,
           from `bg-white` / `dark:bg-gray-950` to the token's `transparent` —
           which is invisible on the default page surfaces those two named, and
           is the entire point everywhere else: a field drawn inside a Dialog
           now takes the Dialog's surface instead of punching a white or
           near-black hole in it. */
        outline:
          "rst:border-[var(--roster-control-border)] rst:bg-[var(--roster-control-bg)] rst:text-[var(--roster-control-text)] rst:focus-visible:border-[var(--roster-control-border-focus)]",
        /* A boundary that does not depend on what is behind it. `soft` used
           `border-transparent` and leaned on its fill alone, which fails the
           moment the fill matches the surface — exactly 1.00:1 inside a
           `white` Dialog in dark mode, where both are gray-800, so the field
           vanished until focus. Reported twice in one app before anyone read
           the variant. The border is the same token `outline` reads, so a
           consumer repaints both at once. */
        soft:
          "rst:border-[var(--roster-control-border)] rst:bg-gray-100 rst:text-gray-900 rst:focus-visible:bg-white rst:focus-visible:border-primary-500 rst:dark:bg-gray-800/50 rst:dark:text-gray-100 rst:dark:focus-visible:bg-gray-900 rst:dark:focus-visible:border-primary-400",
        ghost:
          "rst:border-transparent rst:bg-transparent rst:text-gray-900 rst:hover:bg-gray-100 rst:focus-visible:bg-gray-100 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800 rst:dark:focus-visible:bg-gray-800",
        white:
          "rst:border-gray-200 rst:bg-white rst:text-gray-900 rst:focus-visible:border-primary-500 rst:dark:border-gray-800 rst:dark:bg-gray-900 rst:dark:text-gray-100 rst:dark:focus-visible:border-primary-400",
      },
      error: {
        true: "rst:border-error-500 rst:focus-visible:ring-error-500 rst:text-error-900 rst:placeholder:text-error-300 rst:dark:border-error-500 rst:dark:focus-visible:ring-error-500 rst:dark:text-error-100 rst:dark:placeholder:text-error-400/50",
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