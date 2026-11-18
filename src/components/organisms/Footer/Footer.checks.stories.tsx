import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Footer } from "./Footer";
import { Card } from "../../atoms/Card/Card";
import { contrast, rgba, textContrast, textOn } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Footer's links, measured as painted, in Chromium and WebKit (tagged
 * `real-input` for the project that runs both).
 *
 * A link is text at 14px, so its bar is WCAG AA's 4.5:1, in every variant,
 * on the page and on a Card, light and dark. The figures are literals, the
 * same in both engines to 0.01 but `default` in dark, whose fill is
 * translucent: WebKit reads it 0.04 to 0.05 higher.
 *
 * The twin is the links as 5.20 drew them, at 70%: under the bar in every
 * variant.
 *
 * Hover and focus are read under a real pointer and keyboard in Chromium
 * only: Storybook's dev CSS keeps Tailwind's `@media (hover: hover)` nested
 * in `&:hover`, which Playwright's WebKit drops, and WebKit's Tab skips links
 * unless Option is held.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Footer/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "primary", "transparent"] as const;
type Variant = (typeof VARIANTS)[number];
const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card"] as const;
const TEXT = 4.5;
const LINKS = [
  { label: "About", href: "#about" },
  { label: "Privacy", href: "#privacy" },
];

function Ground({ id }: { id: (typeof GROUNDS)[number] }) {
  const dark = id.startsWith("dark");
  const body = (
    <div style={{ display: "grid", gap: 8 }}>
      {VARIANTS.map((v) => (
        <Footer key={v} data-variant={v} variant={v} companyName="Acme" links={LINKS} />
      ))}
    </div>
  );
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 320, background: dark ? "#0c0a09" : "#ffffff" }}>
      {id.endsWith("card") ? <Card>{body}</Card> : body}
    </div>
  );
}

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
function Grounds() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <style>{STILL}</style>
      <input data-before="" aria-label="Before" />
      {GROUNDS.map((id) => (
        <Ground key={id} id={id} />
      ))}
    </div>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
const links = (canvas: Element, id: string, v: Variant) => [
  ...canvas.querySelectorAll<HTMLElement>(`[data-ground="${id}"] [data-variant="${v}"] nav a`),
];

/* Per variant, on [light page, light Card, dark page, dark Card]: Chromium,
   then WebKit where it differs. */
const LINK: Record<Variant, number[]> = {
  default: [5.74, 5.74, 7.41, 6.91],
  primary: [12, 12, 6.75, 6.75],
  transparent: [5.99, 5.99, 7.83, 6.93],
};
const LINK_WEBKIT: Partial<Record<Variant, number[]>> = { default: [5.74, 5.74, 7.45, 6.96] };
/* 5.20's links at 70%, the lowest across the grounds. */
const OLD: Record<Variant, number> = { default: 3.04, primary: 3.93, transparent: 3.12 };

export const TheLinksPassOnEveryGround: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    const webkit = !navigator.userAgent.includes("Chrome");
    const readings: Record<string, { links: number[]; old: number[] }> = {};
    for (const v of VARIANTS) {
      const read = (id: string) => {
        const found = links(canvasElement, id, v);
        return Math.min(...found.map((a) => round(textContrast(a))));
      };
      const old = (id: string) =>
        Math.min(
          ...links(canvasElement, id, v).map((a) => {
            a.style.opacity = "0.7";
            const ratio = round(textContrast(a));
            a.style.opacity = "";
            return ratio;
          }),
        );
      readings[v] = { links: GROUNDS.map(read), old: GROUNDS.map(old) };
    }
    console.info(`FOOTER LINKS ${JSON.stringify(readings)}`);
    /* Reach: two links in each variant on each ground. */
    for (const v of VARIANTS) for (const id of GROUNDS) await expect(links(canvasElement, id, v).length, `${v} on ${id}`).toBe(2);

    for (const v of VARIANTS) {
      await expect(readings[v].links, v).toEqual((webkit && LINK_WEBKIT[v]) || LINK[v]);
      for (const ratio of readings[v].links) await expect(ratio, v).toBeGreaterThanOrEqual(TEXT);
      /* A link reads as the copyright beside it, at full strength. */
      const footer = canvasElement.querySelector(`[data-ground="light-page"] [data-variant="${v}"]`)!;
      await expect(getComputedStyle(footer.querySelector("nav a")!).color).toBe(getComputedStyle(footer.querySelector("p")!).color);
      /* The twin: 5.20's links, at their ledger figures. */
      await expect(Math.abs(Math.min(...readings[v].old) - OLD[v]), `${v} old: ${readings[v].old}`).toBeLessThanOrEqual(0.03);
      await expect(Math.min(...readings[v].old), `${v} old`).toBeLessThan(TEXT);
    }

    /* Primary is dark in both themes, so it carries its own ring: primary-400
       on its own fill, where the page's ring would be primary-500. */
    for (const id of ["light-page", "dark-page"]) {
      const footer = canvasElement.querySelector<HTMLElement>(`[data-ground="${id}"] [data-variant="primary"]`)!;
      const style = getComputedStyle(footer);
      const fill = textOn(footer).ground;
      const ring = rgba(style.getPropertyValue("--roster-ring").trim()).slice(0, 3);
      await expect(rgba(style.getPropertyValue("--roster-ring-offset").trim()).slice(0, 3), `${id} offset`).toEqual(fill.map(Math.round));
      await expect(round(contrast(ring, fill)), `${id} ring`).toBe(id === "light-page" ? 6.04 : 6.75);
      /* Twin: the page's ring there, primary-500 in light. (Dark's page ring
         is primary-400 already.) */
      if (id === "light-page") {
        const page = rgba(getComputedStyle(canvasElement.querySelector(`[data-ground="${id}"]`)!).getPropertyValue("--roster-ring").trim()).slice(0, 3);
        await expect(round(contrast(page, fill)), "the light page's ring").toBe(2.56);
      }
    }
  },
};

export const HoverUnderlinesAndFocusDrawsTheRing: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real || !navigator.userAgent.includes("Chrome")) return;
    /* Hover underlines, and the ink stays: the fade was the only cue. */
    for (const v of VARIANTS) {
      const [a] = links(canvasElement, "light-page", v);
      const rest = getComputedStyle(a);
      const [color, line] = [rest.color, rest.textDecorationLine];
      a.setAttribute("data-hover-probe", v);
      await real.commands.realHover(`[data-hover-probe="${v}"]`);
      a.removeAttribute("data-hover-probe");
      await waitFor(() => expect(getComputedStyle(a).textDecorationLine).toBe("underline"));
      await expect([line, getComputedStyle(a).color], v).toEqual(["none", color]);
    }
    /* Focus from the keyboard: Roster's ring, primary-400 in primary. */
    const before = canvasElement.querySelector<HTMLElement>("[data-before]")!;
    before.focus();
    const order = VARIANTS.flatMap((v) => links(canvasElement, "light-page", v));
    for (const a of order) {
      await real.commands.realPress(["Tab"]);
      await waitFor(() => expect(document.activeElement).toBe(a));
      const style = getComputedStyle(a);
      const ring = rgba(style.getPropertyValue("--roster-ring").trim()).slice(0, 3).join(", ");
      await expect(style.boxShadow).toContain(`rgb(${ring}) 0px 0px 0px 2px`);
      await expect(style.outlineStyle).toBe("none");
    }
  },
};
