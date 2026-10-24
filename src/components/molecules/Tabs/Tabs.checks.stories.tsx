import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Tabs, type TabItem, type TabsProps } from "./Tabs";
import { TheLook } from "./Tabs.stories";
import { backgroundOf, contrast, paint } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";
import { heldOff, settled } from "../../../test/settle";

/**
 * Tabs, checked rendered, with real keys and a real mouse in Chromium and
 * WebKit.
 *
 * - **The keys walk every variant the same way:** one tab stop per strip,
 *   arrows that wrap, Home and End, manual activation's Enter and Space, and
 *   Tab out, pinned step by step for plain and liquid alike. A click selects;
 *   where it leaves focus is pinned per engine (Chromium focuses the tab,
 *   WebKit does on Linux and not on macOS).
 * - **The underline marks the selected tab, and only it,** in light and dark:
 *   2px on the selected tab, none on the others at rest, and a lighter one
 *   under a real pointer (Chromium only: see `HOVER_READS`). Its color clears
 *   3:1 against the page, every label 4.5:1, and every count's number 4.5:1
 *   against its mark. The twin: the hover underline isn't the selected one's
 *   color.
 * - **Selecting never moves the row:** every tab's box is the same whichever
 *   is selected. The twin: the selection really moved.
 * - **Keyboard focus rings, a click doesn't.**
 * - **In forced colors the underline stays,** and the others still have none.
 * - **The showcase's specimens are the real states:** the hover specimen
 *   computes as a real hover does, and the focus specimen as real keyboard
 *   focus.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Tabs/Checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);
/* Whether a hover style can be read here. Not in WebKit: the stylesheet these
   checks run against is the dev server's, which keeps Tailwind's nesting,
   `.x { &:hover { @media (hover: hover) { … } } }`, and Playwright's WebKit
   drops an `@media` nested that way (it applies the same rule unnested, and
   `matchMedia("(hover: hover)")` is true). The built stylesheet flattens the
   rule, so Safari's users get the hover; these checks just can't see it. */
const HOVER_READS = () => chromium();
/* Past the liquid pill's two phases (130ms and 160ms) and a margin. */
const MOVE = 500;

const TABS: TabItem[] = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta", count: 4 },
  { id: "c", label: "Gamma" },
];

function Strip(props: Omit<TabsProps, "activeTab" | "onChange" | "tabs">) {
  const [active, setActive] = useState("a");
  return <Tabs {...(props as TabsProps)} tabs={TABS} activeTab={active} onChange={setActive} />;
}

/* ── The keys ─────────────────────────────────────────────────────────── */

function Walk() {
  return (
    <div style={{ display: "grid", gap: 16, width: 420 }}>
      <button type="button" data-walk-before="">
        Before
      </button>
      <Strip aria-label="Plain" />
      <Strip aria-label="Manual" activation="manual" />
      <Strip aria-label="Liquid" variant="liquid" />
      <Strip aria-label="Filled" variant="liquid" liquidStyle="filled" />
      <button type="button">After</button>
    </div>
  );
}

const where = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return "body";
  const strip = el.closest('[role="tablist"]')?.getAttribute("aria-label") ?? "page";
  return `${strip}: ${el.getAttribute("aria-label") ?? el.textContent?.trim()}`;
};
const selected = () =>
  [...document.querySelectorAll('[role="tablist"]')].map((s) => s.querySelector<HTMLElement>('[aria-selected="true"]')?.dataset.tabId).join(" ");

