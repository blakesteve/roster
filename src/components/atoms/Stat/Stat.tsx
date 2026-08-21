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
}

/**
 * Renders as a `<div>` wrapping a definition pair, so a row of Stats can sit
 * inside a `<dl>` and stay semantically honest.
 */
const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ value, label, source, size, colorScheme, className, ...props }, ref) => (
    <div ref={ref} className={cn("rst:flex rst:flex-col rst:gap-[3px]", className)} {...props}>
      <dd className={cn("rst:m-0", statValueVariants({ size, colorScheme }))}>{value}</dd>
      <dt>
        <Eyebrow size="xs">{label}</Eyebrow>
      </dt>
      {source && (
        <span className="rst:font-mono rst:text-[0.53125rem] rst:leading-none rst:tracking-[0.06em] rst:text-gray-500 rst:opacity-75 rst:dark:text-gray-400">
          {source}
        </span>
      )}
    </div>
  ),
);

Stat.displayName = "Stat";

export { Stat };
