import { cn } from "../lib/utils";

/**
 * A step's marker, shared by `StepProgress` and `Timeline`, so a finished,
 * current or upcoming step looks the same in both. The check it shows when
 * done is `StepCheck`, in `step-check.tsx`.
 *
 * Internal, and not exported from the package.
 */

export type StepState = "done" | "current" | "upcoming";

/** The marker's classes: a 32px circle, filled when done, ringed when current. */
export const stepMarkerClass = (state: StepState) =>
  cn(
    "rst:relative rst:z-10 rst:flex rst:h-8 rst:w-8 rst:items-center rst:justify-center rst:rounded-full rst:text-sm rst:font-semibold rst:tabular-nums",
    state === "done" &&
      "rst:bg-primary-600 rst:text-primary-600-ink rst:dark:bg-primary-400 rst:dark:text-gray-950 rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[Highlight] rst:forced-colors:text-[HighlightText]",
    /* A border, not a ring: forced colors keep a border and drop the shadow a
       ring is drawn with. */
    state === "current" &&
      "rst:border-2 rst:border-primary-600 rst:bg-[var(--roster-card-bg)] rst:text-primary-600 rst:dark:border-primary-400 rst:dark:text-primary-400",
    state === "upcoming" && "rst:bg-[var(--roster-skeleton)] rst:text-gray-600 rst:dark:text-gray-300 rst:forced-colors:border",
  );
