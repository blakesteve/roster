import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { RadioTileGroup, type RadioTileGroupProps, type RadioTileOption } from "./RadioTileGroup";
import { differs, goldLook, readLook, type Look } from "../../../test/tile-look";
import { TILE_GOLD } from "../../../test/tile-parity-gold";
import { Card } from "../../atoms/Card/Card";
import { textContrast } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Tiles in a radio group, checked rendered, with real keys and a real mouse
 * in Chromium and WebKit, and through Chromium's accessibility tree.
 *
 * - **One tab stop, the arrows, Home and End.** Tab reaches the group once
 *   and leaves it on the next press; Shift+Tab comes back to it. The arrows
 *   move and choose in the tiles' order (Down is the next tile in a grid of
 *   two), wrapping and skipping a disabled tile; Home and End go to the first
 *   and last that can be chosen. Each step pins where focus is, which tile is
 *   `aria-checked` and `data-checked`, and which says `data-focus-visible`.
 * - **The chosen look follows `data-checked`**: Roster's (the tile's edge in
 *   the checked token, two pixels with its inset ring) and a consumer's own,
 *   drawn by plain CSS on `variant="plain"`, measured on the chosen tile and
 *   its neighbor.
 * - **The focus ring is Roster's, outside the tile**, so outside a
 *   consumer's frame inside it: on keyboard focus, and gone after a click.
 * - **In forced colors the chosen tile still stands out**: its name is
 *   underlined and the `outlined` edge is two pixels, where box-shadows and
 *   fills are gone. The twin: outside forced colors, neither changes.
 * - **Tinted matches the bordered tiles it replaces**, unchosen, hovered
 *   (Chromium's: see `Button.tiles.checks.stories.tsx`), chosen and chosen
 *   hovered, field by field against the old build's captured values
 *   (`src/test/tile-parity-gold.ts`). One value moves: the unchosen name and
 *   icon are Roster's quiet ink, gray-400, where the old muted ink was 3.45:1.
 *   Keyboard focus is Roster's ring.
 * - **Tinted names clear 4.5:1**, every scheme, chosen and not, on a page and
 *   a Card in light and dark, pinned at their lowest.
 * - **Two to a row at 375px, three at 1280px**, by default.
 * - **The name is the label, once**, though each picture is an image whose
 *   alt text is that name: the radio's name, its description, its checked
 *   state, and the picture ignored; and the group's name, invalid state,
 *   message and `required`.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/RadioTileGroup/Checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const svg = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="${fill}"/></svg>`)}`;
/* Each picture's alt text is the option's name: a tile that let it through
   would be read "Harbor at dawn, Harbor at dawn". */
const COVERS: RadioTileOption[] = [
  ["harbor", "Harbor at dawn", "#f9d5c9", "Boats under a pink sky"],
  ["ridge", "Pine ridge", "#2f5d47", undefined],
  ["flats", "Salt flats", "#bfe0f5", undefined],
  ["market", "Night market", "#1f2440", undefined],
  ["orchard", "Orchard in May", "#7a9a4a", undefined],
].map(([value, label, fill, description]) => ({
  value: value!,
  label: label!,
  description,
  picture: <img src={svg(fill!)} alt={label} />,
}));
const WITH_DISABLED = COVERS.map((o) => (o.value === "orchard" ? { ...o, disabled: true } : o));

function Group(props: Partial<RadioTileGroupProps> & { initial?: string }) {
  const { initial = "", ...rest } = props;
  const [value, setValue] = useState(initial);
  return <RadioTileGroup label="Cover photo" options={COVERS} {...rest} value={value} onChange={setValue} />;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);
const nameOf = (el: Element | null | undefined) => el?.querySelector("[id^='headlessui-label']")?.textContent ?? "none";
const radios = (scope: ParentNode = document) => [...scope.querySelectorAll<HTMLElement>('[role="radio"]')];
const state = () => {
  const focused = document.activeElement;
  const focus = focused?.getAttribute("role") === "radio" ? nameOf(focused) : (focused?.textContent?.trim() ?? "body");
  const checked = radios().filter((r) => r.getAttribute("aria-checked") === "true").map(nameOf).join(",") || "none";
  const marked = radios().filter((r) => r.hasAttribute("data-checked")).map(nameOf).join(",") || "none";
  const visible = radios().filter((r) => r.hasAttribute("data-focus-visible")).map(nameOf).join(",") || "none";
  return `focus ${focus}, checked ${checked}, data-checked ${marked}, focus-visible ${visible}`;
};
/* A computed box-shadow without the transparent placeholders Tailwind's
   shadow and ring utilities compose in. */
const shadows = (el: Element) =>
  getComputedStyle(el)
    .boxShadow.split(/,(?![^(]*\))/)
    .map((x) => x.trim())
    .filter((x) => x !== "none" && !x.startsWith("rgba(0, 0, 0, 0)"))
    .join(", ") || "none";
/* Names each tile in the DOM, for the real mouse to aim at. */
const tag = () => radios().forEach((r) => r.setAttribute("data-tile", nameOf(r)));

/* ── One tab stop, the arrows, Home and End ───────────────────────────── */

export const OneTabStopTheArrowsHomeAndEnd: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 420 }}>
      <button type="button" data-check="before">
        Before
      </button>
      <div style={{ margin: "16px 0" }}>
        <Group options={WITH_DISABLED} columns={2} />
      </div>
      <button type="button">After</button>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* Safari's keyboard users reach buttons with Option+Tab. */
    const tab = chromium() ? "Tab" : "Alt+Tab";
    const back = chromium() ? "Shift+Tab" : "Alt+Shift+Tab";
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    const rows: string[] = [];
    for (const key of [tab, tab, back, "ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "ArrowLeft", "ArrowRight", "End", "Home", "End", "ArrowRight"]) {
      await real.commands.realPress([key]);
      await wait(120);
      rows.push(`${key.replace("Alt+", "")}: ${state()}`);
    }
    console.info(`TILES KEYS ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      "Tab: focus Harbor at dawn, checked none, data-checked none, focus-visible Harbor at dawn",
      "Tab: focus After, checked none, data-checked none, focus-visible none",
      "Shift+Tab: focus Harbor at dawn, checked none, data-checked none, focus-visible Harbor at dawn",
      "ArrowDown: focus Pine ridge, checked Pine ridge, data-checked Pine ridge, focus-visible Pine ridge",
      "ArrowRight: focus Salt flats, checked Salt flats, data-checked Salt flats, focus-visible Salt flats",
      "ArrowUp: focus Pine ridge, checked Pine ridge, data-checked Pine ridge, focus-visible Pine ridge",
      "ArrowLeft: focus Harbor at dawn, checked Harbor at dawn, data-checked Harbor at dawn, focus-visible Harbor at dawn",
      "ArrowLeft: focus Night market, checked Night market, data-checked Night market, focus-visible Night market",
      "ArrowRight: focus Harbor at dawn, checked Harbor at dawn, data-checked Harbor at dawn, focus-visible Harbor at dawn",
      "End: focus Night market, checked Night market, data-checked Night market, focus-visible Night market",
      "Home: focus Harbor at dawn, checked Harbor at dawn, data-checked Harbor at dawn, focus-visible Harbor at dawn",
      "End: focus Night market, checked Night market, data-checked Night market, focus-visible Night market",
      "ArrowRight: focus Harbor at dawn, checked Harbor at dawn, data-checked Harbor at dawn, focus-visible Harbor at dawn",
    ]);
  },
};

/* ── The chosen look ──────────────────────────────────────────────────── */

const OWN_LOOK = `
  .own-look .frame { display: block; padding: 6px; }
  .own-look .stamp { display: block; height: 4px; opacity: 0; background: rgb(185, 28, 28); }
  .own-look [data-checked] .frame { box-shadow: rgb(28, 25, 23) 0px 0px 0px 3px inset; }
  .own-look [data-checked] .stamp { opacity: 1; }
`;
const framed = COVERS.slice(0, 4).map((o) => ({
  ...o,
  picture: (
    <span className="frame">
      {o.picture}
      <span className="stamp" />
    </span>
  ),
}));

export const TheChosenLookFollowsDataChecked: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 560, display: "grid", gap: 24 }}>
      <style>{OWN_LOOK}</style>
      <div data-check="outlined">
        <Group options={COVERS.slice(0, 4)} />
      </div>
      <div data-check="plain" className="own-look">
        <Group options={framed} variant="plain" label="Framed" />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    tag();
    await real.commands.realClick('[data-check="outlined"] [data-tile="Pine ridge"]');
    await real.commands.realClick('[data-check="plain"] [data-tile="Pine ridge"]');
    await wait(150);
    const outlined = radios(document.querySelector('[data-check="outlined"]')!).slice(0, 2);
    const plain = radios(document.querySelector('[data-check="plain"]')!).slice(0, 2);
    const look = (r: HTMLElement) => {
      const s = getComputedStyle(r);
      return `${nameOf(r)} ${r.hasAttribute("data-checked") ? "chosen" : "not chosen"}: edge ${s.borderTopWidth} ${s.borderTopColor}, shadow ${shadows(r)}`;
    };
    const own = (r: HTMLElement) =>
      `${nameOf(r)}: frame ${getComputedStyle(r.querySelector(".frame")!).boxShadow}, stamp ${getComputedStyle(r.querySelector(".stamp")!).opacity}, edge ${getComputedStyle(r).borderTopWidth}`;
    const rows = [...outlined.map(look), ...plain.map(own)];
    console.info(`TILES LOOK ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      "Harbor at dawn not chosen: edge 1px rgb(101, 99, 95), shadow none",
      "Pine ridge chosen: edge 1px rgb(15, 100, 152), shadow rgb(15, 100, 152) 0px 0px 0px 1px inset",
      "Harbor at dawn: frame none, stamp 0, edge 0px",
      "Pine ridge: frame rgb(28, 25, 23) 0px 0px 0px 3px inset, stamp 1, edge 0px",
    ]);
  },
};

