import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { SliderSnapPoint } from "../Slider/Slider";
import { RangeSlider } from "./RangeSlider";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * RangeSlider's promises, checked in real browsers. The pointer and keyboard
 * ones run in Chromium and WebKit (the real-input project), with the real
 * mouse and keys. Each expected value is a literal, each with a twin that
 * must come out differently.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/RangeSlider/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SURE: SliderSnapPoint[] = [
  { value: 100, label: "Certain" },
  { value: 75, label: "Likely" },
  { value: 50, label: "Toss-up" },
];

const thumb = (name: string, end: "Minimum" | "Maximum") => within(document.body).getByRole("slider", { name: `${name} ${end}` });
const pair = (name: string) => [thumb(name, "Minimum"), thumb(name, "Maximum")].map((t) => t.getAttribute("aria-valuenow"));
const track = (name: string) => thumb(name, "Minimum").parentElement!;
/** Tags an element so a real-input command can find it. */
const tag = (el: Element, name: string) => {
  el.setAttribute("data-check", name);
  return `[data-check="${name}"]`;
};

/** The widest plain ring in an element's box-shadow, in px: a focus ring is 2px past its 2px offset. */
const ringWidth = (el: Element) => Math.max(0, ...[...getComputedStyle(el).boxShadow.matchAll(/0px 0px 0px (\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])));

/* 300px wide: the rail runs from 22px to 278px, 256px for 0 to 100. */
const Frame = ({ children }: { children: React.ReactNode }) => <div style={{ width: 300, display: "grid", gap: 24 }}>{children}</div>;

export const ATapMovesTheNearerThumb: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <RangeSlider label="Low tap" defaultValue={[20, 80]} />
      <RangeSlider label="High tap" defaultValue={[20, 80]} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* 120px is 38, nearer the low thumb, which goes there and takes focus. */
    await real.commands.realClick(tag(track("Low tap"), "low-tap"), { fx: 0.4 });
    await waitFor(() => expect([...pair("Low tap"), document.activeElement === thumb("Low tap", "Minimum")]).toEqual(["38", "80", true]));
    /* The twin: 180px is 62, nearer the high one. */
    await real.commands.realClick(tag(track("High tap"), "high-tap"), { fx: 0.6 });
    await waitFor(() => expect([...pair("High tap"), document.activeElement === thumb("High tap", "Maximum")]).toEqual(["20", "62", true]));
  },
};

export const TheThumbsMeetAndNeverCross: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <RangeSlider label="Meet" defaultValue={[20, 60]} />
      <RangeSlider label="Part left" defaultValue={[50, 50]} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* The low thumb dragged far past the high one stops on it. */
    await real.commands.realDrag(tag(thumb("Meet", "Minimum"), "meet-low"), 400);
    await waitFor(() => expect(pair("Meet")).toEqual(["60", "60"]));
    /* On one spot, the drag's way decides: right takes the high thumb. */
    await real.commands.realDrag(tag(thumb("Meet", "Maximum"), "meet-high"), 400);
    await waitFor(() => expect(pair("Meet")).toEqual(["60", "100"]));
    /* The twin: left from one spot takes the low one. */
    await real.commands.realDrag(tag(thumb("Part left", "Maximum"), "part-left"), -400);
    await waitFor(() => expect(pair("Part left")).toEqual(["0", "50"]));
  },
};

export const EachThumbTakesItsKeys: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <RangeSlider label="Keys" defaultValue={[20, 80]} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    thumb("Keys", "Minimum").focus();
    /* Right on the low thumb, then Tab to the high one, and Left there. */
    await real.commands.realPress(["ArrowRight", "Tab", "ArrowLeft"]);
    await waitFor(() => expect([...pair("Keys"), document.activeElement === thumb("Keys", "Maximum")]).toEqual(["21", "79", true]));
    /* The twin: Shift+Tab back, and End takes the low thumb only as far as the high. */
    await real.commands.realPress(["Shift+Tab", "End"]);
    await waitFor(() => expect([...pair("Keys"), document.activeElement === thumb("Keys", "Minimum")]).toEqual(["79", "79", true]));
  },
};

export const AKeyBurstStepsFromTheValue: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <RangeSlider label="Burst" defaultValue={[20, 80]} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const low = thumb("Burst", "Minimum");
    /* A slow ease, so the drawn thumb is still on its way when the keys stop. */
    low.style.transitionDuration = "10s";
    const said: string[] = [];
    const watch = new MutationObserver(() => said.push(low.getAttribute("aria-valuetext")!));
    watch.observe(low, { attributes: true, attributeFilter: ["aria-valuetext"] });
    low.focus();
    try {
      await real.commands.realPress(Array(10).fill("ArrowRight"));
      await waitFor(() => expect(pair("Burst")[0]).toBe("30"));
    } finally {
      watch.disconnect();
    }
    await expect(said).toEqual(["21", "22", "23", "24", "25", "26", "27", "28", "29", "30"]);
    /* The twin: the thumb drawn for 30 is still short of it. */
    const box = track("Burst").getBoundingClientRect();
    const t = low.getBoundingClientRect();
    await expect((t.left + t.width / 2 - box.left - 22) / 256 < 0.28).toBe(true);
  },
};

