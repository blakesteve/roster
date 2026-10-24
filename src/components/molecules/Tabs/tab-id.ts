/**
 * The `id` a `Tabs` tab renders with, for a panel's `aria-labelledby`.
 * `TabPanel` uses it, so you need it only for a panel of your own.
 *
 * ```tsx
 * <Tabs id="views" tabs={tabs} activeTab={view} onChange={setView} />
 * <div role="tabpanel" id="views-panel" aria-labelledby={tabId("views", view)}>
 * ```
 *
 * The tab's own `id` is used verbatim, so keep it free of whitespace. A module
 * of its own, with no React in it, so a server component can call it too.
 */
export function tabId(listId: string, tab: string): string {
  return `${listId}-tab-${tab}`;
}
