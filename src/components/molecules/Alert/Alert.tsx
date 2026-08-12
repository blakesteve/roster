import React from "react";
import { type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { alertVariants } from "./alert-variants";

export interface AlertProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  /** Optional bolded first line above the message. */
  title?: React.ReactNode;
  /** The message itself. */
  children: React.ReactNode;
  /** Replaces the icon chosen for the color scheme. Pass `null` for none. */
  icon?: React.ReactNode;
  /** Renders a dismiss button when provided. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. */
  dismissLabel?: string;
}

const DEFAULT_ICONS = {
  error: faCircleExclamation,
  success: faCircleCheck,
  amber: faTriangleExclamation,
  info: faCircleInfo,
  primary: faCircleInfo,
  neutral: faCircleInfo,
} as const;

/**
 * Inline notice strip for feedback in the flow of a page: "this action
 * failed", "changes saved". For a full zero-data panel reach for EmptyState or
 * ErrorState instead.
 *
 * Errors announce themselves assertively; every other scheme is polite, so a
 * success note does not interrupt whatever a screen reader is currently saying.
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      colorScheme = "error",
      title,
      children,
      icon,
      onDismiss,
      dismissLabel = "Dismiss",
      className,
      ...props
    },
    ref,
  ) => {
    const isError = colorScheme === "error";

    return (
      <div
        ref={ref}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        className={cn(alertVariants({ colorScheme }), className)}
        {...props}
      >
        {icon === undefined ? (
          <FontAwesomeIcon
            icon={DEFAULT_ICONS[colorScheme ?? "error"]}
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        ) : (
          icon
        )}

        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}
          <div className={cn("min-w-0", title && "mt-0.5 opacity-90")}>
            {children}
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="-m-1 shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = "Alert";

export { Alert };
