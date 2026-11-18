import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Input } from "./Input";
import { PasswordInput } from "../PasswordInput/PasswordInput";
import { Card } from "../Card/Card";
import { textContrast, textOn } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A field's icon slot, measured as painted on the field's own fill, in
 * Chromium and WebKit (tagged `real-input` for the project that runs both).
 *
 * The slot takes the ink its variant gives its placeholder. An end icon is
 * often a control whose icon is all there is of it, PasswordInput's reveal
 * toggle the first, so the bar is 3:1 (WCAG 1.4.11), for a start icon and the
 * toggle, in every variant, on the page and on a Card, light and dark, and
 * in an error. The figures are literals, the same in both engines to 0.01.
 *
 * The slot is positioned over the input, not inside it, so a walk up from the
 * icon never meets the input's fill: each reading passes the input as the
 * ground beneath (`textOn`'s `under`). The premise holds that what's read is
 * the field's fill; its twin, the same reading without the input, gets the
 * page instead wherever a field paints its own.
 *
 * The twin is the slot as 5.20 inked it, gray-400 (gray-500 in dark) with the
 * toggle at 70%, drawn with inline styles: it fails in four variants of the
 * five. `ghost` cleared 3:1 by 0.12.
 *
 * The toggle's hover is read under a real pointer in Chromium only:
 * Storybook's dev CSS keeps Tailwind's `@media (hover: hover)` nested in
 * `&:hover`, which Playwright's WebKit drops.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Input/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["outline", "white", "soft", "slate", "ghost"] as const;
type Variant = (typeof VARIANTS)[number];
const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card"] as const;
const ICON = 3;

/* A start icon an app might pass: a magnifier, inked by the slot. */
const Magnifier = () => (
  <svg data-icon="" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="7" cy="7" r="5" />
    <path d="m11 11 3 3" />
  </svg>
);

function Fields() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {VARIANTS.map((v) => (
        <div key={v} data-variant={v} style={{ display: "grid", gap: 8 }}>
          <Input aria-label={`Search ${v}`} variant={v} startIcon={<Magnifier />} />
          <PasswordInput aria-label={`Password ${v}`} variant={v} />
          <PasswordInput aria-label={`Password ${v}, error`} variant={v} errorMessage="Required" data-error="" />
          <PasswordInput aria-label={`Password ${v}, disabled`} variant={v} disabled data-disabled="" />
        </div>
      ))}
    </div>
  );
}

function Ground({ id }: { id: (typeof GROUNDS)[number] }) {
  const dark = id.startsWith("dark");
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 260, background: dark ? "#0c0a09" : "#ffffff" }}>
      {id.endsWith("card") ? (
        <Card>
          <Fields />
        </Card>
      ) : (
        <Fields />
      )}
    </div>
  );
}

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
function Grounds() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <style>{STILL}</style>
      {GROUNDS.map((id) => (
        <Ground key={id} id={id} />
      ))}
    </div>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
/* The input a slot sits over. */
const inputOf = (el: Element) => el.closest(".rst\\:relative")!.querySelector("input")!;
const fields = (canvas: Element, ground: string, v: Variant) => {
  const holder = canvas.querySelector(`[data-ground="${ground}"] [data-variant="${v}"]`)!;
  const toggle = (label: string) => holder.querySelector<HTMLElement>(`input[aria-label="${label}"]`)!.closest(".rst\\:relative")!.querySelector<HTMLElement>("button")!;
  return {
    start: holder.querySelector("[data-icon]")!.parentElement!,
    toggle: toggle(`Password ${v}`),
    error: toggle(`Password ${v}, error`),
    disabled: toggle(`Password ${v}, disabled`),
  };
};

/* Per variant, on [light page, light Card, dark page, dark Card]. */
const SLOT: Record<Variant, number[]> = {
  /* The text token at 65%, as the placeholder. */
  outline: [5.44, 5.44, 7.78, 7.33],
  white: [5.99, 5.99, 6.01, 6.01],
  soft: [5.49, 5.49, 6.01, 6.01],
  slate: [6.9, 6.9, 6.93, 6.93],
  ghost: [5.99, 5.99, 7.83, 6.93],
};

/* Below the bar, and outside the slot ruling, which leaves an error's ink as
   it was: error-500 on `slate`'s gray-700 field in light. The field's typed
   text in an error, error-600 there, is 1.24:1. Pinned so it can't move
   unnoticed until it's ruled. */
const SLATE_ERROR_LIGHT = 1.61;

/* 5.20's slot ink, and its toggle at 70%, on the same fills. */
const OLD_INK: Record<Variant, [string, string]> = {
  outline: ["var(--roster-gray-400, #a8a29e)", "var(--roster-gray-500, #65635f)"],
  white: ["var(--roster-gray-400, #a8a29e)", "var(--roster-gray-500, #65635f)"],
  soft: ["var(--roster-gray-500, #65635f)", "var(--roster-gray-400, #a8a29e)"],
  slate: ["var(--roster-gray-300, #d6d3d1)", "var(--roster-gray-500, #65635f)"],
  ghost: ["var(--roster-gray-500, #65635f)", "var(--roster-gray-400, #a8a29e)"],
};
const OLD_TOGGLE: Record<Variant, number[]> = {
  outline: [1.85, 1.85, 2.18, 2.07],
  white: [1.85, 1.85, 1.9, 1.9],
  soft: [2.97, 2.97, 3.71, 3.71],
  slate: [4.29, 4.29, 2.07, 2.07],
  ghost: [3.12, 3.12, 4.3, 4.06],
};

