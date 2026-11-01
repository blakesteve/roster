import React from "react";
import { cn } from "../../../lib/utils";
import { withLabels } from "../../../lib/labels";
import { stepMarkerClass, type StepState } from "../../../internal/step-marker";
import { StepCheck } from "../../../internal/step-check";

/** Every word Timeline shows or says. Pass any of them in `labels` to replace it. */
export interface TimelineLabels {
  /** Said after a finished step's title. */
  done: string;
  /** A step's number, as its default marker shows it. */
  number: (step: number) => string;
  /** The word on the "now" divider. Shown only: the divider is hidden from assistive technology. */
  now: string;
}

const LABELS: TimelineLabels = {
  done: "done",
  number: (step) => String(step),
  now: "Now",
};

export type TimelineStep = {
  /** Unique among the steps, and stable: React's key. */
  id: string;
  /** The step's name, at the top of its body. */
  title: React.ReactNode;
  /** The leading column: a date, a week, a time. */
  when?: React.ReactNode;
  /** Anything under the title: a description, facts, a badge. */
  content?: React.ReactNode;
  /** The trailing column: buttons and links of your own. */
  actions?: React.ReactNode;
  /**
   * What sits on the line in place of the numbered marker: a mark of your
   * own, or `"hollow"` for an empty ring, for a step with nothing in it yet.
   * Decoration: hidden from assistive technology. A mark of your own needs a
   * background, or the line shows through it.
   */
  marker?: React.ReactNode | "hollow";
};

export interface TimelineProps {
  steps: TimelineStep[];
  /** The list's name. Use `aria-labelledby` instead when a heading on the page names it. */
  label?: string;
  "aria-labelledby"?: string;
  /**
   * The step you're on, from 1: the ones before it are done, the ones after
   * it upcoming. 0, the default, for none started; past the last for every
   * step done.
   */
  current?: number;
  /**
   * Draws the "now" divider just before this step, from 1: where today falls,
   * which needn't be beside the current step. Leave it out for none.
   */
  nowBefore?: number;
  /** The component's own words, replaced; any left out stay English. */
  labels?: Partial<TimelineLabels>;
  className?: string;
  /** Classes for every step, the `<li>`. It carries `data-step`: `done`, `current` or `upcoming`. */
  stepClassName?: string;
  /** Classes for every step's leading column. */
  whenClassName?: string;
  /** Classes for what holds every step's marker, on the line. */
  markerClassName?: string;
  /** Classes for every step's title. */
  titleClassName?: string;
  /** Classes for every step's `content`. */
  contentClassName?: string;
  /** Classes for every step's trailing column. */
  actionsClassName?: string;
  /** Classes for the "now" divider's row. */
  nowClassName?: string;
}

/* Where each part goes once the timeline is 40rem wide, by which columns the
   steps use. One grid holds every step (each `<li>` is a subgrid of it), so
   the columns line up from step to step whatever each one holds. */
const WIDE = {
  whenActions: {
    grid: "rst:@[40rem]:grid-cols-[fit-content(12rem)_minmax(2rem,max-content)_minmax(0,1fr)_auto]",
    when: "rst:@[40rem]:col-start-1",
    marker: "rst:@[40rem]:col-start-2",
    body: "rst:@[40rem]:col-start-3",
    actions: "rst:@[40rem]:col-start-4",
  },
  when: {
    grid: "rst:@[40rem]:grid-cols-[fit-content(12rem)_minmax(2rem,max-content)_minmax(0,1fr)]",
    when: "rst:@[40rem]:col-start-1",
    marker: "rst:@[40rem]:col-start-2",
    body: "rst:@[40rem]:col-start-3",
    actions: "",
  },
  actions: {
    grid: "rst:@[40rem]:grid-cols-[minmax(2rem,max-content)_minmax(0,1fr)_auto]",
    when: "",
    marker: "rst:@[40rem]:col-start-1",
    body: "rst:@[40rem]:col-start-2",
    actions: "rst:@[40rem]:col-start-3",
  },
  neither: {
    grid: "",
    when: "",
    marker: "rst:@[40rem]:col-start-1",
    body: "rst:@[40rem]:col-start-2",
    actions: "",
  },
} as const;

