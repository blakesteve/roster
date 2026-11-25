import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Navbar, type NavbarProps } from "./Navbar";
import { Bar523, Panel523, type Brand523 } from "../../../test/Navbar523";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";

/**
 * Navbar at 320px and 200% text: its menu button and the menu's close button
 * stay on the screen and the brand gives way, and what fits at 100% is the
 * same as 5.23's. Measured as rendered in Chromium and WebKit.
 *
 * - **At 100% nothing moves:** eleven brands, at 320 to 1280px, both directions,
 *   each beside the same one as 5.23 drew it (`src/test/Navbar523.tsx`), in
 *   the bar and in the menu: logo, words, buttons, links, rows and the menu's
 *   edges, to 0.05px, the crowded wide row included. The brand's pixels too.
 * - **On the screen:** the menu button and the close button, for a wordmark, a
 *   lockup, two spans, a fragment and a default name, at 320, 375, 390 and
 *   640px and 100, 150 and 200%, and right to left. Nothing pushes the page,
 *   no row leaves the menu. The twin: 5.23's are off it at 320px and 200%.
 * - **A name leaves the bar whole:** it wraps where it may, and goes when its
 *   widest part can't fit beside the logo. The link keeps the name.
 * - **The menu's head** gives a name that can't sit between the logo and the
 *   close button the head's full width, under them, and the close button stays
 *   on the logo's line. A word breaks only when a full line can't hold it.
 * - **A wide logo** stays on the close button's line and gives only what's
 *   missing. A square one keeps its size.
 * - **Side margins** stop growing on a phone.
 * - **The wide row** yields its brand when the text outgrows it, and not while
 *   its links can still give: a name 5.23 fits is never dropped.
 *
 * Sizes that decide a break are drawn as blocks in rem, not text, so no
 * outcome here depends on the platform's fonts.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Navbar/Reflow checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}.capped{max-width:calc(100vw - 96px)}";
const SQUARE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='20' fill='%230a4f7a'/%3E%3C/svg%3E";
const LOCKUP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='241' height='32' viewBox='0 0 241 32'%3E%3Crect width='241' height='32' fill='%230a4f7a'/%3E%3C/svg%3E";
const items = (...labels: string[]) => labels.map((label) => ({ label, path: `/${label.toLowerCase().replace(/\W+/g, "-")}` }));
const FEW = items("Charts", "Tide tables");
const MANY = items("Charts", "Tide tables", "Harbor notes", "Sailing directions", "Notices to mariners");
const wordmark = (kids: ReactNode) => <span style={{ fontSize: "1.5rem", lineHeight: "2rem", fontWeight: 700, letterSpacing: "-0.03em" }}>{kids}</span>;
/* A word of a known width: unbreakable, whatever the fonts. */
const Word = ({ rem }: { rem: number }) => <span data-word="" style={{ display: "inline-block", width: `${rem}rem`, height: "1.5rem", background: "#0a4f7a" }} />;

