/* Shared by `StepProgress` and `Timeline` (see `step-marker.ts`). Internal. */

/** The check a finished step's marker shows in place of its number. */
export const StepCheck = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
