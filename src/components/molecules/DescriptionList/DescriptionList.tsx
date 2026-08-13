import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { descriptionListVariants } from "./description-list-variants";

export type DescriptionListItem = {
  term: React.ReactNode;
  description: React.ReactNode;
};

export interface DescriptionListProps
  extends
    Omit<React.HTMLAttributes<HTMLDListElement>, "children">,
    VariantProps<typeof descriptionListVariants> {
  items: DescriptionListItem[];
  /** Adds a hairline under every row but the last. */
  dividers?: boolean;
}

/**
 * Label and value pairs: a spec sheet, a metadata panel, a props table.
 *
 * Renders a real `<dl>` with `<dt>`/`<dd>`, which matters more than it looks —
 * screen readers announce the pairing, so "Framework, Next.js 16" arrives as
 * one fact rather than two loose strings.
 *
 * The `contents` display on each row wrapper is what lets a grid layout treat
 * the dt and dd as direct grid children while keeping them grouped in markup.
 */
const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ items, layout, size, dividers = false, className, ...props }, ref) => (
    <dl
      ref={ref}
      className={cn(descriptionListVariants({ layout, size }), className)}
      {...props}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const rule = dividers && !last ? "border-b border-gray-200 pb-1.5 dark:border-gray-800" : "";

        if (layout === "stacked") {
          return (
            <div key={index} className={cn("flex flex-col gap-0.5", rule)}>
              <dt className="font-mono uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                {item.term}
              </dt>
              <dd className="m-0 text-gray-900 dark:text-gray-100">{item.description}</dd>
            </div>
          );
        }

        if (layout === "split") {
          return (
            <div key={index} className={cn("flex items-baseline justify-between gap-4", rule)}>
              <dt className="font-mono uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                {item.term}
              </dt>
              <dd className="m-0 text-right tabular-nums text-gray-900 dark:text-gray-100">
                {item.description}
              </dd>
            </div>
          );
        }

        return (
          <div key={index} className={cn("contents", rule)}>
            <dt className="whitespace-nowrap font-mono uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
              {item.term}
            </dt>
            <dd className="m-0 text-gray-900 dark:text-gray-100">{item.description}</dd>
          </div>
        );
      })}
    </dl>
  ),
);

DescriptionList.displayName = "DescriptionList";

export { DescriptionList };
