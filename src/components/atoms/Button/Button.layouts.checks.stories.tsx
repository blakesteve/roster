import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Button } from "./Button";

/**
 * A Button is the same size in a flex column, a grid and a flex row in
 * Chromium and WebKit, measured as rendered (tagged `real-input` for the
 * project that runs both).
 *
 * - **A flex column:** a label in a column three quarters of its one-line
 *   width takes two lines and the button grows to hold them, in every size
 *   and the five classic looks, stretched, at the start and centered, and with
 *   a minimum height of the app's own. The twin is the same Button with
 *   5.24.0's fixed height, as an inline style: in WebKit it keeps its one-line
 *   height, since WebKit takes a fixed height as the most `min-height:
 *   fit-content` can ask for there.
 * - **A grid:** two columns that same width, stretched, centered, at the
 *   start and full height, with `w-full`: the button is its column's width.
 *   The twin is without it, and in WebKit it's its one-line width, over the
 *   next column. That's WebKit's, and pinned so a WebKit that fixes it is seen.
 * - **Tiles** in two and three columns at 320 and 375px, with long labels, the
 *   same four ways. The twin has 5.24.0's one-line floor.
 * - **What it keeps:** one line beside a wrapping heading; its height beside a
 *   taller neighbor, and with content shorter than a line; a height and a
 *   padding of the caller's own.
 *
 * Widths are read against the column's, never pinned, since they're the
 * platform's fonts.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Button/Layout checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
const chromium = () => navigator.userAgent.includes("Chrome");
const VARIANTS = ["solid", "soft", "outline", "ghost", "link"] as const;
const SIZES = ["xs", "sm", "compact", "default", "lg"] as const;
type Size = (typeof SIZES)[number];
const ONE_LINE: Record<Size, number> = { xs: 28, sm: 36, compact: 30, default: 40, lg: 44 };
const TWO_LINES: Record<Size, number> = { xs: 44, sm: 56, compact: 46, default: 60, lg: 64 };
/* `text-xs`'s 15.9996px line is 15 in WebKit: two of them, 2px less. */
const twoLines = (size: Size) => TWO_LINES[size] - (chromium() || (size !== "xs" && size !== "compact") ? 0 : 2);
const r2 = (n: number) => Math.round(n * 100) / 100;
const near = (a: number, b: number) => Math.abs(a - b) <= 0.05;

const LABEL = "Wrapping wording";
const Icon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" style={{ display: "block" }}>
    <rect width="16" height="16" />
  </svg>
);

/* 5.24.0's fixed height. */
const as524 = (size: Size): CSSProperties => ({ height: ONE_LINE[size], minHeight: "fit-content" });

type Case = { id: string; variant: (typeof VARIANTS)[number]; size: Size; place: string; icon?: boolean; style?: CSSProperties };

/** Each case's label at its one-line width, to size its column by. */
function Sized({ cases, twin, wrap }: { cases: Case[]; twin: boolean; wrap: (c: Case, button: ReactNode) => ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start", padding: 16 }}>
      <style>{STILL}</style>
      {cases.map((c) => {
        const button = (which: "measure" | "now") => (
          <Button
            variant={c.variant}
            size={c.size}
            startIcon={c.icon ? <Icon /> : undefined}
            style={which === "now" ? { ...c.style, ...(twin ? as524(c.size) : null) } : undefined}
            data-which={which}
          >
            {LABEL}
          </Button>
        );
        return (
          <div key={c.id} data-case={c.id} style={{ width: "max-content" }}>
            <div style={{ width: "max-content" }}>{button("measure")}</div>
            <div data-holder="">{wrap(c, button("now"))}</div>
          </div>
        );
      })}
    </div>
  );
}

type Box = { over: number; height: number; fills: boolean };

/** Sizes every holder to three quarters of its label's one-line width, plus what else it holds. */
async function read(canvas: Element, columns: number) {
  await document.fonts.ready;
  const holders = [...canvas.querySelectorAll<HTMLElement>("[data-case]")];
  for (const h of holders) {
    const col = Math.floor(h.querySelector<HTMLElement>('[data-which="measure"]')!.getBoundingClientRect().width * 0.75);
    h.querySelector<HTMLElement>("[data-holder]")!.style.width = `${col * columns + 8 * (columns - 1)}px`;
    h.dataset.col = String(col);
  }
  await new Promise((r) => requestAnimationFrame(r));
  const out: Record<string, Box> = {};
  for (const h of holders) {
    const button = h.querySelector<HTMLElement>('[data-holder] [data-which="now"]')!;
    const b = button.getBoundingClientRect();
    out[h.dataset.case!] = { over: r2(Math.max(0, b.width - Number(h.dataset.col))), height: r2(b.height), fills: near(b.width, Number(h.dataset.col)) };
  }
  return out;
}

/* ── A flex column ────────────────────────────────────────────────────── */

