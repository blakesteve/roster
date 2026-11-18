import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ActionBar } from "./ActionBar";
import { Card } from "../../atoms/Card/Card";
import { contrast, rgba, textContrast, textOn } from "../../../test/painted";

/**
 * ActionBar's title and subtitle, measured as painted, in Chromium and WebKit
 * (tagged `real-input` for the project that runs both; nothing here takes
 * input).
 *
 * Both are text, so the bar is WCAG AA's 4.5:1, in every variant, on the page
 * and on a Card, light and dark. The bar is sticky, so its ground is also
 * whatever scrolls beneath it: each filled variant is read over a black and a
 * white underlay too, in both themes. `transparent` has no fill and paints on
 * the page, so it's read on the page alone. The figures are Chromium's, as
 * literals; WebKit mixes the translucent fills a little differently and
 * reads within 0.25 of them.
 *
 * The twin is the bar as 5.20 drew it, its fills at 50% and its subtitle at
 * 80%, drawn with inline styles: primary fails on the page, and default and
 * soft fail over an underlay.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/ActionBar/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "soft", "primary", "transparent"] as const;
type Variant = (typeof VARIANTS)[number];
const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card", "light-black", "light-white", "dark-black", "dark-white"] as const;
type Ground = (typeof GROUNDS)[number];
const TEXT = 4.5;

const UNDERLAY: Record<string, string> = { black: "#000000", white: "#ffffff" };

function Ground({ id }: { id: Ground }) {
  const dark = id.startsWith("dark");
  const under = id.split("-")[1];
  const bars = (
    <div style={{ display: "grid", gap: 8 }}>
      {VARIANTS.filter((v) => !(under in UNDERLAY) || v !== "transparent").map((v) => (
        <ActionBar key={v} data-variant={v} variant={v} position="static" title="Title" subtitle="A subtitle under it" />
      ))}
    </div>
  );
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 300, background: dark ? "#0c0a09" : "#ffffff" }}>
      {under === "card" ? <Card>{bars}</Card> : under in UNDERLAY ? <div style={{ background: UNDERLAY[under], padding: 8 }}>{bars}</div> : bars}
    </div>
  );
}

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
const round = (n: number) => Math.round(n * 100) / 100;

/* 5.20's fills and inks, as inline styles: [fill, ink], light then dark. */
const mix = (step: string, pct: number) => `color-mix(in oklab, var(--roster-${step}) ${pct}%, transparent)`;
const OLD: Record<Exclude<Variant, "transparent">, [[string, string], [string, string]]> = {
  default: [[mix("white, #fff", 50), ""], [mix("gray-950, #0c0a09", 50), ""]],
  soft: [[mix("gray-50, #fafaf9", 50), ""], [mix("gray-900, #1c1917", 50), ""]],
  primary: [[mix("primary-700, #084063", 50), "#ffffff"], [mix("primary-950, #021724", 50), "var(--roster-primary-50, #f0f7fd)"]],
};

type Reading = { title: number; subtitle: number };
function read(canvas: Element, id: Ground, v: Variant): Reading | undefined {
  const bar = canvas.querySelector<HTMLElement>(`[data-ground="${id}"] [data-variant="${v}"]`);
  if (!bar) return undefined;
  const title = bar.querySelector(".rst\\:text-lg")!;
  const subtitle = bar.querySelector(".rst\\:mt-1")!;
  return { title: round(textContrast(title)), subtitle: round(textContrast(subtitle)) };
}
function readOld(canvas: Element, id: Ground, v: Exclude<Variant, "transparent">): Reading | undefined {
  const bar = canvas.querySelector<HTMLElement>(`[data-ground="${id}"] [data-variant="${v}"]`);
  if (!bar) return undefined;
  const [fill, ink] = OLD[v][id.startsWith("dark") ? 1 : 0];
  const subtitle = bar.querySelector<HTMLElement>(".rst\\:mt-1")!;
  bar.style.background = fill;
  if (ink) bar.style.color = ink;
  subtitle.style.color = "inherit";
  subtitle.style.opacity = "0.8";
  const out = read(canvas, id, v);
  bar.style.background = bar.style.color = subtitle.style.color = subtitle.style.opacity = "";
  return out;
}

