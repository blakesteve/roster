import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
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
  /** When provided, renders a `✕` dismiss button at the leading edge of the strip. */
  onDismiss?: () => void;
  /**
   * Rendered immediately after the overflow chip inside the avatar stack.
   * Use for a ghost-slot CTA, an add-member button, or any custom element
   * that should sit within the `-space-x-2` stack.
   */
  trailingSlot?: ReactNode;
  /** Rendered to the right of the avatar stack. Accepts any React node. */
  label?: ReactNode;
  /**
   * Tailwind class that sets the ring color around each avatar and the overflow chip.
   * Should match the background the strip is rendered on to produce the cutout stack effect.
   * Default: `"ring-white dark:ring-gray-900"`.
   */
  ringClass?: string;
  /** Extra classes applied to the outermost `<div>`. */
  className?: string;
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
  ringClass = "ring-white dark:ring-gray-900",
  className,
}: AvatarStripProps) {
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
      className={cn("flex items-center gap-3", className)}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          data-testid="avatar-strip-dismiss"
          className="shrink-0 text-gray-400/50 dark:text-gray-500/50 hover:text-gray-400 dark:hover:text-gray-500 transition-colors cursor-pointer"
        >
          ✕
        </button>
      )}

      {/* Avatar stack */}
      <div
        data-testid="avatar-strip-stack"
        className="flex items-center -space-x-2"
      >
        {visible.map((item) => {
          const avatar = (
            <Avatar
              initials={item.label[0].toUpperCase()}
              src={item.src}
              colorScheme={item.colorScheme ?? "neutral"}
              size="xs"
            />
          );

          const wrapperClass = cn(
            "relative rounded-full ring-2 transition-transform hover:z-10 hover:scale-110",
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
            title={`${overflow} more`}
            data-testid="avatar-strip-overflow"
            className={cn(
              "relative flex h-6 w-6 items-center justify-center rounded-full bg-gray-500/10 ring-2",
              ringClass,
            )}
          >
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 select-none">
              +{overflow}
            </span>
          </div>
        )}

        {trailingSlot}
      </div>

      {label && (
        <div data-testid="avatar-strip-label">{label}</div>
      )}
    </div>
  );
}