/* A stretch of the line, behind the markers: filled once the step it leads to
   is reached, as `StepProgress` fills its connectors. */
function Rail({ reached, className }: { reached: boolean; className: string }) {
  return (
    <span
      aria-hidden="true"
      data-timeline-rail={reached ? "done" : "ahead"}
      className={cn(
        "rst:absolute rst:left-1/2 rst:w-0.5 rst:-translate-x-1/2",
        reached
          ? "rst:bg-(--roster-timeline-rail-done) rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[Highlight]"
          : "rst:bg-(--roster-timeline-rail) rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[GrayText]",
        className,
      )}
    />
  );
}

/**
 * Steps down the page, each with its own content: a schedule, a history, an
 * onboarding list. Each step has a title, any content under it, a leading
 * "when" column, a trailing column for actions, and a marker on a line that
 * runs through them all.
 *
 * Its own component rather than `StepProgress orientation="vertical"`, with
 * the same markers. A timeline isn't always progress: a schedule doesn't
 * advance while you watch it, so there's no "Step 3 of 5" status here, and
 * where today falls (the "now" divider) needn't be the current step. And each
 * step carries content, where `StepProgress` takes names.
 *
 * An ordered list with a name. The current step is `aria-current="step"`,
 * each finished one says "done" after its title, and the markers, the line
 * and the "now" divider are hidden from assistive technology. It takes no
 * keys: buttons and links inside a step are reached in reading order, which
 * is the order they're shown in.
 *
 * Below 40rem of its own width the leading column moves above the body and
 * the actions under it.
 */
