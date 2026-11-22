import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Input } from "./components/atoms/Input/Input";
import { PasswordInput } from "./components/atoms/PasswordInput/PasswordInput";
import { Combobox } from "./components/atoms/Combobox/Combobox";
import { Select } from "./components/atoms/Select/Select";
import { MultiSelect } from "./components/atoms/MultiSelect/MultiSelect";
import { Textarea } from "./components/atoms/Textarea/Textarea";
import { CheckboxGroup } from "./components/molecules/CheckboxGroup/CheckboxGroup";
import { Card } from "./components/atoms/Card/Card";
import { contrast, paint, rgba, textContrast, textOn } from "./test/painted";
import { realInputOrSkip } from "./test/real-input";

/**
 * Every field, in and out of an error, at rest, focused and hovered, measured
 * as painted in Chromium and WebKit (tagged `real-input` for the project that
 * runs both): Input, PasswordInput, Combobox, Select, MultiSelect, Textarea
 * (no `slate`) and CheckboxGroup's `panel`, in all five variants, on the page,
 * a Card and a dark slate Card (gray-800), light and dark.
 *
 * - **The chevron** Combobox, Select and MultiSelect draw takes its field's
 *   slot ink, the error's in an error: 3:1, the only sign the field opens a
 *   list. Pinned as the lowest per variant, theme and state.
 * - **Every field has an edge:** the better of its fill and its edge (Input's
 *   border, Select's inset ring) against what's outside it, at 3:1, `ghost`
 *   exempt outside an error. The same readings hold every field's typed or
 *   chosen text to 4.5:1 and its icons to 3:1, in and out of an error. In an error the edge is the error's ink, error-500
 *   and dark error-400, at rest, hovered and focused: the variant's focus
 *   border must not win over it, so the painted edge is read, never the class
 *   list.
 * - **An error's inks hold in every state:** typed or chosen text at 4.5:1 and
 *   the slot (start icon, reveal toggle, chevron) at 3:1, focused and hovered
 *   as at rest. No field in an error changes its fill.
 *
 * Each has a twin drawn as 5.21 had it, with inline styles on the same fields,
 * which the same reading fails: the gray-400 chevron, white's hairline, dark's
 * error-500 edge, dark slate with no edge, the focus border taking over an
 * error, and slate's error-600 text on its lightened focus fill.
 *
 * Focus is `focus()` with `:focus-visible` confirmed (`focus-within` for
 * MultiSelect). Hover is a real pointer, in Chromium only: Storybook's dev CSS
 * keeps Tailwind's `@media (hover: hover)` nested in `&:hover`, which
 * Playwright's WebKit drops.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Fields in an error/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["outline", "white", "soft", "slate", "ghost"] as const;
type Variant = (typeof VARIANTS)[number];
const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card", "dark-slate-card"] as const;
type Ground = (typeof GROUNDS)[number];
const STATES = ["rest", "focused", "hovered"] as const;
type State = (typeof STATES)[number];
type Kind = "input" | "password" | "combobox" | "select" | "multiselect" | "textarea" | "panel";

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
const noop = () => {};
const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];
const ERROR_INK = { light: "rgb(185, 32, 32)", dark: "rgb(248, 113, 113)" };

const Magnifier = () => (
  <svg data-icon="" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="7" cy="7" r="5" />
    <path d="m11 11 3 3" />
  </svg>
);

function Field({ kind, variant, error }: { kind: Kind; variant: Variant; error: boolean }) {
  const e = error ? { errorMessage: "Required" } : {};
  const field = (() => {
    switch (kind) {
      case "input":
        return <Input aria-label="Input" variant={variant} defaultValue="Typed" startIcon={<Magnifier />} {...e} />;
      case "password":
        return <PasswordInput aria-label="Password" variant={variant} defaultValue="secret" {...e} />;
      case "combobox":
        return <Combobox options={OPTIONS} value="a" onChange={noop} variant={variant} {...e} />;
      case "select":
        return <Select options={OPTIONS} value="a" onChange={noop} variant={variant} {...e} />;
      case "multiselect":
        return <MultiSelect options={OPTIONS} value={["a"]} onChange={noop} display="count" variant={variant} {...e} />;
      case "textarea":
        return <Textarea aria-label="Textarea" variant={variant === "slate" ? "outline" : variant} defaultValue="Typed" {...e} />;
      case "panel":
        return <CheckboxGroup variant="panel" options={OPTIONS} value={[]} onChange={noop} {...e} />;
    }
  })();
  return (
    <div data-field={kind} data-variant={variant} data-error={error ? "yes" : "no"}>
      {field}
    </div>
  );
}

function GroundBox({ id, children }: { id: Ground; children: ReactNode }) {
  const dark = id.startsWith("dark");
  const inner = id === "dark-slate-card" ? <Card variant="slate">{children}</Card> : id.endsWith("card") ? <Card>{children}</Card> : children;
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 280, background: dark ? "#0c0a09" : "#ffffff" }}>
      {inner}
    </div>
  );
}

/* One ground's fields: `kinds` in every variant, in and out of an error. */
function Grounds({ kinds, errors = [false, true], grounds = GROUNDS }: { kinds: Kind[]; errors?: boolean[]; grounds?: readonly Ground[] }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <style>{STILL}</style>
      <div data-pointer-rest="" tabIndex={-1} style={{ width: 24, height: 24 }} />
      {grounds.map((g) => (
        <GroundBox key={g} id={g}>
          <div style={{ display: "grid", gap: 8 }}>
            {VARIANTS.flatMap((v) =>
              errors.flatMap((error) =>
                kinds
                  .filter((k) => !(k === "textarea" && v === "slate") && !(k === "panel" && (v !== "outline" || !error)))
                  .map((k) => <Field key={`${v}-${error}-${k}`} kind={k} variant={v} error={error} />),
              ),
            )}
          </div>
        </GroundBox>
      ))}
    </div>
  );
}