type Brand = Pick<NavbarProps, "logoSrc" | "logoSize" | "logoWidth" | "logoHeight" | "logoClassName" | "brandName" | "brandElement" | "items">;
const BRANDS: Record<string, Brand> = {
  wordmark: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "Tidewater", brandElement: wordmark("Tidewater"), items: FEW },
  breakable: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "Tidewater", brandElement: wordmark(<>Tide<wbr />water</>), items: FEW },
  spans: { logoSrc: SQUARE, brandName: "Harbor Watch", brandElement: <span style={{ fontSize: "0.875rem", lineHeight: "1.25rem", letterSpacing: "0.1em" }}><span style={{ fontWeight: 700 }}>HARBOR</span><span style={{ fontWeight: 200 }}> WATCH</span></span>, items: FEW },
  name: { logoSrc: SQUARE, brandName: "Harbor Watch", items: FEW },
  long: { logoSrc: SQUARE, brandName: "The Tidewater Society of Charts", items: FEW },
  text: { logoSrc: SQUARE, brandName: "Harbor Watch", brandElement: "Harbor Watch", items: FEW },
  fragment: { logoSrc: SQUARE, brandName: "Harbor Watch", brandElement: <><strong>Harbor</strong><em>Watch tides</em></>, items: FEW },
  /* A wordmark that isn't text: its width is all it has. */
  block: { logoSrc: SQUARE, brandName: "Harbor Watch", brandElement: <span aria-label="Harbor Watch" role="img" style={{ display: "inline-block", width: "7rem", height: "1.5rem", background: "#0a4f7a" }} data-word="" />, items: FEW },
  /* Its own class caps it, as a lockup's does, so the menu holds it at 320px. */
  lockup: { logoSrc: LOCKUP, logoWidth: 241, logoHeight: 32, logoClassName: "capped", brandName: "Harbor Watch", brandElement: <span className="rst:sr-only">Harbor Watch</span>, items: FEW },
  crowded: { logoSrc: LOCKUP, logoWidth: 241, logoHeight: 32, logoClassName: "capped", brandName: "Harbor Watch", brandElement: <span className="rst:sr-only">Harbor Watch</span>, items: MANY },
  oneWord: { logoSrc: SQUARE, brandName: "Tidewater", items: MANY },
};
const twinOf = ({ logoSrc, logoSize = "2rem", logoWidth, logoHeight, logoClassName, brandName, brandElement, items }: Brand): Brand523 & { items: Brand["items"] } => {
  const free = logoWidth !== undefined || logoHeight !== undefined;
  const px = (v: string | number) => (typeof v === "number" ? `${v}px` : v);
  const logoStyle: CSSProperties = free ? { width: logoWidth === undefined ? "auto" : px(logoWidth), height: logoHeight === undefined ? "auto" : px(logoHeight) } : { width: px(logoSize), height: px(logoSize) };
  return { logoSrc, logoStyle, logoFree: free, logoClassName, brandName, brandElement, items };
};

/* One brand, as it is now and as 5.23 drew it: the bar, then the menu's panel. */
function Pair({ id, brand }: { id: string; brand: Brand }) {
  return (
    <div data-pair={id}>
      <div data-now="" style={{ position: "relative" }}>
        <Navbar {...brand} position="static" onLogin={() => {}} />
      </div>
      <div data-was="">
        <Bar523 {...twinOf(brand)} />
        <Panel523 {...twinOf(brand)} />
      </div>
    </div>
  );
}
const pairs = (ids: string[]) => (
  <div>
    <style>{STILL}</style>
    {ids.map((id) => (
      <Pair key={id} id={id} brand={BRANDS[id]} />
    ))}
  </div>
);

const r2 = (n: number) => Math.round(n * 100) / 100;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const q = (root: ParentNode, s: string) => root.querySelector<HTMLElement>(s)!;
const pair = (id: string) => q(document, `[data-pair="${id}"]`);
type Box = { l: number; r: number; t: number; b: number };
const boxOf = (el: Element | Range): Box => {
  const r = el.getBoundingClientRect();
  return { l: r.left, r: r.right, t: r.top, b: r.bottom };
};
/* Each run of shown text: every line of it, as drawn. */
const words = (root: Element) => {
  const out: Box[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const n = walk.currentNode;
    if (!n.textContent?.trim() || n.parentElement!.closest(".rst\\:sr-only")) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width) out.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
  }
  return out;
};
/* The words drawn as blocks. */
const blocks = (root: Element) => [...root.querySelectorAll("[data-word]")].map((w) => boxOf(w));
const rel = (b: Box, o: Box) => [b.l - o.l, b.r - o.l, b.t - o.t, b.b - o.t].map(r2);

