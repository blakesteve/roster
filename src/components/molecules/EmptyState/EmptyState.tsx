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
}

const EmptyState = ({
  title,
  description,
  icon,
  action,
  variant,
  className,
  ...props
}: EmptyStateProps) => {
  return (
    <div className={cn(emptyStateVariants({ variant }), className)} {...props}>
      {icon && (
        <div className="rst:mb-4 rst:flex rst:h-12 rst:w-12 rst:items-center rst:justify-center rst:rounded-full rst:bg-gray-100 rst:text-gray-400 rst:dark:bg-gray-800 rst:dark:text-gray-500">
          <div className="rst:h-6 rst:w-6 rst:[&>svg]:h-full rst:[&>svg]:w-full">{icon}</div>
        </div>
      )}

      <h3 className="rst:text-lg rst:font-semibold rst:text-gray-900 rst:dark:text-gray-100">{title}</h3>
      {description && (
        <p className="rst:mt-1 rst:max-w-sm rst:text-sm rst:text-gray-500 rst:dark:text-gray-400">{description}</p>
      )}

      {action && <div className="rst:mt-6">{action}</div>}
    </div>
  );
};

export { EmptyState };