export const TheKeysWalkEveryVariant: Story = {
  tags: ["real-input"],
  render: () => <Walk />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const steps: string[] = [];
    /* Safari's keyboard users reach buttons with Option+Tab. */
    const tab = chromium() ? "Tab" : "Alt+Tab";
    const press = async (key: string) => {
      await real.commands.realPress([key]);
      await wait(150);
      steps.push(`${key === tab ? "Tab" : key === " " ? "Space" : key} > ${where()} | ${selected()}`);
    };
    document.querySelector<HTMLElement>("[data-walk-before]")!.focus();
    for (const key of [tab, "ArrowRight", "End", "ArrowRight", "ArrowLeft", "Home", "ArrowLeft"]) await press(key);
    for (const key of [tab, "ArrowRight", "Enter", "ArrowRight", " "]) await press(key);
    for (const key of [tab, "ArrowRight", "End", "ArrowRight", "Home", "ArrowLeft"]) await press(key);
    for (const key of [tab, "ArrowRight", tab]) await press(key);
    console.info(`TABS WALK\n${steps.join("\n")}`);
    /* Each strip's selected tab, in order: Plain, Manual, Liquid, Filled. */
    await expect(steps).toEqual([
      "Tab > Plain: Alpha | a a a a",
      "ArrowRight > Plain: Beta, 4 items | b a a a",
      "End > Plain: Gamma | c a a a",
      "ArrowRight > Plain: Alpha | a a a a",
      "ArrowLeft > Plain: Gamma | c a a a",
      "Home > Plain: Alpha | a a a a",
      "ArrowLeft > Plain: Gamma | c a a a",
      /* Manual: the arrows move focus, and only Enter or Space selects. */
      "Tab > Manual: Alpha | c a a a",
      "ArrowRight > Manual: Beta, 4 items | c a a a",
      "Enter > Manual: Beta, 4 items | c b a a",
      "ArrowRight > Manual: Gamma | c b a a",
      "Space > Manual: Gamma | c c a a",
      /* The liquid variant, the same pattern. */
      "Tab > Liquid: Alpha | c c a a",
      "ArrowRight > Liquid: Beta, 4 items | c c b a",
      "End > Liquid: Gamma | c c c a",
      "ArrowRight > Liquid: Alpha | c c a a",
      "Home > Liquid: Alpha | c c a a",
      "ArrowLeft > Liquid: Gamma | c c c a",
      "Tab > Filled: Alpha | c c c a",
      "ArrowRight > Filled: Beta, 4 items | c c c b",
      "Tab > page: After | c c c b",
    ]);

    /* A click selects, in both variants. Where it leaves focus is the
       engine's: Chromium focuses the tab; WebKit does on Linux, where CI
       runs, and leaves focus where it was on macOS. */
    const plainBeta = '[aria-label="Plain"] [data-tab-id="b"]';
    const liquidBeta = '[aria-label="Liquid"] [data-tab-id="b"]';
    document.querySelector<HTMLElement>("[data-walk-before]")!.focus();
    await real.commands.realClick(plainBeta);
    await wait(MOVE);
    const clicked = document.querySelector(plainBeta)!;
    const focus = document.activeElement === clicked ? "the tab" : document.activeElement?.hasAttribute("data-walk-before") ? "where it was" : where();
    await real.commands.realClick(liquidBeta);
    await wait(MOVE);
    const either = focus === "the tab" || focus === "where it was" ? "the tab, or where it was" : focus;
    await expect([selected(), chromium() ? focus : either]).toEqual(["b c b b", chromium() ? "the tab" : "the tab, or where it was"]);
  },
};

/* ── The underline ────────────────────────────────────────────────────── */

const PAGES = { light: "#ffffff", dark: "#0c0a09" } as const;

function Schemes() {
  return (
    <div style={{ display: "grid", gap: 0 }}>
      {(["light", "dark"] as const).map((scheme) => (
        <div key={scheme} className={scheme === "dark" ? "dark" : undefined} style={{ background: PAGES[scheme], padding: 16, width: 420 }}>
          <Strip aria-label={scheme} />
        </div>
      ))}
    </div>
  );
}

const after = (el: Element) => getComputedStyle(el, "::after");

