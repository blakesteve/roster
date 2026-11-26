import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Breadcrumbs, type BreadcrumbsProps } from "./Breadcrumbs";
import { Breadcrumbs524 } from "../../../test/Breadcrumbs524";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";

/**
 * Breadcrumbs at 320px and 200% text: the trail wraps by item onto more lines
 * and pushes nothing past the page, and what fits at 100% is the same as
 * 5.24's. Measured as rendered in Chromium and WebKit, each trail beside 5.24's
 * (`src/test/Breadcrumbs524.tsx`).
 *
 * - **At 100% nothing moves:** ten trails at 320 to 1,280px, wherever 5.24's
 *   fits on one line without squeezing a label: every separator, the home
 *   icon, every line of words and every link, to 0.05px.
 * - **Nothing is pushed:** every trail at 320 and 375px, 100 and 200%, and
 *   right to left. The twin: 5.24's runs past at 320px and 200%.
 * - **A separator stays with the item it leads,** on the line of that item's
 *   first words, the home icon's included. The twin: 5.24's with only
 *   `flex-wrap` added leaves the home icon's at the end of a line.
 * - **Lines are 4px apart** (a 24px pitch for 20px links at 100%), 8px between
 *   items, and a word too long for a line breaks inside its crumb.
 * - **Right to left,** a separator is 8px from each of its neighbors. The
 *   twin: 5.24's put it 0px from its own label and 16px from the one before.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page. Story
 * styling is inline, so none of it ships in roster.css.
 */
const meta = {
  title: "Molecules/Breadcrumbs/Reflow checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const CHEVRON = <FontAwesomeIcon icon={faChevronRight} style={{ width: "0.625rem", height: "0.625rem" }} />;
const MARK = <span style={{ display: "inline-block", width: "1.5rem", height: "1.5rem", background: "#a8a29e", borderRadius: 4 }} />;
const LONG_WORD = "Pneumonoultramicroscopicsilicovolcanoconiosis";

const TRAILS: Record<string, Omit<BreadcrumbsProps, "items"> & { items: BreadcrumbsProps["items"] }> = {
  three: { items: [{ label: "Leagues", href: "#l" }, { label: "Tidewater Premier", href: "#t" }, { label: "Settings" }] },
  home: { showHomeIcon: true, items: [{ label: "Leagues", href: "#l" }, { label: "Tidewater Premier", href: "#t" }, { label: "Settings" }] },
  chevron: { showHomeIcon: true, separator: CHEVRON, items: [{ label: "Leagues", href: "#l" }, { label: "Tidewater Premier", href: "#t" }, { label: "Settings" }] },
  mark: { separator: MARK, items: [{ label: "Leagues", href: "#l" }, { label: "Tidewater", href: "#t" }, { label: "Settings" }] },
  restyled: {
    currentClassName: "rst:text-primary-600",
    items: [{ label: "Leagues", href: "#l", className: "rst:font-semibold" }, { label: "Tidewater Premier", href: "#t" }, { label: "Week 12" }],
  },
  primary: { variant: "primary", showHomeIcon: true, items: [{ label: "Leagues", href: "#l" }, { label: "Settings" }] },
  unlinked: { items: [{ label: "Leagues", href: "#l" }, { label: "Archive" }, { label: "Season 2025" }] },
  node: {
    items: [
      { label: <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "#16a34a" }} />Live</span>, href: "#live" },
      { label: "Lanternfish" },
    ],
  },
  four: {
    showHomeIcon: true,
    items: [
      { label: "Tidewater Premier Fantasy League", href: "#t" },
      { label: "Week 12 Matchups", href: "#w" },
      { label: "Harbor Watch at Ridge Runners" },
    ],
  },
  word: { items: [{ label: "Leagues", href: "#l" }, { label: LONG_WORD, href: "#w" }, { label: "Settings" }] },
};

/* Each trail as now and as 5.24 drew it, in a page's padded column. `naive`
   is 5.24's with only `flex-wrap` added, for the separators' twin. */
