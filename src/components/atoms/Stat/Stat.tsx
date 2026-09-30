import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { statValueVariants } from "./stat-variants";
import { Eyebrow } from "../Eyebrow/Eyebrow";

export interface StatProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof statValueVariants> {
  /** The figure itself. A string, so you control formatting and units. */
  value: React.ReactNode;
  /** What the figure counts. */
  label: React.ReactNode;
  /**
   * Where the number came from: "live", "GitHub API", "at build time". Small
   * and quiet by design, but worth having — a figure whose provenance is
   * stated reads very differently from one that is merely asserted.
   */
  source?: React.ReactNode;
  /**
   * `"definition"` (default): a `dt` and `dd` pair in a `div`, for a row of
   * Stats inside a `<dl>`. Only valid there.
   *
   * `"standalone"`: plain spans, for a Stat that is not in a list.
   */
  semantics?: "definition" | "standalone";
}

/* `font-normal` and `normal-nums` because in the definition markup the source
   sits inside the value's `dd` and would otherwise inherit its bold, tabular
   figures. In both markups this also means the source no longer inherits a
   weight from outside the Stat: it is always regular. */
const SOURCE =
  "rst:block rst:font-mono rst:text-[0.53125rem] rst:font-normal rst:normal-nums rst:leading-none rst:tracking-[0.06em] rst:text-gray-500 rst:opacity-75 rst:dark:text-gray-400";

/**
 * A figure with its label, and optionally where it came from.
 *
 * By default a `div` holding a `dt` (the label) then a `dd` (the value, with
 * the source inside it), which is what a group inside a `<dl>` must be: a
 * group is its terms and then its details. The value still shows first,
 * because the grid places it there, not the DOM order.
 *
 * With a source, the `dd` spans three rows as a subgrid, so the source can
 * sit below the label while staying inside the `dd` it describes. Both are
 * pinned to column 1: placed by row alone, the `dd` would find the `dt` in
 * its way at row 2 and move to a new column, beside the label. The `dt` is
 * `relative` because the `dd`'s box covers its row, and without it the label
 * would lose clicks and text selection to that box.
 *
 * A `[&>dd]` selector on the Stat reaches the value and the source. The
 * source sets its own family, size, weight, figures, tracking, leading and
 * color; anything else on the `dd` (`uppercase`, `italic`, `opacity`) reaches
 * it too.
 *
 * A Stat outside a list takes `semantics="standalone"`, which renders spans.
 */
const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  (
    { value, label, source, size, colorScheme, semantics = "definition", className, ...props },
    ref,
  ) => {
    const valueClass = statValueVariants({ size, colorScheme });

    if (semantics === "standalone") {
      return (
        <div ref={ref} className={cn("rst:flex rst:flex-col rst:gap-[3px]", className)} {...props}>
          <span className={valueClass}>{value}</span>
          <Eyebrow size="xs">{label}</Eyebrow>
          {source && <span className={SOURCE}>{source}</span>}
        </div>
      );
    }

    return (
      /* `content-start`: a Stat in a row of taller siblings is stretched to
         their height, and a grid shares that height out among its auto rows,
         which pushed the label of a Stat without a source down to meet
         nothing. The flex column this replaced never did. */
      <div ref={ref} className={cn("rst:grid rst:content-start rst:gap-[3px]", className)} {...props}>
        <dt className="rst:relative rst:col-start-1 rst:row-start-2">
          <Eyebrow size="xs">{label}</Eyebrow>
        </dt>
        {source ? (
          <dd
            className={cn(
              "rst:m-0",
              valueClass,
              "rst:col-start-1 rst:row-span-3 rst:row-start-1 rst:grid rst:grid-rows-subgrid",
            )}
          >
            <span className="rst:row-start-1">{value}</span>
            <span className={cn(SOURCE, "rst:row-start-3")}>{source}</span>
          </dd>
        ) : (
          <dd className={cn("rst:m-0 rst:col-start-1 rst:row-start-1", valueClass)}>{value}</dd>
        )}
      </div>
    );
  },
);

Stat.displayName = "Stat";

export { Stat };