async function at(real: RealInput, width: number, percent: number, dir: "ltr" | "rtl" = "ltr") {
  await real.page.viewport(width, 900);
  await waitFor(() => expect(window.innerWidth).toBe(width));
  document.documentElement.style.fontSize = percent === 100 ? "" : `${percent}%`;
  document.documentElement.dir = dir;
  await frame();
}
async function restore(real: RealInput) {
  document.documentElement.style.fontSize = "";
  document.documentElement.dir = "ltr";
  await real.page.viewport(1280, 720);
}
/* One half of one pair, with nothing else on the page. */
async function alone(id: string, half: "[data-now]" | "[data-was]") {
  document.querySelectorAll<HTMLElement>("[data-pair] > *").forEach((h) => (h.style.display = h === q(pair(id), half) ? "" : "none"));
  await frame();
}
const hamburger = (id: string) => q(pair(id), "[data-now] [data-roster-hamburger] button");
/* The menu open over its bar, and shut again after `read`. */
async function open<T>(id: string, read: (card: HTMLElement) => T): Promise<T> {
  hamburger(id).click();
  const card = await waitFor(() => {
    const c = q(pair(id), "[data-now] [data-roster-mobile-panel]");
    expect(c).toBeTruthy();
    expect(c.parentElement!.getAnimations({ subtree: true }).length).toBe(0);
    expect(c.parentElement!.hasAttribute("data-closed")).toBe(false);
    return c;
  });
  await frame();
  await frame();
  const got = read(card);
  q(card, "button[aria-expanded], button").click();
  await waitFor(() => expect(q(pair(id), "[data-now] [data-roster-mobile-panel]")).toBeNull());
  return got;
}
const closeOf = (card: HTMLElement) => [...card.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === "Close menu")!;
const logoIn = (root: Element) => q(root, "img");
const shown = (el: HTMLElement) => el.offsetWidth > 0;

/* ── At 100% nothing moves ────────────────────────────────────────────── */

const barParts = (nav: HTMLElement, burger: HTMLElement | null) => {
  const o = boxOf(nav);
  const link = q(nav, "a");
  const rest = [...nav.querySelectorAll<HTMLElement>("a, button")].filter((e) => e !== link && shown(e) && !e.closest("[data-roster-hamburger],[data-hamburger523]"));
  return { logo: rel(boxOf(logoIn(link)), o), words: [...words(link), ...blocks(link)].map((w) => rel(w, o)), burger: burger && shown(burger) ? rel(boxOf(burger), o) : null, rest: rest.map((e) => rel(boxOf(e), o)) };
};
const apart = (a: unknown, b: unknown): number => {
  const [x, y] = [JSON.stringify(a).match(/-?[\d.]+/g) ?? [], JSON.stringify(b).match(/-?[\d.]+/g) ?? []];
  return x.length !== y.length ? Infinity : Math.max(0, ...x.map((n, i) => Math.abs(Number(n) - Number(y[i]))));
};

export const TheBarIsUnchangedAt100Percent: Story = {
  render: () => pairs(Object.keys(BRANDS)),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const moved: string[] = [];
    let read = 0;
    try {
      for (const dir of ["ltr", "rtl"] as const)
        for (const width of [320, 375, 414, 640, 768, 900, 1280]) {
          await at(real, width, 100, dir);
          for (const id of Object.keys(BRANDS)) {
            const p = pair(id);
            const now = barParts(q(p, "[data-now] nav"), q(p, "[data-now] [data-roster-hamburger] button"));
            const was = barParts(q(p, "[data-bar523]"), q(p, "[data-hamburger523] button"));
            read += 1;
            if (apart(now, was) > 0.05) moved.push(`${dir} ${width} ${id}: ${JSON.stringify(now)} was ${JSON.stringify(was)}`);
          }
        }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR BAR ${read} read, ${moved.length} moved`);
    await expect(read).toBe(2 * 7 * Object.keys(BRANDS).length);
    await expect(moved).toEqual([]);
  },
};

const panelParts = (card: HTMLElement, close: HTMLElement) => {
  const o = boxOf(card);
  const head = card.firstElementChild!.firstElementChild!;
  const rows = [...card.querySelectorAll<HTMLElement>("a")];
  const action = [...card.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === "Log In")!;
  return { width: r2(o.r - o.l), logo: rel(boxOf(logoIn(head)), o), words: [...words(head), ...blocks(head)].map((w) => rel(w, o)), close: rel(boxOf(close), o), rows: rows.map((e) => rel(boxOf(e), o)), text: rows.flatMap((e) => words(e).map((w) => rel(w, o))), action: rel(boxOf(action), o) };
};

export const TheMenuIsUnchangedAt100Percent: Story = {
  render: () => pairs(Object.keys(BRANDS)),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const moved: string[] = [];
    let read = 0;
    try {
      for (const dir of ["ltr", "rtl"] as const)
        for (const width of [320, 375, 640]) {
          await at(real, width, 100, dir);
          for (const id of Object.keys(BRANDS)) {
            const now = await open(id, (card) => panelParts(card, closeOf(card)));
            const card = q(pair(id), "[data-card523]");
            const was = panelParts(card, q(card, "[data-close523]"));
            read += 1;
            if (apart(now, was) > 0.05) moved.push(`${dir} ${width} ${id}: ${JSON.stringify(now)} was ${JSON.stringify(was)}`);
          }
        }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR MENU ${read} read, ${moved.length} moved`);
    await expect(read).toBe(2 * 3 * Object.keys(BRANDS).length);
    await expect(moved).toEqual([]);
  },
};