export const TheUnderlineMarksTheSelectedTab: Story = {
  tags: ["real-input"],
  render: () => <Schemes />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: string[] = [];
    const ratios: [string, number, number][] = [];
    for (const scheme of ["light", "dark"] as const) {
      const strip = document.querySelector<HTMLElement>(`[aria-label="${scheme}"]`)!;
      const [alpha, beta, gamma] = within(strip).getAllByRole("tab");
      const page = paint(backgroundOf(strip));
      const lines = () => [alpha, beta, gamma].map((t) => after(t).borderBottomWidth).join(" ");
      const ink = (t: HTMLElement) => contrast(paint([...backgroundOf(t), getComputedStyle(t).color]), page);
      const mark = (t: HTMLElement) => {
        const m = t.querySelector("[data-tab-count]")!;
        const under = [...backgroundOf(t), getComputedStyle(m).backgroundColor];
        return contrast(paint([...under, getComputedStyle(m).color]), paint(under));
      };
      const line = (t: HTMLElement) => contrast(paint([...backgroundOf(t), after(t).borderBottomColor]), page);
      rows.push(`${scheme} at rest: ${lines()}`);
      ratios.push([`${scheme} selected label`, ink(alpha), 4.5], [`${scheme} label at rest`, ink(gamma), 4.5], [`${scheme} underline`, line(alpha), 3], [`${scheme} count at rest`, mark(beta), 4.5]);

      beta.setAttribute("data-check", `${scheme}-beta`);
      await real.commands.realHover(`[data-check="${scheme}-beta"]`);
      await wait(50);
      await settled(beta);
      const hover = HOVER_READS();
      rows.push(`${scheme} hovered${hover ? "" : " (not read here)"}: ${lines()}`);
      if (hover) {
        ratios.push([`${scheme} label hovered`, ink(beta), 4.5], [`${scheme} count hovered`, mark(beta), 4.5]);
        /* The twin: the hover underline is a different, lighter color than the selected one's. */
        rows.push(`${scheme} hover line is the selected one's: ${after(beta).borderBottomColor === after(alpha).borderBottomColor}`);
      }
    }
    await real.commands.realHover("body", { fx: 0.99, fy: 0.99 });
    console.info(`TABS UNDERLINE\n${rows.join("\n")}\n${ratios.map(([k, v]) => `${k} ${v.toFixed(2)}`).join("\n")}`);
    await expect(rows).toEqual(
      chromium()
        ? [
            "light at rest: 2px 0px 0px",
            "light hovered: 2px 2px 0px",
            "light hover line is the selected one's: false",
            "dark at rest: 2px 0px 0px",
            "dark hovered: 2px 2px 0px",
            "dark hover line is the selected one's: false",
          ]
        : ["light at rest: 2px 0px 0px", "light hovered (not read here): 2px 0px 0px", "dark at rest: 2px 0px 0px", "dark hovered (not read here): 2px 0px 0px"],
    );
    await expect(ratios.filter(([, ratio, floor]) => ratio < floor).map(([k]) => k)).toEqual([]);
  },
};

/* ── The row stays put ────────────────────────────────────────────────── */

export const SelectingNeverMovesTheRow: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 420 }}>
      <Strip aria-label="Still" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    await document.fonts.ready;
    const tabs = within(canvasElement).getAllByRole("tab");
    const boxes = () => tabs.map((t) => { const b = t.getBoundingClientRect(); return `${b.left.toFixed(2)}+${b.width.toFixed(2)}x${b.height.toFixed(2)}`; }).join(" ");
    const reads: string[] = [];
    const lines: string[] = [];
    for (const id of ["a", "b", "c"]) {
      await real.commands.realClick(`[data-tab-id="${id}"]`);
      await wait(200);
      reads.push(boxes());
      lines.push(tabs.map((t) => after(t).borderBottomWidth).join(" "));
    }
    console.info(`TABS STILL ${reads.join(" / ")}`);
    /* Every tab's box the same whichever is selected; the twin, the
       underline really moved each time. */
    await expect([new Set(reads).size, lines]).toEqual([1, ["2px 0px 0px", "0px 2px 0px", "0px 0px 2px"]]);
  },
};

/* ── Focus ────────────────────────────────────────────────────────────── */

/* Roster's ring is a box-shadow with a spread; at rest a tab has none. */
const ringed = (el: Element) => /0px 0px 0px [1-9]/.test(getComputedStyle(el).boxShadow);

