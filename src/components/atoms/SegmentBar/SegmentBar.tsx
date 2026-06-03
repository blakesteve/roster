import { cn } from "../../../lib/utils";

export type SegmentBarSize = "sm" | "md";

export interface SegmentBarSegment {
  /** Unique identifier for the segment. */
  key: string;
  /** Display label used in the legend and the bar segment's title tooltip. */
  label: string;
  /** Raw vote / count / quantity. Percentages are computed from the total. */
  value: number;
  /** CSS color for the bar segment and legend dot (hex, rgb, hsl, or CSS variable). */
  color: string;
}

export interface SegmentBarProps {
  /** Ordered list of segments rendered left to right. */
  segments: SegmentBarSegment[];
  /** Height of the bar track. */
  size?: SegmentBarSize;
  /** Render a dot-and-label legend below the bar. */
  showLegend?: boolean;
  /** Extra classes applied to the outer wrapper. */
  className?: string;
}

/**
 * A proportional horizontal bar divided into colored segments.
 * Percentages are computed automatically from raw `value` fields.
 * Colors are passed as CSS color strings so any palette works without
 * requiring specific Tailwind classes to be present in the consumer's build.
 *
 * Returns `null` when all segment values sum to zero.
 */
export function SegmentBar({
  segments,
  size = "md",
  showLegend = true,
  className,
}: SegmentBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const visibleSegments = segments.filter((s) => s.value > 0);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* Bar track */}
      <div
        data-testid="segment-bar-track"
        className={cn(
          "flex w-full overflow-hidden rounded-full",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        {visibleSegments.map((segment) => {
          // Use exact floats for widths so segments always fill 100%.
          const pct = (segment.value / total) * 100;
          return (
            <div
              key={segment.key}
              data-testid={`segment-${segment.key}`}
              className="transition-[width]"
              style={{ width: `${pct}%`, backgroundColor: segment.color }}
              title={`${segment.label}: ${Math.round(pct)}%`}
            />
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div
          data-testid="segment-bar-legend"
          className="flex flex-wrap gap-x-3 gap-y-0.5"
        >
          {visibleSegments.map((segment) => {
            const pct = Math.round((segment.value / total) * 100);
            return (
              <span
                key={segment.key}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
              >
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                {segment.label}
                <span className="opacity-60">{pct}%</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}