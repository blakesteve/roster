import { useId, type ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { withLabels } from "../../../lib/labels";
import { Avatar } from "../Avatar/Avatar";

export type AvatarStripColorScheme =
  | "primary"
  | "orange"
  | "teal"
  | "purple"
  | "amber"
  | "success"
  | "error"
  | "neutral";

export interface AvatarStripItem {
  /** Unique identifier. Pass as `excludeKey` to hide this item (e.g. current user). */
  key: string;
  /** Display name — used as the avatar title and the source of the single-letter initials. */
  label: string;
  /** Avatar image URL. Falls back to initials when omitted or when the image fails to load. */
  src?: string;
  /** Background color scheme for the initials avatar. Defaults to `"neutral"`. */
  colorScheme?: AvatarStripColorScheme;
  /** When provided, the avatar is wrapped in an `<a>` tag with this href. */
  href?: string;
}

/** Every word AvatarStrip says of its own. Pass any of them in `labels` to replace it. */
export interface AvatarStripLabels {
  /** The dismiss button's name, with `onDismiss`. */
  dismiss: string;
  /** The overflow chip's title: how many more there are. */
  more: (count: number) => string;
}

const LABELS: AvatarStripLabels = { dismiss: "Dismiss", more: (count) => `${count} more` };

export interface AvatarStripProps {
  /** Ordered list of avatar items. */
  items: AvatarStripItem[];
  /** Maximum number of avatars to show before collapsing into a +N chip. Default: `5`. */
  maxDisplay?: number;
  /**
   * The true total count. When provided, the overflow chip shows
   * `totalCount - visible.length` instead of `items.length - maxDisplay`,
   * keeping the number accurate when the fetched array is a subset of the real total.
   */
  totalCount?: number;
  /** Remove one item by key before rendering — typically used to hide the current user. */
  excludeKey?: string;
  /**
   * When provided, renders a dismiss button, a drawn ✕, at the leading edge of
   * the strip. With a `label`, the button is described by it.
   */
  onDismiss?: () => void;
  /**
   * Rendered immediately after the overflow chip inside the avatar stack.
   * Use for a ghost-slot CTA, an add-member button, or any custom element
   * that should sit within the `-space-x-2` stack.
   */
  trailingSlot?: ReactNode;
  /** Rendered to the right of the avatar stack. Accepts any React node. */
  label?: ReactNode;
  /** The component's own words, replaced; any left out stay English. */
  labels?: Partial<AvatarStripLabels>;
  /**
   * Tailwind class that sets the ring color around each avatar and the overflow chip.
   * Should match the background the strip is rendered on to produce the cutout stack effect.
   *
   * Pass your own classes unprefixed, exactly as you write them in your app —
   * they land in your `utilities` layer and win, which is the point of the prop.
   * Only Roster's default carries the `rst:` prefix, so a host that happens to
   * use `ring-white` itself cannot silently repaint the strip.
   *
   * Default: `"rst:ring-white rst:dark:ring-gray-900"`.
   */
  ringClass?: string;
  /** Extra classes applied to the outermost `<div>`. */
  className?: string;
}

/* Drawn here rather than imported from Font Awesome: an import at module scope
   would bring FA's runtime to every app that renders a strip, with or without
   a dismiss. */
function DismissGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 12 12"
      className="rst:pointer-events-none rst:size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  );
}

/**
 * A compact social-proof strip: a stacked row of overlapping avatars with an
 * optional overflow chip, dismiss button, trailing slot, and label area.
 *
 * Returns `null` when there are no visible items and no `trailingSlot`.
 */
export function AvatarStrip({
  items,
  maxDisplay = 5,
  totalCount,
  excludeKey,
  onDismiss,
  trailingSlot,
  label,
  ringClass = "rst:ring-white rst:dark:ring-gray-900",
  labels,
  className,
}: AvatarStripProps) {
  const l = withLabels(LABELS, labels);
  const labelId = useId();
  const visible = items
    .filter((item) => item.key !== excludeKey)
    .slice(0, maxDisplay);

  const overflow =
    totalCount !== undefined
      ? Math.max(0, totalCount - visible.length)
      : Math.max(0, items.filter((i) => i.key !== excludeKey).length - maxDisplay);

  if (visible.length === 0 && !trailingSlot) return null;

  return (
    <div
      data-testid="avatar-strip"
      className={cn("rst:font-ui rst:flex rst:items-center rst:gap-3", className)}
    >
      {onDismiss && (
        /* A 24px icon button, not a bare glyph. The text "✕" was sized by the
           host's font (12px wide in Chromium, 10 in WebKit), drew the
           browser's outline instead of Roster's ring, and its faded ink
           painted 1.54:1. The quiet ink is the "+N" chip's: 5.99:1 on white.
           No negative margin, so the hit area never pokes out of a container
           with no padding. Described by the label, so a screen reader hears
           what it dismisses. */
        <button
          type="button"
          onClick={onDismiss}
          aria-label={l.dismiss}
          aria-describedby={label ? labelId : undefined}
          data-testid="avatar-strip-dismiss"
          className="rst:inline-flex rst:size-6 rst:shrink-0 rst:items-center rst:justify-center rst:rounded-full rst:cursor-pointer rst:text-gray-500 rst:dark:text-gray-400 rst:hover:text-gray-700 rst:dark:hover:text-gray-200 rst:hover:bg-gray-500/10 rst:transition-colors rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
        >
          <DismissGlyph />
        </button>
      )}

      {/* Avatar stack */}
      <div
        data-testid="avatar-strip-stack"
        className="rst:flex rst:items-center rst:-space-x-2"
      >
        {visible.map((item) => {
          const avatar = (
            <Avatar
              initials={item.label[0].toUpperCase()}
              src={item.src}
              alt={item.label}
              colorScheme={item.colorScheme ?? "neutral"}
              size="xs"
            />
          );

          const wrapperClass = cn(
            "rst:relative rst:inline-flex rst:h-6 rst:w-6 rst:rounded-full rst:ring-2 rst:transition-transform rst:hover:z-10 rst:hover:scale-110",
            ringClass,
          );

          return item.href ? (
            <a
              key={item.key}
              href={item.href}
              title={item.label}
              data-testid={`avatar-strip-item-${item.key}`}
              className={wrapperClass}
            >
              {avatar}
            </a>
          ) : (
            <span
              key={item.key}
              title={item.label}
              data-testid={`avatar-strip-item-${item.key}`}
              className={wrapperClass}
            >
              {avatar}
            </span>
          );
        })}

        {overflow > 0 && (
          <div
            title={l.more(overflow)}
            data-testid="avatar-strip-overflow"
            className={cn(
              "rst:relative rst:flex rst:h-6 rst:w-6 rst:items-center rst:justify-center rst:rounded-full rst:bg-gray-500/10 rst:ring-2",
              ringClass,
            )}
          >
            <span className="rst:text-[9px] rst:font-bold rst:text-gray-500 rst:dark:text-gray-400 rst:select-none">
              +{overflow}
            </span>
          </div>
        )}

        {trailingSlot}
      </div>

      {label && (
        <div id={labelId} data-testid="avatar-strip-label">
          {label}
        </div>
      )}
    </div>
  );
}