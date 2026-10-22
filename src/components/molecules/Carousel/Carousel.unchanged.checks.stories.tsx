import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Carousel } from "./Carousel";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * The default mode, pinned to the build before the selection mode existed
 * (d087aba, 5.13.0), in Chromium and WebKit.
 *
 * Three rows in their usual shapes: links (each its own tab stop, arrows
 * above), plain items (the list is the tab stop, fluid, with the position
 * readout), and pressed buttons (overlay arrows, the fade). Each is read at
 * rest, after a real hover and a real click, and along a real Tab walk
 * through all three, with a real ArrowRight on the row that is itself the tab
 * stop. What's pinned: every row's rendered HTML (ids normalized) as a
 * SHA-256 digest at each of those moments, and the walk itself, the focused
 * element and every row's scroll position at each step, as the old build
 * gave them. A mismatch logs the HTML it read.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Carousel/Unchanged checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const CARD: CSSProperties = { display: "block", height: 80, padding: 8, borderRadius: 12, border: "1px solid rgb(0 0 0 / 0.2)", font: "inherit", color: "inherit" };
const names = Array.from({ length: 9 }, (_, i) => `Item ${i + 1}`);

function Rows() {
  const [pressed, setPressed] = useState(0);
  return (
    <div style={{ width: 520, display: "flow-root" }}>
      <button type="button" data-pin="before">
        Before
      </button>
      <div data-pin="links" style={{ marginTop: 16 }}>
        <Carousel aria-label="Links" itemWidth={150} arrows="always">
          {names.map((n) => (
            <a key={n} href={`#${n}`} style={CARD} onClick={(e) => e.preventDefault()}>
              {n}
            </a>
          ))}
        </Carousel>
      </div>
      <div data-pin="plain" style={{ marginTop: 16 }}>
        <Carousel aria-label="Plain" perView={2.5} showPosition>
          {names.map((n) => (
            <div key={n} style={CARD}>
              {n}
            </div>
          ))}
        </Carousel>
      </div>
      <div data-pin="pressed" style={{ marginTop: 16 }}>
        <Carousel aria-label="Pressed" itemWidth={120} arrowPlacement="overlay" arrows="always" fade>
          {names.map((n, i) => (
            <button key={n} type="button" aria-pressed={pressed === i} onClick={() => setPressed(i)} style={{ ...CARD, width: "100%" }}>
              {n}
            </button>
          ))}
        </Carousel>
      </div>
    </div>
  );
}

