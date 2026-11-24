import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Button } from "./Button";
import { realInputOrSkip } from "../../../test/real-input";
import { differs, goldLook, readLook, type Look } from "../../../test/tile-look";
import { TILE_GOLD } from "../../../test/tile-parity-gold";

/**
 * The tile, the two tints and the plain action hold the looks of the native
 * controls they replace, in every state, measured as rendered in Chromium and
 * WebKit (tagged `real-input` for the project that runs both).
 *
 * - **Parity:** `src/test/tile-parity-gold.ts` holds each control's look as
 *   the old build painted it, captured from that build's own compiled CSS in
 *   each engine, and a Roster control in the same state must read the same:
 *   colors painted over the same dark card, the ring, the border, padding,
 *   radius, text, height, opacity, cursor and the focus outline. Colors agree
 *   to 1 in 255 a channel. The same four ramp steps a consumer would set on
 *   the Button (`--roster-primary-300`, `-400`, `-500`) carry each hue, so
 *   the eleven tints and the plain actions are checked through them.
 * - **What was accepted to change** is `ACCEPTED` below: each states the
 *   control, the state, the new value and why. Every other field is the old
 *   one, and each accepted value is checked to differ from the old, so a
 *   stale entry fails rather than passing unused.
 * - **Hover is read in Chromium only:** Playwright's WebKit drops the dev
 *   stylesheet's `@media (hover: hover)` nested in `&:hover`. Pressed (`:active`)
 *   goes with it, since a held press also hovers.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Button/Tiles checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const CARD = "#1a1f2e";
const STILL = "*,*::before,*::after{transition:none!important;animation-play-state:paused!important}";
const chromium = () => /Chrome/.test(navigator.userAgent);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const engine = () => (chromium() ? "chromium" : "webkit");

/* The hues, as a consumer sets a ramp of its own on a control: 300, 400 and
   500. Rose's is a darker one, its 700 and 600 steps standing in for 500 and
   400, as the old controls painted it. */
const HUES: Record<string, [string, string, string]> = {
  indigo: ["#a5b4fc", "#818cf8", "#6366f1"],
  amber: ["#fcd34d", "#fbbf24", "#f59e0b"],
  emerald: ["#6ee7b7", "#34d399", "#10b981"],
  teal: ["#5eead4", "#2dd4bf", "#14b8a6"],
  blue: ["#93c5fd", "#60a5fa", "#3b82f6"],
  violet: ["#c4b5fd", "#a78bfa", "#8b5cf6"],
  pink: ["#f9a8d4", "#f472b6", "#ec4899"],
  orange: ["#fdba74", "#fb923c", "#f97316"],
  cyan: ["#67e8f9", "#22d3ee", "#06b6d4"],
  yellow: ["#fef08a", "#fde047", "#eab308"],
  rose: ["#fda4af", "#e11d48", "#be123c"],
};
const ramp = ([s300, s400, s500]: [string, string, string], extra: CSSProperties = {}) =>
  ({ "--roster-primary-300": s300, "--roster-primary-400": s400, "--roster-primary-500": s500, ...extra }) as CSSProperties;