export const TheFocusRingIsTheFocusedThumbs: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <RangeSlider label="Ring" defaultValue={[20, 80]} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* A thumb always casts its own shadow, and the ring's offset is a layer
       too: the ring is the layer that reaches past the offset. */
    const ringed = () => [thumb("Ring", "Minimum"), thumb("Ring", "Maximum")].map((t) => ringWidth(t) === 4);
    /* Reached by a real Shift+Tab: a press or a script's focus isn't the
       keyboard's to WebKit, which shows no ring after a click. */
    thumb("Ring", "Maximum").focus();
    await real.commands.realPress(["Shift+Tab"]);
    await waitFor(() => expect(ringed()).toEqual([true, false]));
    /* The twin: Tab, and the ring moves to the high thumb. */
    await real.commands.realPress(["Tab"]);
    await waitFor(() => expect(ringed()).toEqual([false, true]));
  },
};

export const EveryThumbIs44At320: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <RangeSlider label="Small" snapPoints={[...SURE, { value: 0, label: "0" }]} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.page.viewport(320, 720);
    try {
      await waitFor(() => expect(window.innerWidth).toBe(320));
      const t = track("Small");
      /* Each thumb's 44 by 44, at min and at max, is on the track. */
      const hits = (el: Element) => {
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        return [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]].map(([x, y]) => t.contains(document.elementFromPoint(x, y)));
      };
      await waitFor(() => expect([hits(thumb("Small", "Minimum")), hits(thumb("Small", "Maximum"))]).toEqual([[true, true, true, true], [true, true, true, true]]));
      /* The twin: 23px left of the low thumb at 0 is off the track. */
      const low = thumb("Small", "Minimum").getBoundingClientRect();
      await expect(t.contains(document.elementFromPoint(low.left + low.width / 2 - 23, low.top + low.height / 2))).toBe(false);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const ARealTouchMovesTheNearerThumb: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ height: 1600 }}>
      <Frame>
        <RangeSlider label="Swipe" defaultValue={[10, 80]} />
        <RangeSlider label="Scroll past" defaultValue={[10, 80]} />
      </Frame>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* A finger on the rail at 50, nearer the high thumb, swiped far left:
       the high thumb comes down to the low one, and stops there. */
    const swiped = await real.commands.realTouchSwipe(tag(track("Swipe"), "swipe"), -400, 0, { fx: 0.5 });
    if (!swiped) return; /* WebKit: Playwright has no real touch there. */
    await waitFor(() => expect([...pair("Swipe"), document.activeElement === thumb("Swipe", "Maximum")]).toEqual(["10", "10", true]));
    /* The twin: the same finger down the page scrolls it, and moves nothing. */
    await real.commands.realTouchSwipe(tag(track("Scroll past"), "scroll-past"), 0, -150, { fx: 0.5 });
    await new Promise((r) => setTimeout(r, 300));
    await expect(pair("Scroll past")).toEqual(["10", "80"]);
    window.scrollTo(0, 0);
  },
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <Frame>
        <RangeSlider label="RTL" defaultValue={[20, 80]} />
      </Frame>
    </div>
  ),
  play: async () => {
    thumb("RTL", "Minimum").focus();
    /* Right is back toward the start, which is on the right. */
    await userEvent.keyboard("{ArrowRight}");
    await expect(pair("RTL")).toEqual(["19", "80"]);
    /* The fill runs between the thumbs, measured from the right: the twin,
       its left end, is the high thumb's. */
    await waitFor(() => {
      const box = track("RTL").getBoundingClientRect();
      const fill = track("RTL").querySelector("[data-slider-fill]")!.getBoundingClientRect();
      expect([Math.round(box.right - fill.right), Math.round(fill.left - box.left)]).toEqual([Math.round(22 + 256 * 0.19), Math.round(22 + 256 * 0.2)]);
    });
  },
};

export const ReducedMotionHoldsTheThumbsStill: Story = {
  tags: ["reduced-motion"],
  render: () => (
    <Frame>
      <RangeSlider label="Motion" defaultValue={[20, 80]} />
    </Frame>
  ),
  play: async () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* No easing under reduced motion; the twin is this story in the default
       project, where the thumbs ease. */
    await expect([thumb("Motion", "Minimum"), thumb("Motion", "Maximum")].map((t) => getComputedStyle(t).transitionProperty)).toEqual(
      reduced ? ["none", "none"] : ["inset-inline-start", "inset-inline-start"],
    );
  },
};

export const ItSaysWhatItIs: Story = {
  tags: ["ax-tree"],
  render: () => (
    <Frame>
      <RangeSlider label="Price" defaultValue={[20, 80]} snapPoints={SURE} formatValue={(v) => `${v}%`} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    thumb("Price", "Minimum").setAttribute("data-ax-probe", "low");
    thumb("Price", "Maximum").setAttribute("data-ax-probe", "high");
    const read = async () =>
      (await real.commands.axStates(['[data-ax-probe="low"]', '[data-ax-probe="high"]'])).map((a) => [a.role, a.name, a.value, a.valueText]);
    await expect(await read()).toEqual([
      ["slider", "Price Minimum", "20", "20%, Toss-up"],
      ["slider", "Price Maximum", "80", "80%, Likely"],
    ]);
    /* The twin: the low thumb moved, the high one's word for itself unchanged. */
    thumb("Price", "Minimum").focus();
    await userEvent.keyboard("{End}");
    await expect(await read()).toEqual([
      ["slider", "Price Minimum", "80", "80%, Likely"],
      ["slider", "Price Maximum", "80", "80%, Likely"],
    ]);
  },
};
