import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { backgroundOf, inkOf, paint, textOn } from "./test/painted";

/**
 * `textOn` (src/test/painted.ts), the measurement every contrast check here
 * reads text through, against colors worked out by hand: on a white page,
 * black text at half opacity paints mid-gray, and so on, and text positioned
 * over a sibling paints over that sibling. Each case's twin is
 * the reading that ignores opacity, the element's own color over the
 * backgrounds behind it, which paints black text black.
 *
 * Measured in Chromium and WebKit (tagged `real-input` for the project that
 * runs both; nothing here takes input).
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Painted/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const CASES = {
  /* Black at opacity 0.5 over white: half of each. */
  own: <span style={{ color: "#000", opacity: 0.5 }}>Text</span>,
  /* An ancestor at 0.5 holds a black ground and white text, and goes over
     the white page as one layer: the text stays white, its ground mid-gray.
     Faded one layer at a time instead, the text would read 191. */
  group: (
    <div style={{ opacity: 0.5 }}>
      <div style={{ background: "#000" }}>
        <span style={{ color: "#fff" }}>Text</span>
      </div>
    </div>
  ),
  /* Two opacities multiply: a quarter of black. */
  nested: (
    <div style={{ opacity: 0.5 }}>
      <span style={{ color: "#000", opacity: 0.5 }}>Text</span>
    </div>
  ),
  /* An alpha in the color itself. */
  alpha: <span style={{ color: "rgba(0, 0, 0, 0.5)" }}>Text</span>,
  /* A translucent ground: black at half over white, under white text. */
  ground: (
    <div style={{ background: "rgba(0, 0, 0, 0.5)" }}>
      <span style={{ color: "#fff" }}>Text</span>
    </div>
  ),
  /* Positioned over a sibling, as a field's icon sits over its input: white
     at half over the sibling's black, not over the page. */
  under: (
    <div style={{ position: "relative" }}>
      <div data-under style={{ background: "#000", height: 24 }} />
      <span style={{ position: "absolute", left: 4, top: 4, color: "#fff", opacity: 0.5 }}>Text</span>
    </div>
  ),
  /* The sibling faded itself, as a disabled field's input is: its black at
     half over the page, under solid white text. */
  underFaded: (
    <div style={{ position: "relative" }}>
      <div data-under style={{ background: "#000", height: 24, opacity: 0.5 }} />
      <span style={{ position: "absolute", left: 4, top: 4, color: "#fff" }}>Text</span>
    </div>
  ),
};

/* The element each case's text is painted over without being inside it. */
const UNDER: Partial<Record<keyof typeof CASES, string>> = { under: "[data-under]", underFaded: "[data-under]" };

/* By hand, on a white page: [ink, ground], one channel (they're grays). */
const EXPECTED: Record<keyof typeof CASES, [number, number]> = {
  own: [127.5, 255],
  group: [255, 127.5],
  nested: [191.25, 255],
  alpha: [127.5, 255],
  ground: [255, 127.5],
  under: [127.5, 0],
  underFaded: [255, 127.5],
};

/* The reading that ignores opacity: [ink, ground]. */
const UNFADED: Record<keyof typeof CASES, [number, number]> = {
  own: [0, 255],
  group: [255, 0],
  nested: [0, 255],
  alpha: [127.5, 255],
  ground: [255, 127.5],
  /* White on the page it isn't inside. */
  under: [255, 255],
  underFaded: [255, 255],
};

export const TextIsMeasuredAsPainted: Story = {
  render: () => (
    <div style={{ background: "#fff", padding: 16, display: "grid", gap: 8 }}>
      {Object.entries(CASES).map(([k, node]) => (
        <div key={k} data-case={k}>
          {node}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const wrong: string[] = [];
    /* Within a step of 8-bit color: an alpha is read back as n / 255. */
    const near = (a: number, b: number) => Math.abs(a - b) <= 1;
    for (const k of Object.keys(CASES) as (keyof typeof CASES)[]) {
      const text = [...canvasElement.querySelectorAll(`[data-case="${k}"] span`)].at(-1)!;
      const under = UNDER[k] ? canvasElement.querySelector(`[data-case="${k}"] ${UNDER[k]}`)! : undefined;
      const { ink, ground } = textOn(text, undefined, under);
      const [wantInk, wantGround] = EXPECTED[k];
      if (!ink.every((c) => near(c, wantInk)) || !ground.every((c) => near(c, wantGround))) {
        wrong.push(`${k}: ink ${ink.map(Math.round)} ground ${ground.map(Math.round)}, by hand ${wantInk} on ${wantGround}`);
      }
      /* `inkOf`, the text's color with its opacities as one alpha, over the
         white page: the same ink where nothing faded paints a ground. */
      if (!["group", "ground", "under", "underFaded"].includes(k)) {
        const flat = paint(["rgb(255, 255, 255)", inkOf(text)])[0];
        if (!near(flat, wantInk)) wrong.push(`${k} inkOf: ${flat}, by hand ${wantInk}`);
      }
      /* Twin: the old reading, which only the alpha cases agree with. */
      const layers = backgroundOf(text);
      const oldInk = paint([...layers, getComputedStyle(text).color])[0];
      const oldGround = paint(layers)[0];
      const [unInk, unGround] = UNFADED[k];
      if (!near(oldInk, unInk) || !near(oldGround, unGround)) wrong.push(`${k} old: ${oldInk} on ${oldGround}, expected ${unInk} on ${unGround}`);
    }
    /* Twin for `under`: read without it, the walk meets only the page, so
       the ground is white, not the black the text sits on. */
    const over = canvasElement.querySelector('[data-case="under"] span')!;
    await expect(textOn(over).ground.map(Math.round)).toEqual([255, 255, 255]);
    /* And it refuses an ancestor, which the walk meets anyway. */
    await expect(() => textOn(over, undefined, over.parentElement!)).toThrow(/ancestors/);
    await expect(wrong).toEqual([]);
  },
};
