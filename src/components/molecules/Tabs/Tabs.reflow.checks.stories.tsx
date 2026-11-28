import { useLayoutEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Tabs, type TabItem, type TabsProps } from "./Tabs";
import { LiquidNav, type LiquidNavItem, type LiquidNavLinkProps } from "../LiquidTabs/LiquidNav";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";
import { asStrips524 } from "../../../test/strip-524";

/**
 * Tab strips that don't fit scroll inside themselves: `Tabs` (`plain`,
 * `pill`, `filled`, `fullWidth`, `lg`) and `LiquidNav`, in Chromium and
 * WebKit, each beside its strip as 5.24 drew it (`src/test/strip-524.ts`).
 *
 * - **What fits is unchanged:** from 320 to 1,280px, at 100% and 200% text,
 *   in both directions, wherever 5.24's strip fits, this one is marked as
 *   fitting and its box and every tab's are the same to 0.05px; wherever it
 *   doesn't, this one scrolls. Nothing pushes the page, and resizing logs no
 *   `ResizeObserver loop` notice. The twin: 5.24's push the page.
 * - **A strip that fits is measured once:** its mark is set once, and never
 *   read again while nothing that sizes it changes.
 * - **A strip that scrolls:** no tab wider than the strip less 32px, a label
 *   longer than that wrapping inside it and every other on one line; a
 *   `fullWidth` or `filled` strip still the full width.
 * - **Kept in view:** after every arrow, Home, End, wrap-around, a burst of
 *   arrows and a click on a tab that's cut off, in both directions, the
 *   focused tab (and the selected one) is clear of the chevrons, the pill is
 *   on its tab, and the page hasn't moved. Manual activation and `LiquidNav`'s
 *   Tab walk too. A tab as wide as the strip allows narrows the chevrons'
 *   zones to 16px and sits clear of both. When the page narrows and widens,
 *   the selected tab stays in view.
 * - **The chevrons move nothing:** a tab sits at the same place in the strip
 *   whichever chevrons show. A press on one pages the strip by its width less
 *   both zones, selects nothing and leaves focus where it was.
 * - **Reduced motion:** the strip jumps where it would glide (this story runs
 *   again in `storybook-reduced-motion`).
 * - **Forced colors:** the chevrons draw in `CanvasText` (Chromium).
 * - **A plain strip that scrolls** draws its focus ring inside the tab and its
 *   underline on the rule's inner edge; one that fits, as 5.24 did.
 * - **Before script:** server-rendered strips, never hydrated, push nothing
 *   and show their selection.
 * - **The README's limit:** in a `1fr` grid column or a `flex: 1` child the
 *   box widens to the tabs' longest words; with a minimum of zero, or as a
 *   flex item itself, the strip scrolls.
 *
 * Widths here come from the system font, so what's pinned is the relation
 * between this strip and 5.24's, or between a tab and its strip, never a
 * pixel count of text.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page. Story
 * styling is inline, so none of it ships in roster.css.
 */
