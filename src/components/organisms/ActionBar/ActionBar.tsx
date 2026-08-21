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
        <div className="rst:container rst:mx-auto rst:p-4">
          <div className="rst:flex rst:justify-between rst:items-center">
            {/* Left Content */}
            <div className="rst:flex rst:flex-col rst:sm:flex-row rst:sm:items-center rst:gap-x-4 rst:gap-y-2">
              {title && <span className="rst:font-semibold rst:text-lg">{title}</span>}
              {badge && (
                <div className="rst:max-w-44 rst:sm:max-w-max rst:mr-2">{badge}</div>
              )}
            </div>

            {/* Right Actions */}
            {actions && <div className="rst:flex rst:gap-2">{actions}</div>}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="rst:text-sm rst:opacity-80 rst:mt-1 rst:font-medium">
              {subtitle}
            </div>
          )}

          {/* Bottom Tray */}
          {children && (
            <div className="rst:flex rst:flex-wrap rst:items-center rst:mt-4 rst:pt-4 rst:border-t rst:border-black/10 rst:dark:border-white/10 rst:gap-y-2">
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
