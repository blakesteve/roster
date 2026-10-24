import { tabId } from "../Tabs/tab-id";

/**
 * The `id` a tab renders with, for a panel's `aria-labelledby`.
 *
 * @deprecated Renamed `tabId`, which is the same function: `Tabs` and
 * `LiquidTabs` give their tabs the same ids. This name keeps working.
 */
export const liquidTabId: (listId: string, tab: string) => string = tabId;