/* ── Reading a field ─────────────────────────────────────────────────── */

type Ref = {
  ground: Ground;
  variant: Variant;
  error: boolean;
  kind: Kind;
  /** What takes focus. */
  focus: HTMLElement | null;
  /** What draws the edge and the fill. */
  box: HTMLElement;
  /** What the pointer rests on to hover the field. */
  hover: HTMLElement;
  text?: HTMLElement;
  slot?: Element;
  /** Painted beneath the slot without being its ancestor: the input it sits over. */
  under?: Element;
  chevron?: Element;
};

function refs(canvas: Element): Ref[] {
  return [...canvas.querySelectorAll<HTMLElement>("[data-field]")].map((holder) => {
    const ground = holder.closest<HTMLElement>("[data-ground]")!.dataset.ground as Ground;
    const variant = holder.dataset.variant as Variant;
    const error = holder.dataset.error === "yes";
    const kind = holder.dataset.field as Kind;
    const base = { ground, variant, error, kind };
    switch (kind) {
      case "input": {
        const input = holder.querySelector("input")!;
        return { ...base, focus: input, box: input, hover: input, text: input, slot: holder.querySelector("[data-icon]")!.parentElement!, under: input };
      }
      case "password": {
        const input = holder.querySelector("input")!;
        return { ...base, focus: input, box: input, hover: input, text: input, slot: holder.querySelector("button")!, under: input };
      }
      case "combobox": {
        const input = holder.querySelector("input")!;
        const chevron = holder.querySelector("svg")!;
        return { ...base, focus: input, box: input, hover: input, text: input, slot: chevron, under: input, chevron };
      }
      case "select": {
        const button = holder.querySelector<HTMLElement>("button[aria-haspopup]")!;
        const chevron = button.querySelector("svg")!;
        return { ...base, focus: button, box: button, hover: button, text: button.querySelector<HTMLElement>("span")!, slot: chevron, chevron };
      }
      case "multiselect": {
        const button = holder.querySelector<HTMLElement>("button[aria-haspopup]")!;
        const shell = button.parentElement!;
        const chevron = shell.querySelector("svg")!;
        const count = shell.querySelector<HTMLElement>(":scope > span[aria-hidden='true']")!;
        return { ...base, focus: button, box: shell, hover: button, text: count, slot: chevron, chevron };
      }
      case "textarea": {
        const area = holder.querySelector("textarea")!;
        return { ...base, focus: area, box: area, hover: area, text: area };
      }
      case "panel": {
        const panel = holder.querySelector<HTMLElement>("fieldset > div")!;
        return { ...base, focus: null, box: panel, hover: panel };
      }
    }
  });
}

