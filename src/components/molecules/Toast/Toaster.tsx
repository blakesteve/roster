import {
  Toaster as HotToaster,
  toast as hotToast,
  resolveValue,
  type ToasterProps as HotToasterProps,
  type Toast as HotToast,
} from "react-hot-toast";
import { Toast } from "./Toast";
import { Spinner } from "../../atoms/Spinner/Spinner";
import { TONE_PREFIX } from "./toast-api";
import type { ToastProps } from "./Toast";

export interface ToasterProps
  extends Pick<HotToasterProps, "position" | "gutter" | "reverseOrder" | "containerClassName"> {
  /** Milliseconds a toast stays up. */
  duration?: number;
  /** Adds a dismiss control to every toast. */
  dismissible?: boolean;
  /**
   * Fill treatment for every toast in the queue.
   *
   * `soft` is the default and is quiet enough that a stack does not shout.
   * Reach for `solid` when toasts land over photography, video or any surface
   * the app does not control, where a tint is a gamble.
   */
  variant?: ToastProps["variant"];
}

/**
 * Mount once, near the root. Everything else goes through `toast`.
 *
 * This wraps react-hot-toast rather than replacing it, because both consumers
 * already depend on it at the same version and already write
 * `toast.success(...)`. Wrapping means their call sites do not move; what
 * changes is that the toast stops being styled with hardcoded hex in each app
 * — game-verdict pinned `#1a1f2e` and `#10b981`, mega-squad `#413f3c` and
 * `#f3eee3`, neither of which is in either app's palette any more.
 *
 * The `children` render prop is used rather than `toastOptions`, so the body
 * is a real Roster component instead of a set of inline styles handed to
 * someone else's markup. That is what lets `Toast` be tested and viewed on its
 * own, and what lets a toast carry a title, a dismiss control and the popover
 * tokens.
 */
export function Toaster({
  position = "bottom-right",
  duration = 4000,
  dismissible = true,
  variant = "soft",
  gutter,
  reverseOrder,
  containerClassName,
}: ToasterProps) {
  return (
    <HotToaster
      position={position}
      gutter={gutter}
      reverseOrder={reverseOrder}
      containerClassName={containerClassName}
      /* Per-type, and never for `loading`. react-hot-toast resolves duration
         as `toast.duration || toastOptions[type].duration ||
         toastOptions.duration || defaultTimeouts[type]`, so a blanket
         `duration` beats `defaultTimeouts.loading`, which is `Infinity`. A
         `toast.loading("Uploading…")` was disappearing after four seconds
         mid-request, and `toast.promise` lost its loading state before the
         promise settled. */
      toastOptions={{
        success: { duration },
        error: { duration },
        blank: { duration },
        custom: { duration },
      }}
    >
      {(t) => {
        /* `info` and `warning` have no slot in react-hot-toast, so `toast`
           marks them on `className` and they are read back here. Without this
           they would arrive as `blank` and render neutral, which is what an
           app improvising them ends up with. */
        /* Exact token, not `includes`. A substring test let any consumer
           class containing the marker hijack the tone — `toast.success("Ok",
           { className: "rst-toast-tone-info" })` rendered as info. */
        const classes = t.className?.split(/\s+/) ?? [];
        const marked = TONES.find((tone) =>
          classes.includes(`${TONE_PREFIX}${tone}`),
        );
        const scheme = marked
          ? MARKED_SCHEME[marked]
          : (SCHEME_FOR[t.type] ?? "neutral");
        return (
          <Toast
            colorScheme={scheme}
            variant={variant}
            /* The `children` render prop replaces `ToastBar`, which is where
               react-hot-toast would otherwise apply a per-toast `icon` — so
               `toast.success("Done", { icon: "🎉" })` was silently ignored.
               `loading` gets a spinner rather than the scheme's icon, which
               made it identical to an info toast. */
            icon={t.icon ?? (t.type === "loading" ? <Spinner size="sm" /> : undefined)}
            onDismiss={dismissible ? () => hotToast.dismiss(t.id) : undefined}
            /* Urgency by tone, which react-hot-toast does not do: it marks
               EVERY toast `status` / `polite`, errors included. A polite live
               region is announced when the reader next pauses, which for a
               message that disappears in four seconds can mean never. An
               error that vanishes unannounced is the failure mode worth
               avoiding, so errors are `alert` / `assertive` and everything
               else keeps the library's default.

               Checked rather than assumed — the comment here previously said
               react-hot-toast made this distinction, and a test written to
               confirm it found `status` / `polite` on an error. */
            {...(scheme === "error"
              ? { role: "alert" as const, "aria-live": "assertive" as const }
              : t.ariaProps)}
            className={ANIMATION[t.visible ? "in" : "out"]}
          >
            {resolveValue(t.message, t)}
          </Toast>
        );
      }}
    </HotToaster>
  );
}

const TONES = ["info", "warning"] as const;
const MARKED_SCHEME = {
  info: "info",
  /* `amber` is the library's warning color; Alert names it the same way. */
  warning: "amber",
} as const satisfies Record<(typeof TONES)[number], ToastProps["colorScheme"]>;

/* `blank` is what `toast("...")` produces, and `custom` never reaches here. */
const SCHEME_FOR: Record<HotToast["type"], ToastProps["colorScheme"]> = {
  success: "success",
  error: "error",
  loading: "neutral",
  blank: "neutral",
  custom: "neutral",
};

/* Enter and leave, honoring reduced motion. A toast that slides is the one
   piece of chrome a vestibular-sensitive reader cannot look away from, since
   it arrives unbidden. */
const ANIMATION = {
  in: "rst:motion-safe:animate-in rst:motion-safe:fade-in-0 rst:motion-safe:slide-in-from-bottom-2",
  /* Leaving is a transition rather than an `animate-out`: this build ships the
     enter half of the animation utilities and not the exit half, which
     `scripts/check-classes-emit.mjs` caught by failing the build on classes
     that produce no CSS. A fade on opacity needs no plugin and is honest about
     what it does. */
  out: "rst:opacity-0 rst:transition-opacity rst:duration-200",
} as const;
