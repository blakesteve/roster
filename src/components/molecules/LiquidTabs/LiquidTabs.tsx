import type { LiquidSize, LiquidVariant } from "./liquid-pill";
import { Tabs, type TabItem, type TabsLabels } from "../Tabs/Tabs";

export type { TabItem };
export type { LiquidTabsLabels } from "./liquid-count";

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
  /** Every word a count says, with English defaults: see `TabItem.count`. */
  labels?: Partial<TabsLabels>;
}

/**
 * A controlled tab strip with a liquid sliding indicator.
 *
 * @deprecated Use `Tabs` with `variant="liquid"`, which renders exactly this:
 * the same markup, styles, keys and pill. `variant` becomes `liquidStyle`, and
 * every other prop is the same:
 *
 * ```tsx
 * <LiquidTabs variant="filled" … />  // before
 * <Tabs variant="liquid" liquidStyle="filled" … />  // after
 * ```
 *
 * `LiquidTabs` keeps working, unchanged.
 */
export function LiquidTabs({ variant = "pill", ...rest }: LiquidTabsProps) {
  return <Tabs {...rest} variant="liquid" liquidStyle={variant} />;
}