const COLUMN_PLACES: Record<string, CSSProperties> = {
  stretched: {},
  start: { alignItems: "flex-start" },
  centered: { alignItems: "center" },
};
const COLUMN_CASES: Case[] = [
  ...VARIANTS.flatMap((variant) => SIZES.map((size) => ({ id: `${variant}-${size}`, variant, size, place: "stretched" }))),
  { id: "start", variant: "solid", size: "default", place: "start" },
  { id: "centered", variant: "solid", size: "default", place: "centered" },
  { id: "icon", variant: "solid", size: "default", place: "stretched", icon: true },
  /* A minimum of the app's own, in place of `min-h-fit`. */
  { id: "min-44", variant: "solid", size: "default", place: "stretched", style: { minHeight: 44 } },
];
const column = (c: Case, button: ReactNode) => (
  <div style={{ display: "flex", flexDirection: "column", width: "100%", ...COLUMN_PLACES[c.place] }}>{button}</div>
);

export const AWrappedLabelGrowsInAFlexColumn: Story = {
  render: () => <Sized cases={COLUMN_CASES} twin={false} wrap={column} />,
  play: async ({ canvasElement }) => {
    const now = await read(canvasElement, 1);
    console.info(`BUTTON COLUMN ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(now)}`);
    await expect(Object.keys(now)).toHaveLength(29);
    const off = COLUMN_CASES.filter((c) => now[c.id].over > 0 || now[c.id].height !== twoLines(c.size)).map((c) => `${c.id}: ${JSON.stringify(now[c.id])}, ${twoLines(c.size)} expected`);
    await expect(off).toEqual([]);
  },
};

/* The twin: 5.24.0's height doesn't grow in a WebKit column. */
export const AWrappedLabelGrowsInAFlexColumnTwin: Story = {
  render: () => <Sized cases={COLUMN_CASES.filter((c) => !c.style)} twin wrap={column} />,
  play: async ({ canvasElement }) => {
    const then = await read(canvasElement, 1);
    console.info(`BUTTON COLUMN TWIN ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(then)}`);
    const stuck = COLUMN_CASES.filter((c) => !c.style && then[c.id].height === ONE_LINE[c.size]).map((c) => c.id);
    await expect(stuck).toEqual(chromium() ? [] : COLUMN_CASES.filter((c) => !c.style).map((c) => c.id));
  },
};

/* ── A grid ───────────────────────────────────────────────────────────── */

const GRID_PLACES: Record<string, CSSProperties> = {
  stretched: {},
  centered: { alignItems: "center" },
  start: { alignItems: "start" },
  tall: {},
};
const gridCases = (full: boolean): Case[] => {
  const width = full ? { width: "100%" } : {};
  return [
    ...SIZES.flatMap((size) => Object.keys(GRID_PLACES).map((place) => ({ id: `${size}-${place}`, variant: "solid" as const, size, place, style: place === "tall" ? { ...width, height: "100%" } : width }))),
    ...VARIANTS.filter((v) => v !== "solid").map((variant) => ({ id: variant, variant, size: "default" as const, place: "stretched", style: width })),
    { id: "icon", variant: "solid", size: "default", place: "stretched", icon: true, style: width },
  ];
};
const grid = (c: Case, button: ReactNode) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, ...GRID_PLACES[c.place] }}>
    {button}
    <span style={{ height: c.place === "tall" ? 90 : 10 }} />
  </div>
);

export const WFullKeepsAButtonToItsGridColumn: Story = {
  render: () => <Sized cases={gridCases(true)} twin={false} wrap={grid} />,
  play: async ({ canvasElement }) => {
    const now = await read(canvasElement, 2);
    console.info(`BUTTON GRID ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(now)}`);
    await expect(Object.keys(now)).toHaveLength(25);
    const off = gridCases(true).filter((c) => !now[c.id].fills || now[c.id].height !== (c.place === "tall" ? 90 : twoLines(c.size))).map((c) => `${c.id}: ${JSON.stringify(now[c.id])}`);
    await expect(off).toEqual([]);
  },
};

/* The twin, without it: right in Chromium, and in WebKit the one-line width. */
export const WFullKeepsAButtonToItsGridColumnTwin: Story = {
  render: () => <Sized cases={gridCases(false)} twin={false} wrap={grid} />,
  play: async ({ canvasElement }) => {
    const then = await read(canvasElement, 2);
    console.info(`BUTTON GRID TWIN ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(then)}`);
    await expect(Object.keys(then).filter((id) => then[id].over > 5)).toEqual(chromium() ? [] : Object.keys(then));
  },
};

/* ── Tiles ────────────────────────────────────────────────────────────── */

/* Short words, so no font's longest word is wider than a column, and a first
   label longer than any of them. */
const TILE_LABELS = ["Buy it now at its full price, it is worth it", "Wait for a sale", "Not sure of it yet", "Skip"];
const TILE_GRIDS = [320, 375].flatMap((phone) =>
  [2, 3].flatMap((columns) => Object.keys(GRID_PLACES).map((place) => ({ id: `${phone} by ${columns}, ${place}`, width: phone - 32, columns, place }))),
);