/* Splits a computed `box-shadow` into its shadows, commas inside a color kept. */
const shadows = (value: string) => value.match(/(?:[^,(]|\([^)]*\))+/g)?.map((s) => s.trim()) ?? [];

/** The color a field draws its edge in: its border, or the inset ring Select's
    and MultiSelect's triggers draw instead. */
function edgeInk(el: Element): string {
  const style = getComputedStyle(el);
  if (parseFloat(style.borderTopWidth) > 0) return style.borderTopColor;
  for (const shadow of shadows(style.boxShadow)) {
    if (!/\binset\b/.test(shadow)) continue;
    const color = shadow.match(/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/)?.[0];
    const lengths = shadow.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/, "").match(/-?[\d.]+px/g) ?? [];
    if (color && rgba(color)[3] > 0 && parseFloat(lengths[3] ?? "0") > 0) return color;
  }
  return "rgba(0, 0, 0, 0)";
}

/** The focus ring an Input-like field draws outside its border: the outer
    shadow with the widest spread. Empty when there's none. */
function ringInk(el: Element): string {
  let widest = 0;
  let ink = "";
  for (const shadow of shadows(getComputedStyle(el).boxShadow)) {
    if (/\binset\b/.test(shadow)) continue;
    const color = shadow.match(/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/)?.[0];
    const spread = parseFloat((shadow.replace(color ?? "", "").match(/-?[\d.]+px/g) ?? [])[3] ?? "0");
    if (color && rgba(color)[3] > 0 && spread > widest) [widest, ink] = [spread, opaque(color)];
  }
  return ink;
}

const round = (n: number) => Math.round(n * 100) / 100;
const rgb = (c: number[]) => `rgb(${c.map(Math.round).join(", ")})`;
const opaque = (color: string) => rgb(rgba(color).slice(0, 3));

type Reading = {
  edge: number;
  fill: number;
  boundary: number;
  ink: string;
  /** The field's own fill, as painted. */
  ground: string;
  ring: string;
  text?: number;
  textInk?: string;
  slot?: number;
  chevron?: number;
};

function read(r: Ref): Reading {
  const outside = textOn(r.box.parentElement!).ground;
  const ink = edgeInk(r.box);
  const edge = round(contrast(paint([rgb(outside), ink]), outside));
  const ground = textOn(r.box).ground;
  const fill = round(contrast(ground, outside));
  return {
    edge,
    fill,
    boundary: Math.max(edge, fill),
    ink: opaque(ink),
    ground: rgb(ground),
    ring: ringInk(r.box),
    text: r.text ? round(textContrast(r.text)) : undefined,
    textInk: r.text ? opaque(getComputedStyle(r.text).color) : undefined,
    slot: r.slot ? round(textContrast(r.slot, undefined, r.under)) : undefined,
    chevron: r.chevron ? round(textContrast(r.chevron, undefined, r.under)) : undefined,
  };
}

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const chromium = () => navigator.userAgent.includes("Chrome");

/* The fields a hover can change: Select's and MultiSelect's tinting triggers,
   and every `ghost` field but PasswordInput, whose field is Input's. The
   others set no hover style, so hovered reads as rest, and a real pointer
   costs a tenth of a second a field. */
const tints = (r: Ref) =>
  (r.variant === "ghost" && r.kind !== "password") || ((r.kind === "select" || r.kind === "multiselect") && r.variant !== "outline");