/* [title, subtitle] per variant per ground, as Chromium paints them. Over an
   underlay, the light theme's worst is black and dark's is white. */
const NOW: Record<Variant, Partial<Record<Ground, [number, number]>>> = {
  default: {
    "light-page": [17.49, 10.27], "light-card": [17.49, 10.27], "dark-page": [18.11, 13.26], "dark-card": [17.95, 13.14],
    "light-black": [14.01, 8.23], "light-white": [17.49, 10.27], "dark-black": [18.22, 13.34], "dark-white": [14.52, 10.64],
  },
  soft: {
    "light-page": [16.7, 9.81], "light-card": [16.7, 9.81], "dark-page": [16.17, 11.84], "dark-card": [15.93, 11.66],
    "light-black": [13.32, 7.82], "light-white": [16.7, 9.81], "dark-black": [16.33, 11.96], "dark-white": [11.98, 8.78],
  },
  /* Solid, so the same over anything: primary-700's ink token in light,
     white on primary-950 in dark. */
  primary: {
    "light-page": [10.92, 10.92], "light-card": [10.92, 10.92], "dark-page": [18.25, 18.25], "dark-card": [18.25, 18.25],
    "light-black": [10.92, 10.92], "light-white": [10.92, 10.92], "dark-black": [18.25, 18.25], "dark-white": [18.25, 18.25],
  },
  transparent: { "light-page": [17.49, 10.27], "light-card": [17.49, 10.27], "dark-page": [18.11, 13.26], "dark-card": [16.03, 11.74] },
};
/* 5.20's bar, the same way. */
const BEFORE: Record<Exclude<Variant, "transparent">, Partial<Record<Ground, [number, number]>>> = {
  default: {
    "light-page": [17.49, 9.23], "light-card": [17.49, 9.23], "dark-page": [18.11, 11.57], "dark-card": [17.18, 11.15],
    "light-black": [4.43, 3.44], "light-white": [17.49, 9.23], "dark-black": [18.66, 11.79], "dark-white": [3.42, 2.78],
  },
  soft: {
    "light-page": [17.04, 9.08], "light-card": [17.04, 9.08], "dark-page": [17.12, 11.12], "dark-card": [15.97, 10.53],
    "light-black": [4.25, 3.33], "light-white": [17.04, 9.08], "dark-black": [17.79, 11.43], "dark-white": [3.07, 2.54],
  },
  primary: {
    "light-page": [2.77, 2.33], "light-card": [2.77, 2.33], "dark-page": [17.8, 11.48], "dark-card": [16.71, 10.94],
    "light-black": [16.67, 10.97], "light-white": [2.77, 2.33], "dark-black": [18.45, 11.77], "dark-white": [3.26, 2.67],
  },
};
/* WebKit mixes a translucent fill in oklab a little differently. */
const WEBKIT_DRIFT = 0.25;

/* Each reading against its literal, within `drift`. */
function against(got: Record<string, [number, number]>, want: Partial<Record<Ground, [number, number]>>, drift: number, what: string) {
  const wrong: string[] = [];
  if (Object.keys(got).sort().join() !== Object.keys(want).sort().join()) wrong.push(`${what}: grounds ${Object.keys(got)}`);
  for (const [id, pair] of Object.entries(got)) {
    const expected = want[id as Ground]!;
    if (pair.some((r, i) => Math.abs(r - expected[i]) > drift + 1e-9)) wrong.push(`${what} on ${id}: ${pair}, pinned ${expected}`);
  }
  return wrong;
}