/* ── The focus ring ───────────────────────────────────────────────────── */

export const TheFocusRingIsOutsideTheTile: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 560 }} className="own-look">
      <style>{OWN_LOOK}</style>
      <button type="button" data-check="before">
        Before
      </button>
      <div style={{ marginTop: 16 }}>
        <Group options={framed} variant="plain" initial="ridge" label="Framed" />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
    await wait(150);
    const tile = document.activeElement as HTMLElement;
    const t = tile.getBoundingClientRect();
    const f = tile.querySelector(".frame")!.getBoundingClientRect();
    const inside = f.left >= t.left && f.right <= t.right && f.top >= t.top && f.bottom <= t.bottom;
    const byKey = `${nameOf(tile)} by key: ring ${shadows(tile)}, frame inside the tile ${inside}, focus-visible ${tile.hasAttribute("data-focus-visible")}`;
    tag();
    await real.commands.realClick('[data-tile="Salt flats"]');
    await wait(150);
    const clicked = radios().find((r) => r.getAttribute("aria-checked") === "true")!;
    const byClick = `${nameOf(clicked)} by click: ring ${shadows(clicked)}, focus-visible ${clicked.hasAttribute("data-focus-visible")}`;
    console.info(`TILES RING ${JSON.stringify([byKey, byClick])}`);
    await expect([byKey, byClick]).toEqual([
      "Pine ridge by key: ring rgb(255, 255, 255) 0px 0px 0px 2px, rgb(15, 100, 152) 0px 0px 0px 4px, frame inside the tile true, focus-visible true",
      "Salt flats by click: ring none, focus-visible false",
    ]);
  },
};

