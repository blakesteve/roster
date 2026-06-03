import * as React from "react";
import { useState, useCallback } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "../../../lib/utils";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
export type TooltipVariant = "dark" | "light";

export interface TooltipProps {
  /** The tooltip's popup content. Accepts a string or any React node. */
  content: React.ReactNode;
  /** The element that triggers the tooltip on hover, focus, or tap. */
  children: React.ReactNode;
  /** Which side of the trigger the tooltip appears on. Radix auto-flips if there isn't enough room. */
  placement?: TooltipPlacement;
  /** Visual theme for the tooltip bubble. `dark` is the default and works on both light and dark backgrounds. */
  variant?: TooltipVariant;
  /** Milliseconds of hover delay before the tooltip opens (default 300). */
  delayDuration?: number;
  /** Mount the tooltip open — useful for visual stories and testing. */
  defaultOpen?: boolean;
  /** Extra classes applied to the tooltip content bubble. */
  className?: string;
}

/**
 * Radix-powered tooltip with a caret arrow and entry animation.
 *
 * - **Desktop:** opens on hover (configurable delay) or keyboard focus.
 * - **Mobile:** tap the trigger to toggle open; tap anywhere else to dismiss.
 *   This avoids tooltips getting permanently stuck open on touchscreens.
 *
 * The trigger is wrapped in a focusable `<span>` so any element — including
 * non-interactive ones — can act as a tooltip anchor without breaking
 * Radix's `asChild` forwarding.
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  variant = "dark",
  delayDuration = 300,
  defaultOpen = false,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Toggle on click so touch users can read the content by tapping,
  // then dismiss it by tapping the trigger again.
  const handleClick = useCallback(() => setOpen((v) => !v), []);

  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root open={open} onOpenChange={setOpen}>
        <RadixTooltip.Trigger asChild onClick={handleClick}>
          {/* Focusable span keeps keyboard accessibility for any child type */}
          <span
            className="inline-flex items-center cursor-default"
            tabIndex={0}
            data-testid="tooltip-trigger"
          >
            {children}
          </span>
        </RadixTooltip.Trigger>

        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={placement}
            sideOffset={8}
            collisionPadding={8}
            data-testid="tooltip-content"
            className={cn(
              "z-50 max-w-60 rounded-lg px-3 py-2 text-xs leading-snug shadow-xl",
              "animate-in fade-in-0 zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=top]:slide-in-from-bottom-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
              variant === "dark"
                ? "bg-zinc-900 text-zinc-100 ring-1 ring-white/10"
                : "bg-white text-zinc-900 ring-1 ring-zinc-200",
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow
              className={variant === "dark" ? "fill-zinc-900" : "fill-white"}
              width={12}
              height={6}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}