import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StepProgress, type StepProgressProps } from "./StepProgress";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * The horizontal `StepProgress`, pinned to the build before `Timeline` came
 * beside it and took its marker into a shared module (5dc303a), in Chromium
 * and WebKit.
 *
 * Nine of them: the stepper at its first step, partway, past its last, at
 * 320px with names that wrap, with its words replaced and on a dark page; the
 * segmented bar partway, past its last and on a dark page. What's pinned, as
 * SHA-256 digests: each one's HTML, and the computed styles of every element
 * in it (colors, borders, corners, type, spacing, transforms). Pinned the same
 * on macOS and Linux, as the other pins are: React's ids masked, pixel values
 * in the HTML masked, and an outline's platform values left out. So are the
 * offsets and heights that follow the names' widths in the system font: a
 * connector's `right` (half its step's width) and, where names wrap, a
 * step's `height` and `top`. Linux's fonts gave other pixels for all three.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/StepProgress/Unchanged checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = ["Account", "Profile", "Shelf", "Invite", "Done"];
type Case = { pin: string; width?: number; dark?: boolean; props: StepProgressProps };
const CASES: Case[] = [
  { pin: "first", props: { steps: STEPS, current: 1 } },
  { pin: "partway", props: { steps: STEPS, current: 3 } },
  { pin: "finished", props: { steps: STEPS, current: 6 } },
  { pin: "narrow", width: 320, props: { steps: ["Your account", "A profile photo", "Your first shelf", "Done"], current: 2 } },
  { pin: "words", props: { steps: STEPS, current: 4, labels: { nav: "Fortschritt", done: "erledigt", number: (n) => `#${n}`, position: (c, t) => `Schritt ${c} von ${t}` } } },
  { pin: "dark", dark: true, props: { steps: STEPS, current: 2 } },
  { pin: "bar", props: { steps: STEPS, current: 2, variant: "segmented" } },
  { pin: "bar-finished", props: { steps: STEPS, current: 6, variant: "segmented" } },
  { pin: "bar-dark", dark: true, props: { steps: STEPS, current: 4, variant: "segmented" } },
];

function All() {
  return (
    <div style={{ display: "grid", gap: 24, width: 560 }}>
      {CASES.map((c) => (
        <div
          key={c.pin}
          data-pin={c.pin}
          className={c.dark ? "dark" : undefined}
          style={{ width: c.width, ...(c.dark ? { background: "#0c0a09", padding: 12 } : {}) }}
        >
          <StepProgress {...c.props} />
        </div>
      ))}
    </div>
  );
}

const html = (pin: string) =>
  document
    .querySelector(`[data-pin="${pin}"]`)!
    .innerHTML.replace(/-?\d+(\.\d+)?px/g, "#px")
    .replace(/_r_[0-9a-z]+_|[«:]r[0-9a-z]+[»:]/g, "ID");
const PROPS = [
  "display", "position", "box-sizing", "color", "background-color",
  "border-top-style", "border-top-width", "border-top-color", "border-top-left-radius",
  "font-family", "font-size", "font-weight", "line-height", "text-align", "font-variant-numeric",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-bottom",
  "gap", "flex-direction", "flex-grow", "align-items", "justify-content",
  "outline-style", "outline-width", "outline-color", "outline-offset", "box-shadow",
  "opacity", "transform", "visibility", "z-index", "min-width",
  "overflow-wrap", "word-break",
];
const look = (el: Element) => {
  const s = getComputedStyle(el);
  const platform = s.outlineStyle === "none" || s.outlineStyle === "auto";
  return PROPS.map((p) => (platform && p.startsWith("outline-") && p !== "outline-style" ? "-" : s.getPropertyValue(p))).join(";");
};
const styles = (pin: string) =>
  [...document.querySelectorAll(`[data-pin="${pin}"] *`)].map((el) => `${el.tagName.toLowerCase()} ${look(el)}`).join("\n");
async function digest(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);

/* Read from 5dc303a's build, 1 Nov 2026, and again the same day without the
   font-derived offsets (above), after Linux CI read other pixels for them. */
const OLD_BUILD: Record<"chromium" | "webkit", Record<string, string>> = {
  chromium: {
    first: "fdda6d3c10ea2254 8c11e31cce93b8e4",
    partway: "9c6973c63cd81a3e 3178aaa50f528954",
    finished: "9c0253655070902c 0b56695dd2736fb3",
    narrow: "02c563d92801428a 778bb9b117857a36",
    words: "7faf2ed5a93a454c fa60ce376ead4538",
    dark: "c20c9cdcd1af26fb 8cd6a0e68236c825",
    bar: "391d9cf1545c17be 7fcd039286db1ce5",
    "bar-finished": "71630fe58e88fb35 c6947aa9d6275708",
    "bar-dark": "e5c1f7f8c2f08553 1053ff4e43059f6f",
  },
  webkit: {
    first: "fdda6d3c10ea2254 fd02dc04eaf66b7b",
    partway: "9c6973c63cd81a3e 2007ab693cbf1d75",
    finished: "9c0253655070902c 9e06c9dee0394d74",
    narrow: "02c563d92801428a fd998a8137791deb",
    words: "7faf2ed5a93a454c f8f69c77c0b65cae",
    dark: "c20c9cdcd1af26fb 5380cde9b11bffae",
    bar: "391d9cf1545c17be dd1de9961080d621",
    "bar-finished": "71630fe58e88fb35 3b380fc25221afc8",
    "bar-dark": "e5c1f7f8c2f08553 2301e39fd6ed0c30",
  },
};

export const TheHorizontalFormsAreUnchanged: Story = {
  tags: ["real-input"],
  render: () => <All />,
  play: async () => {
    if (!realInputOrSkip()) return;
    const engine = chromium() ? "chromium" : "webkit";
    await document.fonts.ready;
    await wait(300);
    const now: Record<string, string> = {};
    for (const c of CASES) now[c.pin] = `${await digest(html(c.pin))} ${await digest(styles(c.pin))}`;
    console.info(`STEPPROGRESS UNCHANGED ${engine} ${JSON.stringify(now)}`);
    if (JSON.stringify(now) !== JSON.stringify(OLD_BUILD[engine])) {
      for (const c of CASES) console.info(`STEPPROGRESS UNCHANGED ${engine} ${c.pin} html: ${html(c.pin)}\nstyles:\n${styles(c.pin)}`);
    }
    await expect(now).toEqual(OLD_BUILD[engine]);
  },
};
