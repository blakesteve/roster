import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { ctaVariants } from "./call-to-action-variants";
import { Button } from "../../atoms/Button/Button";

export interface CallToActionProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ctaVariants> {
  title: string;
  description?: string;
  /** The primary button/link to display */
  action?: React.ReactNode;
  /** Optional icon to display on the left */
  icon?: React.ReactNode;
  /** If provided, renders an X button in the corner */
  onDismiss?: () => void;
}

const CallToAction = ({
  title,
  description,
  action,
  icon,
  variant,
  onDismiss,
  className,
  ...props
}: CallToActionProps) => {
  return (
    <div className={cn(ctaVariants({ variant }), className)} {...props}>
      {/* Content Section */}
      <div className="flex items-start gap-4">
        {icon && <div className="mt-1 shrink-0 opacity-80">{icon}</div>}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold leading-tight tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="max-w-prose text-sm leading-relaxed opacity-90">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Action Section (Pushed to right on desktop) */}
      {action && <div className="shrink-0 pt-2 md:pt-0">{action}</div>}

      {/* Dismiss Button (Absolute positioned) */}
      {onDismiss && (
        <div className="absolute right-2 top-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0 opacity-60 hover:opacity-100"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export { CallToAction };
