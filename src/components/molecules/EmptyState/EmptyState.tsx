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
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <div className="h-6 w-6 [&>svg]:h-full [&>svg]:w-full">{icon}</div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export { EmptyState };
