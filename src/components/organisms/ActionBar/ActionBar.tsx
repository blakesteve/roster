import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { actionBarVariants } from "./action-bar-variants";

export interface ActionBarProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof actionBarVariants> {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  (
    {
      title,
      subtitle,
      badge,
      actions,
      children,
      position,
      variant,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(actionBarVariants({ variant, position }), className)}
        {...props}
      >
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center">
            {/* Left Content */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
              {title && <span className="font-semibold text-lg">{title}</span>}
              {badge && (
                <div className="max-w-44 sm:max-w-max mr-2">{badge}</div>
              )}
            </div>

            {/* Right Actions */}
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-sm opacity-80 mt-1 font-medium">
              {subtitle}
            </div>
          )}

          {/* Bottom Tray */}
          {children && (
            <div className="flex flex-wrap items-center mt-4 pt-4 border-t border-black/10 dark:border-white/10 gap-y-2">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ActionBar.displayName = "ActionBar";

export { ActionBar };
