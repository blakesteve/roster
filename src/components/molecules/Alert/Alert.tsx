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

/*
 * `current` has no icon of its own on purpose. The scheme exists for a page
 * supplying its own accent, which usually means it is supplying its own mark
 * too — and a lookup that returns `undefined` for a valid scheme renders a
 * blank box rather than nothing, so the fallback is explicit.
 */
const DEFAULT_ICONS = {
  error: faCircleExclamation,
  success: faCircleCheck,
  amber: faTriangleExclamation,
  info: faCircleInfo,
  primary: faCircleInfo,
  neutral: faCircleInfo,
  current: faCircleInfo,
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
      surface,
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
        className={cn(alertVariants({ colorScheme, surface }), className)}
        {...props}
      >
        {icon === undefined ? (
          <FontAwesomeIcon
            icon={DEFAULT_ICONS[colorScheme ?? "error"]}
            className="rst:mt-0.5 rst:h-4 rst:w-4 rst:shrink-0"
            aria-hidden="true"
          />
        ) : (
          icon
        )}

        <div className="rst:min-w-0 rst:flex-1">
          {title && <p className="rst:font-semibold">{title}</p>}
          <div className={cn("rst:min-w-0", title && "rst:mt-0.5 rst:opacity-90")}>
            {children}
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="rst:-m-1 rst:shrink-0 rst:rounded rst:p-1 rst:opacity-60 rst:transition-opacity rst:hover:opacity-100 rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
          >
            <FontAwesomeIcon icon={faXmark} className="rst:h-3.5 rst:w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = "Alert";

export { Alert };
