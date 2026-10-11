import React from "react";
import { type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { withLabels } from "../../../lib/labels";
import { errorStateVariants } from "./error-state-variants";
import { Button } from "../../atoms/Button/Button";

/** Every word ErrorState shows of its own, past its `title`. Pass any of them in `labels` to replace it. */
export interface ErrorStateLabels {
  /** The retry button, with `onRetry`. */
  retry: string;
}

const LABELS: ErrorStateLabels = { retry: "Try Again" };

export interface ErrorStateProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorStateVariants> {
  title?: string;
  description: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  /** The component's own words, replaced; any left out stay English. */
  labels?: Partial<ErrorStateLabels>;
}

const ErrorState = ({
  title = "An Error Occurred",
  description,
  onRetry,
  action,
  icon,
  labels,
  variant,
  className,
  ...props
}: ErrorStateProps) => {
  const l = withLabels(LABELS, labels);
  return (
    <div className={cn(errorStateVariants({ variant }), className)} {...props}>
      <div className="rst:mb-4 rst:flex rst:h-12 rst:w-12 rst:items-center rst:justify-center rst:rounded-full rst:bg-error-100 rst:text-error-600 rst:dark:bg-error-500/15 rst:dark:text-error-400">
        <div className="rst:h-6 rst:w-6 rst:flex rst:items-center rst:justify-center">
          {icon || (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="rst:h-full rst:w-full"
            />
          )}
        </div>
      </div>

      <h3 className="rst:text-lg rst:font-bold rst:tracking-tight">{title}</h3>
      <p
        className={cn(
          "rst:mt-2 rst:text-sm rst:leading-relaxed",
          variant === "card"
            ? "rst:text-error-800/80 rst:dark:text-error-200/80"
            : "rst:text-gray-500 rst:dark:text-gray-400",
        )}
      >
        {description}
      </p>

      <div className="rst:mt-6">
        {action ? (
          action
        ) : onRetry ? (
          <Button
            onClick={onRetry}
            colorScheme="error"
            variant={variant === "card" ? "outline" : "solid"}
          >
            {l.retry}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export { ErrorState };