/* The brand as painted, beside 5.23's: a clip a hair too tight shaves the last
   letter of a tracked name, which no box shows. */
const pixels = async (real: RealInput, el: HTMLElement) => {
  const shot = await (real.page as unknown as { screenshot: (o: object) => Promise<string | { base64: string }> }).screenshot({ element: el, base64: true, save: false });
  const img = new Image();
  img.src = `data:image/png;base64,${typeof shot === "string" ? shot : shot.base64}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
};

export const TheBrandIsTheSamePixels: Story = {
  render: () => (
    <>
      {/* The twin colors neither its menu button nor its edge; their boxes are
          compared above. And the brand lightens under a pointer, where one
          can be resting from the file before: with none to feel, both halves
          are at rest. */}
      <style>{"[data-pair] { pointer-events: none } [data-roster-hamburger] *, [data-hamburger523] * { visibility: hidden } [data-now] nav, [data-bar523] { border-color: transparent !important }"}</style>
      {pairs(["wordmark", "spans", "name", "lockup"])}
    </>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    let clear: number[] = [];
    try {
      await at(real, 375, 100);
      /* The clip, in any font: 4px past the last letter, 8 above and below. */
      const link = q(pair("wordmark"), "[data-now] nav a");
      const clip = boxOf(q(link, ":scope > span"));
      const word = boxOf(q(link, ":scope > span > span:last-child > span:last-child"));
      clear = [clip.r - word.r, word.t - clip.t, clip.b - word.b].map(r2);
      /* Each alone at the top of the page: the runner scales its frame, so a
         different y would be drawn from different device pixels. */
      for (const id of ["wordmark", "spans", "name", "lockup"]) {
        const shot = async (half: "[data-now]" | "[data-was]", selector: string) => {
          await alone(id, half);
          await Promise.all([...q(pair(id), half).querySelectorAll("img")].map((img) => img.decode()));
          await frame();
          return pixels(real, q(pair(id), selector));
        };
        /* Chromium's scaled frame paints a pixel or two a shade apart from one
           shot to the next; a shaved letter is far past a shade, in every shot. */
        let off = Infinity;
        let a = await shot("[data-now]", "[data-now] nav > div");
        for (let tries = 0; tries < 3 && off > 0; tries += 1) {
          if (tries) a = await shot("[data-now]", "[data-now] nav > div");
          const b = await shot("[data-was]", "[data-bar523] > div");
          let n = 0;
          for (let i = 0; i < a.data.length; i += 1) if (Math.abs(a.data[i] - b.data[i]) > 16) n += 1;
          off = a.width === b.width && a.height === b.height ? Math.min(off, n) : Infinity;
        }
        rows.push(`${id}: ${off} of ${a.data.length > 1000 ? "a bar" : "nothing"}`);
      }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR PIXELS ${JSON.stringify(rows)}, the clip clears ${JSON.stringify(clear)}`);
    await expect(clear).toEqual([4, 8, 8]);
    await expect(rows).toEqual(["wordmark: 0 of a bar", "spans: 0 of a bar", "name: 0 of a bar", "lockup: 0 of a bar"]);
  },
};

/* ── On the screen ────────────────────────────────────────────────────── */

const ON_SCREEN = ["wordmark", "breakable", "spans", "name", "fragment", "lockup"];

