import { useLayoutEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Tabs, type TabItem } from "../Tabs/Tabs";
import { LiquidNav, type LiquidNavItem } from "./LiquidNav";
import { liquidItemClassName } from "./liquid-pill";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Liquid strips in forced colors, in Chromium's emulation (WebKit has none):
 * the selected item of `pill`, `filled` and `LiquidNav` draws a 3px bar along
 * its bottom edge, a border on its `::after` in its own text color, and no
 * other item draws one. With a count and without, and before script, from
 * server-rendered markup that's never hydrated, so the pill hasn't been
 * measured. The twin: the selected item as 5.24 classed it draws none, so
 * nothing said which tab was selected. Outside forced colors no item draws
 * one, and in them every item keeps its height: the bar takes no layout.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/LiquidTabs/Forced colors checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const COUNTED: TabItem[] = [
  { id: "open", label: "Open", count: 12 },
  { id: "done", label: "Done", count: 0 },
  { id: "all", label: "All" },
];
const PLAIN: TabItem[] = [
  { id: "board", label: "Board" },
  { id: "list", label: "List" },
  { id: "chart", label: <span>Chart</span> },
];
const LINKS: LiquidNavItem[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "inbox", label: "Inbox", href: "#inbox", count: 3 },
  { id: "about", label: "About", href: "#about" },
];
const off = () => {};

const strips = () => (
  <>
    <div data-strip="pill, counted">
      <Tabs variant="liquid" aria-label="Counted" tabs={COUNTED} activeTab="done" onChange={off} />
    </div>
    <div data-strip="pill">
      <Tabs variant="liquid" aria-label="Plain labels" tabs={PLAIN} activeTab="list" onChange={off} />
    </div>
    <div data-strip="filled">
      <Tabs variant="liquid" liquidStyle="filled" aria-label="Filled" tabs={COUNTED} activeTab="open" onChange={off} />
    </div>
    <div data-strip="nav">
      <LiquidNav aria-label="Sections" items={LINKS} activeTab="inbox" />
    </div>
  </>
);

/* The same strips as a server sends them, put in the page without hydrating,
   so no script has run on them: no pill measured, no strip marked. */
function BeforeScript() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current!.innerHTML = renderToStaticMarkup(strips());
  }, []);
  return <div ref={ref} data-when="before script" />;
}

/* 5.24's selected item: today's classes less the bar. */
const was524 = liquidItemClassName({ variant: "pill", fullWidth: false, size: "md", isActive: true })
  .split(" ")
  .filter((c) => !c.startsWith("rst:forced-colors:"))
  .join(" ");

function Strips() {
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start", padding: 16 }}>
      <div data-when="after script" style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        {strips()}
      </div>
      <BeforeScript />
      <div data-when="twin" role="tablist" aria-label="5.24" className="rst:flex rst:rounded-xl rst:border rst:p-1">
        <button type="button" role="tab" aria-selected="true" className={was524}>
          Selected
        </button>
      </div>
    </div>
  );
}

const items = (root: Element) => [...root.querySelectorAll<HTMLElement>("[data-tab-id]")];
const bar = (el: Element) => {
  const s = getComputedStyle(el, "::after");
  /* The reset gives every ::after a solid border 0px wide. */
  if (s.borderBottomStyle === "none" || parseFloat(s.borderBottomWidth) === 0) return "none";
  /* Where it sits: on the item's bottom edge (`bottom` resolves to its used
     length on a positioned box). */
  const edge = s.bottom === "0px" ? "on the bottom edge" : `${s.bottom} above it`;
  /* And as wide as the item: an `::after` left in the flow is an empty inline
     box, its border no wider than nothing. */
  const across = Math.abs(parseFloat(s.width) - el.getBoundingClientRect().width) < 0.5 ? "across it" : `${s.width} wide`;
  return `${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderBottomColor === getComputedStyle(el).color ? "its ink" : s.borderBottomColor} ${edge}, ${across}`;
};
const chromium = () => navigator.userAgent.includes("Chrome");

/* For each strip, each item's bar: the selected one first. */
const read = () => {
  const out: Record<string, string[]> = {};
  for (const when of document.querySelectorAll<HTMLElement>("[data-when]")) {
    if (when.dataset.when === "twin") {
      out.twin = [bar(when.querySelector("button")!)];
      continue;
    }
    for (const strip of when.querySelectorAll<HTMLElement>("[data-strip]")) {
      const all = items(strip);
      const selected = all.filter((el) => el.matches('[aria-selected="true"], [aria-current="page"]'));
      out[`${when.dataset.when}, ${strip.dataset.strip}`] = [...selected, ...all.filter((el) => !selected.includes(el))].map(bar);
    }
  }
  return out;
};

export const TheSelectedItemDrawsABar: Story = {
  render: () => <Strips />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await waitFor(() => expect(document.querySelectorAll('[data-when="before script"] [data-tab-id]')).toHaveLength(12));
    // Before script really is before it: the strips carry no marks a script would set.
    await expect(document.querySelector('[data-when="before script"] [data-pill-ready]')).toBeNull();
    const outside = read();
    const heights = () => [...document.querySelectorAll("[data-tab-id]")].map((el) => el.getBoundingClientRect().height);
    const heightsOutside = heights();
    let heightsForced: number[] = heightsOutside;
    let forced: Record<string, string[]> | null = null;
    if (chromium()) {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      try {
        await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
        forced = read();
        heightsForced = heights();
      } finally {
        await real.commands.realEmulateMedia({ forcedColors: null });
      }
    }
    console.info(`LIQUID FORCED ${chromium() ? "chromium" : "webkit"} ${JSON.stringify({ outside, forced })}`);
    for (const looks of Object.values(outside)) await expect(looks.every((l) => l === "none")).toBe(true);
    if (!forced) return;
    const { twin, ...strips } = forced;
    await expect(Object.keys(strips)).toHaveLength(8);
    for (const [strip, [selected, ...rest]] of Object.entries(strips)) {
      await expect(`${strip}: ${selected}`).toBe(`${strip}: 3px solid its ink on the bottom edge, across it`);
      await expect(rest).toEqual(["none", "none"]);
    }
    await expect(twin).toEqual(["none"]);
    // The bar takes no layout: every item is the height it was.
    await expect(heightsForced).toEqual(heightsOutside);
  },
};
