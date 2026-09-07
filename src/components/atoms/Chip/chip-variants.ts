import { cva } from "class-variance-authority";

/**
 * Chip vs Pill vs Badge.
 *
 * Badge is a compact label attached to something else: a count on an avatar, a
 * status on a table row. Pill is standalone inline chrome carrying a short
 * phrase: social proof, live state, a filter that reads as a sentence fragment.
 * Neither does anything when you click it.
 *
 * Chip is the interactive one. It is removable, selectable, or both, and it is
 * the only one of the three that is a control rather than decoration. That is
 * also why it is a component and not a `interactive` prop on Badge: it renders
 * real buttons with real names and real focus rings, and bolting that onto a
 * `<span>` would either lie to assistive tech or turn Badge into two
 * components wearing one name.
 *
 * The visual language deliberately matches Pill — fully rounded, roomy
 * horizontal padding — because a selected filter and a filter that merely
 * reads as one should not look like different species. The difference the
 * viewer should notice is that this one responds.
 */
export const chipVariants = cva(
  "rst:font-ui rst:inline-flex rst:items-center rst:rounded-full rst:font-medium rst:whitespace-nowrap rst:align-middle rst:transition-colors",
  {
    variants: {
      colorScheme: {
        primary: "",
        success: "",
        error: "",
        amber: "",
        info: "",
        neutral: "",
      },
      variant: {
        soft: "",
        outline: "rst:bg-transparent rst:border",
        solid: "",
      },
      size: {
        sm: "rst:text-xs rst:px-2.5 rst:py-0.5 rst:gap-1.5",
        md: "rst:text-sm rst:px-3 rst:py-1 rst:gap-2",
      },
      disabled: {
        /* `cursor-not-allowed`, not `pointer-events-none`. The library has both
           patterns — Button takes pointer events away, Input and Textarea show
           the refusal — and a chip is closer to a field: it sits in a row of
           them, and silently doing nothing on click reads as a broken chip
           rather than a disabled one. Pointer events have to stay live for any
           cursor to be shown at all, which is safe here because every control
           carries the native `disabled` attribute and cannot fire regardless. */
        true: "rst:opacity-50 rst:cursor-not-allowed",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "soft", colorScheme: "primary", className: "rst:bg-primary-50 rst:text-primary-700 rst:dark:bg-primary-500/15 rst:dark:text-primary-300" },
      { variant: "soft", colorScheme: "success", className: "rst:bg-success-50 rst:text-success-700 rst:dark:bg-success-500/15 rst:dark:text-success-300" },
      { variant: "soft", colorScheme: "error",   className: "rst:bg-error-50 rst:text-error-700 rst:dark:bg-error-500/15 rst:dark:text-error-300" },
      { variant: "soft", colorScheme: "amber",   className: "rst:bg-amber-50 rst:text-amber-800 rst:dark:bg-amber-500/15 rst:dark:text-amber-300" },
      { variant: "soft", colorScheme: "info",    className: "rst:bg-info-50 rst:text-info-700 rst:dark:bg-info-500/15 rst:dark:text-info-300" },
      { variant: "soft", colorScheme: "neutral", className: "rst:bg-gray-100 rst:text-gray-700 rst:dark:bg-gray-500/15 rst:dark:text-gray-300" },

      /* `-600` light and `-400` dark, not the `-300` / `-500/40` this started
         with. `outline` is `bg-transparent`, so the border is the only thing
         identifying the control, and 1.4.11 asks 3:1 for that — the first pass
         here ran 1.40 to 1.90 in light and as low as 1.37 composited in dark.
         That is the same hairline 4.8.2 had just finished removing from every
         other control, reintroduced on the newest one. `Button`'s outline uses
         `-600` for exactly this reason. Measured now: 8.71 / 5.02 / 8.31 /
         3.19 / 4.10 / 7.63 on white, and 7.31 / 11.34 / 7.14 / 11.83 / 9.22 /
         7.83 on the gray-950 page.

         This is the one place Chip does NOT match Pill step for step: Pill is
         decoration and 1.4.11 does not reach it, this is a control and it
         does. */
      { variant: "outline", colorScheme: "primary", className: "rst:border-primary-600 rst:text-primary-700 rst:dark:border-primary-400 rst:dark:text-primary-300" },
      { variant: "outline", colorScheme: "success", className: "rst:border-success-600 rst:text-success-700 rst:dark:border-success-400 rst:dark:text-success-300" },
      { variant: "outline", colorScheme: "error",   className: "rst:border-error-600 rst:text-error-700 rst:dark:border-error-400 rst:dark:text-error-300" },
      { variant: "outline", colorScheme: "amber",   className: "rst:border-amber-600 rst:text-amber-800 rst:dark:border-amber-400 rst:dark:text-amber-300" },
      { variant: "outline", colorScheme: "info",    className: "rst:border-info-600 rst:text-info-700 rst:dark:border-info-400 rst:dark:text-info-300" },
      { variant: "outline", colorScheme: "neutral", className: "rst:border-gray-600 rst:text-gray-700 rst:dark:border-gray-400 rst:dark:text-gray-300" },

      /* The same fills and the same ink tokens as Pill's solid, step for step.
         Chip and Pill are the same object at rest and differ only in whether
         they respond, so a solid Chip beside a solid Pill must not be a
         different shade of the same color. (The `outline` borders above are
         the exception, and say why.) Using `-600` here instead looked
         reasonable and asked for `amber-600-ink` and `info-600-ink`, which do
         not exist — `src/contrast.test.ts` caught it on the first run. */
      { variant: "solid", colorScheme: "primary", className: "rst:bg-primary-500 rst:text-primary-500-ink" },
      { variant: "solid", colorScheme: "success", className: "rst:bg-success-500 rst:text-success-500-ink" },
      { variant: "solid", colorScheme: "error",   className: "rst:bg-error-500 rst:text-error-500-ink" },
      { variant: "solid", colorScheme: "amber",   className: "rst:bg-amber-500 rst:text-amber-500-ink" },
      { variant: "solid", colorScheme: "info",    className: "rst:bg-info-500 rst:text-info-500-ink" },
      { variant: "solid", colorScheme: "neutral", className: "rst:bg-gray-600 rst:dark:bg-gray-500 rst:text-gray-600-ink rst:dark:text-gray-500-ink" },
    ],
    defaultVariants: {
      colorScheme: "neutral",
      variant: "soft",
      size: "md",
      disabled: false,
    },
  },
);