export const TheMenuButtonAndTheCloseButtonStayOnTheScreen: Story = {
  render: () => pairs(ON_SCREEN),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const off: string[] = [];
    let read = 0;
    let twin = { burger: 0, close: 0 };
    try {
      const sizes: [number, number, "ltr" | "rtl"][] = [320, 375, 390, 640].flatMap((w) => [100, 150, 200].map((f) => [w, f, "ltr"] as [number, number, "ltr"]));
      for (const [width, percent, dir] of [...sizes, [320, 200, "rtl"] as [number, number, "rtl"]]) {
        await at(real, width, percent, dir);
        const inside = (what: string, b: Box, l = 0, r = width) => {
          if (b.l < l - 0.1 || b.r > r + 0.1) off.push(`${dir} ${width} ${percent}% ${what}: ${r2(b.l)} to ${r2(b.r)}, of ${r2(l)} to ${r2(r)}`);
        };
        for (const id of ON_SCREEN) {
          read += 1;
          inside(`${id} menu button`, boxOf(hamburger(id)));
          /* Nothing shown of the brand reaches the button. */
          const nav = q(pair(id), "[data-now] nav");
          const burger = boxOf(hamburger(id));
          for (const w of words(q(nav, "a"))) if (w.t < boxOf(nav).b && (dir === "ltr" ? w.r > burger.l + 1 : w.l < burger.r - 1)) off.push(`${dir} ${width} ${percent}% ${id} name reaches ${r2(w.r)}`);
          await open(id, (card) => {
            const c = boxOf(card);
            inside(`${id} close button`, boxOf(closeOf(card)));
            for (const row of card.querySelectorAll("a, button")) inside(`${id} row`, boxOf(row), c.l, c.r);
            for (const w of words(card.firstElementChild!.firstElementChild!)) inside(`${id} menu name`, w, c.l, c.r);
            /* Its own box, so the twin's overflow below doesn't count. */
            inside(`${id} menu`, c);
          });
        }
        if (width === 320 && percent === 200 && dir === "ltr") twin = { burger: r2(boxOf(q(pair("wordmark"), "[data-hamburger523] button")).r), close: r2(boxOf(q(pair("wordmark"), "[data-close523]")).r) };
      }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR ON SCREEN ${read} read, ${off.length} off; 5.23 at 320 and 200%: ${JSON.stringify(twin)}`);
    await expect(read).toBe(13 * ON_SCREEN.length);
    await expect(off).toEqual([]);
    /* The twin: 5.23's are past the screen's edge. */
    await expect(twin.burger).toBeGreaterThan(320);
    await expect(twin.close).toBeGreaterThan(320);
  },
};

/* A phone doesn't wait on style queries, which not every browser has: the
   property that answers them turned off, its bar still gives way. The twin:
   the wide row, which does wait on them, doesn't. */
export const APhonesBarNeedsNoStyleQuery: Story = {
  render: () => (
    <div>
      <style>{STILL}</style>
      <div style={{ position: "relative" }}>
        <Navbar {...BRANDS.wordmark} position="static" style={{ "--rst-nav-tight": "0px" } as CSSProperties} />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    let phone = 0;
    let gap = "";
    try {
      await at(real, 320, 200);
      phone = r2(boxOf(q(document, "[data-roster-hamburger] button")).r);
      await at(real, 768, 200);
      gap = getComputedStyle(q(document, "nav a")).columnGap;
    } finally {
      await restore(real);
    }
    await expect(phone).toBe(304);
    await expect(gap).toBe("24px");
  },
};

/* ── A name leaves whole ──────────────────────────────────────────────── */

/* At 320px and 200%: 288 inside the bar's margins, 72 for the menu button, 80
   for the logo and 24 between, so 112px for a name: 3.5rem. */
const NAMES: Record<string, Brand> = {
  fits: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={3.25} /></span>, items: FEW },
  wraps: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={3.25} /><wbr /><Word rem={3} /></span>, items: FEW },
  leaves: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={4} /></span>, items: FEW },
  oneOfTwo: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <><Word rem={3.25} /><Word rem={4} /></>, items: FEW },
  string: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: "Tidewatertidewater", items: FEW },
  /* A wide logo beside a name: the name goes before the logo gives anything. */
  wideLogo: { logoSrc: LOCKUP, logoWidth: 80, logoHeight: 32, brandName: "x", brandElement: <span><Word rem={4} /></span>, items: FEW },
};

export const ANameLeavesTheBarWhole: Story = {
  render: () => (
    <div>
      <style>{STILL}</style>
      {Object.entries(NAMES).map(([id, brand]) => (
        <Pair key={id} id={id} brand={brand} />
      ))}
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    let under = 0;
    try {
      await at(real, 320, 200);
      under = r2(boxOf(q(pair("leaves"), "[data-bar523] a [data-word]")).r - boxOf(q(pair("leaves"), "[data-hamburger523] button")).l);
      for (const id of Object.keys(NAMES)) {
        /* Alone, so nothing covers what the clip would let through. */
        await alone(id, "[data-now]");
        const nav = q(pair(id), "[data-now] nav");
        const bar = boxOf(nav);
        const burger = boxOf(hamburger(id));
        const logo = boxOf(logoIn(nav));
        /* Off it whole, and clipped there: past the bar, and nothing of the
           link to hit where it lies. */
        const gone = (b: Box) => b.t >= bar.b && !q(nav, "a").contains(document.elementFromPoint((b.l + Math.min(b.r, 320)) / 2, (b.t + b.b) / 2));
        const seen = [...nav.querySelectorAll<HTMLElement>("a [data-word]")].map((w) => {
          const b = boxOf(w);
          const inBar = b.b <= bar.b && b.r <= burger.l + 0.1;
          return inBar ? "shown" : gone(b) ? "gone" : "cut";
        });
        if (id === "string") seen.push(words(q(nav, "a")).every(gone) ? "gone" : "cut");
        rows.push(`${id}: logo ${r2(logo.r - logo.l)}, ${seen.join(" ")}`);
      }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR NAMES ${JSON.stringify(rows)}, 5.23's past its button by ${under}`);
    await expect(rows).toEqual(["fits: logo 80, shown", "wraps: logo 80, shown shown", "leaves: logo 80, gone", "oneOfTwo: logo 80, shown gone", "string: logo 80, gone", "wideLogo: logo 80, gone"]);
  },
};