const NAIVE = "[data-naive] ol{flex-wrap:wrap;row-gap:0.25rem}";
const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
function Pairs() {
  return (
    <div>
      <style>{STILL + NAIVE}</style>
      {Object.entries(TRAILS).map(([id, props]) => (
        <div key={id} data-pair={id}>
          <div data-now="" style={{ padding: "8px 16px" }}>
            <Breadcrumbs {...props} />
          </div>
          <div data-was="" style={{ padding: "8px 16px" }}>
            <Breadcrumbs524 {...props} />
          </div>
          <div data-naive="" style={{ padding: "8px 16px" }}>
            <Breadcrumbs524 {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const q = (root: ParentNode, s: string) => root.querySelector<HTMLElement>(s)!;
type Box = { l: number; r: number; t: number; b: number };
const boxOf = (el: Element | Range): Box => {
  const r = el.getBoundingClientRect();
  return { l: r.left, r: r.right, t: r.top, b: r.bottom };
};
const rel = (b: Box, o: Box) => [b.l - o.l, b.r - o.l, b.t - o.t, b.b - o.t].map(r2);

/* Every line of each run of words, in order. */
const lines = (root: Element) =>
  [...walk(root)].map((n) => {
    const range = document.createRange();
    range.selectNodeContents(n);
    return [...range.getClientRects()].filter((r) => r.width).map((r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom }));
  });
function* walk(root: Element) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) if (w.currentNode.textContent?.trim()) yield w.currentNode;
}
const separators = (nav: Element) => [...nav.querySelectorAll('[aria-hidden="true"]')].filter((s) => s.tagName === "SPAN" && !s.closest("a"));
/* What a separator shows: its glyph, mark or icon. */
const glyph = (sep: Element) => {
  const inner = sep.firstElementChild!;
  if (inner.children.length || !inner.textContent?.trim()) return boxOf(inner);
  const range = document.createRange();
  range.selectNodeContents(inner);
  return boxOf(range);
};
/* The words that follow each separator: the next crumb's first line. */
const firstLineAfter = (nav: Element, sep: Element): Box | null => {
  const crumbs = [...nav.querySelectorAll("li > a, li > span:not([aria-hidden])")];
  const next = crumbs.find((c) => sep.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
  if (!next) return null;
  const first = lines(next).flat()[0];
  return first ?? boxOf(next);
};

/* Everything a trail draws, against its nav's corner: the parity reading. */
const parts = (nav: HTMLElement) => {
  const o = boxOf(nav);
  return {
    height: r2(o.b - o.t),
    separators: separators(nav).map((s) => rel(glyph(s), o)),
    home: [...nav.querySelectorAll("a svg")].map((s) => rel(boxOf(s), o)),
    words: lines(nav).flat().map((l) => rel(l, o)),
    links: [...nav.querySelectorAll("a")].map((a) => rel(boxOf(a), o)),
  };
};
const apart = (a: unknown, b: unknown): number => {
  const [x, y] = [JSON.stringify(a).match(/-?[\d.]+/g) ?? [], JSON.stringify(b).match(/-?[\d.]+/g) ?? []];
  return x.length !== y.length ? Infinity : Math.max(0, ...x.map((n, i) => Math.abs(Number(n) - Number(y[i]))));
};
/* Past its column: how far anything the trail draws runs beyond the padded
   box it sits in, on either side. */
const past = (half: HTMLElement) => {
  const nav = q(half, "nav");
  const col = boxOf(nav);
  const drawn = [...nav.querySelectorAll("*")].filter((el) => el.getClientRects().length);
  const all = drawn.map(boxOf).concat(lines(nav).flat());
  return r2(Math.max(0, ...all.map((b) => Math.max(b.r - col.r, col.l - b.l))));
};
/* 5.24's trail fits when nothing runs past and no crumb's words wrap. */
const fits524 = (half: HTMLElement) => past(half) <= 0.05 && lines(q(half, "nav")).every((l) => l.length === 1);

async function at(real: RealInput, width: number, percent: number, dir: "ltr" | "rtl" = "ltr") {
  await real.page.viewport(width, 900);
  await waitFor(() => expect(window.innerWidth).toBe(width));
  document.documentElement.style.fontSize = percent === 100 ? "" : `${percent}%`;
  document.documentElement.dir = dir;
  await frame();
  await frame();
}
async function restore(real: RealInput) {
  document.documentElement.style.fontSize = "";
  document.documentElement.dir = "ltr";
  await real.page.viewport(1280, 720);
}
const half = (id: string, which: "now" | "was" | "naive") => q(document, `[data-pair="${id}"] [data-${which}]`);
const engine = () => (navigator.userAgent.includes("Chrome") ? "chromium" : "webkit");

export const WhatFitsIsUnchangedAt100Percent: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const moved: string[] = [];
    const read: string[] = [];
    try {
      for (const width of [320, 375, 414, 640, 768, 1280]) {
        await at(real, width, 100);
        for (const id of Object.keys(TRAILS)) {
          if (!fits524(half(id, "was"))) continue;
          const now = parts(q(half(id, "now"), "nav"));
          const was = parts(q(half(id, "was"), "nav"));
          read.push(`${width} ${id}`);
          if (apart(now, was) > 0.05) moved.push(`${width} ${id}: ${JSON.stringify(now)} was ${JSON.stringify(was)}`);
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`BREADCRUMBS UNCHANGED ${engine()} ${read.length} read, ${moved.length} moved; not fitting in 5.24: ${6 * 10 - read.length}`);
    // Every trail fits from 640px; `four` and `word` don't at 320.
    await expect(read.filter((r) => r.startsWith("1280 ")).length).toBe(10);
    await expect(read).not.toContain("320 word");
    await expect(moved).toEqual([]);
  },
};

export const NothingIsPushed: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const now: string[] = [];
    const was: string[] = [];
    let read = 0;
    try {
      const sizes: [number, number, "ltr" | "rtl"][] = [
        [320, 100, "ltr"], [320, 200, "ltr"], [375, 100, "ltr"], [375, 200, "ltr"], [320, 200, "rtl"],
      ];
      for (const [width, percent, dir] of sizes) {
        await at(real, width, percent, dir);
        for (const id of Object.keys(TRAILS)) {
          read += 1;
          const p = past(half(id, "now"));
          if (p > 0.05) now.push(`${width} ${percent}% ${dir} ${id}: ${p}px`);
          if (width === 320 && percent === 200 && dir === "ltr") was.push(`${id}: ${past(half(id, "was"))}`);
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`BREADCRUMBS PAST ${engine()} ${read} read; 5.24 at 320 and 200%: ${was.join(", ")}`);
    await expect(read).toBe(5 * 10);
    await expect(now).toEqual([]);
    // The twin: at 320px and 200% only the shortest trails fit in 5.24.
    await expect(was.filter((w) => !w.endsWith(": 0")).length).toBeGreaterThanOrEqual(6);
  },
};

/* A separator's glyph sits on the line of the words it leads: its middle
   within that line, and before it in the reading direction. */
const astray = (nav: HTMLElement, dir: "ltr" | "rtl") =>
  separators(nav).flatMap((sep, i) => {
    const g = glyph(sep);
    const line = firstLineAfter(nav, sep);
    if (!line) return [`separator ${i} leads nothing`];
    const middle = (g.t + g.b) / 2;
    const onLine = middle >= line.t - 0.5 && middle <= line.b + 0.5;
    const before = dir === "ltr" ? g.r <= line.l + 0.5 : g.l >= line.r - 0.5;
    return onLine && before ? [] : [`separator ${i}: ${JSON.stringify([g, line].map((b) => [b.l, b.r, b.t, b.b].map(r2)))}`];
  });

export const EachSeparatorStaysWithItsItem: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const now: string[] = [];
    const naive: string[] = [];
    let wrapped = 0;
    try {
      for (const [width, percent, dir] of [[320, 100, "ltr"], [320, 200, "ltr"], [375, 200, "ltr"], [320, 200, "rtl"]] as const) {
        await at(real, width, percent, dir);
        for (const id of Object.keys(TRAILS)) {
          const nav = q(half(id, "now"), "nav");
          const tops = new Set([...nav.querySelectorAll("li")].map((li) => Math.round(li.getBoundingClientRect().top)));
          if (tops.size > 1) wrapped += 1;
          now.push(...astray(nav, dir).map((a) => `${width} ${percent}% ${dir} ${id} ${a}`));
          naive.push(...astray(q(half(id, "naive"), "nav"), dir).map((a) => `${width} ${percent}% ${dir} ${id} ${a}`));
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`BREADCRUMBS SEPARATORS ${engine()} ${wrapped} trails wrapped; 5.24 with flex-wrap astray: ${naive.length}`);
    await expect(wrapped).toBeGreaterThanOrEqual(10);
    await expect(now).toEqual([]);
    await expect(naive.some((n) => / (home|chevron|four) separator 0:/.test(n))).toBe(true);
  },
};

export const LinesAndWordsWrapInside: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    try {
      for (const percent of [100, 200]) {
        await at(real, 320, percent);
        const nav = q(half("four", "now"), "nav");
        /* The trail's lines: its crumbs grouped by the line they're on. One
           whose words wrap makes its line taller. */
        const lis = [...nav.querySelectorAll("li")];
        const rows: { t: number; b: number }[] = [];
        for (const li of lis) {
          const b = li.getBoundingClientRect();
          const row = rows.find((r) => b.top < r.b && r.t < b.bottom);
          if (row) Object.assign(row, { t: Math.min(row.t, b.top), b: Math.max(row.b, b.bottom) });
          else rows.push({ t: b.top, b: b.bottom });
        }
        const worded = lis.filter((li) => li.textContent?.trim());
        const tops = [...new Set(worded.map((li) => r2(li.getBoundingClientRect().top)))].sort((a, b) => a - b);
        const gaps = lis.slice(1).flatMap((li, i) => {
          const a = lis[i].getBoundingClientRect();
          const b = li.getBoundingClientRect();
          return a.top < b.bottom && b.top < a.bottom ? [r2(b.left - a.right)] : [];
        });
        const word = q(half("word", "now"), "nav");
        const wordLines = lines([...word.querySelectorAll("a")].find((a) => a.textContent === LONG_WORD)!).flat().length;
        got[percent] = {
          pitch: tops.slice(1).map((t, i) => r2(t - tops[i])),
          between: rows.slice(1).map((r, i) => r2(r.t - rows[i].b)),
          gaps,
          wordLines,
        };
      }
    } finally {
      await restore(real);
    }
    console.info(`BREADCRUMBS LINES ${engine()} ${JSON.stringify(got)}`);
    type Got = { pitch: number[]; between: number[]; gaps: number[]; wordLines: number };
    const [at100, at200] = [got[100] as Got, got[200] as Got];
    // At 100% a one-line crumb is 20px, and lines are 24px apart.
    await expect(at100.pitch).toEqual([24, 24]);
    // Lines are 0.25rem apart, a crumb whose words wrap included; crumbs 0.5rem.
    await expect(at100.between).toEqual([4, 4]);
    await expect(at200.between.length).toBeGreaterThan(1);
    for (const b of at200.between) await expect(b).toBe(8);
    await expect(at100.gaps.length).toBeGreaterThan(0);
    for (const g of at100.gaps) await expect(g).toBe(8);
    for (const g of at200.gaps) await expect(g).toBe(16);
    // The long word breaks inside its crumb.
    await expect(at100.wordLines).toBeGreaterThan(1);
    await expect(at200.wordLines).toBeGreaterThan(1);
  },
};

export const RightToLeftGapsAreEven: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, number[][]> = {};
    try {
      await at(real, 1280, 100, "rtl");
      for (const which of ["now", "was"] as const) {
        const nav = q(half("three", which), "nav");
        /* Right to left: the words before the separator are on its right, its
           own on its left. */
        got[which] = separators(nav).map((sep) => {
          const g = glyph(sep);
          const own = firstLineAfter(nav, sep)!;
          const li = sep.closest("li")!;
          const crumb = li.previousElementSibling!.querySelector(":scope > a, :scope > span:not([aria-hidden])")!;
          const prior = lines(crumb).flat()[0];
          /* To a tenth: WebKit places right-to-left words a hundredth off. */
          const r1 = (n: number) => Math.round(n * 10) / 10;
          return [r1(prior.l - g.r), r1(g.l - own.r)];
        });
      }
    } finally {
      await restore(real);
    }
    console.info(`BREADCRUMBS RTL ${engine()} ${JSON.stringify(got)}`);
    await expect(got.now).toEqual([[8, 8], [8, 8]]);
    await expect(got.was).toEqual([[16, 0], [16, 0]]);
  },
};
