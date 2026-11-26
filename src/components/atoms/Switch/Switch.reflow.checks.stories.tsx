import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Switch, type SwitchProps } from "./Switch";
import { Switch524 } from "../../../test/Switch524";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";

/**
 * Switch at 320px and 200% text: when its words' longest can't sit beside the
 * track, the track drops under them, at the start, and nothing runs past the
 * row. Wherever 5.24's fits, every box is the same. Measured as rendered in
 * Chromium and WebKit, each row beside 5.24's (`src/test/Switch524.tsx`), in a
 * padded card in a padded page.
 *
 * - **Where it fits nothing moves:** eleven rows at 320 to 1,280px, at 100%
 *   and at 200% wherever 5.24's fits: the label's box (what a click on it
 *   reaches), the description's, the track's and every line of words, to
 *   0.05px. `w-fit`, and a bare Switch in a row of the app's own, among them.
 * - **Nothing past the row,** at 320 and 375px, 100 and 200%, and right to
 *   left. The twin: 5.24's runs past at 320px and 200%.
 * - **The track drops under a long word,** at the start, 0.5rem below, and a
 *   word too long for the whole row breaks.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page. Story
 * styling is inline, so none of it ships in roster.css.
 */
const meta = {
  title: "Atoms/Switch/Reflow checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const off = () => {};
type Row = Omit<SwitchProps, "checked" | "onChange"> & { appRow?: boolean };
const ROWS: Record<string, Row> = {
  short: { label: "Email alerts", description: "When picks lock" },
  plain: { label: "Push notifications", description: "Get alerted when your matchup goes live." },
  labelOnly: { label: "Show scores" },
  descriptionOnly: { description: "Only you can see this" },
  long: { label: "Autosubmission", description: "Submit my picks automatically at kickoff" },
  word: { label: "Pneumonoultramicroscopicsilicovolcanoconiosis" },
  small: { label: "Compact rows", description: "Tighter tables", size: "sm" },
  large: { label: "Large text", description: "Bigger everything", size: "lg" },
  passive: { label: "Not clickable", description: "Only the track toggles", labelClickable: false, disabled: true },
  fit: { label: "Sound", description: "Play a chime", className: "rst:w-fit" },
  bare: { ariaLabel: "Dark mode", appRow: true },
};

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
/* A card in a page: 16px each side for the page, 24 for the card. */
function Pairs() {
  return (
    <div style={{ padding: "8px 16px" }}>
      <style>{STILL}</style>
      {Object.entries(ROWS).map(([id, { appRow, ...props }]) =>
        (["now", "was"] as const).map((which) => {
          const Row = which === "now" ? Switch : Switch524;
          const row = <Row checked={false} onChange={off} {...props} />;
          return (
            <div key={`${id}-${which}`} data-pair={id} data-which={which} style={{ padding: 24, border: "1px solid #e7e5e4", borderRadius: 12, marginBottom: 8 }}>
              {appRow ? (
                <div data-row="" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <span style={{ fontSize: "0.875rem" }}>Dark mode</span>
                  {row}
                </div>
              ) : (
                <div data-row="">{row}</div>
              )}
            </div>
          );
        }),
      )}
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
const lines = (root: Element) => {
  const out: Box[] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    if (!w.currentNode.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(w.currentNode);
    for (const r of range.getClientRects()) if (r.width) out.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
  }
  return out;
};
const card = (id: string, which: "now" | "was") => q(document, `[data-pair="${id}"][data-which="${which}"]`);
const track = (root: Element) => q(root, '[role="switch"]');

/* What a row draws, against its card's content corner. */
const parts = (c: HTMLElement) => {
  const o = boxOf(q(c, "[data-row]"));
  const label = c.querySelector("label");
  const description = c.querySelector('[id^="headlessui-description"]');
  return {
    label: label && rel(boxOf(label), o),
    description: description && rel(boxOf(description), o),
    track: rel(boxOf(track(c)), o),
    words: lines(c).map((l) => rel(l, o)),
  };
};
const apart = (a: unknown, b: unknown): number => {
  const [x, y] = [JSON.stringify(a).match(/-?[\d.]+/g) ?? [], JSON.stringify(b).match(/-?[\d.]+/g) ?? []];
  return x.length !== y.length ? Infinity : Math.max(0, ...x.map((n, i) => Math.abs(Number(n) - Number(y[i]))));
};
/* How far anything the row draws runs past the card's content box. What
   draws nothing (Headless UI's hidden input) has no box to read. */
const past = (c: HTMLElement) => {
  const row = boxOf(q(c, "[data-row]"));
  const drawn = [...q(c, "[data-row]").querySelectorAll("*")].filter((el) => el.getClientRects().length);
  const all = drawn.map(boxOf).concat(lines(c));
  return r2(Math.max(0, ...all.map((b) => Math.max(b.r - row.r, row.l - b.l))));
};

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
const engine = () => (navigator.userAgent.includes("Chrome") ? "chromium" : "webkit");

export const WhereItFitsNothingMoves: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const moved: string[] = [];
    const read: string[] = [];
    try {
      const sizes: [number, number][] = [320, 375, 414, 640, 768, 1280].map((w) => [w, 100]);
      sizes.push([320, 200], [375, 200], [640, 200], [1280, 200]);
      for (const [width, percent] of sizes) {
        await at(real, width, percent);
        for (const id of Object.keys(ROWS)) {
          if (past(card(id, "was")) > 0.05) continue;
          read.push(`${width} ${percent}% ${id}`);
          const now = parts(card(id, "now"));
          const was = parts(card(id, "was"));
          if (apart(now, was) > 0.05) moved.push(`${width} ${percent}% ${id}: ${JSON.stringify(now)} was ${JSON.stringify(was)}`);
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`SWITCH UNCHANGED ${engine()} ${read.length} read, ${moved.length} moved`);
    // At 100% every row but the one long word fits 5.24 at every width.
    await expect(read.filter((r) => r.includes(" 100% ") && !r.endsWith(" word")).length).toBe(6 * 10);
    await expect(read).toContain("1280 100% word");
    await expect(read).toContain("320 200% short");
    await expect(moved).toEqual([]);
  },
};

export const NothingRunsPastTheRow: Story = {
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
        for (const id of Object.keys(ROWS)) {
          read += 1;
          const p = past(card(id, "now"));
          if (p > 0.05) now.push(`${width} ${percent}% ${dir} ${id}: ${p}px`);
          if (width === 320 && percent === 200 && dir === "ltr") was.push(`${id}: ${past(card(id, "was"))}`);
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`SWITCH PAST ${engine()} ${read} read; 5.24 at 320 and 200%: ${was.join(", ")}`);
    await expect(read).toBe(5 * 11);
    await expect(now).toEqual([]);
    await expect(was.find((w) => w.startsWith("long:"))).not.toBe("long: 0");
    await expect(was.find((w) => w.startsWith("word:"))).not.toBe("word: 0");
  },
};

export const TheTrackDropsUnderALongWord: Story = {
  render: () => <Pairs />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const got: Record<string, unknown> = {};
    try {
      for (const dir of ["ltr", "rtl"] as const) {
        await at(real, 320, 200, dir);
        for (const id of ["long", "word", "short"]) {
          const c = card(id, "now");
          const row = boxOf(q(c, "[data-row]"));
          const t = boxOf(track(c));
          const words = lines(c);
          const text = { t: Math.min(...words.map((w) => w.t)), b: Math.max(...words.map((w) => w.b)) };
          const label = q(c, "label");
          got[`${dir} ${id}`] = {
            under: t.t >= text.b,
            gap: r2(t.t - boxOf(q(c, "[data-row] > div > span")).b),
            atStart: r2(dir === "ltr" ? t.l - row.l : row.r - t.r),
            atEnd: r2(dir === "ltr" ? row.r - t.r : t.l - row.l),
            labelLines: lines(label).length,
          };
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`SWITCH TRACK ${engine()} ${JSON.stringify(got)}`);
    for (const dir of ["ltr", "rtl"]) {
      // "Autosubmission" can't sit beside the track at 320 and 200%: the track drops, 1rem (0.5rem at 200%) under, at the start.
      await expect(got[`${dir} long`]).toEqual({ under: true, gap: 16, atStart: 0, atEnd: expect.any(Number), labelLines: 1 });
      // A word too long for the row breaks, and the track is under it.
      await expect(got[`${dir} word`]).toMatchObject({ under: true, atStart: 0 });
      await expect((got[`${dir} word`] as { labelLines: number }).labelLines).toBeGreaterThan(1);
      // Short words keep the track beside them, at the end.
      await expect(got[`${dir} short`]).toMatchObject({ under: false, atEnd: 0 });
    }
  },
};
