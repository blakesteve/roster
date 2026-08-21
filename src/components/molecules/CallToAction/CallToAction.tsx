import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { ctaVariants } from "./call-to-action-variants";
import { Button } from "../../atoms/Button/Button";

export interface CallToActionProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof ctaVariants> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
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
      <div className="rst:flex rst:items-start rst:gap-4">
        {icon && <div className="rst:mt-1 rst:shrink-0 rst:text-current">{icon}</div>}
        <div className="rst:flex rst:flex-col rst:gap-1.5 rst:w-full">
          <h3 className="rst:text-lg rst:font-bold rst:leading-tight rst:tracking-tight rst:text-current">
            {title}
          </h3>
          {description && (
            <div className="rst:max-w-prose rst:text-sm rst:leading-relaxed rst:text-current rst:opacity-90 rst:dark:opacity-80">
              {description}
            </div>
          )}
        </div>
      </div>

      {action && <div className="rst:shrink-0 rst:pt-2 rst:md:pt-0">{action}</div>}

      {onDismiss && (
        <div className="rst:absolute rst:right-2 rst:top-2">
          <Button
            variant="ghost"
            size="sm"
            className="rst:h-8 rst:w-8 rst:rounded-full rst:p-0 rst:opacity-60 rst:hover:opacity-100 rst:dark:hover:bg-black/20"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <FontAwesomeIcon icon={faXmark} className="rst:h-4 rst:w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export { CallToAction };
