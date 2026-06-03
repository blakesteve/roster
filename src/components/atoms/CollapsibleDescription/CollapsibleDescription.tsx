import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../../lib/utils";

export type CollapsibleDescriptionSize = "sm" | "md" | "lg";

const MAX_HEIGHT: Record<CollapsibleDescriptionSize, string> = {
  sm: "max-h-16",   // ~3 lines at text-sm/leading-relaxed
  md: "max-h-24",   // ~4-5 lines
  lg: "max-h-36",   // ~6-7 lines
};

export interface CollapsibleDescriptionProps {
  /** Content to display. Accepts a string or any React node. */
  children: React.ReactNode;
  /** Controls how many lines are visible before the toggle appears. */
  size?: CollapsibleDescriptionSize;
  /** Label for the expand button. */
  expandLabel?: string;
  /** Label for the collapse button. */
  collapseLabel?: string;
  /** Extra classes applied to the outer wrapper. */
  className?: string;
}

/**
 * Clamps content to a fixed height and reveals a toggle when it overflows.
 * Uses CSS `mask-image` for the fade-out effect so it works on any background
 * without needing to know the background color.
 */
export function CollapsibleDescription({
  children,
  size = "md",
  expandLabel = "Read more",
  collapseLabel = "Show less",
  className,
}: CollapsibleDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight);
    }
  }, [children, size]);

  return (
    <div className={className}>
      <div
        ref={ref}
        data-testid="collapsible-content"
        className={cn(!expanded && MAX_HEIGHT[size], !expanded && "overflow-hidden")}
        style={
          !expanded && clamped
            ? {
                maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 50%, transparent 100%)",
              }
            : undefined
        }
      >
        {children}
      </div>

      {clamped && (
        <button
          type="button"
          data-testid="collapsible-toggle"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs font-medium text-primary-500 dark:text-primary-400 hover:opacity-80 transition-opacity cursor-pointer"
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      )}
    </div>
  );
}