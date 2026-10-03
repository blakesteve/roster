import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { emptyStateVariants } from "./empty-state-variants";

export interface EmptyStateProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /**
   * The title's heading level. `3` by default; set it to follow the heading
   * the empty state sits under, so the page's outline doesn't skip a level.
   * Only the element changes; its classes are the same at every level.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

const EmptyState = ({
  title,
  description,
  icon,
  action,
  headingLevel = 3,
  variant,
  className,
  ...props
}: EmptyStateProps) => {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={cn(emptyStateVariants({ variant }), className)} {...props}>
      {icon && (
        <div className="rst:mb-4 rst:flex rst:h-12 rst:w-12 rst:items-center rst:justify-center rst:rounded-full rst:bg-gray-100 rst:text-gray-400 rst:dark:bg-gray-800 rst:dark:text-gray-500">
          <div className="rst:h-6 rst:w-6 rst:[&>svg]:h-full rst:[&>svg]:w-full">{icon}</div>
        </div>
      )}

      <Heading className="rst:text-lg rst:font-semibold rst:text-gray-900 rst:dark:text-gray-100">{title}</Heading>
      {description && (
        <p className="rst:mt-1 rst:max-w-sm rst:text-sm rst:text-gray-500 rst:dark:text-gray-400">{description}</p>
      )}

      {action && <div className="rst:mt-6">{action}</div>}
    </div>
  );
};

export { EmptyState };