const Icon = ({ size = 12 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
    <rect width="16" height="16" fill="currentColor" />
  </svg>
);

/* A control as a consumer would write it, for each id in the gold. */
function Control({ id, state }: { id: string; state?: "busy" | "unavailable" }) {
  const busy = state === "busy";
  const off = state === "unavailable";
  const [kind, hue, tail] = id.split("-") as [string, string, string?];
  const tall = tail === "tall" || hue === "tall";
  const shared = { "data-case": id, isLoading: busy, unavailable: off };
  if (kind === "tile")
    return (
      <Button {...shared} variant="tint" layout="tile" colorScheme="primary" startIcon={<Icon />} style={ramp(HUES[hue], tall ? { minHeight: 60 } : {})}>
        Label
      </Button>
    );
  if (kind === "sub")
    return (
      <Button {...shared} variant="tint-subtle" layout="tile" colorScheme="primary" style={ramp(HUES[hue], tall ? { minHeight: 44 } : {})}>
        Label
      </Button>
    );
  if (kind === "type")
    return (
      <Button {...shared} variant="tint-subtle" size="compact" colorScheme="primary" pressed={tail === "on"} style={ramp(HUES[hue])}>
        Label
      </Button>
    );
  if (kind === "back")
    return (
      <Button
        {...shared}
        variant="plain"
        size="xs"
        colorScheme="neutral"
        startIcon={<Icon />}
        style={{ "--roster-gray-400": "#94a3b8", "--roster-gray-100": "#f1f5f9", ...(tall ? { minHeight: 44, paddingInline: 8 } : {}) } as CSSProperties}
      >
        Back
      </Button>
    );
  if (kind === "just")
    return (
      <Button
        {...shared}
        variant="plain"
        size="xs"
        colorScheme="primary"
        style={ramp(hue === "rose" ? ["#fda4af", "#fb7185", "#f43f5e"] : HUES[hue], tall ? { minHeight: 44, paddingInline: 8 } : {})}
      >
        Label
      </Button>
    );
  return (
    <Button {...shared} variant="plain" size="xs" colorScheme="primary" pressed={id === "other-on"} style={ramp(["#fda4af", "#94a3b8", "#94a3b8"])}>
      Something else?
    </Button>
  );
}

const IDS = Object.keys(TILE_GOLD).filter((id) => !id.startsWith("method-"));
const BUSY = IDS.filter((id) => TILE_GOLD[id].chromium.states.busy);
const UNAVAILABLE = IDS.filter((id) => TILE_GOLD[id].chromium.states.unavailable);

/* The new values, each with the control, the states and why. WebKit lays the
   types' 12px text on a 15px line, so they were 29px there; `compact` is
   ruled 30px, so that engine's height moves a pixel. */
type Change = { id: RegExp; states: string[]; engine?: "webkit"; fields: Partial<Look>; why: string };
const GRAY_400 = [148, 163, 184];
const GRAY_100 = [241, 245, 249];
const ACCEPTED: Change[] = [
  { id: /^(tile|sub|just)-\w+-tall$/, states: ["busy"], fields: { opacity: "1", cursor: "progress" }, why: "the busy one keeps full strength" },
  { id: /^tile-[a-z]+$/, states: ["busy"], fields: { cursor: "progress" }, why: "the busy tile's own cursor" },
  { id: /^tile-[a-z]+$/, states: ["unavailable"], fields: { cursor: "not-allowed" }, why: "the others can't be pressed" },
  { id: /^back$/, states: ["rest", "focus"], fields: { color: GRAY_400 }, why: "fails AA today: 2.09" },
  { id: /^back$/, states: ["hover"], fields: { color: GRAY_100 }, why: "fails AA today: 3.45" },
  { id: /^back-tall$/, states: ["rest", "focus", "unavailable"], fields: { color: GRAY_400 }, why: "the same gray as the other Back" },
  { id: /^just-rose(-tall)?$/, states: ["rest", "focus", "busy", "unavailable"], fields: { color: [251, 113, 133] }, why: "fails AA today: 3.42" },
  { id: /^just-emerald(-tall)?$/, states: ["rest", "focus", "busy", "unavailable"], fields: { color: [52, 211, 153] }, why: "matches the other one" },
  { id: /^other$/, states: ["rest"], fields: { color: GRAY_400 }, why: "fails AA today: 1.59" },
  { id: /^other$/, states: ["hover"], fields: { color: [253, 164, 175] }, why: "its chosen color" },
  { id: /^type-rose-on$/, states: ["rest", "hover"], fields: { borderColor: [225, 29, 72] }, why: "one step serves the pressed border and the hover ring" },
  { id: /^type-/, states: ["rest", "hover", "focus"], engine: "webkit", fields: { height: 30 }, why: "`compact` is 30px; native was 29 there" },
];

/** What the gold says a state paints, with the accepted changes applied. */
function want(id: string, state: string) {
  const eng = engine();
  const old = goldLook(TILE_GOLD[id], eng, state);
  const changes = ACCEPTED.filter((c) => c.id.test(id) && c.states.includes(state) && (!c.engine || c.engine === eng));
  return { old, now: changes.reduce<Look>((l, c) => ({ ...l, ...c.fields }), old), changes };
}

const el = (id: string) => document.querySelector<HTMLElement>(`[data-case="${id}"]`)!;
/* What the gold cares about: the gap between a tile's icon and label, and the
   spinner's box when busy. A label-only control has no gap to compare. */
const skip = (id: string): (keyof Look)[] => (/^(sub|type|other|just)/.test(id) ? ["gap"] : []);
const read = (id: string) => readLook(el(id), CARD);

function Grid({ ids, state, children }: { ids: string[]; state?: "busy" | "unavailable"; children?: ReactNode }) {
  return (
    <div className="dark" style={{ background: CARD, padding: 24 }}>
      <style>{STILL}</style>
      <button type="button" data-check="before">
        Before
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 150px)", gap: 16, marginTop: 16, alignItems: "start" }}>
        {ids.map((id) => (
          <div key={id} style={{ display: "grid" }}>
            <Control id={id} state={state} />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

/* The pointer rests off every control, so none is hovered. */
const park = (real: NonNullable<ReturnType<typeof realInputOrSkip>>) => real.commands.realHover('[data-check="before"]');

/** Reads the state `read` gives and compares it with the gold, listing misses. */
async function compare(ids: string[], state: string, extra?: (id: string) => Promise<void>) {
  const misses: string[] = [];
  for (const id of ids) {
    await extra?.(id);
    const { now } = want(id, state);
    misses.push(...differs(read(id), now, skip(id)).map((d) => `${id} ${state}: ${d}`));
  }
  return misses;
}

export const TheyMatchTheOldBuildAtRest: Story = {
  render: () => <Grid ids={IDS} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await park(real);
    const misses = await compare(IDS, "rest");
    console.info(`TILES REST ${IDS.length} cases, ${misses.length} misses`);
    await expect(misses).toEqual([]);
    /* Every accepted change has a case, and differs from the old value. */
    const stale = ACCEPTED.filter((c) => (!c.engine || c.engine === engine())).filter((c) => {
      const hits = IDS.filter((id) => c.id.test(id));
      return hits.length === 0 || hits.some((id) => c.states.some((state) => TILE_GOLD[id].chromium.states[state] || state === TILE_GOLD[id].first ? JSON.stringify(want(id, state).old) === JSON.stringify(want(id, state).now) : false));
    });
    await expect(stale.map((c) => `${c.id} ${c.states}`)).toEqual([]);
  },
};

export const TheyMatchTheOldBuildHovered: Story = {
  render: () => <Grid ids={IDS} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real || !chromium()) return;
    const hovered = IDS.filter((id) => TILE_GOLD[id].chromium.states.hover);
    const misses = await compare(hovered, "hover", (id) => real.commands.realHover(`[data-case="${id}"]`));
    console.info(`TILES HOVER ${hovered.length} cases, ${misses.length} misses`);
    await expect(misses).toEqual([]);
  },
};

export const TheyMatchTheOldBuildPressed: Story = {
  render: () => <Grid ids={IDS} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real || !chromium()) return;
    const pressed = IDS.filter((id) => TILE_GOLD[id].chromium.states.active);
    const misses: string[] = [];
    for (const id of pressed) {
      const held = real.commands.realDrag(`[data-case="${id}"]`, 0, { holdMs: 500 });
      await wait(250);
      misses.push(...differs(read(id), want(id, "active").now, skip(id)).map((d) => `${id} active: ${d}`));
      await held;
    }
    console.info(`TILES PRESSED ${pressed.length} cases, ${misses.length} misses`);
    await expect(misses).toEqual([]);
  },
};

