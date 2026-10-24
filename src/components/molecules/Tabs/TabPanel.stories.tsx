import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TabPanel } from "./TabPanel";
import { Tabs, type TabItem } from "./Tabs";
import { Input } from "../../atoms/Input/Input";

const meta = {
  title: "Molecules/TabPanel",
  component: TabPanel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**TabPanel** is the `role=\"tabpanel\"` a `Tabs` tab controls, paired with it by construction: its `id` is the tab's `panelId`, and its `aria-labelledby` points at the tab through `tabId`, so the panel is named for its tab, count included. It works with every variant of `Tabs`, and with `LiquidTabs`.",
          "",
          "### Two layouts",
          "**One panel that swaps its content:** every tab carries the same `panelId`, and `tab` is the selected tab. **A panel per tab:** each tab has its own `panelId`, each panel its own `tab`, and every panel gets `activeTab`, so only the selected one shows.",
          "",
          "### Hidden panels",
          "Per tab, a panel that isn't selected stays in the page, hidden, so every tab's `aria-controls` points at something, and renders no content. `keepMounted` keeps its content mounted, so a half-filled form or a scroll position survives a switch away and back.",
          "",
          "### Reaching the panel",
          "A panel with nothing inside it to Tab to is itself in the tab order, as the WAI pattern asks, so a keyboard user can reach what they just selected. It leaves the tab order once its content holds a link, a button or a field, rechecked as the content changes. Pass `tabIndex` to decide it yourself.",
          "",
          "`LiquidTabPanel` is this component's old name: deprecated, and kept working.",
        ].join("\n"),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    tabsId: { control: false },
    id: { control: false },
    tab: { control: false },
    activeTab: { control: false },
    keepMounted: { control: "boolean", table: { defaultValue: { summary: "false" } } },
  },
} satisfies Meta<typeof TabPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SEASONS: TabItem[] = [
  { id: "spring", label: "Spring", count: 4 },
  { id: "summer", label: "Summer", count: 6 },
  { id: "autumn", label: "Autumn", count: 0 },
];

const PLANTINGS: Record<string, string[]> = {
  spring: ["Peas", "Radishes", "Spinach", "Lettuce"],
  summer: ["Tomatoes", "Beans", "Squash", "Basil", "Peppers", "Cucumbers"],
  autumn: [],
};

const PANEL = { padding: 16, borderRadius: 8, border: "1px solid rgb(120 113 108 / 0.3)", minHeight: 96 } as const;

function OneSwappingPanel() {
  const [season, setSeason] = useState("spring");
  const list = PLANTINGS[season];
  return (
    <div style={{ width: 400, display: "grid", gap: 12 }}>
      <Tabs id="seasons" aria-label="Seasons" tabs={SEASONS.map((t) => ({ ...t, panelId: "seasons-panel" }))} activeTab={season} onChange={setSeason} />
      <TabPanel tabsId="seasons" id="seasons-panel" tab={season} style={PANEL}>
        {list.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {list.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, opacity: 0.7 }}>Nothing planted yet.</p>
        )}
      </TabPanel>
    </div>
  );
}

export const OnePanelThatSwaps: Story = {
  args: { tabsId: "seasons", id: "seasons-panel", tab: "spring" },
  render: () => <OneSwappingPanel />,
  parameters: {
    docs: {
      description: {
        story: "Every tab controls the same panel, which shows the selected tab's content and takes its name: \"Spring, 4 items\". With nothing to Tab to inside, the panel itself is the next stop after the strip.",
      },
    },
  },
};

function APanelEach() {
  const [view, setView] = useState("profile");
  return (
    <div style={{ width: 400, display: "grid", gap: 12 }}>
      <Tabs
        id="account"
        aria-label="Account"
        variant="liquid"
        tabs={[
          { id: "profile", label: "Profile", panelId: "account-profile" },
          { id: "alerts", label: "Alerts", panelId: "account-alerts" },
        ]}
        activeTab={view}
        onChange={setView}
      />
      <TabPanel tabsId="account" id="account-profile" tab="profile" activeTab={view} keepMounted style={PANEL}>
        <Input label="Display name" placeholder="Type, then switch tabs and back" />
      </TabPanel>
      <TabPanel tabsId="account" id="account-alerts" tab="alerts" activeTab={view} style={PANEL}>
        <p style={{ margin: 0 }}>Email me when a pick locks.</p>
      </TabPanel>
    </div>
  );
}

export const APanelPerTab: Story = {
  args: { tabsId: "account", id: "account-profile", tab: "profile" },
  render: () => <APanelEach />,
  parameters: {
    docs: {
      description: {
        story: "A panel per tab, with the liquid variant. Profile is `keepMounted`: type a name, switch to Alerts and back, and it's still there. Alerts isn't, so its content renders only while it's selected.",
      },
    },
  },
};
