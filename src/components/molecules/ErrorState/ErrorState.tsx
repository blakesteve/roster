import React from "react";
import { type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { errorStateVariants } from "./error-state-variants";
import { Button } from "../../atoms/Button/Button";

export interface ErrorStateProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorStateVariants> {
  title?: string;
  description: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const ErrorState = ({
  title = "An Error Occurred",
  description,
  onRetry,
  action,
  icon,
  variant,
  className,
  ...props
}: ErrorStateProps) => {
  return (
    <div className={cn(errorStateVariants({ variant }), className)} {...props}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 text-error-600">
        <div className="h-6 w-6 flex items-center justify-center">
          {icon || (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="h-full w-full"
            />
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed",
          variant === "card" ? "text-error-800/80" : "text-gray-500",
        )}
      >
        {description}
      </p>

      <div className="mt-6">
        {action ? (
          action
        ) : onRetry ? (
          <Button
            onClick={onRetry}
            colorScheme="error"
            variant={variant === "card" ? "outline" : "solid"}
          >
            Try Again
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export { ErrorState };
