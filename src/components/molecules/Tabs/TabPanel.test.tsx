import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { useState } from "react";
import { TabPanel } from "./TabPanel";
import { Tabs } from "./Tabs";
import { LiquidTabPanel } from "../LiquidTabs/LiquidTabPanel";

function PerTab({ keep = false }: { keep?: boolean }) {
  const [view, setView] = useState("one");
  return (
    <>
      <Tabs
        id="v"
        aria-label="Views"
        tabs={[
          { id: "one", label: "One", count: 2, panelId: "v-one" },
          { id: "two", label: "Two", panelId: "v-two" },
        ]}
        activeTab={view}
        onChange={setView}
      />
      <TabPanel tabsId="v" id="v-one" tab="one" activeTab={view}>
        <p>First</p>
      </TabPanel>
      <TabPanel tabsId="v" id="v-two" tab="two" activeTab={view} keepMounted={keep}>
        <input aria-label="Field" />
      </TabPanel>
    </>
  );
}

describe("TabPanel", () => {
  it("is its tab's panel with a plain Tabs: role, id, and named for the tab, count included", () => {
    render(<PerTab />);
    expect(screen.getByRole("tabpanel", { name: "One, 2 items" })).toHaveAttribute("id", "v-one");
    expect(screen.getByRole("tab", { name: "One, 2 items" })).toHaveAttribute("aria-controls", "v-one");
  });

  it("shows only the selected panel, and keeps a hidden one's content only when asked", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PerTab />);
    expect([screen.queryByText("First"), screen.queryByRole("textbox", { hidden: true })]).toEqual([screen.getByText("First"), null]);
    unmount();
    render(<PerTab keep />);
    await user.click(screen.getByRole("tab", { name: "Two" }));
    await user.type(screen.getByRole("textbox", { name: "Field" }), "kept");
    await user.click(screen.getByRole("tab", { name: "One, 2 items" }));
    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByRole("textbox", { name: "Field" })).toHaveValue("kept");
  });

  it("is in the tab order only while nothing inside it can be", () => {
    render(<PerTab keep />);
    /* One holds only text; Two, hidden but mounted, holds a field. */
    expect([document.getElementById("v-one")!.tabIndex, document.getElementById("v-two")!.tabIndex]).toEqual([0, -1]);
  });

  it("is what the old name renders", () => {
    const a = render(<TabPanel tabsId="w" id="w-a" tab="a" activeTab="a" keepMounted className="mine"><p>A</p></TabPanel>);
    const b = render(<LiquidTabPanel tabsId="w" id="w-a" tab="a" activeTab="a" keepMounted className="mine"><p>A</p></LiquidTabPanel>);
    expect(b.container.innerHTML).toBe(a.container.innerHTML);
    render(<Tabs id="w" tabs={[{ id: "a", label: "A", panelId: "w-a" }]} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tabpanel", { name: "A" })).toHaveLength(2);
  });
});
