import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { AvatarStrip } from "./AvatarStrip";
import { Card } from "../Card/Card";
import { rgba, textContrast } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * The dismiss button, measured as painted, in Chromium and WebKit (tagged
 * `real-input` for the project that runs both).
 *
 * Its icon is all there is of the control, so its bar is 3:1 (WCAG 1.4.11),
 * on the page and on a Card, light and dark; its box is 24px square (2.5.8).
 * The figures are literals, the same in both engines to 0.01; the twin's
 * dark readings differ by 0.02 (WebKit mixes the 50% a hair lower).
 *
 * The twin is the dismiss as 5.20 drew it, a text "✕" in gray-400 at 50%
 * (gray-500 in dark), drawn here with inline styles: it fails on every
 * ground, and its box is the host font's glyph, narrower than 24px.
 *
 * Hover and focus are read under a real pointer and keyboard in Chromium
 * only: Storybook's dev CSS keeps Tailwind's `@media (hover: hover)` nested
 * in `&:hover`, which Playwright's WebKit drops, and WebKit's Tab skips
 * buttons unless Option is held.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/AvatarStrip/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { key: "a", label: "Ann" },
  { key: "b", label: "Bo" },
];

/* 5.20's dismiss, as it rendered beside the stack: the twin. */
function OldDismiss({ dark }: { dark: boolean }) {
  const step = dark ? "var(--roster-gray-500, #65635f)" : "var(--roster-gray-400, #a8a29e)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
      <button type="button" data-old="" aria-label="Dismiss" style={{ color: `color-mix(in oklab, ${step} 50%, transparent)`, background: "none", border: 0, padding: 0, flexShrink: 0, cursor: "pointer" }}>
        ✕
      </button>
      <span style={{ display: "inline-block", width: 24, height: 24 }} />
    </div>
  );
}

const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card"] as const;

function Ground({ id }: { id: (typeof GROUNDS)[number] }) {
  const dark = id.startsWith("dark");
  const body = (
    <>
      <AvatarStrip items={ITEMS} onDismiss={() => {}} label="2 others prefer Controller" />
      <OldDismiss dark={dark} />
    </>
  );
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 280, background: dark ? "#0c0a09" : "#ffffff" }}>
      {id.endsWith("card") ? <Card>{body}</Card> : body}
    </div>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
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

const dismissOn = (canvas: Element, id: string) =>
  canvas.querySelector<HTMLElement>(`[data-ground="${id}"] [data-testid="avatar-strip-dismiss"]`)!;
const oldOn = (canvas: Element, id: string) => canvas.querySelector<HTMLElement>(`[data-ground="${id}"] [data-old]`)!;

/* Rests the real pointer on the field before the grounds, which has no hover
   style: a story or file before this one leaves it wherever it last was, and
   over a dismiss its hover ink would read as the rest. */
async function restPointer() {
  await realInputOrSkip()?.commands.realHover("[data-before]");
}

export const TheDismissPassesOnEveryGround: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    await restPointer();
    const read = (id: string) => {
      const dismiss = dismissOn(canvasElement, id);
      const box = dismiss.getBoundingClientRect();
      const oldBox = oldOn(canvasElement, id).getBoundingClientRect();
      return {
        rest: round(textContrast(dismiss)),
        old: round(textContrast(oldOn(canvasElement, id))),
        box: [round(box.width), round(box.height)],
        icon: [...dismiss.querySelectorAll("svg")].map((svg) => round(svg.getBoundingClientRect().width)),
        oldWidth: round(oldBox.width),
      };
    };
    const all = Object.fromEntries(GROUNDS.map((id) => [id, read(id)]));
    console.info(`AVATARSTRIP DISMISS ${JSON.stringify(all)}`);

    /* gray-500 on white and on a light Card; gray-400 on the dark page
       (gray-950) and a dark Card (gray-900): the "+N" chip's ink. */
    await expect(GROUNDS.map((id) => all[id].rest)).toEqual([5.99, 5.99, 7.83, 6.93]);
    /* A 24px button holding one 12px drawn icon. */
    for (const id of GROUNDS) {
      await expect(all[id].box, id).toEqual([24, 24]);
      await expect(all[id].icon, id).toEqual([12]);
    }

    /* The twin: 5.20's glyph, under the bar everywhere, and narrower than
       the 24px it now has. */
    const OLD = [1.54, 1.54, 1.67, 1.66];
    for (const [i, id] of GROUNDS.entries()) await expect(Math.abs(all[id].old - OLD[i]), `${id}: ${all[id].old}`).toBeLessThanOrEqual(0.03);
    for (const id of GROUNDS) await expect(all[id].oldWidth, id).toBeLessThan(24);
  },
};

export const HoverAndFocusUnderARealPointerAndKeyboard: Story = {
  render: () => <Grounds />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real || !navigator.userAgent.includes("Chrome")) return;
    await restPointer();

    /* Hover: a stronger ink and the chip's wash. */
    const hovered: Record<string, number> = {};
    for (const id of GROUNDS) {
      const dismiss = dismissOn(canvasElement, id);
      const rest = getComputedStyle(dismiss).color;
      dismiss.setAttribute("data-hover-probe", id);
      await real.commands.realHover(`[data-hover-probe="${id}"]`);
      await waitFor(() => expect(getComputedStyle(dismiss).color).not.toBe(rest));
      hovered[id] = round(textContrast(dismiss));
      dismiss.removeAttribute("data-hover-probe");
    }
    console.info(`AVATARSTRIP HOVER ${JSON.stringify(hovered)}`);
    await expect(GROUNDS.map((id) => hovered[id])).toEqual([8.93, 8.93, 14.76, 12.84]);

    /* Focus from the keyboard: Roster's ring, a 2px band in `--roster-ring`
       with no offset. The twin, 5.20's glyph, had the browser's outline. */
    const before = canvasElement.querySelector<HTMLElement>("[data-before]")!;
    before.focus();
    await real.commands.realPress(["Tab"]);
    const dismiss = dismissOn(canvasElement, "light-page");
    await waitFor(() => expect(document.activeElement).toBe(dismiss));
    const style = getComputedStyle(dismiss);
    const ring = rgba(style.getPropertyValue("--roster-ring").trim());
    await expect(style.boxShadow).toContain(`rgb(${ring.slice(0, 3).join(", ")}) 0px 0px 0px 2px`);
    await expect(style.outlineStyle).toBe("none");
    /* The next stop, the avatars being no stops at all. */
    const old = oldOn(canvasElement, "light-page");
    await real.commands.realPress(["Tab"]);
    await waitFor(() => expect(document.activeElement).toBe(old));
    await expect(getComputedStyle(old).boxShadow).toBe("none");
    await expect(getComputedStyle(old).outlineStyle).not.toBe("none");
  },
};
