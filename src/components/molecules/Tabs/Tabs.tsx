import { useId, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import {
  LIQUID_PILL_STYLE,
  LIQUID_STRIP_STYLE,
  liquidItemClassName,
  liquidPillClassName,
  liquidStripClassName,
  useLiquidPill,
} from "../LiquidTabs/liquid-pill";
import { LiquidCount } from "../LiquidTabs/LiquidCount";
import { LIQUID_COUNT_LABELS, countName, shownCount, type TabsLabels } from "../LiquidTabs/liquid-count";
import { tabId } from "./tab-id";
import { withLabels } from "../../../lib/labels";
import { cn } from "../../../lib/utils";
import { useKeyFocus } from "../../../internal/key-focus";

export type { TabsLabels };

export interface TabItem {
  id: string;
  /** Static label, or a render function that receives whether this tab is active. */
  label: ReactNode | ((isActive: boolean) => ReactNode);
  /**
   * The `id` of the panel this tab controls, which sets `aria-controls`. Give
   * every tab the same id when one panel swaps its content.
   */
  panelId?: string;
  /**
   * A number in a small mark beside the label, read as part of the tab's
   * name: "Open, 12 items" (`labels.count` says it).
   *
   * **Zero shows**, as "0" and "0 items": a count that vanished at zero would
   * change the tab's width and move every tab after it, and an empty list is
   * worth saying. To hide it, pass `undefined` for zero. `undefined` means no
   * count and no mark. A negative or fractional count isn't shown at all,
   * never rounded or clamped. Large counts aren't abbreviated: 12,345 shows
   * as "12,345" unless `labels.countMark` writes it shorter.
   */
  count?: number;
}

/** How the strip looks: `plain` (an underline) or `liquid` (a sliding pill). */
export type TabsVariant = "plain" | "liquid";
/** The liquid variant's two styles: a floating `pill`, or `filled` cells. */
export type TabsLiquidStyle = "pill" | "filled";
/** `md`, or `lg` for a 44px target. */
export type TabsSize = "md" | "lg";

interface TabsBaseProps {
  tabs: TabItem[];
  /** The `id` of the currently active tab. */
  activeTab: string;
  /** Called with the new tab `id` when the user selects a different tab. */
  onChange: (id: string) => void;
  /**
   * Stretch the tabs to fill the row, each an equal share. In `plain`, the
   * underline then spans each tab's share; the liquid `filled` style is always
   * full width.
   */
  fullWidth?: boolean;
  /**
   * `"md"` (default), or `"lg"`, which makes every tab at least 44px tall, the
   * WCAG 2.5.5 target size.
   */
  size?: TabsSize;
  /**
   * `"automatic"` (default): arrowing onto a tab selects it.
   * `"manual"`: arrows move focus only, and Enter or Space selects. Use it when
   * selecting a tab is expensive, like swapping a whole form.
   */
  activation?: "automatic" | "manual";
  /**
   * The tablist's `id`, and the base of every tab's id: see `tabId`.
   * Generated when omitted, which is fine unless a panel needs to point back at
   * its tab: give it one to pair a `TabPanel`.
   */
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Extra classes applied to the tablist. */
  className?: string;
  /** Every word a count says, with English defaults: see `TabItem.count`. */
  labels?: Partial<TabsLabels>;
}

export type TabsProps = TabsBaseProps &
  (
    | {
        /**
         * `"plain"` (default): the selected tab is underlined, on a rule that
         * runs the strip's width. `"liquid"`: a pill slides to the selected
         * tab; `liquidStyle` picks its look.
         */
        variant?: "plain";
        /** The liquid variant's look; only with `variant="liquid"`. */
        liquidStyle?: never;
      }
    | {
        variant: "liquid";
        /**
         * `"pill"` (default): a floating pill inside a padded strip, `w-fit`
         * unless `fullWidth` is set.
         *
         * `"filled"`: the selected tab fills its whole cell, and the strip is
         * always full width.
         *
         * Both squash the pill vertically (`scaleY`) while it stretches
         * between tabs.
         */
        liquidStyle?: TabsLiquidStyle;
      }
  );

/* The plain strip: a rule along the bottom, the tabs on it. A block-level
   flex row, so the rule runs the width of whatever holds it. */
const plainListClassName = (className?: string) =>
  cn("rst:font-ui rst:flex rst:gap-1 rst:border-b rst:border-(--roster-tabs-border)", className);

/*
 * One plain tab.
 *
 * The selected tab's underline is a 2px border on an `::after` laid over the
 * strip's rule, rather than a background: forced-colors mode repaints a
 * border in a system color but every background in the page's own, so a
 * border is still there, and the selected tab still says so, in the one mode
 * nobody tests. Only the selected tab and the hovered one draw it at all; an
 * underline that was merely transparent elsewhere would show on every tab in
 * forced colors.
 *
 * The weight is the same selected or not, so selecting a tab never reflows
 * the row. Focus is Roster's own ring, as on a Button: nothing here clips it.
 * The browser's own button border and background are undone, for an app
 * without a reset.
 */
const plainTabClassName = ({ fullWidth, size, isActive }: { fullWidth: boolean; size: TabsSize; isActive: boolean }) =>
  cn(
    "rst:relative rst:cursor-pointer rst:rounded-md rst:border-0 rst:bg-transparent rst:px-3 rst:py-2 rst:text-sm rst:font-medium rst:transition-colors",
    "rst:ring-offset-background rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2",
    "rst:after:pointer-events-none rst:after:absolute rst:after:inset-x-0 rst:after:-bottom-px",
    size === "lg" && "rst:min-h-11",
    fullWidth && "rst:flex-1",
    isActive
      ? "rst:text-(--roster-tabs-text-active) rst:after:border-b-2 rst:after:border-(--roster-tabs-indicator)"
      : "rst:text-(--roster-tabs-text) rst:hover:text-(--roster-tabs-text-hover) rst:hover:after:border-b-2 rst:hover:after:border-(--roster-tabs-indicator-hover)",
  );

/*
 * The liquid variant's strip: the tablist element, its pill, and the hook
 * that measures and moves the pill, in a component of their own so that hook
 * runs only for this variant.
 *
 * The strip element is rendered here, not by `Tabs`, because the pill is
 * placed in a layout effect, before the first paint, and React attaches a
 * ref only after the layout effects of everything below it have run. With
 * the element one level up, the hook would find no strip on mount and the
 * pill would land a frame late.
 */
function LiquidStrip({
  stripRef,
  activeTab,
  itemsKey,
  liquidStyle,
  fullWidth,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onKeyDown,
  onBlur,
  children,
}: {
  stripRef: RefObject<HTMLDivElement | null>;
  activeTab: string;
  itemsKey: string;
  liquidStyle: TabsLiquidStyle;
  fullWidth: boolean;
  className?: string;
  id: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  useLiquidPill(stripRef, pillRef, activeTab, itemsKey);
  /* Exactly what `LiquidTabs` has always rendered, test ids and inline
     styles included: apps style its pill by `data-testid`. */
  return (
    <div
      ref={stripRef}
      id={id}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-testid="liquid-tabs"
      style={LIQUID_STRIP_STYLE}
      className={liquidStripClassName(liquidStyle, fullWidth, className)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      {/* Starts invisible; a layout effect places and reveals it before the first paint. */}
      <div ref={pillRef} aria-hidden data-testid="liquid-tabs-pill" className={liquidPillClassName(liquidStyle)} style={LIQUID_PILL_STYLE} />
      {children}
    </div>
  );
}

/**
 * A controlled tab strip, plain or liquid.
 *
 * Follows the WAI tabs pattern in every variant: only the selected tab is in
 * the tab order, Left and Right move between tabs and wrap, Home and End go
 * to the ends, and `activation="manual"` moves focus without selecting. If
 * `activeTab` matches no tab, the first tab takes the tab stop and nothing is
 * marked selected. Every tab is `type="button"`, so a strip inside a form
 * never submits it.
 *
 * **`variant="plain"`**, the default, underlines the selected tab in
 * `--roster-tabs-indicator` on a rule in `--roster-tabs-border`. The other
 * tabs read `--roster-tabs-text`, darkening to `--roster-tabs-text-hover`
 * under the pointer with a lighter underline, `--roster-tabs-indicator-hover`.
 *
 * **`variant="liquid"`** is the sliding pill `LiquidTabs` has always drawn,
 * with its `pill` and `filled` styles (`liquidStyle`) and its
 * `--roster-lt-*` tokens. The pill follows `activeTab`, never the click, so a
 * change the consumer vetoes, or one that waits on navigation, never leaves
 * it on the wrong tab. Until script has measured it, the selected tab paints
 * the pill's color itself, so server-rendered HTML shows the selection too.
 *
 * A tab can carry a `count`, and a panel pairs with its tab by construction
 * through `TabPanel`, in either variant.
 *
 * For navigation between routes, use `LiquidNav`, which renders links.
 */
export function Tabs(props: TabsProps) {
  const {
    tabs,
    activeTab,
    onChange,
    variant = "plain",
    liquidStyle = "pill",
    fullWidth = false,
    size = "md",
    activation = "automatic",
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    labels,
  } = props;
  useKeyFocus();
  const l = withLabels(LIQUID_COUNT_LABELS, labels);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const listId = id ?? generatedId;
  const liquid = variant === "liquid";

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

  const items = tabs.map((tab) => {
    const isActive = tab.id === activeTab;
    const label = typeof tab.label === "function" ? tab.label(isActive) : tab.label;
    return (
      <button
        key={tab.id}
        /* Not optional. A button's default type is `submit`, so a tab
           inside a form submitted the form on every click. */
        type="button"
        role="tab"
        id={tabId(listId, tab.id)}
        aria-selected={isActive}
        aria-controls={tab.panelId}
        aria-label={countName(label, tab.count, l)}
        tabIndex={tab.id === tabStop ? 0 : -1}
        data-tab-id={tab.id}
        data-testid={liquid ? `liquid-tab-${tab.id}` : undefined}
        onClick={() => select(tab.id)}
        onFocus={() => setFocused(tab.id)}
        className={
          liquid
            ? liquidItemClassName({ variant: liquidStyle, fullWidth, size, isActive })
            : plainTabClassName({ fullWidth, size, isActive })
        }
      >
        {shownCount(tab.count) ? <LiquidCount label={label} count={tab.count} labels={l} /> : label}
      </button>
    );
  });

  if (liquid) {
    return (
      <LiquidStrip
        stripRef={containerRef}
        activeTab={activeTab}
        itemsKey={tabs.map((t) => t.id).join("\u0000")}
        liquidStyle={liquidStyle}
        fullWidth={fullWidth}
        className={className}
        id={listId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        {items}
      </LiquidStrip>
    );
  }
  return (
    <div
      ref={containerRef}
      id={listId}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={plainListClassName(className)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      {items}
    </div>
  );
}
