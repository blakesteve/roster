import { useId, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  LIQUID_PILL_STYLE,
  LIQUID_STRIP_STYLE,
  liquidItemClassName,
  liquidPillClassName,
  liquidStripClassName,
  useLiquidPill,
  type LiquidSize,
  type LiquidVariant,
} from "./liquid-pill";
import { liquidTabId } from "./liquid-tab-id";

export interface TabItem {
  id: string;
  /** Static label, or a render function that receives whether this tab is active. */
  label: ReactNode | ((isActive: boolean) => ReactNode);
  /**
   * The `id` of the panel this tab controls, which sets `aria-controls`. Give
   * every tab the same id when one panel swaps its content.
   */
  panelId?: string;
}

export interface LiquidTabsProps {
  tabs: TabItem[];
  /** The `id` of the currently active tab. */
  activeTab: string;
  /** Called with the new tab `id` when the user selects a different tab. */
  onChange: (id: string) => void;
  /**
   * `"pill"` (default): a floating pill inside a padded container, `w-fit`
   * unless `fullWidth` is set.
   *
   * `"filled"`: the active tab fills its whole cell, and the container is
   * always `w-full`.
   *
   * Both squash the pill vertically (`scaleY`) while it stretches between tabs.
   */
  variant?: LiquidVariant;
  /** Stretch the `pill` variant container to full width with `flex-1` buttons. */
  fullWidth?: boolean;
  /**
   * `"md"` (default) keeps the heights this component has always had. `"lg"`
   * makes every tab at least 44px tall, the WCAG 2.5.5 target size.
   */
  size?: LiquidSize;
  /**
   * `"automatic"` (default): arrowing onto a tab selects it.
   * `"manual"`: arrows move focus only, and Enter or Space selects. Use it when
   * selecting a tab is expensive, like swapping a whole form.
   */
  activation?: "automatic" | "manual";
  /**
   * The tablist's `id`, and the base of every tab's id: see `liquidTabId`.
   * Generated when omitted, which is fine unless a panel needs to point back at
   * its tab with `aria-labelledby`.
   */
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Extra classes applied to the outer container. */
  className?: string;
}

/**
 * A controlled tab strip with a liquid sliding indicator.
 *
 * Follows the WAI tabs pattern: only the selected tab is in the tab order,
 * Left and Right move between tabs and wrap, Home and End go to the ends. If
 * `activeTab` matches no tab, the first tab takes the tab stop and no pill
 * shows.
 *
 * Until script has measured the pill, the active tab paints the pill's color
 * itself, so server-rendered HTML shows the selection too.
 *
 * The pill follows `activeTab`, never the click, so a change the consumer
 * vetoes, or one that waits on navigation, never leaves it on the wrong tab.
 *
 * For navigation between routes, use `LiquidNav`, which renders links.
 */
export function LiquidTabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  fullWidth = false,
  size = "md",
  activation = "automatic",
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
}: LiquidTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const listId = id ?? generatedId;

  useLiquidPill(containerRef, pillRef, activeTab, tabs.map((t) => t.id).join("\u0000"));

  const select = (next: string) => {
    if (next !== activeTab) onChange(next);
  };

  /* The tab stop is the selected tab, or the first if none is, until focus
     is inside the strip; then it is wherever focus is. Otherwise, after
     arrowing onto a tab that is not selected (manual activation, or a change
     the consumer refused), Tab would land on the selected tab instead of
     leaving the strip. */
  const [focused, setFocused] = useState<string | null>(null);
  const hasActive = tabs.some((t) => t.id === activeTab);
  const tabStop =
    focused !== null && tabs.some((t) => t.id === focused)
      ? focused
      : hasActive
        ? activeTab
        : tabs[0]?.id;

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current === -1) return;

    const last = buttons.length - 1;
    const rtl = getComputedStyle(container).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";

    let next: number;
    if (event.key === forward) next = current === last ? 0 : current + 1;
    else if (event.key === back) next = current === 0 ? last : current - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    buttons[next].focus();
    if (activation === "automatic") select(tabs[next].id);
  };

  return (
    <div
      ref={containerRef}
      id={listId}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-testid="liquid-tabs"
      style={LIQUID_STRIP_STYLE}
      className={liquidStripClassName(variant, fullWidth, className)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      {/* Starts invisible; a layout effect places and reveals it before the first paint. */}
      <div
        ref={pillRef}
        aria-hidden
        data-testid="liquid-tabs-pill"
        className={liquidPillClassName(variant)}
        style={LIQUID_PILL_STYLE}
      />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            /* Not optional. A button's default type is `submit`, so a tab
               inside a form submitted the form on every click. */
            type="button"
            role="tab"
            id={liquidTabId(listId, tab.id)}
            aria-selected={isActive}
            aria-controls={tab.panelId}
            tabIndex={tab.id === tabStop ? 0 : -1}
            data-tab-id={tab.id}
            data-testid={`liquid-tab-${tab.id}`}
            onClick={() => select(tab.id)}
            onFocus={() => setFocused(tab.id)}
            className={liquidItemClassName({ variant, fullWidth, size, isActive })}
          >
            {typeof tab.label === "function" ? tab.label(isActive) : tab.label}
          </button>
        );
      })}
    </div>
  );
}
