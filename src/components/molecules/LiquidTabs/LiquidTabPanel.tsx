import { TabPanel, type TabPanelProps } from "../Tabs/TabPanel";

/**
 * @deprecated Renamed `TabPanelProps`; the props are the same.
 */
export type LiquidTabPanelProps = TabPanelProps;

/**
 * The panel a tab controls, named for its tab by construction.
 *
 * @deprecated Renamed `TabPanel`, which this renders, for `Tabs` of every
 * variant and for `LiquidTabs`. Replace the name; nothing else changes. This
 * name keeps working.
 */
export function LiquidTabPanel(props: LiquidTabPanelProps) {
  return <TabPanel {...props} />;
}