export const TheLinkKeepsANameThatLeft: Story = {
  tags: ["!real-input", "ax-tree"],
  render: () => pairs(["wordmark"]),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    try {
      await at(real, 320, 200);
      const link = q(pair("wordmark"), "[data-now] nav a");
      const gone = words(link).every((w) => w.t >= boxOf(q(pair("wordmark"), "[data-now] nav")).b);
      link.setAttribute("data-ax-probe", "brand");
      const [state] = await real.commands.axStates(['[data-ax-probe="brand"]']);
      await expect([gone, state.role, state.name]).toEqual([true, "link", "Tidewater"]);
    } finally {
      await restore(real);
    }
  },
};

/* ── The menu's head ──────────────────────────────────────────────────── */

/* At 320px and 200%: 264 inside the head's margins, 80 for the logo, 24
   between and 56 for the close button, so 104px beside them: 3.25rem; and
   8.25rem is a full line. */
const HEADS: Record<string, Brand> = {
  beside: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={3.2} /></span>, items: FEW },
  under: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={4} /></span>, items: FEW },
  full: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={4} /><wbr /><Word rem={4.2} /></span>, items: FEW },
  each: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <><Word rem={5} /><Word rem={5} /></>, items: FEW },
  breaks: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: wordmark("Tidewatertidewatertidewater"), items: FEW },
  string: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: "Tidewatertidewatertidewater", items: FEW },
  /* Too wide beside the logo in any font, and not for a line of its own. */
  word: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "Tidewater", items: FEW },
};

