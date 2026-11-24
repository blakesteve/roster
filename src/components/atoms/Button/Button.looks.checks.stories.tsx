import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { Button } from "./Button";
import { buttonVariants } from "./button-variants";
import { Card } from "../Card/Card";
import { textContrast } from "../../../test/painted";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";

/**
 * What `tint`, `tint-subtle`, `plain`, a tile, `compact`, `pressed` and
 * `unavailable` promise beyond looking right, which
 * `Button.tiles.checks.stories.tsx` compares with the controls they replace.
 * Measured as rendered in Chromium and WebKit.
 *
 * - **The browser's own outline, on a link too:** raw `buttonVariants` classes
 *   on an `<a>`, which nothing merges, show the browser's outline, no ring,
 *   and a tint's edge. A `solid` tile keeps Roster's ring.
 * - **Nothing moves while a tile is busy:** the icon's box, the label and the
 *   tile, at rest against busy, to 0.05px, and the spinner fills the icon's
 *   box. The twin is a tile without an icon, whose label sits elsewhere.
 * - **`unavailable` is a control you can reach and can't use:** focus stays on
 *   it, Tab passes, a press, Enter and Space do nothing, `aria-disabled` says
 *   so. The twin, native `disabled`, drops focus.
 * - **The light and dark labels clear 4.5:1**, all eight schemes, at rest, and
 *   hovered and pressed where the ruling found the lowest (a light page, a
 *   dark Card), measured as painted. Hover and press are Chromium's: see
 *   `Button.tiles.checks.stories.tsx`.
 * - **`compact` is 30px** in every look, `tint-subtle`'s border inside it. A
 *   tile takes none of a size's height.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Button/Looks checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STILL = "*,*::before,*::after{transition:none!important;animation-play-state:paused!important}";
const chromium = () => /Chrome/.test(navigator.userAgent);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const r2 = (n: number) => Math.round(n * 100) / 100;

const Icon = ({ size = 12 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
    <rect width="16" height="16" fill="currentColor" />
  </svg>
);
/* Every visible shadow, without Tailwind's placeholders. */
const shadowList = (el: Element) =>
  getComputedStyle(el)
    .boxShadow.split(/,(?![^(]*\))/)
    .map((x) => x.trim())
    .filter((x) => x !== "none" && !/0px 0px 0px 0px$/.test(x) && !x.startsWith("rgba(0, 0, 0, 0)"));

/* ── The browser's own outline ────────────────────────────────────────── */

