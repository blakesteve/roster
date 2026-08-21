import React from "react";
import { cn } from "../../../lib/utils";
import { Eyebrow } from "../Eyebrow/Eyebrow";

export interface LabeledDividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Sits before the rule. */
  label: React.ReactNode;
  /** Sits after the rule. Use for a count, a total, a date. */
  trailing?: React.ReactNode;
  /** Puts the label on the right instead, with the rule leading. */
  align?: "start" | "end";
}

/**
 * A horizontal rule that carries a label, and optionally something on the far
 * side of it. Reads as a section marker rather than a heading, so it suits
 * lists whose contents already have their own headings.
 *
 * `role="presentation"` because the rule is decoration; the label is real text
 * and stays in the accessibility tree on its own.
 */
const LabeledDivider = React.forwardRef<HTMLDivElement, LabeledDividerProps>(
  ({ label, trailing, align = "start", className, ...props }, ref) => (
    <div ref={ref} className={cn("rst:flex rst:items-center rst:gap-3", className)} {...props}>
      {align === "end" && (
        <span role="presentation" className="rst:h-px rst:flex-1 rst:bg-gray-200 rst:dark:bg-gray-800" />
      )}
      <Eyebrow>{label}</Eyebrow>
      {align === "start" && (
        <span role="presentation" className="rst:h-px rst:flex-1 rst:bg-gray-200 rst:dark:bg-gray-800" />
      )}
      {trailing && <Eyebrow>{trailing}</Eyebrow>}
    </div>
  ),
);

LabeledDivider.displayName = "LabeledDivider";

export { LabeledDivider };
