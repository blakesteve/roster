import * as React from "react";
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
import { toastVariants } from "./toast-variants";

export interface ToastProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof toastVariants> {
  /** The message itself. */
  children: React.ReactNode;
  /** Optional bolded first line above the message, as on `Alert`. */
  title?: React.ReactNode;
  /** Replaces the icon chosen for the color scheme. Pass `null` for none. */
  icon?: React.ReactNode;
  /** Presence adds a dismiss control. */
  onDismiss?: () => void;
  /** Accessible name for the dismiss control. */
  dismissLabel?: string;
}

/* The same icon per scheme as `Alert`. Two components saying "this failed"
   with different icons is a worse inconsistency than either choice is a
   problem. */
const ICONS = {
  success: faCircleCheck,
  error: faCircleExclamation,
  amber: faTriangleExclamation,
  info: faCircleInfo,
  primary: faCircleInfo,
  neutral: faCircleInfo,
} as const;

/**
 * The body of a toast: icon, message, optional dismiss.
 *
 * Presentational and controlled. It does not queue, position or time itself —
 * `Toaster` does that, and this stays renderable on its own so it can be
 * tested and viewed without a running queue.
 *
 * `role` is deliberately not set here. A toast's urgency depends on what it is
 * saying, not on how it looks, and the same body is used for all of them.
 * `Toaster` decides: `alert` / `assertive` for errors, and react-hot-toast's
 * `status` / `polite` for the rest. Rendered on its own, this sets no role at
 * all, which is correct for a component that does not know why it exists.
 */
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      colorScheme = "neutral",
      variant = "soft",
      title,
      icon,
      onDismiss,
      dismissLabel = "Dismiss",
      children,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(toastVariants({ colorScheme, variant }), className)}
      {...props}
    >
      {icon !== null && (
        <span aria-hidden="true" className="rst:mt-0.5 rst:shrink-0">
          {icon ?? (
            <FontAwesomeIcon
              icon={ICONS[colorScheme ?? "neutral"]}
              className="rst:h-4 rst:w-4"
            />
          )}
        </span>
      )}

      <div className="rst:flex rst:min-w-0 rst:flex-col rst:gap-0.5">
        {title && <p className="rst:font-semibold">{title}</p>}
        <div className="rst:min-w-0 rst:break-words">{children}</div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn(
            "rst:-mr-1 rst:ml-auto rst:shrink-0 rst:cursor-pointer rst:rounded rst:opacity-70 rst:hover:opacity-100",
            "rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:ring-offset-background rst:focus-visible:ring-offset-2",
          )}
        >
          <FontAwesomeIcon icon={faXmark} className="rst:h-3.5 rst:w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  ),
);

Toast.displayName = "Toast";

export { Toast };