function Timeline({
  steps,
  label,
  "aria-labelledby": labelledBy,
  current: rawCurrent = 0,
  nowBefore,
  labels: overrides,
  className,
  stepClassName,
  whenClassName,
  markerClassName,
  titleClassName,
  contentClassName,
  actionsClassName,
  nowClassName,
}: TimelineProps) {
  const l = withLabels(LABELS, overrides);
  const total = steps.length;
  if (total === 0) return null;
  const current = Math.min(Math.max(0, Math.floor(Number.isFinite(rawCurrent) ? rawCurrent : 0)), total + 1);
  const hasWhen = steps.some((s) => s.when != null);
  const hasActions = steps.some((s) => s.actions != null);
  const wide = WIDE[hasWhen && hasActions ? "whenActions" : hasWhen ? "when" : hasActions ? "actions" : "neither"];
  const now = nowBefore != null && nowBefore >= 1 && nowBefore <= total ? nowBefore : undefined;

  const nowRow = (before: number) => (
    <li
      key="now"
      aria-hidden="true"
      data-timeline-now=""
      className={cn("rst:col-span-full rst:grid rst:grid-cols-subgrid", nowClassName)}
    >
      {/* Rows by start and end, never a span: the divider's line crosses this
          column too, and a span left this to find its own place, in an empty
          row below the line. */}
      <span className={cn("rst:relative rst:col-start-1 rst:row-start-1 rst:row-end-3 rst:@[40rem]:row-end-2", wide.marker)}>
        {before > 1 && <Rail reached={before <= current} className="rst:inset-y-0" />}
      </span>
      <span
        className={cn(
          "rst:col-start-2 rst:row-start-1 rst:text-xs rst:font-semibold rst:uppercase rst:tracking-wider rst:text-(--roster-timeline-now) rst:forced-colors:text-[CanvasText]",
          hasWhen ? "rst:@[40rem]:col-start-1 rst:@[40rem]:self-center" : wide.body,
        )}
      >
        {l.now}
      </span>
      <span
        className={cn(
          "rst:col-start-1 rst:col-end-[-1] rst:row-start-2 rst:my-2 rst:h-0.5 rst:bg-(--roster-timeline-now) rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[CanvasText]",
          hasWhen && "rst:@[40rem]:col-start-2 rst:@[40rem]:row-start-1 rst:@[40rem]:self-center",
        )}
      />
    </li>
  );

  return (
    <div className={cn("rst:font-ui rst:@container rst:w-full rst:min-w-0", className)} data-timeline="">
      {/* m-0 p-0 list-none: without a reset, a list's own indent pushes the
          timeline 40px past its box. */}
      <ol
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className={cn(
          "rst:m-0 rst:list-none rst:p-0 rst:grid rst:grid-cols-[minmax(2rem,max-content)_minmax(0,1fr)] rst:gap-x-3 rst:@[40rem]:gap-x-4",
          wide.grid,
        )}
      >
        {steps.map((s, i) => {
          const step = i + 1;
          const state: StepState = step < current ? "done" : step === current ? "current" : "upcoming";
          const last = step === total;
          /* The space below a step, kept inside every cell rather than on the
             row, so the marker's cell, and the line in it, reach the next step. */
          const below = last ? "" : "rst:pb-6";
          return (
            <React.Fragment key={s.id}>
              {now === step && nowRow(step)}
              <li
                aria-current={state === "current" ? "step" : undefined}
                data-step={state}
                className={cn("rst:col-span-full rst:grid rst:grid-cols-subgrid", stepClassName)}
              >
                {s.when != null && (
                  <div
                    data-timeline-when=""
                    className={cn(
                      "rst:col-start-2 rst:row-start-1 rst:min-w-0 rst:pt-1.5 rst:text-sm rst:text-gray-600 rst:dark:text-gray-400",
                      "rst:@[40rem]:row-start-1",
                      wide.when,
                      last ? "" : "rst:@[40rem]:pb-6",
                      whenClassName,
                    )}
                  >
                    {s.when}
                  </div>
                )}
                <div
                  aria-hidden="true"
                  data-timeline-marker=""
                  className={cn(
                    "rst:relative rst:col-start-1 rst:row-start-1 rst:row-end-3 rst:flex rst:justify-center rst:@[40rem]:row-end-2",
                    wide.marker,
                    below,
                    markerClassName,
                  )}
                >
                  {step > 1 && <Rail reached={step <= current} className="rst:top-0 rst:h-4" />}
                  {!last && <Rail reached={step + 1 <= current} className="rst:top-4 rst:bottom-0" />}
                  {s.marker == null ? (
                    <span className={stepMarkerClass(state)}>{state === "done" ? <StepCheck /> : l.number(step)}</span>
                  ) : s.marker === "hollow" ? (
                    <span
                      className="rst:relative rst:z-10 rst:block rst:size-8 rst:rounded-full rst:border-2 rst:border-(--roster-timeline-rail) rst:bg-[var(--roster-card-bg)] rst:forced-colors:border-[GrayText]"
                      data-timeline-hollow=""
                    />
                  ) : (
                    <span className="rst:relative rst:z-10">{s.marker}</span>
                  )}
                </div>
                {/* The body and the actions: one block under the leading
                    column while narrow, two of the grid's columns once wide. */}
                <div className={cn("rst:col-start-2 rst:row-start-2 rst:min-w-0 rst:@[40rem]:contents", below)}>
                  <div
                    data-timeline-body=""
                    className={cn(
                      "rst:min-w-0 rst:@[40rem]:row-start-1 rst:@[40rem]:pt-1.5",
                      wide.body,
                      s.when == null && "rst:pt-1.5",
                      last ? "" : "rst:@[40rem]:pb-6",
                    )}
                  >
                    <div
                      className={cn(
                        "rst:text-sm rst:text-[var(--roster-control-text)]",
                        state === "current" ? "rst:font-semibold" : "rst:font-medium",
                        titleClassName,
                      )}
                    >
                      {s.title}
                      {state === "done" && <span className="rst:sr-only">{`, ${l.done}`}</span>}
                    </div>
                    {s.content != null && (
                      <div className={cn("rst:mt-0.5 rst:text-sm rst:text-gray-600 rst:dark:text-gray-400", contentClassName)}>{s.content}</div>
                    )}
                  </div>
                  {s.actions != null && (
                    <div
                      data-timeline-actions=""
                      className={cn(
                        "rst:mt-2 rst:flex rst:flex-wrap rst:gap-2 rst:@[40rem]:row-start-1 rst:@[40rem]:mt-0 rst:@[40rem]:justify-self-end rst:@[40rem]:justify-end",
                        wide.actions,
                        last ? "" : "rst:@[40rem]:pb-6",
                        actionsClassName,
                      )}
                    >
                      {s.actions}
                    </div>
                  )}
                </div>
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}

export { Timeline };