export const TheBrowsersOutlineOnALinkTooAndRostersRingOnASolidTile: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <style>{STILL}</style>
      <button type="button" data-check="before">
        Before
      </button>
      <a href="#tint" data-look="tint" className={buttonVariants({ variant: "tint", size: "sm" })}>
        Raw tint
      </a>
      <a href="#subtle" data-look="tint-subtle" className={buttonVariants({ variant: "tint-subtle", size: "compact" })}>
        Raw subtle
      </a>
      <a href="#plain" data-look="plain" className={buttonVariants({ variant: "plain", size: "xs" })}>
        Raw plain
      </a>
      <Button data-look="solid-tile" layout="tile" variant="solid">
        Solid tile
      </Button>
      <Button data-look="tint-tile" layout="tile" variant="tint">
        Tint tile
      </Button>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    const rows: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
      await wait(60);
      const el = document.activeElement as HTMLElement;
      const ring = shadowList(el).filter((s) => /0px 0px 0px 4px$/.test(s));
      const edge = shadowList(el).filter((s) => /0px 0px 0px 1px$/.test(s));
      rows.push(`${el.dataset.look}: outline ${getComputedStyle(el).outlineStyle}, ring ${ring.length}, edge ${edge.length}`);
    }
    console.info(`LOOKS FOCUS ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      "tint: outline auto, ring 0, edge 1",
      "tint-subtle: outline auto, ring 0, edge 1",
      "plain: outline auto, ring 0, edge 0",
      "solid-tile: outline none, ring 1, edge 0",
      "tint-tile: outline auto, ring 0, edge 1",
    ]);
    /* The raw plain link's other classes hold, with nothing merging them. */
    const plain = getComputedStyle(document.querySelector('[data-look="plain"]')!);
    await expect([plain.borderTopLeftRadius, plain.fontWeight, plain.paddingLeft, plain.height]).toEqual(["0px", "400", "0px", plain.height]);
    await expect(parseFloat(plain.height)).toBeLessThanOrEqual(16);
  },
};

/* ── Nothing moves ────────────────────────────────────────────────────── */

export const NothingMovesWhileATileIsBusy: Story = {
  render: () => (
    <div className="dark" style={{ background: "#1a1f2e", padding: 24, display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 140px)", alignItems: "start" }}>
      <style>{STILL}</style>
      <Button variant="tint" layout="tile" startIcon={<Icon />} data-tile="rest">
        Keyboard
      </Button>
      <Button variant="tint" layout="tile" startIcon={<Icon />} isLoading data-tile="busy">
        Keyboard
      </Button>
      <Button variant="tint" layout="tile" data-tile="rest-none">
        Keyboard
      </Button>
      <Button variant="tint" layout="tile" isLoading data-tile="busy-none">
        Keyboard
      </Button>
    </div>
  ),
  play: async () => {
    const tile = (id: string) => document.querySelector<HTMLElement>(`[data-tile="${id}"]`)!;
    /* An element's or a range's box inside its tile. */
    const inTile = (id: string, at: Element | Range) => {
      const o = tile(id).getBoundingClientRect();
      const r = at.getBoundingClientRect();
      return [r.left - o.left, r.top - o.top, r.width, r.height].map(r2).join(" ");
    };
    const label = (id: string) => {
      const range = document.createRange();
      const text = document.createTreeWalker(tile(id), NodeFilter.SHOW_TEXT, (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)).nextNode()!;
      range.selectNode(text);
      return inTile(id, range);
    };
    const icon = (id: string) => inTile(id, tile(id).querySelector("svg")!);
    const height = (id: string) => r2(tile(id).getBoundingClientRect().height);
    const got = {
      icon: [icon("rest"), icon("busy")],
      spinner: inTile("busy", tile("busy").querySelector("[role=status]")!),
      label: [label("rest"), label("busy")],
      height: [height("rest"), height("busy"), height("rest-none"), height("busy-none")],
      without: label("rest-none"),
    };
    console.info(`LOOKS STILL ${JSON.stringify(got)}`);
    await expect(got.icon[1]).toBe(got.icon[0]);
    await expect(got.spinner).toBe(got.icon[0]);
    await expect(got.label[1]).toBe(got.label[0]);
    await expect(got.height[1]).toBe(got.height[0]);
    /* A spinner with no icon to stand over is 16px, where WebKit lays the
       tile's 12px text on a 15px line: one pixel taller there, as the native
       control was. */
    await expect(Math.abs(got.height[3] - got.height[2])).toBeLessThanOrEqual(chromium() ? 0 : 1);
    /* The twin: the label without an icon isn't where the one with it is. */
    await expect(got.without).not.toBe(got.label[0]);
  },
};

/* ── unavailable ──────────────────────────────────────────────────────── */

const presses = { vote: 0 };
function Votes() {
  const [off, setOff] = useState(false);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <Button data-vote="" unavailable={off} onClick={() => presses.vote++}>
        Vote
      </Button>
      <Button data-toggle="" onClick={() => setOff(true)}>
        Off
      </Button>
      <button data-native="" type="button" onClick={(e) => ((e.currentTarget as HTMLButtonElement).disabled = true)}>
        Native
      </button>
    </div>
  );
}

export const UnavailableKeepsFocusAndSwallowsPresses: Story = {
  render: () => <Votes />,
  play: async () => {
    presses.vote = 0;
    const q = (s: string) => document.querySelector<HTMLButtonElement>(`[data-${s}]`)!;
    await userEvent.click(q("toggle"));
    await waitFor(() => expect(q("vote").getAttribute("aria-disabled")).toBe("true"));
    await expect([q("vote").disabled, q("vote").tabIndex, getComputedStyle(q("vote")).opacity, getComputedStyle(q("vote")).cursor]).toEqual([false, 0, "0.5", "not-allowed"]);
    await userEvent.click(q("vote"));
    q("vote").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(presses.vote).toBe(0);
    await expect(document.activeElement).toBe(q("vote"));
    await userEvent.tab();
    await expect(document.activeElement).toBe(q("toggle"));
    /* The twin: a native disabled drops focus the moment it lands. */
    q("native").focus();
    await userEvent.click(q("native"));
    await expect(document.activeElement).not.toBe(q("native"));
  },
};

/* ── Contrast ─────────────────────────────────────────────────────────── */

const SCHEMES = ["primary", "orange", "teal", "purple", "amber", "success", "error", "neutral"] as const;
const VARIANTS = ["tint", "tint-subtle", "plain"] as const;
type Ground = "light-page" | "light-card" | "dark-page" | "dark-card";

function Samples({ ground }: { ground: Ground }) {
  const dark = ground.startsWith("dark");
  const buttons: ReactNode[] = VARIANTS.flatMap((variant) =>
    SCHEMES.map((scheme) => (
      <Button key={`${variant}-${scheme}`} variant={variant} colorScheme={scheme} size="sm" data-probe={`${ground} ${variant} ${scheme}`}>
        Label
      </Button>
    )),
  );
  const inner = <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>{buttons}</div>;
  return (
    <div className={dark ? "dark" : undefined} style={{ padding: 16, background: dark ? "#0c0a09" : "#fafaf9" }}>
      {ground.endsWith("card") ? <Card>{inner}</Card> : inner}
    </div>
  );
}

const probe = (ground: Ground, variant: string, scheme: string) => document.querySelector<HTMLElement>(`[data-probe="${ground} ${variant} ${scheme}"]`)!;

/* The lowest ratio per look across its states, and where. */
async function sweep(real: RealInput, ground: Ground[]) {
  const low: Record<string, { ratio: number; at: string }> = {};
  const note = (look: string, ratio: number, at: string) => {
    if (!low[look] || ratio < low[look].ratio) low[look] = { ratio: r2(ratio), at };
  };
  for (const g of ground)
    for (const variant of VARIANTS) for (const scheme of SCHEMES) note(variant, textContrast(probe(g, variant, scheme)), `${scheme} at rest, ${g}`);
  if (!chromium()) return low;
  /* Where the ruling found each lowest: hover and press, real. */
  const worst: Ground = ground.includes("dark-card") ? "dark-card" : "light-page";
  for (const variant of ["tint", "tint-subtle"] as const) {
    for (const scheme of SCHEMES) {
      const el = probe(worst, variant, scheme);
      const selector = `[data-probe="${worst} ${variant} ${scheme}"]`;
      await real.commands.realHover(selector);
      note(variant, textContrast(el), `${scheme} hovered, ${worst}`);
      if (variant === "tint") {
        const held = real.commands.realDrag(selector, 0, { holdMs: 250 });
        await wait(130);
        note(variant, textContrast(el), `${scheme} pressed, ${worst}`);
        await held;
      }
    }
  }
  return low;
}

export const TheLightLabelsPass: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <style>{STILL}</style>
      {(["light-page", "light-card"] as const).map((g) => (
        <Samples key={g} ground={g} />
      ))}
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const low = await sweep(real, ["light-page", "light-card"]);
    console.info(`LOOKS LIGHT ${JSON.stringify(low)}`);
    /* The ruling's lowest figures, as literals. */
    await expect(low.tint.ratio).toBeGreaterThanOrEqual(4.67);
    await expect(low["tint-subtle"].ratio).toBeGreaterThanOrEqual(5.69);
    await expect(low.plain.ratio).toBeGreaterThanOrEqual(6.79);
  },
};

export const TheDarkLabelsPass: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <style>{STILL}</style>
      {(["dark-page", "dark-card"] as const).map((g) => (
        <Samples key={g} ground={g} />
      ))}
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const low = await sweep(real, ["dark-page", "dark-card"]);
    console.info(`LOOKS DARK ${JSON.stringify(low)}`);
    await expect(low.tint.ratio).toBeGreaterThanOrEqual(6.48);
    await expect(low["tint-subtle"].ratio).toBeGreaterThanOrEqual(8.05);
    await expect(low.plain.ratio).toBeGreaterThanOrEqual(6.32);
  },
};

/* ── compact and the sizes on tiles ───────────────────────────────────── */

const COMPACT = ["solid", "soft", "outline", "ghost", "link", "tint", "tint-subtle"] as const;

export const CompactIs30PxAndATileTakesNoSize: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <style>{STILL}</style>
      {COMPACT.map((v) => (
        <Button key={v} data-compact={v} variant={v} size="compact">
          Types
        </Button>
      ))}
      {(["xs", "lg"] as const).map((size) => (
        <Button key={size} data-tile={size} layout="tile" variant="solid" size={size}>
          Tile
        </Button>
      ))}
    </div>
  ),
  play: async () => {
    const height = (s: string) => r2(document.querySelector<HTMLElement>(s)!.getBoundingClientRect().height);
    const compact = COMPACT.map((v) => `${v} ${height(`[data-compact="${v}"]`)}`);
    const tiles = (["xs", "lg"] as const).map((s) => height(`[data-tile="${s}"]`));
    console.info(`LOOKS SIZES ${JSON.stringify({ compact, tiles })}`);
    await expect(compact).toEqual(COMPACT.map((v) => `${v} 30`));
    await expect(tiles[0]).toBe(tiles[1]);
  },
};
