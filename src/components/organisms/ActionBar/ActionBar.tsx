import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { actionBarVariants } from "./action-bar-variants";

export interface ActionBarProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof actionBarVariants> {
  /** The primary text or element on the left (e.g., "5 of 16") */
  title?: ReactNode;
  /** Secondary text below the title/badge (e.g., "Week 4") */
  subtitle?: ReactNode;
  /** A slot for a status indicator next to the title */
  badge?: ReactNode;
  /** A slot for buttons aligned to the right */
  actions?: ReactNode;
  /** Content rendered in the bottom tray (e.g., the logo list) */
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
            // ✨ Swapped hardcoded grays for `opacity-80` so it inherits the variant's text color perfectly
            <div className="text-sm opacity-80 mt-1 font-medium">
              {subtitle}
            </div>
          )}

          {/* Bottom Tray */}
          {children && (
            // ✨ Used border-black/10 and white/10 to create a universal separator line
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