/* ── Forced colors ────────────────────────────────────────────────────── */

export const InForcedColorsTheChosenTileStillStandsOut: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 560, display: "grid", gap: 24 }}>
      <div data-check="outlined">
        <Group options={COVERS.slice(0, 3)} initial="ridge" />
      </div>
      <div data-check="plain">
        <Group options={COVERS.slice(0, 3)} initial="ridge" variant="plain" label="Plain" />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const read = () =>
      ["outlined", "plain"].flatMap((look) =>
        radios(document.querySelector(`[data-check="${look}"]`)!)
          .slice(0, 2)
          .map((r) => {
            const name = getComputedStyle(r.querySelector("[id^='headlessui-label']")!).textDecorationLine;
            return `${look} ${nameOf(r)}: name ${name}, edge ${getComputedStyle(r).borderTopWidth}`;
          }),
      );
    let forced: string[] = [];
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      forced = read();
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
    await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(false));
    const normal = read();
    await expect({ forced, normal }).toEqual({
      forced: [
        "outlined Harbor at dawn: name none, edge 1px",
        "outlined Pine ridge: name underline, edge 2px",
        "plain Harbor at dawn: name none, edge 0px",
        "plain Pine ridge: name underline, edge 0px",
      ],
      normal: [
        "outlined Harbor at dawn: name none, edge 1px",
        "outlined Pine ridge: name none, edge 1px",
        "plain Harbor at dawn: name none, edge 0px",
        "plain Pine ridge: name none, edge 0px",
      ],
    });
  },
};

