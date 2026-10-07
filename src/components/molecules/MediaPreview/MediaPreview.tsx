import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "../../../lib/utils";

export interface MediaPreviewProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "onError"> {
  /** The thumbnail. Missing or failing to load, the preview falls back. */
  src?: string | null;
  /** The original, opened from the fallback. Without it the fallback says so. */
  href?: string | null;
  /** What the image shows. Required: a preview in a queue is content. */
  alt: string;
  /** What the fallback says before "Open original". */
  unavailableLabel?: string;
  /** The link's own words. */
  openLabel?: string;
  /** Called once when the thumbnail fails, for an app that keeps a count. */
  onUnavailable?: () => void;
}

/**
 * A thumbnail that admits when it can't render.
 *
 * Previews fail in ordinary ways: a short-lived signed link that expired, or a
 * format the browser can't draw, such as a photo straight off a phone. The
 * browser's answer is a broken-image glyph, which tells a reviewer nothing
 * and hides the one thing they may need to see before deciding. This swaps it
 * for a card that says the preview is unavailable and links to the original,
 * in the same footprint, so a row of previews doesn't jump.
 */
function MediaPreview({
  src,
  href,
  alt,
  unavailableLabel = "Preview unavailable",
  openLabel = "Open original",
  onUnavailable,
  className,
  ...props
}: MediaPreviewProps) {
  /* Keyed by the source that failed, so a new `src` gets its own try. */
  const [failed, setFailed] = useState<string | null>(null);
  const broken = !src || failed === src;

  const frame =
    "rst:font-ui rst:h-28 rst:w-36 rst:shrink-0 rst:rounded-md rst:border rst:border-[var(--roster-card-border)]";

  if (broken) {
    const body = (
      <>
        <span>{unavailableLabel}</span>
        {href ? (
          <span className="rst:font-semibold rst:underline">
            {openLabel}
            <span aria-hidden="true"> ↗</span>
          </span>
        ) : null}
      </>
    );
    const card = cn(
      frame,
      "rst:flex rst:flex-col rst:items-center rst:justify-center rst:gap-1 rst:border-dashed rst:px-2 rst:text-center rst:text-xs rst:text-gray-600 rst:dark:text-gray-300",
      className,
    );
    /* The link's name carries what it opens, so a screen reader hears more
       than "Open original" in a row of several, and that it opens a new tab,
       which the arrow says to everyone else. A plain link rather than Roster's
       Link, which carries an icon runtime this small card doesn't need. */
    return href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(card, "rst:hover:bg-gray-50 rst:dark:hover:bg-gray-800 rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring")}
        aria-label={`${unavailableLabel}. ${openLabel}, in a new tab: ${alt}`}
      >
        {body}
      </a>
    ) : (
      <span role="img" aria-label={`${unavailableLabel}: ${alt}`} className={card}>
        {body}
      </span>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={cn(frame, "rst:object-cover", className)}
      onError={() => {
        setFailed(src);
        onUnavailable?.();
      }}
    />
  );
}

export { MediaPreview };
