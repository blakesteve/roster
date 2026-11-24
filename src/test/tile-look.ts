/* What a control paints and measures, as one comparable record: a check reads
   it from a Roster control and compares it with values captured from another
   build in the same browser. Colors are painted, not computed, so a hex and
   the same color written another way agree; a build's own alpha blends over
   `ground`, an opaque color, as it would on the page. */
import { paint } from "./painted";

export type Shadow = { color: number[]; geometry: string };

export type Look = {
  color: number[];
  bg: number[];
  borderWidth: string;
  borderColor: number[] | null;
  shadows: Shadow[];
  padding: string;
  radius: string;
  gap: string;
  font: string;
  opacity: string;
  cursor: string;
  height: number;
  outline: string;
  /** The spinner it shows: its box and its border, when it shows one. */
  spin?: string;
};

const round = (n: number) => Math.round(n * 100) / 100;
const px = (v: string) => round(parseFloat(v) || 0);

/* A `box-shadow`, split at its top-level commas, without the placeholders the
   shadow and ring utilities compose in: transparent, or with no size. */
function splitShadows(value: string) {
  if (value === "none") return [];
  return value
    .split(/,(?![^(]*\))/)
    .map((x) => x.trim())
    .filter((x) => {
      const color = /^(?:[a-z]+\([^)]*\)|#[\da-f]+|[a-z]+)/i.exec(x)?.[0] ?? "";
      /* No offset, blur or spread paints nothing, whatever its color. */
      const lengths = x.replace(color, "").match(/-?[\d.]+px/g) ?? [];
      const nothing = lengths.length > 0 && lengths.every((l) => parseFloat(l) === 0);
      return !nothing && !/^rgba\(\s*0,\s*0,\s*0,\s*0\)$/.test(color) && color !== "transparent";
    });
}

/**
 * `el`'s look, over `ground`, an opaque color (the page or card behind it).
 * The outline is its style and width, or "none".
 */
export function readLook(el: Element, ground: string): Look {
  const s = getComputedStyle(el);
  const bg = [ground, s.backgroundColor];
  const border = s.borderTopStyle === "none" ? "0px" : s.borderTopWidth;
  const spinner = el.querySelector("[role=status]");
  const box = spinner?.getBoundingClientRect() ?? new DOMRect();
  const shadows = splitShadows(s.boxShadow).map((x) => {
    const color = /(?:[a-z]+\((?:[^()]|\([^()]*\))*\)|#[\da-f]+)/i.exec(x)?.[0] ?? "rgb(0 0 0)";
    return { color: paint([ground, color]), geometry: x.replace(color, "").trim() };
  });
  return {
    color: paint([...bg, s.color]),
    bg: paint(bg),
    borderWidth: `${px(border)}px`,
    borderColor: px(border) > 0 ? paint([...bg, s.borderTopColor]) : null,
    shadows,
    padding: `${px(s.paddingTop)} ${px(s.paddingRight)} ${px(s.paddingBottom)} ${px(s.paddingLeft)}`,
    radius: `${px(s.borderTopLeftRadius)}px`,
    gap: `${px(s.rowGap)} ${px(s.columnGap)}`,
    font: `${px(s.fontSize)}/${px(s.lineHeight)} ${s.fontWeight}`,
    opacity: s.opacity,
    cursor: s.cursor,
    height: round(el.getBoundingClientRect().height),
    outline: s.outlineStyle === "none" ? "none" : `${s.outlineStyle} ${px(s.outlineWidth)}px`,
    ...(spinner ? { spin: `${round(box.width)}x${round(box.height)} ${getComputedStyle(spinner).borderTopWidth}` } : {}),
  };
}

/** One control's captured looks: the state it starts in, whole, and what each other state changes, per engine. */
export type Captured = {
  first: string;
  chromium: { base: Look; states: Record<string, Partial<Look>> };
  webkit: { base: Partial<Look>; states: Record<string, Partial<Look>> };
};

/** What a captured control looked like in `state`, in `engine`. */
export function goldLook(g: Captured, engine: "chromium" | "webkit", state: string): Look {
  const base = (engine === "webkit" ? { ...g.chromium.base, ...g.webkit.base } : g.chromium.base) as Look;
  return { ...base, ...g[engine].states[state] };
}

const near = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const numbers = (v: unknown) =>
  String(v)
    .split(/[ /]/)
    .map(parseFloat);

/**
 * How two looks differ: colors to 1 in 255 a channel, heights to half a pixel,
 * paddings to 0.05px, the rest exactly. `skip` leaves fields out of it.
 */
export function differs(got: Look, wanted: Look, skip: (keyof Look)[] = []): string[] {
  const out: string[] = [];
  for (const key of Object.keys(wanted) as (keyof Look)[]) {
    if (skip.includes(key)) continue;
    const a = got[key];
    const b = wanted[key];
    let same: boolean;
    if (key === "height") same = Math.abs((a as number) - (b as number)) <= 0.51;
    else if (key === "padding") same = numbers(a).every((n, i) => Math.abs(n - numbers(b)[i]) <= 0.05);
    else if (key === "shadows") {
      const [x, y] = [a as Look["shadows"], b as Look["shadows"]];
      same = x.length === y.length && x.every((s, i) => near(s.color, y[i].color) && s.geometry === y[i].geometry);
    } else if (Array.isArray(a) && Array.isArray(b)) same = near(a as number[], b as number[]);
    else same = JSON.stringify(a) === JSON.stringify(b);
    if (!same) out.push(`${key}: ${JSON.stringify(a)}, not ${JSON.stringify(b)}`);
  }
  return out;
}