export const TheTextPassesOverAnything: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <style>{STILL}</style>
      {GROUNDS.map((id) => (
        <Ground key={id} id={id} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const webkit = !navigator.userAgent.includes("Chrome");
    const now: Record<string, Record<string, [number, number]>> = {};
    const before: Record<string, Record<string, [number, number]>> = {};
    for (const v of VARIANTS) {
      now[v] = {};
      for (const id of GROUNDS) {
        const r = read(canvasElement, id, v);
        if (r) now[v][id] = [r.title, r.subtitle];
      }
      if (v === "transparent") continue;
      before[v] = {};
      for (const id of GROUNDS) {
        const r = readOld(canvasElement, id, v);
        if (r) before[v][id] = [r.title, r.subtitle];
      }
    }
    console.info(`ACTIONBAR ${JSON.stringify({ now, before })}`);

    /* Reach: every filled variant on all eight grounds, transparent on four. */
    for (const v of VARIANTS) await expect(Object.keys(now[v]).length, v).toBe(v === "transparent" ? 4 : 8);

    const drift = webkit ? WEBKIT_DRIFT : 0;
    const wrong: string[] = [];
    for (const v of VARIANTS) {
      for (const [id, pair] of Object.entries(now[v])) {
        for (const ratio of pair) if (ratio < TEXT) wrong.push(`${v} on ${id}: ${ratio}, under ${TEXT}`);
      }
      wrong.push(...against(now[v], NOW[v], drift, v));
    }
    for (const v of ["default", "soft", "primary"] as const) wrong.push(...against(before[v], BEFORE[v], drift, `${v} before`));
    await expect(wrong).toEqual([]);
    /* The twin fails where the ruling found it: primary on its own page, and
       default and soft over an underlay. */
    await expect(before.primary["light-page"][1]).toBeLessThan(TEXT);
    for (const v of ["default", "soft"] as const) {
      await expect(Math.min(before[v]["light-black"][1], before[v]["dark-white"][1]), v).toBeLessThan(TEXT);
    }
  },
};

export const PrimaryCarriesItsOwnRingAndControls: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      {/* The bar transitions every property, so a token change would read
          mid-transition. */}
      <style>{STILL}</style>
      <Ground id="light-page" />
      <Ground id="dark-page" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const id of ["light-page", "dark-page"]) {
      const bar = canvasElement.querySelector<HTMLElement>(`[data-ground="${id}"] [data-variant="primary"]`)!;
      const style = getComputedStyle(bar);
      const token = (name: string) => rgba(style.getPropertyValue(name).trim()).slice(0, 3);
      const fill = textOn(bar).ground.map(Math.round);
      /* Solid: the fill is opaque, so nothing behind it shows. */
      await expect(rgba(style.backgroundColor)[3], id).toBe(1);
      await expect(token("--roster-ring-offset"), `${id} offset`).toEqual(fill);
      await expect(round(contrast(token("--roster-ring"), fill)), `${id} ring`).toBe(id === "light-page" ? 4.04 : 6.75);
      /* Dialog primary's control tokens, so a field inside reads. */
      const root = getComputedStyle(document.documentElement);
      const step = (name: string) => rgba(root.getPropertyValue(name).trim()).slice(0, 3);
      await expect(token("--roster-control-text"), id).toEqual(step("--roster-gray-100"));
      await expect(token("--roster-control-border"), id).toEqual(step("--roster-gray-400"));
      await expect(token("--roster-control-border-focus"), id).toEqual(step("--roster-primary-400"));
    }
    /* In light, the text is the fill's ink token, so a palette whose
       primary-700 is light gets dark text; dark keeps white. The token is
       read where the theme declares it, on <html>. */
    const root = document.documentElement;
    const color = (id: string) => getComputedStyle(canvasElement.querySelector(`[data-ground="${id}"] [data-variant="primary"]`)!).color;
    root.style.setProperty("--roster-primary-700-ink", "rgb(1, 2, 3)");
    try {
      await expect([color("light-page"), color("dark-page")]).toEqual(["rgb(1, 2, 3)", "rgb(255, 255, 255)"]);
    } finally {
      root.style.removeProperty("--roster-primary-700-ink");
    }
  },
};
