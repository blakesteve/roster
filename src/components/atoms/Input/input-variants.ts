import { cva } from "class-variance-authority";

export const inputVariants = cva(
  /* `h-10 px-4` are floors, not defaults. `VariantProps` admits `null`, so
     `size={fieldSize ?? null}` typechecks and `defaultVariants` cannot catch it
     — and because padding moved out of this base into the size scale, a null
     size produced a field with no height AND no horizontal padding, text flush
     against the border. `cn()` is tailwind-merge, so a real size still wins. */
  "rst:font-ui rst:flex rst:w-full rst:rounded-md rst:border rst:h-10 rst:px-4 rst:text-sm rst:ring-offset-background rst:focus-visible:ring-offset-2 rst:file:border-0 rst:file:bg-transparent rst:file:text-sm rst:file:font-medium rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:transition-all",
  {
    variants: {
      variant: {
        white:
          "rst:border-gray-300 rst:bg-white rst:text-gray-900 rst:placeholder:text-gray-400 rst:focus-visible:border-primary-500 rst:dark:border-gray-700 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500",
        soft:
          "rst:border-transparent rst:bg-gray-100 rst:text-gray-900 rst:placeholder:text-gray-400 rst:focus-visible:bg-white rst:focus-visible:border-primary-500 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500 rst:dark:focus-visible:bg-gray-900",
        slate:
          "rst:border-transparent rst:bg-gray-700 rst:text-gray-100 rst:placeholder:text-gray-400 rst:focus-visible:bg-gray-600 rst:dark:bg-gray-900 rst:dark:placeholder:text-gray-500 rst:dark:focus-visible:bg-gray-800",
        /* The default variant, and the only one that reads tokens.
           `Button`'s colors resolve through `--roster-*`, so remapping a palette
           carries; these were hardcoded, so a consumer wanting a field border in
           their own accent had no variant for it and no token to point at.
           The four tokens default to exactly the values this variant used
           before, so nothing moves for a consumer who sets none of them at
           `:root`. The other four
           variants stay opinionated on purpose: `white`, `soft`, `slate` and
           `ghost` each name a specific surface, and a token that meant something
           different in each would not be a token. */
        outline:
          "rst:border-[var(--roster-control-border)] rst:bg-[var(--roster-control-bg)] rst:text-[var(--roster-control-text)] rst:placeholder:text-gray-400 rst:focus-visible:border-[var(--roster-control-border-focus)] rst:dark:placeholder:text-gray-500",
        ghost:
          "rst:border-transparent rst:bg-transparent rst:text-gray-900 rst:placeholder:text-gray-400 rst:hover:bg-gray-100 rst:focus-visible:bg-gray-100 rst:dark:text-gray-100 rst:dark:placeholder:text-gray-500 rst:dark:hover:bg-gray-800 rst:dark:focus-visible:bg-gray-800",
      },
      /* Deliberately the same three heights as Button: h-9 / h-10 / h-11.
         Input was a fixed 42px, which agreed with Button at no size at all, so
         a field beside a submit button never lined up. retrospect gave up and
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
      error: {
        true: "rst:border-error-500 rst:focus-visible:ring-error-500 rst:text-error-600 rst:placeholder:text-error-300 rst:dark:border-error-500 rst:dark:text-error-400 rst:dark:placeholder:text-error-800 rst:dark:focus-visible:ring-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
      error: false,
    },
  }
);

export const iconVariants = cva(
  "rst:absolute rst:top-1/2 rst:-translate-y-1/2 rst:transition-colors",
  {
    variants: {
      variant: {
        white: "rst:text-gray-400 rst:dark:text-gray-500",
        soft: "rst:text-gray-500 rst:dark:text-gray-400",
        slate: "rst:text-gray-300 rst:dark:text-gray-500",
        outline: "rst:text-gray-400 rst:dark:text-gray-500",
        ghost: "rst:text-gray-500 rst:dark:text-gray-400",
      },
      error: {
        true: "rst:text-error-500 rst:dark:text-error-400",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);