const ROWS = ["links", "plain", "pressed"] as const;
const html = (row: string) => document.querySelector(`[data-pin="${row}"]`)!.innerHTML.replace(/[«:]r[0-9a-z]+[»:]/g, "ID");
async function digest(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const read = async () => {
  const out: Record<string, string> = {};
  for (const row of ROWS) out[row] = await digest(html(row));
  return out;
};
const where = () => {
  const el = document.activeElement as HTMLElement | null;
  const focused = !el || el === document.body ? "body" : `${el.tagName.toLowerCase()} ${el.getAttribute("aria-label") ?? el.textContent?.trim()}`;
  const lists = [...document.querySelectorAll("[data-pin] ul")].map((u) => Math.round(u.scrollLeft)).join(",");
  return `${focused} | ${lists}`;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);

type Pinned = { rest: Record<string, string>; hovered: Record<string, string>; clicked: Record<string, string>; walked: Record<string, string>; walk: string[] };

/* Read from d087aba's build, 22 Oct 2026. */
const OLD_BUILD: Record<"chromium" | "webkit", Pinned> = {
  chromium: {
    rest: { links: "4c375685ba4f3308", plain: "631bd75f8e3173e5", pressed: "5b8fa188d1b43e79" },
    hovered: { links: "4c375685ba4f3308", plain: "631bd75f8e3173e5", pressed: "5b8fa188d1b43e79" },
    clicked: { links: "4c375685ba4f3308", plain: "631bd75f8e3173e5", pressed: "2d6337cbf4be977e" },
    walked: { links: "a52a5acf037a3ba5", plain: "5259aa9c1c4f6ce0", pressed: "22ea51f7e9fb22a4" },
    walk: [
      "hovered: body | 0,0,0",
      "clicked: button Item 3 | 0,0,0",
      "button Next Links | 0,0,0",
      "a Item 1 | 0,0,0",
      "a Item 2 | 162,0,0",
      "a Item 3 | 324,0,0",
      "a Item 4 | 486,0,0",
      "a Item 5 | 648,0,0",
      "a Item 6 | 810,0,0",
      "a Item 7 | 958,0,0",
      "a Item 8 | 958,0,0",
      "a Item 9 | 958,0,0",
      "button Next Plain | 958,0,0",
      "ul Plain | 958,0,0",
      "ArrowRight: ul Plain | 958,204,0",
      "button Item 1 | 958,204,0",
      "button Item 2 | 958,204,132",
      "button Item 3 | 958,204,264",
      "button Item 4 | 958,204,396",
      "button Item 5 | 958,204,528",
      "button Item 6 | 958,204,660",
      "button Item 7 | 958,204,688",
      "button Item 8 | 958,204,688",
      "button Item 9 | 958,204,688",
      "button Previous Pressed | 958,204,688",
      "body | 958,204,688",
      "body | 958,204,688",
      "button Before | 958,204,688",
      "button Previous Links | 958,204,688",
    ],
  },
  webkit: {
    rest: { links: "924367926a088df6", plain: "49a29d6467d71334", pressed: "d1805a637a1a821e" },
    hovered: { links: "924367926a088df6", plain: "49a29d6467d71334", pressed: "d1805a637a1a821e" },
    clicked: { links: "924367926a088df6", plain: "49a29d6467d71334", pressed: "e57d6d464085b7f2" },
    walked: { links: "8e2a82d7130a592f", plain: "788368f2da6f49c2", pressed: "9682c08537cc0c1e" },
    walk: [
      "hovered: body | 0,0,0",
      "clicked: body | 0,0,0",
      "button Next Links | 0,0,0",
      "a Item 1 | 0,0,0",
      "a Item 2 | 162,0,0",
      "a Item 3 | 324,0,0",
      "a Item 4 | 486,0,0",
      "a Item 5 | 648,0,0",
      "a Item 6 | 810,0,0",
      "a Item 7 | 958,0,0",
      "a Item 8 | 958,0,0",
      "a Item 9 | 958,0,0",
      "button Next Plain | 958,0,0",
      "ul Plain | 958,0,0",
      "ArrowRight: ul Plain | 958,204,0",
      "button Item 1 | 958,204,0",
      "button Item 2 | 958,204,132",
      "button Item 3 | 958,204,264",
      "button Item 4 | 958,204,396",
      "button Item 5 | 958,204,528",
      "button Item 6 | 958,204,660",
      "button Item 7 | 958,204,688",
      "button Item 8 | 958,204,688",
      "button Item 9 | 958,204,688",
      "button Previous Pressed | 958,204,688",
      "body | 958,204,688",
      "body | 958,204,688",
      "body | 958,204,688",
      "body | 958,204,688",
    ],
  },
};

export const TheDefaultModeIsUnchanged: Story = {
  tags: ["real-input"],
  render: () => <Rows />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const engine = chromium() ? "chromium" : "webkit";
    await document.fonts.ready;
    await wait(300);
    const now: Pinned = { rest: await read(), hovered: {}, clicked: {}, walked: {}, walk: [] };
    await real.commands.realHover('[data-pin="links"] li:nth-child(2) a');
    await wait(200);
    now.hovered = await read();
    now.walk.push(`hovered: ${where()}`);
    await real.commands.realClick('[data-pin="pressed"] li:nth-child(3) button');
    await wait(400);
    now.clicked = await read();
    now.walk.push(`clicked: ${where()}`);
    (document.querySelector('[data-pin="before"]') as HTMLElement).focus();
    /* Safari's keyboard users reach links and buttons with Option+Tab. */
    const tab = chromium() ? "Tab" : "Alt+Tab";
    for (let i = 0; i < 26; i++) {
      await real.commands.realPress([tab]);
      await wait(250);
      now.walk.push(where());
      if (document.activeElement?.getAttribute("aria-label") === "Plain" && document.activeElement.tagName === "UL") {
        await real.commands.realPress(["ArrowRight"]);
        await wait(900);
        now.walk.push(`ArrowRight: ${where()}`);
      }
    }
    now.walked = await read();
    console.info(`CAROUSEL UNCHANGED ${engine} ${JSON.stringify(now)}`);
    const pinned = OLD_BUILD[engine];
    if (JSON.stringify(now) !== JSON.stringify(pinned)) {
      for (const row of ROWS) console.info(`CAROUSEL UNCHANGED ${engine} html ${row}: ${html(row)}`);
    }
    await expect(now).toEqual(pinned);
  },
};