export const KeyboardFocusRingsAndAClickDoesnt: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "grid", gap: 16, width: 420 }}>
      <button type="button" data-ring-before="">
        Before
      </button>
      <Strip aria-label="Rings" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const [alpha, beta] = within(canvasElement).getAllByRole("tab");
    await real.commands.realClick('[data-tab-id="b"]');
    await heldOff(beta);
    const afterClick = ringed(beta);
    document.querySelector<HTMLElement>("[data-ring-before]")!.focus();
    await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
    await waitFor(() => expect(document.activeElement).toBe(beta));
    await settled(beta);
    const keyed = ringed(beta);
    await real.commands.realPress(["ArrowLeft"]);
    await waitFor(() => expect(document.activeElement).toBe(alpha));
    await settled(alpha);
    await expect([afterClick, keyed, ringed(alpha), ringed(beta)]).toEqual([false, true, true, false]);
  },
};

/* ── Forced colors ────────────────────────────────────────────────────── */

export const InForcedColorsTheUnderlineStays: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 420 }}>
      <Strip aria-label="Forced" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const tabs = within(canvasElement).getAllByRole("tab");
    /* What each tab's underline draws: its width, and whether its color is
       anything at all. */
    const read = () => tabs.map((t) => `${after(t).borderBottomWidth} ${after(t).borderBottomColor === "rgba(0, 0, 0, 0)" ? "clear" : "ink"}`);
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      /* The selected tab's underline is drawn in a system color; the others
         are zero wide, so forced colors doesn't underline every tab. */
      await expect(read()).toEqual(["2px ink", "0px ink", "0px ink"]);
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
    /* The twin: outside forced colors, the same underline. */
    await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(false));
    await expect(read()[0]).toBe("2px ink");
  },
};

/* ── The showcase's specimens ─────────────────────────────────────────── */

const LOOK = ["color", "border-bottom-width", "border-bottom-style", "border-bottom-color", "box-shadow", "outline-style"];
const look = (el: Element) => {
  const [own, line] = [getComputedStyle(el), getComputedStyle(el, "::after")];
  return LOOK.map((p) => `${p}: ${p.startsWith("border") ? line.getPropertyValue(p) : own.getPropertyValue(p)}`).join("; ");
};

export const TheSpecimensAreTheRealStates: Story = {
  tags: ["real-input"],
  render: () => <>{TheLook.render!({} as never, {} as never)}</>,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const out: string[] = [];
    for (const scheme of ["light", "dark"]) {
      const live = `[aria-label="Project, ${scheme}"]`;
      const hoverSpecimen = document.querySelector(`[aria-label="Hover, ${scheme}"] [data-tab-id="activity"]`)!;
      const focusSpecimen = document.querySelector(`[aria-label="Focus, ${scheme}"] [data-tab-id="overview"]`)!;

      /* Hover: Chromium only (see `HOVER_READS`). */
      if (HOVER_READS()) {
        await real.commands.realHover(`${live} [data-tab-id="activity"]`);
        const hovered = document.querySelector(`${live} [data-tab-id="activity"]`)!;
        await settled(hovered);
        out.push(`${scheme} hover specimen is a real hover: ${look(hoverSpecimen) === look(hovered)}`);
        await real.commands.realHover("body", { fx: 0.99, fy: 0.99 });
        await settled(hovered);
        out.push(`${scheme} and differs from rest: ${look(hoverSpecimen) !== look(hovered)}`);
      }

      /* Keyboard focus: Tab into the live strip, from the button before it. */
      const first = document.querySelector<HTMLElement>(`${live} [data-tab-id="overview"]`)!;
      const before = document.createElement("button");
      before.textContent = "start";
      first.closest('[role="tablist"]')!.before(before);
      before.focus();
      await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
      await waitFor(() => expect(document.activeElement).toBe(first));
      await settled(first);
      out.push(`${scheme} focus specimen is real focus: ${look(focusSpecimen) === look(first)}`);
      before.remove();
      first.blur();
      await heldOff(first);
      out.push(`${scheme} and differs from rest: ${look(focusSpecimen) !== look(first)}`);
    }
    console.info(`TABS SPECIMENS\n${out.join("\n")}`);
    await expect(out.every((line) => line.endsWith("true"))).toBe(true);
    await expect(out.length).toBe(chromium() ? 8 : 4);
  },
};