/**
 * Every field read in every state it can be read in here: at rest, focused,
 * and, in Chromium, hovered where a hover can change it. Keyed
 * `ground|variant|error|kind|state`.
 */
async function measure(canvas: Element): Promise<Map<string, Reading>> {
  const real = realInputOrSkip();
  const all = refs(canvas);
  const out = new Map<string, Reading>();
  const key = (r: Ref, s: State) => `${r.ground}|${r.variant}|${r.error ? "error" : "fine"}|${r.kind}|${s}`;

  /* At rest: the pointer on nothing with a hover style, focus nowhere. */
  await real?.commands.realHover("[data-pointer-rest]");
  (document.activeElement as HTMLElement | null)?.blur?.();
  await frame();
  for (const r of all) out.set(key(r, "rest"), read(r));

  /* Focused. A key first, so a script's focus counts as the keyboard's. */
  canvas.querySelector<HTMLElement>("[data-pointer-rest]")!.focus();
  await real?.commands.realPress(["Shift"]);
  const premise: string[] = [];
  for (const r of all) {
    if (!r.focus) continue;
    r.focus.focus();
    await frame();
    const shows = r.kind === "multiselect" ? r.box.matches(":focus-within") : r.focus.matches(":focus-visible");
    if (document.activeElement !== r.focus || !shows) premise.push(key(r, "focused"));
    out.set(key(r, "focused"), read(r));
  }
  (document.activeElement as HTMLElement | null)?.blur?.();
  await expect(premise, "every field focused, its focus showing").toEqual([]);

  if (real && chromium()) {
    for (const [i, r] of all.entries()) {
      if (!tints(r)) continue;
      r.hover.setAttribute("data-hover-probe", String(i));
      await real.commands.realHover(`[data-hover-probe="${i}"]`);
      await waitFor(() => expect(r.hover.matches(":hover")).toBe(true));
      out.set(key(r, "hovered"), read(r));
      r.hover.removeAttribute("data-hover-probe");
    }
    await real.commands.realHover("[data-pointer-rest]");
  }
  return out;
}

const parse = (k: string) => {
  const [ground, variant, error, kind, state] = k.split("|");
  return { ground: ground as Ground, variant: variant as Variant, error: error === "error", kind: kind as Kind, state: state as State, theme: ground.startsWith("dark") ? "dark" : "light" };
};
const lowest = (values: number[]) => (values.length ? Math.min(...values) : NaN);

/* ── The chevron ─────────────────────────────────────────────────────── */

/* The lowest across Combobox, Select and MultiSelect, the page, a Card and a
   dark slate Card, per state: [rest, focused, hovered]. The rulings' table. */
const CHEVRON: Record<Variant | "error", { light: number[]; dark: number[] }> = {
  outline: { light: [5.44, 5.44, 5.44], dark: [6.68, 6.68, 6.68] },
  white: { light: [5.99, 5.99, 5.74], dark: [6.01, 6.01, 4.07] },
  soft: { light: [5.49, 5.49, 4.77], dark: [6.01, 6.01, 4.07] },
  slate: { light: [6.9, 5.12, 5.12], dark: [6.93, 6.01, 6.01] },
  ghost: { light: [5.99, 5.49, 5.49], dark: [6.01, 6.01, 6.01] },
  error: { light: [3.71, 3.71, 3.71], dark: [5.48, 5.48, 5.48] },
};

type Theme = "light" | "dark";
const inTheme = (theme: Theme) => GROUNDS.filter((g) => g.startsWith(theme));
/* Each check runs per theme, and in and out of an error apart: a real pointer
   costs a tenth of a second a field here and about twice that on CI, and a
   story has 15 seconds. */
const name = (theme: Theme, error: boolean) => `${theme}, ${error ? "in an error" : "outside one"}`;

