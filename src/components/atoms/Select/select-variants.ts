import { cva } from "class-variance-authority";

export const selectTriggerVariants = cva(
  /* `h-10 pl-4 pr-10` are floors, not defaults, for the same reason Input's
     are: `VariantProps` admits `null`, so `size={fieldSize ?? null}`
     typechecks and would otherwise leave the trigger with no height and its
     label flush against the ring. `cn()` is tailwind-merge, so a real size
     still wins.

     Height used to be a side effect of `py-2.5` plus the line box, and the
     base carried `sm:leading-6` — which made this the only control in the
     library whose height changed at a breakpoint: 40px on mobile, 44px from
     `sm` up. It is now an explicit height at every width. */
  "rst:font-ui rst:relative rst:flex rst:w-full rst:cursor-pointer rst:disabled:cursor-not-allowed rst:disabled:opacity-50 rst:items-center rst:rounded-md rst:h-10 rst:pl-4 rst:pr-10 rst:text-left rst:text-sm rst:font-medium rst:shadow-sm rst:ring-1 rst:ring-inset rst:transition-all rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring",
  {
    variants: {
      variant: {
        white:
          "rst:bg-white rst:text-gray-900 rst:ring-gray-300 rst:hover:bg-gray-50 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:ring-gray-700 rst:dark:hover:bg-gray-700",
        soft:
          "rst:bg-gray-100 rst:text-gray-900 rst:ring-transparent rst:hover:bg-gray-200 rst:dark:bg-gray-800 rst:dark:text-gray-100 rst:dark:hover:bg-gray-700",
        slate:
          "rst:bg-gray-700 rst:text-gray-100 rst:ring-transparent rst:hover:bg-gray-600 rst:dark:bg-gray-900 rst:dark:text-gray-100 rst:dark:hover:bg-gray-800",
        /* The default variant, and the only one that reads tokens, exactly as
           in Input. It takes three of the four: focus on the trigger is the
           shared ring, not a border color, so `--roster-control-border-focus`
           has nothing to apply to here.

           No `hover:bg-*`, unlike the other four. A hover fill is a second
           hardcoded surface painted over the one the consumer just chose:
           tailwind-merge keeps both (different modifier), so a themed trigger
           took the host's color at rest and gray-50 on hover. The
           `ThemedWithTokens` story was the repro — near-white text on gray-50,
           about 1:1. Input's outline has no hover either, so this is also the
           parity the size scale is arguing for. */
        outline:
          "rst:bg-[var(--roster-control-bg)] rst:text-[var(--roster-control-text)] rst:ring-[color:var(--roster-control-border)]",
        ghost:
          "rst:bg-transparent rst:text-gray-700 rst:ring-transparent rst:hover:bg-gray-100 rst:hover:text-gray-900 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800 rst:dark:hover:text-gray-100",
      },
      /* The same three heights as Button and Input: h-9 / h-10 / h-11. */
      size: {
        sm: "rst:h-9 rst:pl-3 rst:pr-9",
        default: "rst:h-10 rst:pl-4 rst:pr-10",
        /* Right padding does not grow with `lg`. It is clearance for the
           chevron, which is a fixed 14px at every size, so widening it would
           only push the label away from a gap that is already big enough. */
        lg: "rst:h-11 rst:pl-4 rst:pr-10",
      },
      error: {
        /* `focus-visible:`, not `focus:`. The base sets
           `focus-visible:ring-ring`; a `focus:` class lands in a different
           tailwind-merge group, so both survived, and equal specificity meant
           the later rule in the stylesheet won — an errored Select drew the
           PRIMARY ring on keyboard focus. Input avoided this by accident of
           modifier choice. */
        true: "rst:ring-error-500 rst:text-error-600 rst:focus-visible:ring-error-500 rst:dark:ring-error-500 rst:dark:text-error-400 rst:dark:focus-visible:ring-error-400",
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

export const selectOptionVariants = cva(
  /* Horizontal padding is a floor here, and tracks the trigger's so the label's
     left edge stays put between the closed trigger and the open menu. (The menu
     does not open OVER the trigger — it is anchored `bottom start` with a 4px
     gap — so this is vertical continuity, not overlap.)

     `text-sm` lives here rather than on the popup, and carries no `sm:`. The
     popup used to set `text-base sm:text-sm`, which made a menu row 44px on
     mobile and 40px from `sm` up: the exact breakpoint-dependent geometry this
     change removed from the trigger, still alive one element away. */
  "rst:text-sm rst:group rst:relative rst:cursor-default rst:select-none rst:py-2.5 rst:pl-4 rst:pr-9 rst:transition-colors rst:text-gray-900 rst:dark:text-gray-100 rst:data-focus:bg-primary-100 rst:data-focus:text-primary-900 rst:dark:data-focus:bg-primary-900/30 rst:dark:data-focus:text-primary-100 rst:data-selected:bg-gray-50 rst:dark:data-selected:bg-gray-700/50 rst:data-disabled:opacity-50 rst:data-disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "rst:py-2 rst:pl-3 rst:pr-8",
        default: "rst:py-2.5 rst:pl-4 rst:pr-9",
        /* `lg` matches `default` on purpose: trigger height is an alignment
           contract with a neighbouring Button, while menu row height is a
           scan-density choice with nothing to align to. Density does not have
           to follow alignment. */
        lg: "rst:py-2.5 rst:pl-4 rst:pr-9",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);