/* ── Rows at 375px and 1280px ─────────────────────────────────────────── */

export const TwoToARowAt375ThreeAt1280: Story = {
  tags: ["real-input"],
  render: () => (
    <div data-check="rows">
      <Group options={COVERS} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const perRow = () => {
      const tops = radios(document.querySelector('[data-check="rows"]')!).map((r) => Math.round(r.getBoundingClientRect().top));
      return tops.filter((top) => top === tops[0]).length;
    };
    const rows: string[] = [];
    for (const width of [375, 1280]) {
      await real.page.viewport(width, 800);
      await wait(300);
      rows.push(`${width}: ${perRow()} to a row`);
    }
    await real.page.viewport(1280, 720);
    await expect(rows).toEqual(["375: 2 to a row", "1280: 3 to a row"]);
  },
};

/* ── What a screen reader is handed ───────────────────────────────────── */

export const TheNameIsTheLabelOnce: Story = {
  tags: ["ax-tree"],
  render: () => (
    <div style={{ width: 560 }} data-check="ax">
      <Group initial="ridge" required errorMessage="Choose a cover photo." />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const group = document.querySelector('[data-check="ax"] [role="radiogroup"]')!;
    group.setAttribute("data-ax-probe", "group");
    radios(group).slice(0, 2).forEach((r, i) => {
      r.setAttribute("data-ax-probe", `tile-${i}`);
      r.querySelector("img")!.setAttribute("data-ax-probe", `picture-${i}`);
    });
    const [g, tile0, tile1, picture0] = await real.commands.axStates(
      ["group", "tile-0", "tile-1", "picture-0"].map((p) => `[data-ax-probe="${p}"]`),
    );
    const rows = [
      `group: ${g.role} "${g.name}", invalid ${g.invalid}, required ${g.required}, described "${g.description}"`,
      `tile: ${tile0.role} "${tile0.name}", checked ${tile0.checked}, described "${tile0.description}"`,
      `tile: ${tile1.role} "${tile1.name}", checked ${tile1.checked}, described "${tile1.description}"`,
      `picture: ignored ${picture0.ignored}`,
    ];
    console.info(`TILES AX ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      'group: radiogroup "Cover photo", invalid true, required true, described "Choose a cover photo."',
      'tile: radio "Harbor at dawn", checked false, described "Boats under a pink sky"',
      'tile: radio "Pine ridge", checked true, described ""',
      "picture: ignored true",
    ]);
  },
};

/* ── Tinted matches the bordered tiles it replaces ────────────────────── */

const CARD = "#1a1f2e";
/* Roster's schemes take the hues' own steps from the region. */
const TINTED_REGION = {
  "--roster-primary-300": "#a5b4fc",
  "--roster-primary-500": "#6366f1",
  "--roster-success-300": "#6ee7b7",
  "--roster-success-500": "#10b981",
  "--roster-amber-300": "#fcd34d",
  "--roster-amber-500": "#f59e0b",
  "--roster-tile-border": "#2d3748",
  "--roster-gray-400": "#94a3b8",
} as CSSProperties;
const TINTED_ICON = (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ display: "block" }}>
    <rect width="16" height="16" fill="currentColor" />
  </svg>
);
const TINTED: RadioTileOption[] = [
  { value: "indigo", label: "Label", colorScheme: "primary", picture: TINTED_ICON },
  { value: "emerald", label: "Label", colorScheme: "success", picture: TINTED_ICON },
  { value: "amber", label: "Label", colorScheme: "amber", picture: TINTED_ICON },
];
const tinted = (value: string) => document.querySelector<HTMLElement>(`[data-tinted] [role="radio"][data-value="${value}"]`)!;

export const TintedMatchesTheOldTiles: Story = {
  tags: ["real-input"],
  render: () => (
    <div className="dark" style={{ ...TINTED_REGION, background: CARD, padding: 24, width: 560 }}>
      <style>{"*,*::before,*::after{transition:none!important}"}</style>
      <button type="button" data-check="before">
        Before
      </button>
      <div style={{ marginTop: 16 }} data-tinted="">
        <Group options={TINTED} columns={{ base: 1, sm: 3 }} variant="tinted" label="Method" initial="emerald" />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const eng = chromium() ? ("chromium" as const) : ("webkit" as const);
    const ids = ["indigo", "emerald", "amber"];
    const radioOf = (id: string) => tinted(id);
    radios(document.querySelector("[data-tinted]")!).forEach((r, i) => r.setAttribute("data-value", ids[i]!));
    const misses: string[] = [];
    const check = (id: string, state: string, changed: Partial<Look> = {}) => {
      const want = { ...goldLook(TILE_GOLD[`method-${id}`], eng, state), ...changed };
      /* The name's size is its Label's, not the tile's, and its color the tile's. */
      misses.push(...differs(readLook(radioOf(id), CARD), want, ["font"]).map((d) => `${id} ${state}: ${d}`));
    };
    /* Unchosen, the name and icon in Roster's quiet ink. */
    const quiet = { color: [148, 163, 184] };
    for (const id of ["indigo", "amber"]) check(id, "rest", quiet);
    check("emerald", "chosen");
    const label = getComputedStyle(radioOf("indigo").querySelector("[id^='headlessui-label']")!);
    const font = `${label.fontSize}/${label.lineHeight} ${label.fontWeight}`;
    if (chromium()) {
      for (const id of ["indigo", "amber"]) {
        await real.commands.realHover(`[data-tinted] [data-value="${id}"]`);
        check(id, "hover", quiet);
      }
      await real.commands.realHover('[data-tinted] [data-value="emerald"]');
      check("emerald", "chosenHover");
    }
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
    const ring = getComputedStyle(document.activeElement!).boxShadow;
    console.info(`TILES TINTED ${misses.length} misses, font ${font}, ring ${ring.includes("4px")}`);
    await expect(misses).toEqual([]);
    await expect(font).toBe("14px/20px 500");
    /* Roster's ring, offset outside the tile. */
    await expect(ring).toContain("4px");
  },
};

/* ── Tinted names clear 4.5:1 ─────────────────────────────────────────── */

const SCHEMES = ["primary", "orange", "teal", "purple", "amber", "success", "error", "neutral"] as const;

function NamesOn({ dark, card }: { dark: boolean; card: boolean }) {
  const groups = SCHEMES.flatMap((scheme) =>
    [false, true].map((chosen) => (
      <div key={`${scheme}-${chosen}`} data-name={`${scheme} ${chosen ? "chosen" : "unchosen"}`}>
        <RadioTileGroup label={`${scheme}`} labelClassName="rst:sr-only" options={[{ value: "x", label: "Morning", colorScheme: scheme }]} value={chosen ? "x" : ""} onChange={() => {}} variant="tinted" columns={1} />
      </div>
    )),
  );
  const inner = <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{groups}</div>;
  return (
    <div className={dark ? "dark" : undefined} data-tinted-ground={`${dark ? "dark" : "light"}-${card ? "card" : "page"}`} style={{ padding: 16, background: dark ? "#0c0a09" : "#fafaf9" }}>
      {card ? <Card>{inner}</Card> : inner}
    </div>
  );
}

export const TintedNamesPass: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
      {[false, true].flatMap((dark) => [false, true].map((card) => <NamesOn key={`${dark}${card}`} dark={dark} card={card} />))}
    </div>
  ),
  play: async () => {
    const low: Record<string, number> = {};
    let reached = 0;
    for (const ground of document.querySelectorAll<HTMLElement>("[data-tinted-ground]")) {
      for (const el of ground.querySelectorAll<HTMLElement>("[data-name]")) {
        const state = el.dataset.name!.endsWith("unchosen") ? "unchosen" : "chosen";
        /* The tile's name, not the group's own label beside it. */
        const ratio = textContrast(el.querySelector("[role='radio'] [id^='headlessui-label']")!);
        reached += 1;
        const key = `${ground.dataset.tintedGround!.split("-")[0]} ${state}`;
        low[key] = Math.min(low[key] ?? 99, Math.round(ratio * 100) / 100);
      }
    }
    console.info(`TILES TINTED NAMES ${JSON.stringify(low)}`);
    /* Four grounds, eight schemes, chosen and not. */
    await expect(reached).toBe(64);
    /* The unchosen name is Roster's quiet ink, at the ruling's figures. */
    await expect(low).toEqual({ "light unchosen": 5.74, "light chosen": 6, "dark unchosen": 6.93, "dark chosen": 8.58 });
  },
};