const chevronCheck = (theme: Theme, error: boolean): Story => ({
  render: () => <Grounds kinds={["combobox", "select", "multiselect"]} grounds={inTheme(theme)} errors={[error]} />,
  play: async ({ canvasElement }) => {
    const readings = await measure(canvasElement);
    const states = chromium() ? STATES : (["rest", "focused"] as const);
    const table: Record<string, number[]> = {};
    for (const row of error ? (["error"] as const) : VARIANTS) {
      const pick = (state: State) => lowest([...readings].filter(([k]) => parse(k).state === state && (error || parse(k).variant === row)).map(([, r]) => r.chevron!));
      /* `outline` never tints, so it isn't hovered: hovered is its rest. */
      table[row] = states.filter((s) => !(row === "outline" && s === "hovered")).map(pick);
    }
    console.info(`CHEVRONS ${name(theme, error)} ${JSON.stringify(table)}`);
    for (const [row, seen] of Object.entries(table)) {
      await expect(seen, row).toEqual(CHEVRON[row as Variant | "error"][theme].slice(0, seen.length));
    }

    /* The twin: 5.21's chevron, gray-400 and dark gray-500 whatever the
       field, on the same fields at rest. */
    let old = Infinity;
    for (const r of refs(canvasElement)) {
      const svg = r.chevron as SVGElement;
      svg.style.color = theme === "dark" ? "var(--roster-gray-500, #65635f)" : "var(--roster-gray-400, #a8a29e)";
      old = Math.min(old, round(textContrast(svg, undefined, r.under)));
      svg.style.color = "";
    }
    console.info(`CHEVRONS ${name(theme, error)} old ${old}`);
    await expect(old).toBeLessThan(3);
    if (!error) await expect(old).toBe(theme === "dark" ? 2.53 : 2.31);
  },
});

export const TheChevronTakesTheSlotInkInLight = chevronCheck("light", false);
export const TheChevronTakesTheSlotInkInLightInAnError = chevronCheck("light", true);
export const TheChevronTakesTheSlotInkInDark = chevronCheck("dark", false);
export const TheChevronTakesTheSlotInkInDarkInAnError = chevronCheck("dark", true);

/* ── The edge ────────────────────────────────────────────────────────── */

/* An error's edge against what's outside the field, every field, variant and
   state: error-500 on a light ground, error-400 on a dark one. */
const ERROR_EDGE: Record<Ground, number> = { "light-page": 6.38, "light-card": 6.38, "dark-page": 7.14, "dark-card": 6.32, "dark-slate-card": 5.48 };
/* `white` outside an error, the field-border token: at rest and hovered, and
   focused, where Input, Combobox and Textarea take the focus-border token. */
const WHITE_EDGE: Record<Ground, number> = { "light-page": 5.99, "light-card": 5.99, "dark-page": 7.83, "dark-card": 6.93, "dark-slate-card": 6.01 };
const WHITE_FOCUSED: Record<Ground, number> = { "light-page": 6.37, "light-card": 6.37, "dark-page": 7.31, "dark-card": 6.47, "dark-slate-card": 5.61 };
/* Dark `slate` outside an error draws gray-400. */
const SLATE_DARK_EDGE: Partial<Record<Ground, number>> = { "dark-page": 7.83, "dark-card": 6.93, "dark-slate-card": 6.01 };

