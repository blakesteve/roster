import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { Progress, type ProgressLabels, type ProgressProps } from "../../atoms/Progress/Progress";
import { progressValues } from "../../atoms/Progress/progress-values";

const PERCENT = (percent: number) => `${percent}%`;
const COUNT = (done: number, total: number) => `${done} of ${total}`;

export interface ProgressFieldProps
  extends Pick<ProgressProps, "value" | "max" | "variant" | "segments" | "status" | "size" | "rounded" | "busy" | "announce" | "announceEvery"> {
  /** What's progressing: "Uploading photos". Shown, and said with the value. */
  label: string;
  /** The value as shown and said, in place of the percent or the count: "3 of 8 files". */
  valueText?: string;
  /** A line under the bar: bytes, a step counter, a time left. */
  detail?: ReactNode;
  labels?: Partial<ProgressLabels>;
  className?: string;
}

/**
 * A progress bar with its label and value above it and an optional detail
 * line below: the form to reach for when showing progress. Label left and
 * value right, on one baseline, so a column of them lines up down a page.
 *
 * A screen reader hears the label and value together, politely, as they
 * change (no more than once every 1.5 seconds); the visible pair is hidden
 * from it so it isn't read twice.
 */
function ProgressField({
  label,
  valueText,
  detail,
  labels,
  className,
  ...progress
}: ProgressFieldProps) {
  const { value, max, variant = "continuous", segments, announce = true } = progress;
  /* The same numbers Progress works out, so what's shown and what's said agree. */
  const { known, percent, done, applicable } = progressValues({ value, max, variant, segments });
  const shown =
    valueText ??
    (variant === "segmented" ? (labels?.count ?? COUNT)(done, applicable) : known ? (labels?.percent ?? PERCENT)(percent) : undefined);
  return (
    /* min-w-0: in a grid or flex column, a field otherwise refuses to be
       narrower than its label on one line, and a long label pushes it out of
       the column instead of truncating. */
    <div className={cn("rst:font-ui rst:w-full rst:min-w-0", className)} data-progress-field="">
      {/* Hidden from screen readers while the status says the same; read in
          place when it doesn't. */}
      <div aria-hidden={announce ? true : undefined} className="rst:mb-1.5 rst:flex rst:items-baseline rst:justify-between rst:gap-3 rst:text-sm">
        <span className="rst:min-w-0 rst:truncate rst:font-medium rst:text-[var(--roster-control-text)]" data-progress-label="">
          {label}
        </span>
        {shown !== undefined && (
          <span className="rst:shrink-0 rst:tabular-nums rst:text-gray-600 rst:dark:text-gray-400" data-progress-value="">
            {shown}
          </span>
        )}
      </div>
      <Progress {...progress} label={label} valueText={valueText} labels={labels} />
      {detail !== undefined && (
        <p className="rst:mt-1.5 rst:text-xs rst:text-gray-600 rst:dark:text-gray-400" data-progress-detail="">
          {detail}
        </p>
      )}
    </div>
  );
}

export { ProgressField };
