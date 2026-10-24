import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { tabId } from "./tab-id";

export interface TabPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "id" | "role" | "hidden" | "children"> {
  /** The `id` of the `Tabs` this panel belongs to (its `id` prop). */
  tabsId: string;
  /** This panel's `id`: the `panelId` its tab carries, or every tab, for one panel that swaps its content. */
  id: string;
  /**
   * The tab that names this panel. For one panel that swaps its content, the
   * selected tab: the panel's name follows the selection. For a panel per tab,
   * its own tab.
   */
  tab: string;
  /**
   * For a panel per tab: the selected tab. The panel shows when it is `tab`,
   * and is hidden otherwise. Leave it out for one panel that swaps its
   * content, which always shows.
   */
  activeTab?: string;
  /**
   * For a panel per tab: keep the content mounted while the panel is hidden,
   * so what's in it (a half-filled form, a scroll position) survives a switch
   * away and back. By default a hidden panel renders no content. The panel
   * element itself always stays, hidden, so its tab's `aria-controls` points
   * at something.
   */
  keepMounted?: boolean;
  children?: ReactNode;
}

/* What a person can Tab to inside the panel. */
const TABBABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

/**
 * The panel a `Tabs` tab controls, paired with it by construction:
 * `role="tabpanel"`, its `id` the tab's `panelId`, and `aria-labelledby`
 * pointing at the tab through `tabId`, so it's named for its tab. It works
 * with every variant, and with `LiquidTabs`, whose tabs have the same ids.
 *
 * ```tsx
 * <Tabs id="views" tabs={[{ id: "open", label: "Open", panelId: "views-panel" }, …]} … />
 * <TabPanel tabsId="views" id="views-panel" tab={view}>…</TabPanel>
 * ```
 *
 * Two ways to lay it out. **One panel that swaps its content:** every tab
 * carries the same `panelId`, and `tab` is the selected tab. **A panel per
 * tab:** each tab has its own `panelId`, each panel its own `tab`, and every
 * panel gets `activeTab`, so only the selected one shows.
 *
 * The WAI tabs pattern puts the panel in the tab order when nothing inside it
 * can take focus, so a keyboard user can reach and scroll what was just
 * selected. Whether the content holds anything focusable isn't known until it
 * renders, and it can change as content loads, so the panel starts reachable
 * (`tabIndex={0}`) and leaves the tab order once its content holds something
 * that can be Tabbed to, rechecking as the content changes. Pass `tabIndex`
 * to decide it yourself.
 */
export function TabPanel({ tabsId, id, tab, activeTab, keepMounted = false, tabIndex, children, ...rest }: TabPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = activeTab === undefined || activeTab === tab;
  const [hasTabbable, setHasTabbable] = useState(false);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const check = () => setHasTabbable(!!panel.querySelector(TABBABLE));
    check();
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(check);
    observer.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "tabindex", "href", "contenteditable"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...rest}
      ref={ref}
      role="tabpanel"
      id={id}
      aria-labelledby={tabId(tabsId, tab)}
      hidden={!shown}
      tabIndex={tabIndex ?? (hasTabbable ? undefined : 0)}
      data-tab-panel=""
    >
      {shown || keepMounted ? children : null}
    </div>
  );
}
