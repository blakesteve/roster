import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { MatchupCard } from "./MatchupCard";
import { Card } from "../../atoms/Card/Card";
import { opacityOf, rgba, textContrast } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * MatchupCard's losing side and its separator, measured as painted, in
 * Chromium and WebKit (tagged `real-input` for the project that runs both).
 *
 * The loser's accessory and score and the "-" between the teams are text,
 * so their bar is WCAG AA's 4.5:1, on the page and on a Card, light and dark.
 * The loser's logo keeps its fade: a logo is exempt as a mark. The figures
 * are literals, the same in both engines to 0.01.
 *
 * The twin is the card as 5.20 drew it, the loser's whole side at 50% and
 * grayscale, the "-" gray-500 in both themes, drawn with inline styles. Each
 * failed somewhere: the score in light, the accessory on every ground, the
 * "-" in dark.
 *
 * Hover and focus are read under a real pointer and keyboard in Chromium
 * only: Storybook's dev CSS keeps Tailwind's `@media (hover: hover)` nested
 * in `&:hover`, which Playwright's WebKit drops, and WebKit's Tab skips
 * buttons unless Option is held.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/MatchupCard/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card"] as const;
const TEXT = 4.5;
/* A logo with no image to load: the fade is what's checked, not the art. */
const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%232563eb'/%3E%3C/svg%3E";

function Ground({ id }: { id: (typeof GROUNDS)[number] }) {
  const dark = id.startsWith("dark");
  const card = (
    <MatchupCard
      isCompleted
      awayTeam={{ id: 1, logoSrc: LOGO, name: "Away", score: 10, isWinner: false, accessory: "(5)" }}
      homeTeam={{ id: 2, logoSrc: LOGO, name: "Home", score: 20, isWinner: true, accessory: "(8)" }}
    />
  );
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 240, background: dark ? "#0c0a09" : "#ffffff" }}>
      {id.endsWith("card") ? <Card>{card}</Card> : card}
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
function parts(canvas: Element, id: string) {
  const button = canvas.querySelector<HTMLElement>(`[data-ground="${id}"] button`)!;
  const [away, separator, home] = [...button.children] as HTMLElement[];
  const words = (side: HTMLElement) => [...side.querySelectorAll<HTMLElement>("span")].filter((s) => !s.matches(".rst\\:sr-only"));
  const [accessory, score] = words(away);
  return { button, away, separator, home, accessory, score, logo: away.querySelector("img")!, winner: words(home) };
}

/* Rests the real pointer on the field before the grounds, which has no hover
   style: a story or file before this one leaves it wherever it last was, and
   over a card its hover fill would read as the rest. */
async function restPointer() {
  await realInputOrSkip()?.commands.realHover("[data-before]");
}

export const TheLosingSideReadsOnEveryGround: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    await restPointer();
    const read = (id: string) => {
      const p = parts(canvasElement, id);
      const now = {
        accessory: round(textContrast(p.accessory)),
        score: round(textContrast(p.score)),
        separator: round(textContrast(p.separator)),
        winner: p.winner.map((w) => round(textContrast(w))),
      };
      /* 5.20: the loser's whole side faded and gray, its words in the
         winner's inks, the "-" gray-500 in dark too. */
      const dark = id.startsWith("dark");
      p.away.style.opacity = "0.5";
      p.away.style.filter = "grayscale(1)";
      p.logo.style.opacity = "1";
      p.accessory.style.color = dark ? "var(--roster-gray-300, #d6d3d1)" : "var(--roster-gray-800, #292524)";
      p.score.style.color = dark ? "#ffffff" : "var(--roster-gray-900, #1c1917)";
      p.separator.style.color = "var(--roster-gray-500, #65635f)";
      const old = { accessory: round(textContrast(p.accessory)), score: round(textContrast(p.score)), separator: round(textContrast(p.separator)) };
      for (const el of [p.away, p.logo, p.accessory, p.score, p.separator]) el.removeAttribute("style");
      return { now, old };
    };
    const all = Object.fromEntries(GROUNDS.map((id) => [id, read(id)]));
    console.info(`MATCHUPCARD ${JSON.stringify(all)}`);

    /* gray-500 in light, gray-400 in dark: Roster's quiet ink. */
    for (const k of ["accessory", "score", "separator"] as const) {
      await expect(GROUNDS.map((id) => all[id].now[k]), k).toEqual([5.99, 5.99, 7.83, 6.93]);
    }
    /* The winner's words are unchanged and pass. */
    for (const id of GROUNDS) for (const r of all[id].now.winner) await expect(r, `winner on ${id}`).toBeGreaterThanOrEqual(TEXT);

    /* The fade is on the loser's logo alone, and it's still gray. */
    const p = parts(canvasElement, "light-page");
    await expect([opacityOf(p.logo), getComputedStyle(p.logo).filter]).toEqual([0.5, "grayscale(1)"]);
    await expect([opacityOf(p.accessory), opacityOf(p.score), getComputedStyle(p.away).filter]).toEqual([1, 1, "none"]);

    /* The twin: 5.20's card. */
    await expect(GROUNDS.map((id) => all[id].old.score)).toEqual([3.35, 3.35, 5.33, 5.22]);
    await expect(GROUNDS.map((id) => all[id].old.accessory)).toEqual([3.1, 3.1, 3.93, 3.88]);
    await expect(GROUNDS.map((id) => all[id].old.separator)).toEqual([5.99, 5.99, 3.3, 2.92]);
  },
};

export const DarkHoverAndFocusUnderARealPointerAndKeyboard: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real || !navigator.userAgent.includes("Chrome")) return;
    await restPointer();
    /* Hover in dark is gray-800, where the "-" still reads. */
    const p = parts(canvasElement, "dark-page");
    const rest = getComputedStyle(p.button).backgroundColor;
    p.button.setAttribute("data-hover-probe", "dark");
    await real.commands.realHover('[data-hover-probe="dark"]');
    await waitFor(() => expect(getComputedStyle(p.button).backgroundColor).not.toBe(rest));
    const gray800 = rgba(getComputedStyle(document.documentElement).getPropertyValue("--roster-gray-800").trim());
    await expect(rgba(getComputedStyle(p.button).backgroundColor)).toEqual(gray800);
    await expect(round(textContrast(p.separator))).toBe(6.01);
    /* The twin: 5.20's hover, Tailwind's slate-800, under the old "-". */
    p.button.style.backgroundColor = "oklch(27.9% 0.041 260.031)";
    p.separator.style.color = "var(--roster-gray-500, #65635f)";
    await expect(round(textContrast(p.separator))).toBe(2.44);
    p.button.removeAttribute("style");
    p.separator.removeAttribute("style");

    /* Focus from the keyboard: Roster's ring. */
    const before = canvasElement.querySelector<HTMLElement>("[data-before]")!;
    before.focus();
    await real.commands.realPress(["Tab"]);
    const first = parts(canvasElement, "light-page").button;
    await waitFor(() => expect(document.activeElement).toBe(first));
    const style = getComputedStyle(first);
    const ring = rgba(style.getPropertyValue("--roster-ring").trim()).slice(0, 3).join(", ");
    await expect(style.boxShadow).toContain(`rgb(${ring}) 0px 0px 0px 2px`);
    await expect(style.outlineStyle).toBe("none");
  },
};