export const TheMenusHeadGivesANameItsOwnLine: Story = {
  render: () => (
    <div>
      <style>{STILL}</style>
      {Object.entries(HEADS).map(([id, brand]) => (
        <Pair key={id} id={id} brand={brand} />
      ))}
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    const text: Record<string, { lines: number; under: boolean; to: number }> = {};
    try {
      await at(real, 320, 200);
      for (const id of Object.keys(HEADS)) {
        const row = await open(id, (card) => {
          const head = card.firstElementChild!.firstElementChild!;
          const logo = boxOf(logoIn(head));
          const close = boxOf(closeOf(card));
          const same = Math.abs((logo.t + logo.b) / 2 - (close.t + close.b) / 2) <= 4 ? "on the logo's line" : "off it";
          const ws = [...head.querySelectorAll<HTMLElement>("[data-word]")].map((w) => boxOf(w));
          const lines = words(head);
          if (lines.length) text[id] = { lines: lines.length, under: lines.every((w) => w.t >= logo.b - 0.1), to: r2(Math.max(...lines.map((w) => w.r))) };
          return `${id}: close ${r2(close.l)} to ${r2(close.r)} ${same}; ${ws.map((w) => `${w.t >= logo.b - 0.1 ? "under" : "beside"} ${r2(w.l)} to ${r2(w.r)}`).join(", ")}`;
        });
        rows.push(row);
      }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR HEADS ${JSON.stringify(rows)}; ${JSON.stringify(text)}`);
    await expect(rows.slice(0, 4)).toEqual([
      "beside: close 236 to 308 on the logo's line; beside 132 to 234.39",
      "under: close 236 to 308 on the logo's line; under 28 to 156",
      /* Both on one line: the full width, the close button's column included. */
      "full: close 236 to 308 on the logo's line; under 28 to 156, under 156 to 290.39",
      "each: close 236 to 308 on the logo's line; under 28 to 188, under 28 to 188",
    ]);
    /* A word breaks only where no line can hold it, and never runs off. */
    await expect([text.word!.lines, text.word!.under]).toEqual([1, true]);
    for (const id of ["breaks", "string"]) await expect([text[id]!.lines > 1, text[id]!.under, text[id]!.to <= 292.1], id).toEqual([true, true, true]);
  },
};

/* ── A wide logo, and the side margins ────────────────────────────────── */

const LOGOS: Record<string, Brand> = {
  lockup: { ...BRANDS.lockup, logoClassName: "" },
  capped: BRANDS.lockup,
  square: BRANDS.wordmark,
  /* Narrower than the floor it would shrink to: never wider than asked. */
  narrow: { ...BRANDS.name, logoSize: undefined, logoWidth: 24, logoHeight: 32 },
};

export const AWideLogoGivesOnlyWhatsMissing: Story = {
  render: () => (
    <div>
      <style>{STILL}</style>
      {Object.entries(LOGOS).map(([id, brand]) => (
        <Pair key={id} id={id} brand={brand} />
      ))}
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    const wide = async (label: string, ids: string[]) => {
      for (const id of ids) {
        const inBar = logoIn(q(pair(id), "[data-now] nav"));
        const bar = boxOf(inBar);
        const menu = await open(id, (card) => {
          const l = boxOf(logoIn(card));
          const c = boxOf(closeOf(card));
          return [r2(l.r - l.l), Math.abs((l.t + l.b) / 2 - (c.t + c.b) / 2) <= 4];
        });
        rows.push(`${label} ${id}: bar ${r2(bar.r - bar.l)} by ${r2(bar.b - bar.t)} ${getComputedStyle(inBar).objectFit}, down to ${getComputedStyle(inBar).minWidth}, menu ${menu[0]}, ${menu[1] ? "one line" : "two"}`);
      }
    };
    try {
      await at(real, 375, 100);
      await wide("375, 100%", ["lockup"]);
      await at(real, 320, 200);
      await wide("320, 200%", ["lockup", "capped", "square", "narrow"]);
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR LOGOS ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      "375, 100% lockup: bar 241 by 32 contain, down to 32px, menu 241, one line",
      "320, 200% lockup: bar 216 by 32 contain, down to 64px, menu 208, one line",
      "320, 200% capped: bar 216 by 32 contain, down to 64px, menu 208, one line",
      "320, 200% square: bar 80 by 80 fill, down to auto, menu 80, one line",
      "320, 200% narrow: bar 24 by 32 contain, down to 24px, menu 24, one line",
    ]);
  },
};

export const SideMarginsStopGrowingOnAPhone: Story = {
  render: () => pairs(["name"]),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    try {
      for (const [width, percent] of [[320, 100], [320, 200], [375, 100], [640, 200]] as const) {
        await at(real, width, percent);
        const bar = boxOf(logoIn(q(pair("name"), "[data-now] nav")));
        const menu = await open("name", (card) => {
          const c = boxOf(card);
          const row = boxOf(q(card, "a"));
          const action = boxOf([...card.querySelectorAll("button")].find((b) => b.textContent === "Log In")!);
          return `menu ${r2(c.l)} to ${r2(c.r)}, its head from ${r2(boxOf(logoIn(card)).l)}, rows ${r2(row.l)} to ${r2(row.r)}, action ${r2(action.l)} to ${r2(action.r)}`;
        });
        rows.push(`${width}, ${percent}%: bar from ${r2(bar.l)}; ${menu}`);
      }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR MARGINS ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      "320, 100%: bar from 16; menu 8 to 312, its head from 28, rows 16 to 304, action 28 to 292",
      /* The same sides at 200%: 5.23 drew the bar from 32, and the head from 56. */
      "320, 200%: bar from 16; menu 8 to 312, its head from 28, rows 16 to 304, action 28 to 292",
      "375, 100%: bar from 16; menu 8 to 367, its head from 28, rows 16 to 359, action 28 to 347",
      /* A wider screen has room for all of it. */
      "640, 200%: bar from 32; menu 16 to 624, its head from 56, rows 32 to 608, action 56 to 584",
    ]);
  },
};

/* ── The wide row ─────────────────────────────────────────────────────── */

const WIDE: Record<string, Brand> = {
  tight: { logoSrc: SQUARE, logoSize: "2.5rem", brandName: "x", brandElement: <span><Word rem={14} /></span>, items: items("A", "B", "C") },
  oneWord: BRANDS.oneWord,
  wordmark: { ...BRANDS.wordmark, items: MANY },
};

export const TheWideRowYieldsItsBrandLast: Story = {
  render: () => (
    <div>
      <style>{STILL}</style>
      {Object.entries(WIDE).map(([id, brand]) => (
        <Pair key={id} id={id} brand={brand} />
      ))}
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const last = (nav: HTMLElement) => Math.max(...[...nav.querySelectorAll<HTMLElement>("a, button")].filter(shown).map((e) => boxOf(e).r));
    const gone = (nav: HTMLElement) => words(q(nav, "a")).some((w) => w.t >= boxOf(nav).b);
    let now = 0;
    let was = 0;
    const dropped: string[] = [];
    let fits = 0;
    try {
      await at(real, 768, 200);
      now = r2(last(q(pair("tight"), "[data-now] nav")));
      was = r2(last(q(pair("tight"), "[data-bar523]")));
      /* Where 5.23's row fits, in any engine or font, ours keeps the name. */
      for (const width of [768, 800, 900, 1024, 1280])
        for (const percent of [100, 110, 125, 150, 175]) {
          await at(real, width, percent);
          for (const id of ["oneWord", "wordmark"]) {
            const bar = q(pair(id), "[data-bar523]");
            const row = q(bar, ":scope > div");
            const end = boxOf(row).r - parseFloat(getComputedStyle(row).paddingRight);
            const under = words(q(bar, "a")).some((w) => w.r > boxOf(row.children[1]).l + 0.5);
            if (last(bar) > end + 0.5 || under) continue;
            fits += 1;
            if (gone(q(pair(id), "[data-now] nav"))) dropped.push(`${width} ${percent}% ${id}`);
          }
        }
    } finally {
      await restore(real);
    }
    console.info(`NAVBAR WIDE 768 and 200%: last control to ${now}, 5.23's to ${was}; ${fits} rows fit on 5.23, ${dropped.length} names dropped`);
    await expect(now).toBeLessThanOrEqual(768);
    await expect(was).toBeGreaterThan(768);
    await expect(fits).toBeGreaterThan(4);
    await expect(dropped).toEqual([]);
  },
};

