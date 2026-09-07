import {
  toast as hotToast,
  type Renderable,
  type Toast,
  type ToastOptions,
  type ValueOrFunction,
} from "react-hot-toast";

/** Everything react-hot-toast accepts as a message, including a render fn. */
type Message = ValueOrFunction<Renderable, Toast>;

/**
 * The imperative handle: `toast.success("Saved")` from anywhere.
 *
 * A thin re-export of react-hot-toast's, with the gaps filled. Both consumers
 * had already written this wrapper themselves — `gameToast` and `megaToast` —
 * which is the usual sign it belongs in the library.
 *
 * The file is `toast-api.ts` rather than `toast.ts` because `Toast.tsx` sits
 * beside it and the two collide on a case-insensitive filesystem. The export
 * is still `toast`.
 *
 * `info` and `warning` are the additions, and they are not cosmetic.
 * react-hot-toast ships `success`, `error`, `loading` and `blank` only, so an
 * app wanting an informational toast has to improvise. One improvised by
 * calling `toast.error`, so every informational message in that app rendered
 * as an error — a bug that survived because the wrapper was three lines long
 * and nobody re-read it.
 */
export const toast = Object.assign(
  (message: Message, options?: ToastOptions) =>
    hotToast(message, tone(null, options)),
  {
    success: (message: Message, options?: ToastOptions) =>
      hotToast.success(message, tone(null, options)),
    error: (message: Message, options?: ToastOptions) =>
      hotToast.error(message, tone(null, options)),
    /* Both ride on `blank` plus an explicit tone marker, because
       react-hot-toast has no slot for them. `Toaster` reads the marker to pick
       a color scheme, so they are real tones rather than a red toast wearing a
       different word. */
    info: (message: Message, options?: ToastOptions) =>
      hotToast(message, tone("info", options)),
    warning: (message: Message, options?: ToastOptions) =>
      hotToast(message, tone("warning", options)),
    loading: (message: Message, options?: ToastOptions) =>
      hotToast.loading(message, tone(null, options)),
    custom: hotToast.custom,
    dismiss: hotToast.dismiss,
    remove: hotToast.remove,
    promise: hotToast.promise,
  },
);

export const TONE_PREFIX = "rst-toast-tone-";

/**
 * Writes the tone onto `className`, which is the only per-toast field
 * react-hot-toast carries through untouched that `Toaster` can read back.
 *
 * EVERY helper calls this, including the ones with no tone, and that is the
 * point. Updating a toast merges `{...old, ...new}` and omits `className`
 * when the caller passes none, so a marker set by an earlier call survives:
 * `toast.info("Saving…", { id })` followed by `toast.error("Failed", { id })`
 * left the info marker in place and the failure rendered blue and was
 * announced politely. Writing the marker unconditionally overwrites it.
 */
const tone = (name: string | null, options?: ToastOptions): ToastOptions => {
  const kept = (options?.className ?? "")
    .split(/\s+/)
    .filter((c) => c && !c.startsWith(TONE_PREFIX));
  if (name) kept.push(`${TONE_PREFIX}${name}`);
  return { ...options, className: kept.join(" ") };
};
