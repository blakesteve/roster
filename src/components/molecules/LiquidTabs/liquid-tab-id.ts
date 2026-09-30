/**
 * The `id` a `LiquidTabs` tab renders with, for a panel's `aria-labelledby`.
 *
 * ```tsx
 * <LiquidTabs id="views" tabs={tabs} activeTab={view} onChange={setView} />
 * <div role="tabpanel" id="views-panel" aria-labelledby={liquidTabId("views", view)}>
 * ```
 *
 * The tab's own `id` is used verbatim, so keep it free of whitespace. A module
 * of its own, with no React in it, so a server component can call it too.
 */
export function liquidTabId(listId: string, tabId: string): string {
  return `${listId}-tab-${tabId}`;
}
