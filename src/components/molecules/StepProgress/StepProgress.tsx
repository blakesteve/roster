import { cn } from "../../../lib/utils";
import { Progress } from "../../atoms/Progress/Progress";

/** Every word StepProgress shows or says. Pass any of them in `labels` to replace it. */
export interface StepProgressLabels {
  /** The list's name. */
  nav: string;
  /** Where you are: "Step 2 of 5". */
  position: (current: number, total: number) => string;
  /** Said after a finished step's name. */
  done: string;
  /** A step's number as shown. */
  number: (step: number) => string;
}

const LABELS: StepProgressLabels = {
  nav: "Progress",
  position: (current, total) => `Step ${current} of ${total}`,
  done: "done",
  number: (step) => String(step),
};

export interface StepProgressProps {
  /** Each step's name, in order. */
  steps: string[];
  /** The step you're on, from 1. Past the last means every step is done. */
  current: number;
  /**
   * - `"stepper"`: every step named, with a numbered marker and connectors
   *   that fill behind the current one. For a flow with room to show its map.
   * - `"segmented"`: a segmented bar and "Step 2 of 5", for a card or a side
   *   panel. The segments alone don't say where you are, so the words always
   *   come with them.
   */
  variant?: "stepper" | "segmented";
  labels?: Partial<StepProgressLabels>;
  className?: string;
}

const Check = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * Discrete progress through named steps: a join flow, a setup, a checkout.
 *
 * The current step is `aria-current="step"`, each finished one says so, and
 * a polite status says the new position ("Step 3 of 5: Shelf") when it
 * changes.
 */
function StepProgress({ steps, current: rawCurrent, variant = "stepper", labels: overrides, className }: StepProgressProps) {
  const l = { ...LABELS, ...overrides };
  const total = steps.length;
  if (total === 0) return null;
  const current = Math.min(Math.max(1, Math.floor(Number.isFinite(rawCurrent) ? rawCurrent : 1)), total + 1);
  const finished = current > total;
  const position = finished ? l.position(total, total) : l.position(current, total);
  const said = finished ? position : `${position}: ${steps[current - 1]}`;

  if (variant === "segmented") {
    return (
      <div className={cn("rst:font-ui rst:w-full rst:min-w-0", className)} data-step-progress="segmented">
        <div className="rst:mb-1.5 rst:flex rst:items-baseline rst:justify-between rst:gap-3 rst:text-sm" aria-hidden="true">
          <span className="rst:font-medium rst:text-[var(--roster-control-text)]" data-step-position="">
            {position}
          </span>
          {!finished && (
            <span className="rst:min-w-0 rst:truncate rst:text-gray-600 rst:dark:text-gray-400" data-step-name="">
              {steps[current - 1]}
            </span>
          )}
        </div>
        <Progress
          variant="segmented"
          segments={steps.map((_, i) => (i + 1 < current ? "done" : i + 1 === current ? "current" : "remaining"))}
          announce={false}
        />
        <span role="status" className="rst:sr-only" data-step-status="">
          {said}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("rst:font-ui rst:w-full", className)} data-step-progress="stepper">
      {/* m-0 p-0 list-none: without a reset, a list's own indent pushes the
          stepper 40px past its box. */}
      <ol aria-label={l.nav} className="rst:m-0 rst:flex rst:w-full rst:list-none rst:p-0">
        {steps.map((name, i) => {
          const step = i + 1;
          const state = step < current ? "done" : step === current ? "current" : "upcoming";
          return (
            <li
              key={`${step}-${name}`}
              aria-current={state === "current" ? "step" : undefined}
              className="rst:relative rst:flex rst:min-w-0 rst:flex-1 rst:flex-col rst:items-center rst:gap-1.5 rst:text-center"
              data-step={state}
            >
              {/* The connector from the step before, drawn behind both
                  markers: filled once this step is reached. */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "rst:absolute rst:right-1/2 rst:top-4 rst:h-0.5 rst:w-full rst:-translate-y-1/2",
                    step <= current
                      ? "rst:bg-primary-600 rst:dark:bg-primary-400 rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[Highlight]"
                      : "rst:bg-[var(--roster-skeleton)] rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[GrayText]",
                  )}
                  data-step-connector={step <= current ? "filled" : "empty"}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "rst:relative rst:z-10 rst:flex rst:h-8 rst:w-8 rst:items-center rst:justify-center rst:rounded-full rst:text-sm rst:font-semibold rst:tabular-nums",
                  state === "done" &&
                    "rst:bg-primary-600 rst:text-primary-600-ink rst:dark:bg-primary-400 rst:dark:text-gray-950 rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[Highlight] rst:forced-colors:text-[HighlightText]",
                  /* A border, not a ring: forced colors keep a border and drop
                     the shadow a ring is drawn with. */
                  state === "current" &&
                    "rst:border-2 rst:border-primary-600 rst:bg-[var(--roster-card-bg)] rst:text-primary-600 rst:dark:border-primary-400 rst:dark:text-primary-400",
                  state === "upcoming" && "rst:bg-[var(--roster-skeleton)] rst:text-gray-600 rst:dark:text-gray-300 rst:forced-colors:border",
                )}
                data-step-marker=""
              >
                {state === "done" ? <Check /> : l.number(step)}
              </span>
              <span
                className={cn(
                  "rst:w-full rst:px-1 rst:text-xs rst:leading-4 rst:break-words",
                  state === "current" ? "rst:font-semibold rst:text-[var(--roster-control-text)]" : "rst:text-gray-600 rst:dark:text-gray-400",
                )}
              >
                {name}
                {state === "done" && <span className="rst:sr-only">{`, ${l.done}`}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <span role="status" className="rst:sr-only" data-step-status="">
        {said}
      </span>
    </div>
  );
}

export { StepProgress };
