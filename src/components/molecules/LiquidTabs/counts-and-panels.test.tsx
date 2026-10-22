import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { LiquidTabs, type TabItem } from "./LiquidTabs";
import { LiquidNav } from "./LiquidNav";
import { LiquidTabPanel } from "./LiquidTabPanel";
import { liquidTabId } from "./liquid-tab-id";

/* Counts on tabs and links, and the panel that pairs with a tab, in jsdom.
   The pill re-measuring when a count widens a tab, and the count's contrast,
   are measured in real browsers (LiquidTabs.checks.stories.tsx). */

describe("counts on a tab", () => {
  it("is part of the tab's name, with the number in a mark hidden from it", () => {
    render(
      <LiquidTabs
        aria-label="Lists"
        tabs={[
          { id: "open", label: "Open", count: 12 },
          { id: "one", label: "One", count: 1 },
          { id: "done", label: "Done", count: 0 },
        ]}
        activeTab="open"
        onChange={vi.fn()}
      />,
    );
    /* "Open, 12 items", "One, 1 item", and zero shown: "Done, 0 items". */
    expect(["Open, 12 items", "One, 1 item", "Done, 0 items"].map((name) => screen.getByRole("tab", { name }).getAttribute("data-tab-id"))).toEqual(["open", "one", "done"]);
    const marks = [...document.querySelectorAll("[data-tab-count]")];
    expect(marks.map((m) => [m.textContent, m.getAttribute("aria-hidden")])).toEqual([
      ["12", "true"],
      ["1", "true"],
      ["0", "true"],
    ]);
  });

  it("shows no mark, and changes nothing, for no count or one that isn't a whole number from zero", () => {
    const tabs: TabItem[] = [
      { id: "none", label: "None" },
      { id: "negative", label: "Negative", count: -3 },
      { id: "fraction", label: "Fraction", count: 2.5 },
      { id: "nan", label: "NaN", count: Number.NaN },
    ];
    render(<LiquidTabs aria-label="Odd" tabs={tabs} activeTab="none" onChange={vi.fn()} />);
    expect(document.querySelectorAll("[data-tab-count]")).toHaveLength(0);
    /* Not rounded or clamped into a number nobody passed: each is its label alone. */
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["None", "Negative", "Fraction", "NaN"]);
    /* The twin: the label renders as it always has, with no wrapper, when there's no count. */
    expect(screen.getByRole("tab", { name: "None" }).firstElementChild).toBeNull();
  });

  it("writes large counts whole, and names them whole", () => {
    render(<LiquidTabs aria-label="Big" tabs={[{ id: "k", label: "Thousand", count: 1000 }, { id: "big", label: "Big", count: 12345 }]} activeTab="k" onChange={vi.fn()} />);
    expect([...document.querySelectorAll("[data-tab-count]")].map((m) => m.textContent)).toEqual(["1,000", "12,345"]);
    expect(screen.getByRole("tab", { name: "Big, 12,345 items" })).toBeInTheDocument();
  });

  it("takes the consumer's words: its own noun, and a shorter mark", () => {
    render(
      <LiquidTabs
        aria-label="Games"
        tabs={[{ id: "live", label: "Live", count: 12345 }, { id: "one", label: "One", count: 1 }]}
        activeTab="live"
        onChange={vi.fn()}
        labels={{
          count: (n) => (n === 1 ? "1 game" : `${n.toLocaleString("en-US")} games`),
          countMark: (n) => (n >= 1000 ? `${Math.floor(n / 1000)}K` : String(n)),
        }}
      />,
    );
    /* The mark is shortened; the name never is. */
    expect([document.querySelector("[data-tab-count]")!.textContent, screen.getByRole("tab", { name: "Live, 12,345 games" }).getAttribute("data-tab-id")]).toEqual(["12K", "live"]);
    expect(screen.getByRole("tab", { name: "One, 1 game" })).toBeInTheDocument();
  });

  it("keeps the tab a button that submits no form", () => {
    const submit = vi.fn((e: Event) => e.preventDefault());
    render(
      <form onSubmit={(e) => submit(e.nativeEvent)}>
        <LiquidTabs aria-label="In a form" tabs={[{ id: "a", label: "A", count: 2 }, { id: "b", label: "B", count: 3 }]} activeTab="a" onChange={vi.fn()} />
      </form>,
    );
    screen.getByRole("tab", { name: "B, 3 items" }).click();
    expect([screen.getByRole("tab", { name: "B, 3 items" }).getAttribute("type"), submit.mock.calls.length]).toEqual(["button", 0]);
  });

  it("reads right on a nav link too", () => {
    render(
      <LiquidNav
        aria-label="Sections"
        items={[
          { id: "inbox", label: "Inbox", href: "/inbox", count: 3 },
          { id: "sent", label: "Sent", href: "/sent" },
        ]}
        activeTab="inbox"
      />,
    );
    expect([screen.getByRole("link", { name: "Inbox, 3 items" }).getAttribute("href"), screen.getByRole("link", { name: "Sent" }).getAttribute("href")]).toEqual(["/inbox", "/sent"]);
  });
});

