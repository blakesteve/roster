import type { CSSProperties } from "react";
import { cn } from "../../../lib/utils";
import { Card, type CardProps } from "../../atoms/Card/Card";
import { Eyebrow } from "../../atoms/Eyebrow/Eyebrow";
import { statSourceClass, statValueVariants } from "../../atoms/Stat/stat-variants";
import { TableCell, TableRow } from "../../organisms/Table/Table";
import { Skeleton, type SkeletonAnimation } from "../../atoms/Skeleton/Skeleton";

/*
 * The presets for what people wait on. Each is built from the real
 * component's own container, so its padding, border and radius are the real
 * ones, and from lines set in the real text sizes, so its height is the real
 * content's. Content that follows the layout each one documents lands in
 * exactly the box the preset drew.
 */

export interface SkeletonCardProps extends Pick<CardProps, "variant" | "padding"> {
  /** A media block above the text, at this height (an image, a chart). */
  media?: CSSProperties["height"];
  /** Body lines under the title. */
  lines?: number;
  /** How its skeletons move: see `Skeleton`. Inside a `SkeletonRegion`, the region's. */
  animation?: SkeletonAnimation;
  className?: string;
}

/**
 * A Card loading. Stands in for a Card holding an optional media block (with
 * 16px below it), a `text-base` title, and `text-sm` body lines 8px under it.
 */
function SkeletonCard({ media, lines = 3, variant, padding, animation, className }: SkeletonCardProps) {
  return (
    <Card variant={variant} padding={padding} className={className} aria-hidden="true" data-skeleton="card">
      {media !== undefined && <Skeleton shape="block" height={media} animation={animation} className="rst:mb-4" />}
      <Skeleton size="lg" width="45%" animation={animation} />
      {lines > 0 && <Skeleton size="md" lines={lines} animation={animation} className="rst:mt-2" />}
    </Card>
  );
}

export interface SkeletonTableRowProps {
  /** How many cells. */
  columns: number;
  /** How its skeletons move: see `Skeleton`. Inside a `SkeletonRegion`, the region's. */
  animation?: SkeletonAnimation;
  className?: string;
}

/**
 * A table row loading, inside Roster's Table: its own cells, at the table's
 * size, each holding one line in the cell's text size. Stands in for a row of
 * one-line cells.
 */
function SkeletonTableRow({ columns, animation, className }: SkeletonTableRowProps) {
  const widths = ["70%", "50%", "60%", "40%"];
  return (
    <TableRow aria-hidden="true" className={className} data-skeleton="table-row">
      {Array.from({ length: Math.max(1, columns) }, (_, i) => (
        <TableCell key={i}>
          <Skeleton size="inherit" width={widths[i % widths.length]} animation={animation} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export interface SkeletonAvatarProps {
  /** Avatar's sizes. */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** A name line beside it, in `text-sm`. */
  withName?: boolean;
  /** How its skeletons move: see `Skeleton`. Inside a `SkeletonRegion`, the region's. */
  animation?: SkeletonAnimation;
  className?: string;
}

/** An Avatar loading, and optionally the name beside it. */
function SkeletonAvatar({ size = "md", withName = false, animation, className }: SkeletonAvatarProps) {
  if (!withName) return <Skeleton shape="circle" size={size} animation={animation} className={className} />;
  return (
    <span aria-hidden="true" className={cn("rst:flex rst:items-center rst:gap-3", className)} data-skeleton="avatar">
      <Skeleton shape="circle" size={size} animation={animation} />
      <Skeleton size="md" width="8rem" animation={animation} />
    </span>
  );
}

export interface SkeletonStatProps {
  /** Stat's sizes. */
  size?: "sm" | "md" | "lg";
  /**
   * Stat's two markups, mirrored. `definition` (Stat's default) is a `dt` and
   * `dd` pair for a `<dl>`: put this preset in the same `<dl>`. `standalone`
   * is spans.
   */
  semantics?: "definition" | "standalone";
  /** A source line under the figure, as a Stat with `source` has. */
  source?: boolean;
  /** How its skeletons move: see `Skeleton`. Inside a `SkeletonRegion`, the region's. */
  animation?: SkeletonAnimation;
  className?: string;
}

/**
 * A Stat loading. Stat's own markup in each of its forms, with lines in place
 * of its words, so the figure that arrives is the height of what held it:
 * the label is the real Eyebrow, a flex item where Stat's is, so it makes the
 * same line.
 */
function SkeletonStat({ size = "md", semantics = "definition", source = false, animation, className }: SkeletonStatProps) {
  const valueClass = statValueVariants({ size, colorScheme: "neutral" });
  const value = <Skeleton size="inherit" width="2.5em" animation={animation} />;
  const label = (
    <Eyebrow size="xs">
      <Skeleton size="inherit" width="9em" animation={animation} />
    </Eyebrow>
  );
  const sourceLine = (
    <span className={statSourceClass}>
      <Skeleton size="inherit" width="12em" animation={animation} />
    </span>
  );
  if (semantics === "standalone") {
    return (
      <span aria-hidden="true" className={cn("rst:flex rst:flex-col rst:gap-[3px]", className)} data-skeleton="stat">
        <span className={valueClass}>{value}</span>
        {label}
        {source && sourceLine}
      </span>
    );
  }
  return (
    <div aria-hidden="true" className={cn("rst:grid rst:content-start rst:gap-[3px]", className)} data-skeleton="stat">
      <dt className="rst:relative rst:col-start-1 rst:row-start-2 rst:flex">{label}</dt>
      {source ? (
        <dd className={cn("rst:m-0", valueClass, "rst:col-start-1 rst:row-span-3 rst:row-start-1 rst:grid rst:grid-rows-subgrid")}>
          <span className="rst:row-start-1">{value}</span>
          <span className={cn(statSourceClass, "rst:row-start-3")}>
            <Skeleton size="inherit" width="12em" animation={animation} />
          </span>
        </dd>
      ) : (
        <dd className={cn("rst:m-0 rst:col-start-1 rst:row-start-1", valueClass)}>{value}</dd>
      )}
    </div>
  );
}

export { SkeletonCard, SkeletonTableRow, SkeletonAvatar, SkeletonStat };