const meta = {
  title: "Molecules/Tabs/Reflow checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const t = (label: string, count?: number): TabItem => ({ id: label.toLowerCase().replace(/\W+/g, "-"), label, count });
type Strip =
  | { nav?: false; props: Omit<TabsProps, "activeTab" | "onChange"> }
  | { nav: true; props: { items: LiquidNavItem[]; variant?: "pill" | "filled" } };
const STRIPS: Record<string, Strip> = {
  counts: { props: { variant: "liquid", "aria-label": "Counts", tabs: [t("Waiting", 12), t("Declined", 3), t("Unpublished", 41)] } },
  eleven: {
    props: {
      variant: "liquid",
      "aria-label": "Eleven",
      tabs: ["Games", "Users", "Flags", "Community", "Rewrites", "Feedback", "Action Log", "Reports", "Imports", "Homepage", "Settings"].map((l, i) => t(l, i === 2 ? 3 : i === 4 ? 5 : undefined)),
    },
  },
  filled: { props: { variant: "liquid", liquidStyle: "filled", "aria-label": "Filled", tabs: [t("Standings", 12), t("Head to Head"), t("Schedule"), t("Members")] } },
  pillFull: { props: { variant: "liquid", fullWidth: true, "aria-label": "Pill full width", tabs: [t("Overview"), t("Statistics"), t("Head to Head")] } },
  lg: { props: { variant: "liquid", size: "lg", "aria-label": "Large", tabs: [t("Morning"), t("Afternoon"), t("Evening"), t("Overnight")] } },
  plain: { props: { "aria-label": "Plain", activation: "manual", tabs: [t("Overview"), t("Activity"), t("Pull requests", 12), t("Settings"), t("Members")] } },
  plainFull: { props: { "aria-label": "Plain full width", fullWidth: true, tabs: [t("Board"), t("Timeline"), t("Calendar view")] } },
  long: { props: { "aria-label": "Long", tabs: [t("Notes"), t("Pneumonoultramicroscopicsilicovolcanoconiosis research notes"), t("Archive")] } },
  short: { props: { "aria-label": "Short", tabs: [t("On"), t("Off")] } },
  nav: {
    nav: true,
    props: { items: ["Home", "Inbox", "Projects", "Calendar", "Documents", "Settings"].map((l, i) => ({ id: l.toLowerCase(), label: l, href: `#${l.toLowerCase()}`, count: i === 1 ? 3 : undefined })) },
  },
  navFilled: { nav: true, props: { variant: "filled", items: ["Today", "This week", "This month", "All time"].map((l) => ({ id: l.toLowerCase().replace(/ /g, "-"), label: l, href: `#${l.replace(/ /g, "")}` })) } },
};
const IDS = Object.keys(STRIPS);
const firstId = (s: Strip) => (s.nav ? s.props.items[0].id : s.props.tabs[0].id);

/* A link that goes nowhere, so a click selects without leaving the story. */
function StayingLink({ href, children, onClick, className, "aria-current": current, "aria-label": label, "data-tab-id": tabId }: LiquidNavLinkProps) {
  return (
    <a
      href={href}
      className={className}
      aria-current={current}
      aria-label={label}
      data-tab-id={tabId}
      onClick={(e) => {
        onClick(e);
        e.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

function OneStrip({ id }: { id: string }) {
  const s = STRIPS[id];
  const [active, setActive] = useState(firstId(s));
  if (s.nav)
    return (
      <LiquidNav
        aria-label={id}
        {...s.props}
        activeTab={active}
        onChange={setActive}
        linkComponent={StayingLink}
      />
    );
  return <Tabs {...(s.props as TabsProps)} activeTab={active} onChange={setActive} />;
}

const STILL = "[data-twin] *{transition:none!important;animation:none!important}";
function Strips({ only }: { only?: string[] }) {
  return (
    <div style={{ padding: "8px 16px" }}>
      <style>{STILL}</style>
      {(only ?? IDS).map((id) => (
        <section key={id} data-strip={id} style={{ marginBottom: 12 }}>
          <div data-now="">
            <OneStrip id={id} />
          </div>
          {/* 5.24's strip, made from this one once it's settled. */}
          <div data-twin="" inert style={{ marginTop: 4 }} />
        </section>
      ))}
    </div>
  );
}

const q = <T extends Element = HTMLElement>(root: ParentNode, s: string) => root.querySelector<T>(s)!;
const now = (id: string) => q(document, `[data-strip="${id}"] [data-now] > *`);
const twin = (id: string) => q(document, `[data-strip="${id}"] [data-twin] > *`);
const scrollerOf = (strip: Element) => q(strip, "[data-strip-scroller]");
const tabsOf = (strip: Element) => [...strip.querySelectorAll<HTMLElement>("[data-tab-id]")];
const cueOf = (strip: Element, side: "left" | "right") => q(strip, `[data-strip-cue="${side}"]`);
const shown = (el: Element) => getComputedStyle(el).display !== "none";
const markOf = (strip: Element) => strip.getAttribute("data-roster-strip");
const selectedOf = (strip: Element) => tabsOf(strip).find((el) => el.matches('[aria-selected="true"], [aria-current="page"]'))!;
const r2 = (n: number) => Math.round(n * 100) / 100;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const engine = () => (navigator.userAgent.includes("Chrome") ? "chromium" : "webkit");

function makeTwins() {
  for (const id of IDS) {
    const host = document.querySelector(`[data-strip="${id}"] [data-twin]`);
    if (!host) continue;
    const copy = now(id).cloneNode(true) as HTMLElement;
    const holder = document.createElement("div");
    holder.append(copy);
    asStrips524(holder);
    host.replaceChildren(...holder.childNodes);
  }
}

/* Every scroll at rest and, unless told not to wait, the pill's two phases
   run out. */
async function settle(pill = true) {
  let last = "";
  let still = 0;
  for (let i = 0; i < 180 && still < 5; i++) {
    await frame();
    /* Each strip's scroll, its mark (set a frame after a resize) and its
       width, so a slow frame can't be read before the strip has decided. */
    const at = [...document.querySelectorAll("[data-strip-scroller]")]
      .map((s) => `${s.scrollLeft.toFixed(2)} ${s.parentElement!.getAttribute("data-roster-strip")} ${s.parentElement!.getBoundingClientRect().width.toFixed(2)}`)
      .join(" ");
    still = at === last ? still + 1 : 0;
    last = at;
  }
  if (pill) await wait(320);
}

type Dir = "ltr" | "rtl";
async function at(real: RealInput, width: number, percent: number, dir: Dir = "ltr") {
  await real.page.viewport(width, 900);
  await waitFor(() => expect(window.innerWidth).toBe(width));
  document.documentElement.style.fontSize = percent === 100 ? "" : `${percent}%`;
  const turned = document.documentElement.dir !== dir;
  document.documentElement.dir = dir;
  await settle(false);
  /* A page doesn't change direction under a strip; here one does, so each
     strip goes back to its start and reads its chevrons again. */
  if (!turned) return;
  for (const box of document.querySelectorAll<HTMLElement>("[data-strip-scroller]")) {
    box.scrollLeft = 0;
    box.dispatchEvent(new Event("scroll"));
  }
  await settle(false);
}
async function restore(real: RealInput) {
  document.documentElement.style.fontSize = "";
  document.documentElement.dir = "ltr";
  for (const el of document.querySelectorAll<HTMLElement>("[data-twin], [data-now]")) el.style.display = "";
  await real.page.viewport(1280, 720);
}
async function ready() {
  await document.fonts.ready;
  await settle();
}

/* Boxes against the section's content corner. */
const rel = (el: Element, o: DOMRect) => {
  const r = el.getBoundingClientRect();
  return [r.left - o.left, r.right - o.left, r.top - o.top, r.bottom - o.top].map(r2);
};
const apart = (a: number[][], b: number[][]) =>
  a.length !== b.length ? Infinity : Math.max(0, ...a.flatMap((x, i) => x.map((n, j) => Math.abs(n - b[i][j]))));
/* Whether a strip's tabs all lie inside it and inside the page's margins. */
const inside = (strip: Element) => {
  const section = strip.closest("section")!.getBoundingClientRect();
  const box = strip.getBoundingClientRect();
  const s = getComputedStyle(strip);
  const l = Math.max(section.left, box.left + parseFloat(s.borderLeftWidth));
  const r = Math.min(section.right, box.right - parseFloat(s.borderRightWidth));
  return box.left >= section.left - 0.5 && box.right <= section.right + 0.5 && tabsOf(strip).every((el) => {
    const t = el.getBoundingClientRect();
    return t.left >= l - 0.5 && t.right <= r + 0.5;
  });
};
/* How many lines a tab's words take: the most any one text node wraps onto.
   A count's mark sits beside the label, so it isn't a line of its own. */
const wrapsOf = (tab: Element) => {
  let most = 0;
  const w = document.createTreeWalker(tab, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    if (!w.currentNode.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(w.currentNode);
    most = Math.max(most, new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top))).size);
  }
  return most;
};
const pageScroll = () => r2(document.documentElement.scrollWidth - window.innerWidth);

const unchangedAt = (percent: 100 | 200): Story => ({
  render: () => <Strips />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const errors: string[] = [];
    const onError = (e: ErrorEvent) => errors.push(e.message);
    window.addEventListener("error", onError);
    const moved: string[] = [];
    const wrong: string[] = [];
    const pushed: string[] = [];
    const twinsPushed: string[] = [];
    let fit = 0;
    let scrolled = 0;
    try {
      await ready();
      makeTwins();
      for (const dir of ["ltr", "rtl"] as const)
        for (const width of [320, 375, 414, 768, 1024, 1280]) {
          await at(real, width, percent, dir);
          const where = `${width} ${percent}% ${dir}`;
          for (const id of IDS) {
            const [a, b] = [now(id), twin(id)];
            const fits = inside(b);
            const mark = markOf(a);
            if (fits !== (mark === "fit")) wrong.push(`${where} ${id}: 5.24's ${fits ? "fits" : "doesn't fit"}, marked ${mark}`);
            if (!fits) {
              scrolled += 1;
              continue;
            }
            fit += 1;
            const read = (strip: Element) => {
              const origin = strip.parentElement!.getBoundingClientRect();
              return [rel(strip, origin), ...tabsOf(strip).map((el) => rel(el, origin))];
            };
            const [x, y] = [read(a), read(b)];
            if (apart(x, y) > 0.05) moved.push(`${where} ${id}: ${JSON.stringify(x)} was ${JSON.stringify(y)}`);
          }
          /* The page, with only today's strips in it, then only 5.24's. */
          for (const el of document.querySelectorAll<HTMLElement>("[data-twin]")) el.style.display = "none";
          if (pageScroll() > 0) pushed.push(`${where}: ${pageScroll()}`);
          for (const el of document.querySelectorAll<HTMLElement>("[data-twin]")) el.style.display = "";
          for (const el of document.querySelectorAll<HTMLElement>("[data-now]")) el.style.display = "none";
          if (pageScroll() > 0) twinsPushed.push(`${where}: ${pageScroll()}`);
          for (const el of document.querySelectorAll<HTMLElement>("[data-now]")) el.style.display = "";
        }
    } finally {
      window.removeEventListener("error", onError);
      await restore(real);
    }
    console.info(`TABS UNCHANGED ${engine()} ${percent}% ${fit} fit, ${scrolled} scroll, ${moved.length} moved, ${wrong.length} marked wrong; pushed ${JSON.stringify(pushed)}; 5.24 pushed at ${twinsPushed.length} of 12 sizes; errors ${JSON.stringify(errors)}`);
    await expect(wrong).toEqual([]);
    await expect(moved).toEqual([]);
    await expect(pushed).toEqual([]);
    await expect(errors.filter((e) => /ResizeObserver/.test(e))).toEqual([]);
    // The twin: 5.24's push the page at 320px.
    await expect(twinsPushed.some((p) => p.startsWith(`320 ${percent}% ltr`))).toBe(true);
    // Both happened: strips that fit and strips that scroll.
    await expect(fit).toBeGreaterThan(percent === 100 ? 40 : 15);
    await expect(scrolled).toBeGreaterThan(percent === 100 ? 15 : 40);
  },
});
export const WhatFitsIsUnchanged: Story = unchangedAt(100);
export const WhatFitsIsUnchangedAt200Percent: Story = unchangedAt(200);

export const AStripThatFitsIsMeasuredOnce: Story = {
  render: () => {
    function Later() {
      const [shown, show] = useState(false);
      return (
        <div style={{ padding: 16, width: 900 }}>
          <button type="button" data-mount="" onClick={() => show(true)}>
            Mount
          </button>
          {shown && <Strips only={["short", "counts", "plain", "nav"]} />}
        </div>
      );
    }
    return <Later />;
  },
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.page.viewport(1280, 720);
    const records: { id: string; was: string | null; now: string | null }[] = [];
    const observer = new MutationObserver((list) => {
      for (const m of list) {
        const el = m.target as Element;
        records.push({ id: el.closest("section")?.getAttribute("data-strip") ?? "?", was: m.oldValue, now: el.getAttribute("data-roster-strip") });
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-roster-strip"], attributeOldValue: true });
    try {
      q(document, "[data-mount]").click();
      await waitFor(() => expect(document.querySelectorAll("[data-roster-strip]")).toHaveLength(4));
      await ready();
      await wait(300);
    } finally {
      observer.disconnect();
      await restore(real);
    }
    const by = (id: string) => records.filter((r) => r.id === id).map((r) => `${r.was}>${r.now}`);
    console.info(`TABS MEASURED ${engine()} ${JSON.stringify(Object.fromEntries(["short", "counts", "plain", "nav"].map((id) => [id, by(id)])))}`);
    // At 900px every one of them fits: marked once, before it painted, and never unmarked to be read again.
    for (const id of ["short", "counts", "plain", "nav"]) await expect(by(id)).toEqual(["null>fit"]);
  },
};

export const AStripThatScrollsHoldsItsTabs: Story = {
  render: () => <Strips />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    const faults: string[] = [];
    try {
      await ready();
      for (const [width, percent] of [[320, 100], [320, 200], [768, 200]] as const) {
        await at(real, width, percent);
        for (const id of IDS) {
          const strip = now(id);
          if (markOf(strip) !== "scroll") continue;
          const box = strip.getBoundingClientRect();
          const limit = box.width - 32;
          for (const tab of tabsOf(strip)) {
            const w = tab.getBoundingClientRect().width;
            const textLines = wrapsOf(tab);
            if (w > limit + 0.5) faults.push(`${width} ${percent}% ${id} ${tab.dataset.tabId}: ${r2(w)} wide, the strip less 32 is ${r2(limit)}`);
            if (textLines > 1 && w < limit - 0.5) faults.push(`${width} ${percent}% ${id} ${tab.dataset.tabId}: ${textLines} lines at ${r2(w)}`);
          }
          const section = strip.closest("section")!.getBoundingClientRect();
          got[`${width} ${percent}% ${id}`] = { width: r2(box.width), full: Math.abs(box.width - section.width) < 0.5 };
          /* The box that scrolls: a swipe at an end stays in it, it draws no
             scrollbar, and it fades its tabs at the edges. Liquid tabs take
             the pill's 1rem of side padding, plain ones keep 0.75rem. */
          const sc = getComputedStyle(scrollerOf(strip));
          const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
          const padding = new Set(tabsOf(strip).map((el) => r2(parseFloat(getComputedStyle(el).paddingLeft) / fontSize)));
          const wanted = STRIPS[id].nav || (STRIPS[id].props as TabsProps).variant === "liquid" ? 1 : 0.75;
          if (sc.overscrollBehaviorX !== "contain") faults.push(`${width} ${percent}% ${id}: overscroll ${sc.overscrollBehaviorX}`);
          if (sc.scrollbarWidth !== "none") faults.push(`${width} ${percent}% ${id}: scrollbar ${sc.scrollbarWidth}`);
          if (!/gradient/.test(sc.maskImage || sc.getPropertyValue("-webkit-mask-image"))) faults.push(`${width} ${percent}% ${id}: no fade`);
          if (padding.size !== 1 || !padding.has(wanted)) faults.push(`${width} ${percent}% ${id}: side padding ${[...padding].join(",")}rem`);
          if (id === "long") {
            const longTab = tabsOf(strip)[1];
            got[`${width} ${percent}% long tab`] = {
              atLimit: Math.abs(longTab.getBoundingClientRect().width - limit) < 0.5,
              wraps: wrapsOf(longTab) > 1,
            };
          }
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS SCROLLING ${engine()} ${JSON.stringify(got)} faults ${JSON.stringify(faults)}`);
    await expect(faults).toEqual([]);
    for (const id of ["counts", "eleven", "plain", "nav", "long"]) await expect(got[`320 100% ${id}`]).toBeTruthy();
    // `fullWidth` and `filled` stay the full width while they scroll.
    for (const id of ["filled", "pillFull", "plainFull"]) await expect(got[`320 200% ${id}`]).toMatchObject({ full: true });
    // The label longer than the strip less 32px wraps inside its tab, at the limit.
    await expect(got["320 100% long tab"]).toEqual({ atLimit: true, wraps: true });
  },
};

/* ── Kept in view ───────────────────────────────────────────────────────── */

/* Whether the tab is clear of every chevron showing, and inside the strip. */
const unclear = (strip: Element, tab: Element) => {
  const r = tab.getBoundingClientRect();
  const box = scrollerOf(strip).getBoundingClientRect();
  const out: string[] = [];
  const left = cueOf(strip, "left");
  const right = cueOf(strip, "right");
  if (shown(left) && r.left < left.getBoundingClientRect().right - 0.5) out.push(`${r2(left.getBoundingClientRect().right - r.left)}px under the left chevron`);
  if (shown(right) && r.right > right.getBoundingClientRect().left + 0.5) out.push(`${r2(r.right - right.getBoundingClientRect().left)}px under the right chevron`);
  /* Under a pixel, as the chevrons count it: Chromium can't scroll right to
     left by the fraction a strip's content may run to. */
  if (r.left < box.left - 1 || r.right > box.right + 1) out.push("out of the strip");
  return out;
};
const pillOff = (strip: Element) => {
  const pill = strip.querySelector('[data-testid="liquid-tabs-pill"]');
  if (!pill) return 0;
  /* Side to side and top to bottom: the pill is the selected tab's box. */
  const [p, s] = [pill.getBoundingClientRect(), selectedOf(strip).getBoundingClientRect()];
  return r2(Math.max(Math.abs(p.left - s.left), Math.abs(p.right - s.right), Math.abs(p.top - s.top), Math.abs(p.bottom - s.bottom)));
};

/* In parts, so each story runs well inside its time limit on a slow runner. */
type Walk = "arrows" | "ends" | "manual" | "links";
/* One direction's walk: every check made, and what was wrong. */
async function walk(real: RealInput, dir: Dir, which: Walk) {
  const faults: string[] = [];
  let steps = 0;
  const page = () => `${window.scrollX},${window.scrollY}`;
  await ready();
  await at(real, 320, 100, dir);
  const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
  const before = page();
  const check = async (id: string, what: string) => {
    await settle();
    steps += 1;
    const strip = now(id);
    const focused = document.activeElement as HTMLElement;
    const where = `${dir} ${id} ${what}`;
    if (!strip.contains(focused)) faults.push(`${where}: focus left the strip`);
    else for (const f of unclear(strip, focused)) faults.push(`${where}: the focused ${focused.dataset.tabId} ${f}`);
    /* On the automatic strip the selection follows focus; on the manual one
       and in the nav it stays where it was. */
    if (id === "eleven") for (const f of unclear(strip, selectedOf(strip))) faults.push(`${where}: the selected ${f}`);
    const off = pillOff(strip);
    if (off > 0.5) faults.push(`${where}: the pill ${off}px off its tab`);
    if (page() !== before) faults.push(`${where}: the page moved to ${page()}`);
  };
  for (const id of ["eleven", "plain", "nav"]) if (markOf(now(id)) !== "scroll") faults.push(`${id} is marked ${markOf(now(id))}`);

  if (which === "arrows") {
    /* Every arrow, and the wrap both ways. */
    selectedOf(now("eleven")).focus();
    const count = tabsOf(now("eleven")).length;
    for (let i = 0; i < count; i++) {
      await real.commands.realPress([forward]);
      await check("eleven", `${forward} ${i + 1}`);
    }
    await real.commands.realPress([back]);
    await check("eleven", `${back}, the wrap back`);
  } else if (which === "ends") {
    /* Home, End, a burst, and a click on a tab that's cut. */
    selectedOf(now("eleven")).focus();
    await real.commands.realPress(["Home"]);
    await check("eleven", "Home");
    await real.commands.realPress(["End"]);
    await check("eleven", "End");
    await real.commands.realPress(["Home"]);
    await settle();
    for (let i = 0; i < 6; i++) await real.commands.realPress([forward]);
    await check("eleven", "a burst of six");

    /* A click on a tab the chevron at the end cuts: the strip scrolled by
       hand until the fifth tab shows 30px outside it. */
    await real.commands.realPress(["Home"]);
    await settle();
    const strip = now("eleven");
    const box = scrollerOf(strip);
    const cut = tabsOf(strip)[4];
    const edge = () => cueOf(strip, dir === "rtl" ? "left" : "right").getBoundingClientRect();
    box.scrollLeft += dir === "rtl" ? cut.getBoundingClientRect().right - (edge().right + 30) : cut.getBoundingClientRect().left - (edge().left - 30);
    await settle();
    const cue = edge();
    const r = cut.getBoundingClientRect();
    const fx = dir === "rtl" ? (cue.right + 4 - r.left) / r.width : (cue.left - 4 - r.left) / r.width;
    await real.commands.realClick(`[data-strip="eleven"] [data-now] [data-tab-id="${cut.dataset.tabId}"]`, { fx, fy: 0.5 });
    await settle();
    steps += 1;
    if (selectedOf(strip) !== cut) faults.push(`${dir} eleven, the click: ${selectedOf(strip).dataset.tabId} selected, not ${cut.dataset.tabId}`);
    for (const f of unclear(strip, cut)) faults.push(`${dir} eleven, the click: ${f}`);
    if (page() !== before) faults.push(`${dir} eleven, the click: the page moved`);
  } else if (which === "manual") {
    /* Manual activation: focus moves, the selection stays, Enter selects. */
    selectedOf(now("plain")).focus();
    for (let i = 0; i < 4; i++) {
      await real.commands.realPress([forward]);
      await check("plain", `manual ${forward} ${i + 1}`);
    }
    await real.commands.realPress(["Enter"]);
    await check("plain", "Enter");
    await real.commands.realPress(["Home"]);
    await check("plain", "Home");
  } else {
    /* LiquidNav: each link its own stop. Safari's keyboard users reach links with Option+Tab. */
    const links = tabsOf(now("nav"));
    links[0].focus();
    for (let i = 1; i < links.length; i++) {
      await real.commands.realPress([engine() === "chromium" ? "Tab" : "Alt+Tab"]);
      await check("nav", `Tab ${i}`);
    }
  }
  (document.activeElement as HTMLElement | null)?.blur();
  return { steps, faults };
}

const walkStory = (dir: Dir, which: Walk, steps: number): Story => ({
  /* The page in its direction before the strips mount, as an app's would be. */
  beforeEach: () => {
    document.documentElement.dir = dir;
    return () => {
      document.documentElement.dir = "ltr";
    };
  },
  render: () => <Strips only={["eleven", "plain", "nav"]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    let got = { steps: 0, faults: [] as string[] };
    try {
      got = await walk(real, dir, which);
    } finally {
      await restore(real);
    }
    console.info(`TABS IN VIEW ${engine()} ${dir} ${which}: ${got.steps} steps, faults ${JSON.stringify(got.faults)}`);
    await expect(got.steps).toBe(steps);
    await expect(got.faults).toEqual([]);
  },
});
export const EveryArrowKeepsTheTabClear: Story = walkStory("ltr", "arrows", 11 + 1);
export const EveryArrowKeepsTheTabClearRightToLeft: Story = walkStory("rtl", "arrows", 11 + 1);
export const HomeEndABurstAndAClickKeepItClear: Story = walkStory("ltr", "ends", 4);
export const HomeEndABurstAndAClickKeepItClearRightToLeft: Story = walkStory("rtl", "ends", 4);
export const ManualActivationKeepsTheFocusedTabClear: Story = walkStory("ltr", "manual", 4 + 2);
export const ManualActivationKeepsTheFocusedTabClearRightToLeft: Story = walkStory("rtl", "manual", 4 + 2);
export const LiquidNavKeepsTheFocusedLinkClear: Story = walkStory("ltr", "links", 5);
export const LiquidNavKeepsTheFocusedLinkClearRightToLeft: Story = walkStory("rtl", "links", 5);

export const AWideTabNarrowsTheChevrons: Story = {
  render: () => <Strips only={["long", "eleven"]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    try {
      await ready();
      for (const dir of ["ltr", "rtl"] as const) {
        await at(real, 320, 100, dir);
        const strip = now("long");
        selectedOf(strip).focus();
        await real.commands.realPress([dir === "rtl" ? "ArrowLeft" : "ArrowRight"]);
        await settle();
        const wide = tabsOf(strip)[1];
        const zone = (side: "left" | "right") => r2(cueOf(strip, side).getBoundingClientRect().width);
        got[dir] = {
          selected: selectedOf(strip) === wide,
          zones: [zone("left"), zone("right")],
          clear: unclear(strip, wide),
        };
        /* Back on a narrow tab, the zones are 32px again. */
        await real.commands.realPress(["Home"]);
        await settle();
        got[`${dir} home`] = shown(cueOf(strip, dir === "rtl" ? "left" : "right")) ? zone(dir === "rtl" ? "left" : "right") : "hidden";
        (document.activeElement as HTMLElement).blur();
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS WIDE ${engine()} ${JSON.stringify(got)}`);
    for (const dir of ["ltr", "rtl"]) {
      // The long label's tab is the strip less 32px: only 16px zones leave it clear of both chevrons.
      await expect(got[dir]).toEqual({ selected: true, zones: [16, 16], clear: [] });
      await expect(got[`${dir} home`]).toBe(32);
    }
  },
};

export const WhenTheStripNarrowsTheSelectedTabStaysInView: Story = {
  render: () => <Strips only={["eleven", "plain"]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const faults: string[] = [];
    try {
      await ready();
      await at(real, 414, 100);
      /* A tab toward the end selected, then the page made narrower and wider. */
      for (const id of ["eleven", "plain"]) {
        const strip = now(id);
        selectedOf(strip).focus();
        await real.commands.realPress(["End"]);
        if (id === "plain") await real.commands.realPress(["Enter"]);
        await settle();
        (document.activeElement as HTMLElement).blur();
      }
      for (const width of [320, 360, 414, 320]) {
        await at(real, width, 100);
        for (const id of ["eleven", "plain"]) for (const f of unclear(now(id), selectedOf(now(id)))) faults.push(`${width} ${id}: ${f}`);
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS NARROWED ${engine()} faults ${JSON.stringify(faults)}`);
    await expect(faults).toEqual([]);
  },
};

const chevronsStory = (id: "eleven" | "plain"): Story => ({
  render: () => <Strips only={[id]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    try {
      await ready();
      for (const dir of ["ltr", "rtl"] as const) {
        await at(real, 320, 100, dir);
        const strip = now(id);
        const box = scrollerOf(strip);
        /* Where each tab sits in the strip's content, whatever's scrolled. */
        const places = () => tabsOf(strip).map((el) => r2(el.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft));
        const cues = () => [shown(cueOf(strip, "left")), shown(cueOf(strip, "right"))];
        const max = box.scrollWidth - box.clientWidth;
        box.scrollLeft = 0;
        await settle();
        const start = { places: places(), cues: cues() };
        box.scrollLeft = dir === "rtl" ? -max / 2 : max / 2;
        await settle();
        const middle = { places: places(), cues: cues() };
        /* Both showing: each over its own inner edge of the strip, top to bottom. */
        const inner = box.getBoundingClientRect();
        const [l, rr] = [cueOf(strip, "left").getBoundingClientRect(), cueOf(strip, "right").getBoundingClientRect()];
        got[`${dir} ${id} edges`] = [l.left - inner.left, rr.right - inner.right, l.top - inner.top, l.bottom - inner.bottom, rr.top - inner.top, rr.bottom - inner.bottom].map((n) => Math.round(n));
        box.scrollLeft = dir === "rtl" ? -max : max;
        await settle();
        const end = { places: places(), cues: cues() };
        got[`${dir} ${id}`] = {
          drift: Math.max(...[middle, end].flatMap((s) => s.places.map((p, i) => Math.abs(p - start.places[i])))),
          cues: [start.cues, middle.cues, end.cues],
        };

        /* A press on the chevron toward the start, from the end, with focus
           on the last tab (selected on the automatic strip, only focused on
           the manual one). */
        selectedOf(strip).focus();
        await settle();
        await real.commands.realPress(["End"]);
        await settle();
        const focused = document.activeElement;
        const selected = selectedOf(strip).dataset.tabId;
        const side = dir === "rtl" ? "right" : "left";
        const from = box.scrollLeft;
        await real.commands.realClick(`[data-strip="${id}"] [data-now] [data-strip-cue="${side}"]`);
        await settle();
        const zone = parseFloat(getComputedStyle(box).getPropertyValue("--rst-strip-cue"));
        got[`${dir} ${id} press`] = {
          cursor: getComputedStyle(cueOf(strip, side)).cursor,
          paged: r2(Math.abs(box.scrollLeft - from)),
          expected: r2(Math.min(box.clientWidth - 2 * zone, max)),
          focus: document.activeElement === focused,
          selected: selectedOf(strip).dataset.tabId === selected,
        };
        (document.activeElement as HTMLElement).blur();
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS CHEVRONS ${engine()} ${JSON.stringify(got)}`);
    for (const dir of ["ltr", "rtl"]) {
      const startCues = dir === "rtl" ? [true, false] : [false, true];
      await expect(got[`${dir} ${id}`]).toEqual({ drift: 0, cues: [startCues, [true, true], [...startCues].reverse()] });
      await expect(got[`${dir} ${id} edges`]).toEqual([0, 0, 0, 0, 0, 0]);
      const press = got[`${dir} ${id} press`] as { cursor: string; paged: number; expected: number; focus: boolean; selected: boolean };
      await expect(Math.abs(press.paged - press.expected)).toBeLessThan(1);
      await expect([press.cursor, press.focus, press.selected]).toEqual(["pointer", true, true]);
    }
  },
});
export const TheChevronsMoveNothing: Story = chevronsStory("eleven");
export const ThePlainStripsChevronsMoveNothing: Story = chevronsStory("plain");

export const ReducedMotionJumps: Story = {
  tags: ["reduced-motion"],
  render: () => <Strips only={["eleven"]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let got: Record<string, number> = {};
    try {
      await ready();
      await at(real, 320, 100);
      const strip = now("eleven");
      const box = scrollerOf(strip);
      selectedOf(strip).focus();
      const from = box.scrollLeft;
      await real.commands.realPress(["End"]);
      await frame();
      const soon = box.scrollLeft;
      await settle();
      got = { from, soon: r2(soon), end: r2(box.scrollLeft), max: box.scrollWidth - box.clientWidth };
    } finally {
      await restore(real);
    }
    console.info(`TABS MOTION ${engine()} ${reduced ? "reduced" : "full"} ${JSON.stringify(got)}`);
    await expect(Math.abs(got.end - got.max)).toBeLessThan(1);
    // Reduced, it's there a frame after the key; otherwise it's still on its way.
    if (reduced) await expect(Math.abs(got.soon - got.end)).toBeLessThan(1);
    else await expect(got.soon).toBeLessThan(got.end - 1);
  },
};

export const InForcedColorsTheChevronsAreCanvasText: Story = {
  render: () => (
    <>
      <Strips only={["eleven", "plain"]} />
      <span data-probe="" style={{ color: "CanvasText" }} />
    </>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real || engine() !== "chromium") return;
    let got: Record<string, string> = {};
    try {
      await ready();
      await at(real, 320, 100);
      const ink = (id: string) => getComputedStyle(q(cueOf(now(id), "right"), "svg")).color;
      const resting = (id: string) => getComputedStyle(tabsOf(now(id))[1]).color;
      got = { eleven: ink("eleven"), elevenTab: resting("eleven"), plain: ink("plain"), plainTab: resting("plain") };
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      try {
        await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
        got = { ...got, forcedEleven: ink("eleven"), forcedPlain: ink("plain"), canvasText: getComputedStyle(q(document, "[data-probe]")).color };
      } finally {
        await real.commands.realEmulateMedia({ forcedColors: null });
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS FORCED ${JSON.stringify(got)}`);
    // A resting tab's ink, then the system's text color.
    await expect([got.eleven, got.plain]).toEqual([got.elevenTab, got.plainTab]);
    await expect([got.forcedEleven, got.forcedPlain]).toEqual([got.canvasText, got.canvasText]);
  },
};

export const APlainStripThatScrollsDrawsInside: Story = {
  render: () => <Strips only={["plain"]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    try {
      await ready();
      for (const width of [320, 1280]) {
        await at(real, width, 100);
        const strip = now("plain");
        document.body.focus();
        selectedOf(strip).focus();
        await real.commands.realPress(["ArrowRight"]);
        await real.commands.realPress(["ArrowLeft"]);
        await settle();
        const focused = document.activeElement as HTMLElement;
        got[width] = {
          mark: markOf(strip),
          ring: getComputedStyle(focused).boxShadow.includes("inset") ? "inside" : "outside",
          underline: getComputedStyle(selectedOf(strip), "::after").bottom,
          /* What decides whether a ring drawn outside the tab is cut. */
          clips: getComputedStyle(scrollerOf(strip)).overflowX !== "visible",
        };
        focused.blur();
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS PLAIN ${engine()} ${JSON.stringify(got)}`);
    await expect(got[320]).toEqual({ mark: "scroll", ring: "inside", underline: "0px", clips: true });
    await expect(got[1280]).toEqual({ mark: "fit", ring: "outside", underline: "-1px", clips: false });
  },
};

/* The strips as a server sends them, put in the page without hydrating. */
function BeforeScript() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current!.innerHTML = renderToStaticMarkup(
      <div style={{ padding: "8px 16px" }}>
        {IDS.map((id) => (
          <section key={id} data-strip={id} style={{ marginBottom: 12 }}>
            <div data-now="">
              <OneStrip id={id} />
            </div>
          </section>
        ))}
      </div>,
    );
  }, []);
  return <div ref={ref} />;
}

export const BeforeScriptNothingIsPushed: Story = {
  render: () => <BeforeScript />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    let got: Record<string, unknown> = {};
    try {
      await waitFor(() => expect(document.querySelectorAll("[data-strip]")).toHaveLength(IDS.length));
      await real.page.viewport(320, 900);
      await waitFor(() => expect(window.innerWidth).toBe(320));
      await document.fonts.ready;
      await frame();
      const liquid = ["counts", "eleven", "filled", "pillFull", "lg", "nav", "navFilled"];
      got = {
        pushed: pageScroll(),
        marked: document.querySelectorAll("[data-roster-strip]").length,
        scrollers: IDS.map((id) => getComputedStyle(scrollerOf(now(id))).overflowX),
        painted: liquid.map((id) => getComputedStyle(selectedOf(now(id))).backgroundColor !== "rgba(0, 0, 0, 0)"),
      };
    } finally {
      await restore(real);
    }
    console.info(`TABS BEFORE SCRIPT ${engine()} ${JSON.stringify(got)}`);
    await expect(got).toEqual({ pushed: 0, marked: 0, scrollers: IDS.map(() => "auto"), painted: [true, true, true, true, true, true, true] });
  },
};

/* Holders: a grid column and a flex child, each with the automatic minimum
   and without it, and a strip that's itself an item in a flex row beside a
   button. */
const HOLDERS = {
  grid: { display: "grid", gridTemplateColumns: "1fr" },
  gridZero: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)" },
  flex: { display: "flex" },
  flexZero: { display: "flex" },
} as const;
function Holders() {
  return (
    <div style={{ padding: "8px 16px" }}>
      {(Object.keys(HOLDERS) as (keyof typeof HOLDERS)[]).map((name) => (
        <div key={name} data-holder={name} style={{ ...HOLDERS[name], marginBottom: 12 }}>
          <div style={name.startsWith("flex") ? { flex: 1, minWidth: name === "flexZero" ? 0 : undefined } : undefined}>
            <OneStrip id="eleven" />
          </div>
        </div>
      ))}
      <div data-holder="row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <OneStrip id="filled" />
        <button type="button">Share</button>
      </div>
    </div>
  );
}

export const InAGridOrAFlexRowItLearnsWithAMinimumOfZero: Story = {
  render: () => <Holders />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    try {
      await ready();
      await at(real, 320, 100);
      for (const name of [...Object.keys(HOLDERS), "row"]) {
        const holder = q(document, `[data-holder="${name}"]`);
        /* How far the holder's own content runs past it. */
        got[name] = [markOf(q(holder, "[data-roster-strip]")), r2(Math.max(0, holder.scrollWidth - holder.clientWidth))];
      }
    } finally {
      await restore(real);
    }
    console.info(`TABS HOLDERS ${engine()} ${JSON.stringify(got)}`);
    // With a minimum of zero, or as a flex item itself, the strip scrolls and nothing runs past.
    await expect([got.gridZero, got.flexZero, got.row]).toEqual([["scroll", 0], ["scroll", 0], ["scroll", 0]]);
    // The README's limit: an automatic minimum widens the holder to the tabs' longest words, so the strip fits in it.
    for (const name of ["grid", "flex"]) {
      const [mark, past] = got[name] as [string, number];
      await expect(mark).toBe("fit");
      await expect(past).toBeGreaterThan(0);
    }
  },
};