function Tiles({ twin }: { twin: boolean }) {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start", padding: 16 }}>
      <style>{STILL}</style>
      {TILE_GRIDS.map((g) => (
        <div key={g.id} data-tiles={g.id} style={{ display: "grid", gridTemplateColumns: `repeat(${g.columns}, minmax(0, 1fr))`, gap: 8, width: g.width, ...GRID_PLACES[g.place] }}>
          {TILE_LABELS.map((label) => (
            <Button key={label} layout="tile" variant="tint-subtle" startIcon={<Icon />} style={{ ...(g.place === "tall" ? { height: "100%" } : null), ...(twin ? { minWidth: "fit-content" } : null) }}>
              {label}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* The grids with a tile wider than its column. */
async function overflowing(canvas: Element) {
  await document.fonts.ready;
  const out: string[] = [];
  for (const g of canvas.querySelectorAll<HTMLElement>("[data-tiles]")) {
    const col = parseFloat(getComputedStyle(g).gridTemplateColumns);
    const wide = [...g.querySelectorAll("button")].map((b) => b.getBoundingClientRect().width).filter((w) => !near(w, col));
    if (wide.length) out.push(g.dataset.tiles!);
  }
  return out;
}

export const TilesKeepToTheirCells: Story = {
  render: () => <Tiles twin={false} />,
  play: async ({ canvasElement }) => {
    const off = await overflowing(canvasElement);
    console.info(`BUTTON TILES ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(off)}`);
    await expect(canvasElement.querySelectorAll("[data-tiles] button")).toHaveLength(64);
    await expect(off).toEqual([]);
  },
};

/* The twin, with 5.24.0's floor: in WebKit a tile is right where it fills its
   row, and over its neighbor where the grid or a height of its own stops
   that. */
export const TilesKeepToTheirCellsTwin: Story = {
  render: () => <Tiles twin />,
  play: async ({ canvasElement }) => {
    const off = await overflowing(canvasElement);
    console.info(`BUTTON TILES TWIN ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(off)}`);
    await expect(off).toEqual(chromium() ? [] : TILE_GRIDS.filter((g) => g.place !== "stretched").map((g) => g.id));
  },
};

/* ── What it keeps ────────────────────────────────────────────────────── */

const H = "A card heading long enough to wrap onto a second line";
const Heading = () => <h3 style={{ flex: "1 1 auto", margin: 0, fontSize: 16 }}>{H}</h3>;
const TALL = <span style={{ height: 120, width: 10 }} />;

export const WhatItKeeps: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, justifyItems: "start", padding: 16 }}>
      <style>{STILL}</style>
      {/* The floor, and the twin without it. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: 280 }}>
        <Heading />
        <Button data-keep="floor">Save changes</Button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: 280 }}>
        <Heading />
        <Button data-keep="no floor" style={{ minWidth: "auto" }}>Save changes</Button>
      </div>
      {/* Beside a taller neighbor, in a row and in a grid. The twin is `auto`. */}
      <div style={{ display: "flex", gap: 8 }}>
        <Button data-keep="row">Save</Button>
        <Button data-keep="row, auto" style={{ height: "auto" }}>Save</Button>
        {TALL}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, width: 343 }}>
        <Button data-keep="grid">Save</Button>
        <Button data-keep="grid, auto" style={{ height: "auto" }}>Save</Button>
        {TALL}
      </div>
      {/* Content shorter than a line. */}
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <Button key={size} data-keep={`short ${size}`} size={size} aria-label="Short">
          <span style={{ width: 8, height: 8 }} />
        </Button>
      ))}
      {/* Heights of the caller's own. */}
      <Button data-keep="own 64" style={{ height: 64 }}>Save</Button>
      <Button data-keep="own 24" style={{ height: 24, paddingBlock: 0 }}>Save</Button>
      <Button data-keep="own auto" style={{ height: "auto", paddingBlock: 2 }}>Save</Button>
      <Button data-keep="own py-1" style={{ paddingBlock: 4 }}>Save</Button>
      <Button data-keep="own py-3" style={{ paddingBlock: 12 }}>Save</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const q = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-keep="${CSS.escape(id)}"]`)!;
    const h = (id: string) => r2(q(id).getBoundingClientRect().height);
    const all = Object.fromEntries([...canvasElement.querySelectorAll<HTMLElement>("[data-keep]")].map((el) => [el.dataset.keep!, h(el.dataset.keep!)]));
    console.info(`BUTTON KEEPS ${chromium() ? "chromium" : "webkit"} ${JSON.stringify(all)}`);
    await expect([h("floor"), h("no floor")]).toEqual([40, 60]);
    await expect([h("row"), h("row, auto"), h("grid"), h("grid, auto")]).toEqual([40, 120, 40, 120]);
    await expect((["xs", "sm", "default", "lg"] as const).map((s) => h(`short ${s}`))).toEqual([28, 36, 40, 44]);
    await expect([h("own 64"), h("own 24"), h("own auto"), h("own py-1"), h("own py-3")]).toEqual([64, 24, 26, 30, 46]);
  },
};