export const EveryIconSlotPassesOnItsField: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    const readings: Record<string, Record<string, number[]>> = {};
    const premise: string[] = [];
    for (const v of VARIANTS) {
      const row = (pick: (f: ReturnType<typeof fields>) => HTMLElement) =>
        GROUNDS.map((id) => {
          const el = pick(fields(canvasElement, id, v));
          const input = inputOf(el);
          /* Premise: the ground read is the field's own fill. */
          const ground = textOn(el, undefined, input).ground.map(Math.round).join();
          const fill = textOn(input).ground.map(Math.round).join();
          if (ground !== fill) premise.push(`${v} on ${id}: read ${ground}, the field is ${fill}`);
          return round(textContrast(el, undefined, input));
        });
      const old = GROUNDS.map((id) => {
        const toggle = fields(canvasElement, id, v).toggle;
        toggle.style.color = OLD_INK[v][id.startsWith("dark") ? 1 : 0];
        toggle.style.opacity = "0.7";
        const ratio = round(textContrast(toggle, undefined, inputOf(toggle)));
        toggle.style.color = toggle.style.opacity = "";
        return ratio;
      });
      readings[v] = { start: row((f) => f.start), toggle: row((f) => f.toggle), error: row((f) => f.error), old };
    }
    console.info(`FIELD ICONS ${JSON.stringify(readings)}`);
    await expect(premise).toEqual([]);

    for (const v of VARIANTS) {
      await expect(readings[v].start, `${v} start icon`).toEqual(SLOT[v]);
      await expect(readings[v].toggle, `${v} toggle`).toEqual(SLOT[v]);
      /* An error inks the slot error-500, error-400 in dark. */
      for (const [i, id] of GROUNDS.entries()) {
        const ratio = readings[v].error[i];
        if (v === "slate" && id.startsWith("light")) await expect(ratio, `slate error on ${id}`).toBe(SLATE_ERROR_LIGHT);
        else await expect(ratio, `${v} error on ${id}`).toBeGreaterThanOrEqual(ICON);
      }
      /* The twin: 5.20's slot, at its figures. */
      for (const [i, id] of GROUNDS.entries()) {
        await expect(Math.abs(readings[v].old[i] - OLD_TOGGLE[v][i]), `${v} old on ${id}: ${readings[v].old[i]}`).toBeLessThanOrEqual(0.03);
      }
      if (v === "ghost") await expect(Math.min(...readings[v].old), "ghost old").toBeGreaterThanOrEqual(ICON);
      else await expect(Math.min(...readings[v].old), `${v} old`).toBeLessThan(ICON);
    }
    await expect(Math.min(...VARIANTS.flatMap((v) => readings[v].error).filter((r) => r !== SLATE_ERROR_LIGHT))).toBe(5.48);

    /* The premise's twin: read without the input, a filled field's icon is
       read on the page. On the dark page, white and soft paint gray-800 and
       slate gray-900, none of them the page's gray-950. */
    for (const v of ["white", "soft", "slate"] as const) {
      const { start } = fields(canvasElement, "dark-page", v);
      await expect(textOn(start).ground.map(Math.round).join(), v).not.toBe(textOn(inputOf(start)).ground.map(Math.round).join());
    }
  },
};

/* The toggle's hover, on [light page, light Card, dark page, dark Card]. */
const HOVER: Record<Variant, number[]> = {
  outline: [17.49, 17.49, 18.11, 16.03],
  white: [17.49, 17.49, 13.9, 13.9],
  soft: [16.03, 16.03, 13.9, 13.9],
  slate: [9.42, 9.42, 16.03, 16.03],
  ghost: [17.49, 17.49, 18.11, 16.03],
};

export const TheToggleTakesTheFieldsInkOnHover: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real || !navigator.userAgent.includes("Chrome")) return;
    const hover = async (el: HTMLElement, probe: string) => {
      el.setAttribute("data-hover-probe", probe);
      await real.commands.realHover(`[data-hover-probe="${probe}"]`);
      el.removeAttribute("data-hover-probe");
    };
    const hovered: Record<string, number[]> = {};
    for (const v of VARIANTS) {
      hovered[v] = [];
      for (const id of GROUNDS) {
        const { toggle } = fields(canvasElement, id, v);
        const rest = getComputedStyle(toggle).color;
        await hover(toggle, `${v}-${id}`);
        await waitFor(() => expect(getComputedStyle(toggle).color).not.toBe(rest));
        hovered[v].push(round(textContrast(toggle, undefined, inputOf(toggle))));
      }
    }
    console.info(`FIELD ICONS hover ${JSON.stringify(hovered)}`);
    for (const v of VARIANTS) await expect(hovered[v], v).toEqual(HOVER[v]);

    /* A disabled toggle dims and takes no hover. */
    const { disabled } = fields(canvasElement, "light-page", "outline");
    const rest = getComputedStyle(disabled).color;
    await hover(disabled, "disabled");
    await new Promise((r) => setTimeout(r, 100));
    await expect([getComputedStyle(disabled).color, getComputedStyle(disabled).opacity]).toEqual([rest, "0.4"]);
  },
};