describe("LiquidTabPanel", () => {
  const TABS: TabItem[] = [
    { id: "open", label: "Open", count: 4, panelId: "lists-panel" },
    { id: "done", label: "Done", panelId: "lists-panel" },
  ];

  it("is the tab's panel by construction: role, id, and named for its tab", () => {
    render(
      <>
        <LiquidTabs id="lists" aria-label="Lists" tabs={TABS} activeTab="open" onChange={vi.fn()} />
        <LiquidTabPanel tabsId="lists" id="lists-panel" tab="open">
          <p>Four things</p>
        </LiquidTabPanel>
      </>,
    );
    const panel = screen.getByRole("tabpanel", { name: "Open, 4 items" });
    const tab = screen.getByRole("tab", { name: "Open, 4 items" });
    expect([panel.id, tab.getAttribute("aria-controls"), panel.getAttribute("aria-labelledby")]).toEqual(["lists-panel", "lists-panel", liquidTabId("lists", "open")]);
  });

  it("follows the selection as one panel that swaps its content", async () => {
    function Swapping() {
      const [tab, setTab] = useState("open");
      return (
        <>
          <LiquidTabs id="lists" aria-label="Lists" tabs={TABS} activeTab={tab} onChange={setTab} />
          <LiquidTabPanel tabsId="lists" id="lists-panel" tab={tab}>
            <p>{tab === "open" ? "Four things" : "Nothing yet"}</p>
          </LiquidTabPanel>
        </>
      );
    }
    render(<Swapping />);
    await userEvent.click(screen.getByRole("tab", { name: "Done" }));
    /* Renamed for the newly selected tab, and still the one panel. */
    expect([screen.getAllByRole("tabpanel").length, screen.getByRole("tabpanel", { name: "Done" }).textContent]).toEqual([1, "Nothing yet"]);
  });

  it("as a panel per tab, shows only the selected one, and unmounts the others' content unless kept", () => {
    render(
      <>
        <LiquidTabs id="views" aria-label="Views" tabs={[{ id: "a", label: "A", panelId: "panel-a" }, { id: "b", label: "B", panelId: "panel-b" }, { id: "c", label: "C", panelId: "panel-c" }]} activeTab="a" onChange={vi.fn()} />
        <LiquidTabPanel tabsId="views" id="panel-a" tab="a" activeTab="a">
          <input aria-label="Field A" />
        </LiquidTabPanel>
        <LiquidTabPanel tabsId="views" id="panel-b" tab="b" activeTab="a">
          <input aria-label="Field B" />
        </LiquidTabPanel>
        <LiquidTabPanel tabsId="views" id="panel-c" tab="c" activeTab="a" keepMounted>
          <input aria-label="Field C" />
        </LiquidTabPanel>
      </>,
    );
    const panels = ["panel-a", "panel-b", "panel-c"].map((id) => document.getElementById(id)!);
    /* Every panel element exists, so every tab's aria-controls resolves. */
    expect(panels.map((p) => [p.hidden, !!p.querySelector("input")])).toEqual([
      [false, true],
      [true, false],
      [true, true],
    ]);
  });

  it("is in the tab order only while nothing inside it can be tabbed to, rechecked as content changes", async () => {
    function Loading() {
      const [loaded, setLoaded] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setLoaded(true)}>
            Load
          </button>
          <LiquidTabPanel tabsId="views" id="panel" tab="a" data-testid="text-panel">
            <p>Just text</p>
          </LiquidTabPanel>
          <LiquidTabPanel tabsId="views" id="panel-2" tab="b" data-testid="loading-panel">
            {loaded ? <a href="/more">More</a> : <p>Loading</p>}
          </LiquidTabPanel>
        </>
      );
    }
    render(<Loading />);
    const text = screen.getByTestId("text-panel");
    const loading = screen.getByTestId("loading-panel");
    expect([text.getAttribute("tabindex"), loading.getAttribute("tabindex")]).toEqual(["0", "0"]);
    /* The twin: once the content holds a link, the panel leaves the tab order. */
    await userEvent.click(screen.getByRole("button", { name: "Load" }));
    await vi.waitFor(() => expect(loading.getAttribute("tabindex")).toBeNull());
    expect(text.getAttribute("tabindex")).toBe("0");
  });
});