const edgeCheck = (theme: Theme, error: boolean): Story => ({
  render: () => (
    <Grounds kinds={["input", "password", "combobox", "select", "multiselect", "textarea", "panel"]} grounds={inTheme(theme)} errors={[error]} />
  ),
  play: async ({ canvasElement }) => {
    const readings = await measure(canvasElement);
    console.info(`FIELD EDGES ${name(theme, error)} ${JSON.stringify(Object.fromEntries(readings))}`);
    const under: string[] = [];
    const notRed: string[] = [];
    const off: string[] = [];
    for (const [k, r] of readings) {
      const p = parse(k);
      if (error) {
        if (r.ink !== ERROR_INK[theme]) notRed.push(`${k}: ${r.ink}`);
        if (r.edge !== ERROR_EDGE[p.ground]) off.push(`${k}: ${r.edge}`);
      } else {
        /* `white` and dark `slate`, as the rulings measured them. A focused
           Select or MultiSelect draws the page's ring, not a border. */
        const ring = p.state === "focused" && (p.kind === "select" || p.kind === "multiselect");
        if (p.variant === "white" && !ring) {
          const want = p.state === "focused" ? WHITE_FOCUSED[p.ground] : WHITE_EDGE[p.ground];
          if (r.edge !== want) off.push(`${k}: ${r.edge}, not ${want}`);
        }
        if (p.variant === "slate" && theme === "dark" && p.state !== "focused" && r.edge !== SLATE_DARK_EDGE[p.ground]) off.push(`${k}: ${r.edge}`);
        if (p.variant === "ghost") continue;
      }
      if (r.boundary < 3) under.push(`${k}: ${r.boundary}`);
    }
    await expect(under, "under 3:1").toEqual([]);
    await expect(notRed, "an error's edge not in the error's ink").toEqual([]);
    await expect(off, "off its figure").toEqual([]);
    /* And every field's typed or chosen text at 4.5:1, its slot and chevron
       at 3:1, in every state read, in and out of an error. */
    const faint = [...readings].flatMap(([k, r]) => [
      ...(r.text !== undefined && r.text < 4.5 ? [`${k} text: ${r.text}`] : []),
      ...(r.slot !== undefined && r.slot < 3 ? [`${k} slot: ${r.slot}`] : []),
      ...(r.chevron !== undefined && r.chevron < 3 ? [`${k} chevron: ${r.chevron}`] : []),
    ]);
    await expect(faint, "text under 4.5:1, or an icon under 3:1").toEqual([]);

    if (error) {
      /* In an error the fill and the text's ink hold in every state, and a
         focused Input, PasswordInput, Combobox or Textarea rings in the
         error's ink. Contrast alone can't see these: a `soft` field turning
         white on focus still passes, and so does a `ghost` Select whose red
         turns gray-900 on hover. */
      const moved: string[] = [];
      for (const [k, r] of readings) {
        const p = parse(k);
        if (p.state === "rest") continue;
        const rest = readings.get(k.replace(/\|[a-z]+$/, "|rest"))!;
        if (r.ground !== rest.ground) moved.push(`${k} fill: ${rest.ground} to ${r.ground}`);
        if (r.textInk !== rest.textInk) moved.push(`${k} text: ${rest.textInk} to ${r.textInk}`);
        const ringed = p.kind === "input" || p.kind === "password" || p.kind === "combobox" || p.kind === "textarea";
        if (p.state === "focused" && ringed && r.ring !== ERROR_INK[theme]) moved.push(`${k} ring: ${r.ring}`);
      }
      await expect(moved, "an error's fill, text or ring moved").toEqual([]);
    }

    /* The twins, drawn as 5.21 had them on the same fields. */
    const one = (ground: Ground, variant: Variant, kind: Kind) =>
      refs(canvasElement).find((r) => r.ground === ground && r.variant === variant && r.kind === kind)!;
    const twin = (r: Ref, styles: Partial<CSSStyleDeclaration>) => {
      Object.assign(r.box.style, styles);
      const reading = read(r);
      for (const prop of Object.keys(styles)) r.box.style.removeProperty(prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
      return reading;
    };
    const card = `${theme}-card` as Ground;
    const dark = theme === "dark";
    if (!error) {
      /* White's hairline, gray-300 on white and gray-700 on a dark Card; and
         slate with no edge on a Card, which light's fill covers and dark's
         doesn't. */
      const twins = {
        white: twin(one(dark ? card : "light-page", "white", "input"), { borderColor: dark ? "var(--roster-gray-700, #44403c)" : "var(--roster-gray-300, #d6d3d1)" }).boundary,
        slate: twin(one(card, "slate", "select"), { boxShadow: "none" }).boundary,
      };
      console.info(`FIELD EDGES ${name(theme, error)} old ${JSON.stringify(twins)}`);
      await expect(twins).toEqual(dark ? { white: 1.7, slate: 1 } : { white: 1.49, slate: 10.27 });
      return;
    }
    /* An error's edge at error-500 on an outline field on a Card, under the
       bar in dark only. */
    const old = twin(one(card, "outline", "input"), { borderColor: "var(--roster-error-500, #b92020)" }).boundary;
    console.info(`FIELD EDGES ${name(theme, error)} old ${old}`);
    await expect(old).toBe(dark ? 2.74 : 6.38);
    /* An error's focused edge taken by the focus border, as 5.21 drew 34
       field and variant pairs: the reading sees it isn't the error's ink. */
    const focusedOld = one(`${theme}-page` as Ground, "outline", "input");
    focusedOld.focus!.focus();
    await frame();
    const taken = twin(focusedOld, { borderColor: "var(--roster-control-border-focus)" }).ink;
    focusedOld.focus!.blur();
    await expect(taken).not.toBe(ERROR_INK[theme]);
  },
});

export const EveryFieldHasAnEdgeInLight = edgeCheck("light", false);
export const EveryFieldHasAnEdgeInLightInAnError = edgeCheck("light", true);
export const EveryFieldHasAnEdgeInDark = edgeCheck("dark", false);
export const EveryFieldHasAnEdgeInDarkInAnError = edgeCheck("dark", true);

/* ── An error's inks ─────────────────────────────────────────────────── */

/* The lowest in an error, in every state: typed or chosen text, light
   slate's error-300 on gray-700 and dark error-400 on a gray-800 fill; the
   slot, slate's error-400 on gray-700 and dark error-400 on gray-800. */
const ERROR_LOWEST: Record<Theme, { text: number; slot: number }> = { light: { text: 5.41, slot: 3.71 }, dark: { text: 5.48, slot: 5.48 } };

const inksCheck = (theme: Theme): Story => ({
  render: () => <Grounds kinds={["input", "password", "combobox", "select", "multiselect", "textarea"]} errors={[true]} grounds={inTheme(theme)} />,
  play: async ({ canvasElement }) => {
    const readings = await measure(canvasElement);
    const states = chromium() ? STATES : (["rest", "focused"] as const);
    const low = (what: "text" | "slot") =>
      states.map((s) => lowest([...readings].filter(([k]) => parse(k).state === s).flatMap(([, r]) => (r[what] === undefined ? [] : [r[what]!]))));
    const seen = { text: low("text"), slot: low("slot") };
    console.info(`ERROR INKS ${theme} ${JSON.stringify(seen)} ${JSON.stringify(Object.fromEntries(readings))}`);
    /* The same in every state: no fill moves. */
    const want = ERROR_LOWEST[theme];
    await expect(seen).toEqual({ text: states.map(() => want.text), slot: states.map(() => want.slot) });

    /* The twins, 5.21's: a light slate field in an error, error-600 text on
       gray-700 at rest and on its gray-600 focus fill; a dark `soft` Select
       in an error hovered to gray-700. */
    if (theme === "light") {
      const input = refs(canvasElement).find((r) => r.ground === "light-page" && r.variant === "slate" && r.kind === "input")!;
      input.box.style.color = "var(--roster-error-600, #991b1b)";
      const rest = round(textContrast(input.box));
      input.box.style.backgroundColor = "var(--roster-gray-600, #57534e)";
      const focused = round(textContrast(input.box));
      input.box.style.color = input.box.style.backgroundColor = "";
      console.info(`ERROR INKS old ${JSON.stringify({ rest, focused })}`);
      await expect({ rest, focused }).toEqual({ rest: 1.24, focused: 1.09 });
    } else {
      const select = refs(canvasElement).find((r) => r.ground === "dark-page" && r.variant === "soft" && r.kind === "select")!;
      select.box.style.backgroundColor = "var(--roster-gray-700, #44403c)";
      const hovered = round(textContrast(select.text!));
      select.box.style.backgroundColor = "";
      console.info(`ERROR INKS old ${hovered}`);
      await expect(hovered).toBe(3.71);
    }
  },
});

export const AnErrorsInksHoldInEveryStateInLight = inksCheck("light");
export const AnErrorsInksHoldInEveryStateInDark = inksCheck("dark");
