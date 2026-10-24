import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { TabPanel } from "./TabPanel";
import { Tabs } from "./Tabs";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * TabPanel with a plain `Tabs`, with real keys in Chromium and WebKit, and
 * its names from the accessibility tree.
 *
 * - **Tab goes from the strip into the panel:** to the panel itself when
 *   nothing inside it takes focus, and past it, to what's inside, when
 *   something does. The twin is the second half: a panel that stayed in the
 *   tab order would be a stop of its own before the button.
 * - **`keepMounted` keeps what was typed** through a switch away and back,
 *   and a panel without it doesn't.
 * - **The names:** each panel is named for its tab, count included.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/TabPanel/Checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);

function Panels() {
  const [view, setView] = useState("notes");
  return (
    <div style={{ display: "grid", gap: 12, width: 420 }}>
      <button type="button" data-panels-before="">
        Before
      </button>
      <Tabs
        id="p"
        aria-label="Views"
        tabs={[
          { id: "notes", label: "Notes", count: 2, panelId: "p-notes" },
          { id: "draft", label: "Draft", panelId: "p-draft" },
          { id: "empty", label: "Empty", panelId: "p-empty" },
        ]}
        activeTab={view}
        onChange={setView}
      />
      <TabPanel tabsId="p" id="p-notes" tab="notes" activeTab={view}>
        <button type="button" data-dropped="">
          Add a note
        </button>
      </TabPanel>
      <TabPanel tabsId="p" id="p-draft" tab="draft" activeTab={view} keepMounted>
        <input aria-label="Kept" data-kept="" />
      </TabPanel>
      <TabPanel tabsId="p" id="p-empty" tab="empty" activeTab={view}>
        <p style={{ margin: 0 }}>Nothing here</p>
      </TabPanel>
      <button type="button">After</button>
    </div>
  );
}

const where = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return "body";
  return `${el.getAttribute("role") ?? el.tagName.toLowerCase()} ${el.getAttribute("aria-label") ?? el.textContent?.trim()}`;
};

export const TabGoesIntoThePanel: Story = {
  tags: ["real-input"],
  render: () => <Panels />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const tab = chromium() ? "Tab" : "Alt+Tab";
    const steps: string[] = [];
    const press = async (key: string) => {
      await real.commands.realPress([key]);
      await wait(150);
      steps.push(`${key === tab ? "Tab" : key} > ${where()}`);
    };
    document.querySelector<HTMLElement>("[data-panels-before]")!.focus();
    /* Notes holds a button, so Tab skips the panel and lands on it. */
    await press(tab);
    await press(tab);
    await press("Shift+" + tab);
    /* Empty holds no field it shows, so the panel is the stop. */
    await press("End");
    await press(tab);
    await press(tab);
    await expect(steps).toEqual([
      "Tab > tab Notes, 2 items",
      "Tab > button Add a note",
      `Shift+${tab} > tab Notes, 2 items`,
      "End > tab Empty",
      "Tab > tabpanel Nothing here",
      "Tab > button After",
    ]);
  },
};

export const KeepMountedKeepsWhatWasTyped: Story = {
  tags: ["real-input"],
  render: () => <Panels />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.commands.realClick('[data-tab-id="draft"]');
    await waitFor(() => expect(document.querySelector("[data-kept]")).toBeVisible());
    /* Notes, hidden now, without keepMounted. */
    const droppedWhileHidden = document.querySelector("[data-dropped]");
    await real.commands.realClick("[data-kept]");
    await real.commands.realPress(["h", "i"]);
    await real.commands.realClick('[data-tab-id="notes"]');
    await waitFor(() => expect(document.getElementById("p-draft")).not.toBeVisible());
    const keptWhileHidden = document.querySelector<HTMLInputElement>("[data-kept]")?.value;
    await real.commands.realClick('[data-tab-id="draft"]');
    await waitFor(() => expect(document.querySelector("[data-kept]")).toBeVisible());
    /* The twin: a panel without keepMounted renders nothing while hidden. */
    await expect([keptWhileHidden, document.querySelector<HTMLInputElement>("[data-kept]")!.value, droppedWhileHidden]).toEqual(["hi", "hi", null]);
  },
};

export const EachPanelIsNamedForItsTab: Story = {
  tags: ["ax-tree"],
  render: () => <Panels />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const read = await real.commands.axStates(["#p-notes", '[data-tab-id="notes"]', '[data-tab-id="draft"]']);
    await expect(read.map((a) => [a.role, a.name])).toEqual([
      ["tabpanel", "Notes, 2 items"],
      ["tab", "Notes, 2 items"],
      ["tab", "Draft"],
    ]);
  },
};