export const TheyMatchTheOldBuildFocused: Story = {
  render: () => <Grid ids={IDS.filter((id) => TILE_GOLD[id].chromium.states.focus)} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const focused = IDS.filter((id) => TILE_GOLD[id].chromium.states.focus);
    await park(real);
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    const misses: string[] = [];
    const reached: string[] = [];
    for (const id of focused) {
      await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
      await wait(30);
      reached.push((document.activeElement as HTMLElement | null)?.dataset.case ?? "nothing");
      misses.push(...differs(read(id), want(id, "focus").now, skip(id)).map((d) => `${id} focus: ${d}`));
    }
    console.info(`TILES FOCUS ${focused.length} cases, ${misses.length} misses`);
    /* Tab went where the gold's did, one stop a control. */
    await expect(reached).toEqual(focused);
    await expect(misses).toEqual([]);
  },
};

export const TheyMatchTheOldBuildBusy: Story = {
  render: () => <Grid ids={BUSY} state="busy" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await park(real);
    const misses: string[] = [];
    for (const id of BUSY) misses.push(...differs(read(id), want(id, "busy").now, skip(id)).map((d) => `${id} busy: ${d}`));
    console.info(`TILES BUSY ${BUSY.length} cases, ${misses.length} misses`);
    await expect(misses).toEqual([]);
  },
};

export const TheyMatchTheOldBuildUnavailable: Story = {
  render: () => <Grid ids={UNAVAILABLE} state="unavailable" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await park(real);
    const misses: string[] = [];
    for (const id of UNAVAILABLE) misses.push(...differs(read(id), want(id, "unavailable").now, skip(id)).map((d) => `${id} unavailable: ${d}`));
    console.info(`TILES UNAVAILABLE ${UNAVAILABLE.length} cases, ${misses.length} misses`);
    await expect(misses).toEqual([]);
  },
};
