import { useRef, type ComponentType, type MouseEvent, type ReactNode } from "react";
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
import type { TabItem } from "./LiquidTabs";
import { LiquidCount } from "./LiquidCount";
import { LIQUID_COUNT_LABELS, countName, shownCount, type LiquidTabsLabels } from "./liquid-count";
import { withLabels } from "../../../lib/labels";
import { cn } from "../../../lib/utils";

export interface LiquidNavItem extends Omit<TabItem, "panelId"> {
  href: string;
}

/**
 * The props every link is rendered with.
 *
 * `href` and `to` carry the same value, so `next/link`, React Router's `Link`
 * and a plain `<a>` all work without a wrapper. `next/link` passes props it
 * does not know through to its `<a>`, so the rendered link carries a `to`
 * attribute too; harmless, and a wrapper can drop it. Forward `data-tab-id`
 * to the DOM: the pill finds its item by it.
 */
export interface LiquidNavLinkProps {
  href: string;
  to: string;
  className: string;
  children: ReactNode;
  "aria-current"?: "page";
  /**
   * The link's whole name when it has a count and a string label: "Inbox, 3
   * items". Forward it to the `<a>`; a component that doesn't still gets a
   * name with the count in it, from text hidden beside the label.
   */
  "aria-label"?: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  "data-tab-id": string;
}

export interface LiquidNavProps {
  items: LiquidNavItem[];
  /** The `id` of the current item. Gets `aria-current="page"` and the pill. */
  activeTab: string;
  /**
   * Called on a plain left click, before navigation. Optional, because the
   * route usually decides `activeTab`. Modified and middle clicks open
   * elsewhere and do not call it.
   */
  onChange?: (id: string) => void;
  /**
   * Renders each link. Defaults to a plain `<a>`, which is right for a static
   * site and wrong inside a router, where it makes every hop a full page load.
   *
   * **Pass it from a client component.** Functions can not cross the React
   * Server Component boundary, so handing `next/link` over from a server
   * layout fails the render with "Functions cannot be passed directly to
   * Client Components". Bind it in a small `"use client"` wrapper.
   */
  linkComponent?: ComponentType<LiquidNavLinkProps>;
  variant?: LiquidVariant;
  fullWidth?: boolean;
  size?: LiquidSize;
  /** Name the navigation; a page with two `nav`s needs both named. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  /** Every word a count says, with English defaults: see `TabItem.count`. */
  labels?: Partial<LiquidTabsLabels>;
}

/* Named props rather than a spread, so `to` does not land on the anchor as an
   attribute. */
function DefaultLink({
  href,
  className,
  children,
  onClick,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel,
  "data-tab-id": tabId,
}: LiquidNavLinkProps) {
  return (
    <a href={href} className={className} onClick={onClick} aria-current={ariaCurrent} aria-label={ariaLabel} data-tab-id={tabId}>
      {children}
    </a>
  );
}

/**
 * `LiquidTabs`' look, for navigation between routes: a `nav` of links rather
 * than a tablist of buttons.
 *
 * It is a separate component, not a mode, because the two are different
 * things to assistive technology. Tabs switch panels on the same page and take
 * one tab stop with arrow keys between them; links go somewhere, and each is
 * its own tab stop, as in any nav.
 *
 * An item can carry a `count`, as a tab does: see `TabItem.count`.
 */
export function LiquidNav({
  items,
  activeTab,
  onChange,
  linkComponent,
  variant = "pill",
  fullWidth = false,
  size = "md",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  labels,
}: LiquidNavProps) {
  const l = withLabels(LIQUID_COUNT_LABELS, labels);
  const containerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const Link = linkComponent ?? DefaultLink;

  useLiquidPill(containerRef, pillRef, activeTab, items.map((i) => i.id).join("\u0000"));

  return (
    <nav
      ref={containerRef}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-testid="liquid-nav"
      style={LIQUID_STRIP_STYLE}
      className={liquidStripClassName(variant, fullWidth, className)}
    >
      <div
        ref={pillRef}
        aria-hidden
        data-testid="liquid-tabs-pill"
        className={liquidPillClassName(variant)}
        style={LIQUID_PILL_STYLE}
      />

      {items.map((item) => {
        const isActive = item.id === activeTab;
        const label = typeof item.label === "function" ? item.label(isActive) : item.label;
        return (
          <Link
            key={item.id}
            href={item.href}
            to={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={countName(label, item.count, l)}
            data-tab-id={item.id}
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              if (!isActive) onChange?.(item.id);
            }}
            className={cn(
              liquidItemClassName({ variant, fullWidth, size, isActive }),
              /* A button centers its label and draws no underline on its own;
                 a link does neither, and a host stylesheet may underline it. */
              "rst:inline-flex rst:items-center rst:justify-center rst:no-underline",
            )}
          >
            {/* With no count, the label itself, as a link component has always
                been handed it. */}
            {shownCount(item.count) ? <LiquidCount label={label} count={item.count} labels={l} /> : label}
          </Link>
        );
      })}
    </nav>
  );
}
