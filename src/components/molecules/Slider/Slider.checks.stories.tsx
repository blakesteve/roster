import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Slider, type SliderSnapPoint } from "./Slider";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Slider's promises, checked in real browsers. The pointer and keyboard ones
 * run in Chromium and WebKit (the real-input project), with the real mouse and
 * keys. Each expected value is a literal, each with a twin that must come out
 * differently.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Slider/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SURE: SliderSnapPoint[] = [
  { value: 100, label: "Certain" },
  { value: 75, label: "Likely" },
  { value: 50, label: "Toss-up" },
];
const percent = (v: number) => `${v}%`;

const slider = (name: string) => within(document.body).getByRole("slider", { name });
const now = (name: string) => slider(name).getAttribute("aria-valuenow");
/** Tags an element so a real-input command can find it. */
const tag = (el: Element, name: string) => {
  el.setAttribute("data-check", name);
  return `[data-check="${name}"]`;
};

/** The widest plain ring in an element's box-shadow, in px: a focus ring is 2px past its 2px offset. */
const ringWidth = (el: Element) => Math.max(0, ...[...getComputedStyle(el).boxShadow.matchAll(/0px 0px 0px (\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])));

/* 300px wide: the rail runs from 22px to 278px, 256px for 0 to 100. */
const Frame = ({ children }: { children: React.ReactNode }) => <div style={{ width: 300, display: "grid", gap: 24 }}>{children}</div>;

export const ATapOnTheTrackSetsIt: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Tap" />
      <Slider label="Tap again" defaultValue={null} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await expect([now("Tap"), document.activeElement === slider("Tap")]).toEqual(["50", false]);
    /* A quarter of the way along the track is 75px: (75 - 22) / 256 of the
       range, 21, away from the thumb in the middle. The press focuses the
       slider itself. */
    await real.commands.realClick(tag(slider("Tap"), "tap"), { fx: 0.25 });
    await waitFor(() => expect([now("Tap"), document.activeElement === slider("Tap")]).toEqual(["21", true]));
    /* The twin, on an empty track: three quarters is 79. */
    await real.commands.realClick(tag(slider("Tap again"), "tap-again"), { fx: 0.75 });
    await waitFor(() => expect(now("Tap again")).toBe("79"));
  },
};

const commits: number[] = [];
const changes: (number | null)[] = [];

export const AnEndOffTheStepIsStillTheEnd: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Halves" min={0} max={2.5} step={1} onChange={(v) => changes.push(v)} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    changes.length = 0;
    /* A max of 2.5 on a step of 1: a tap at the far end reports 2.5, never
       the 3 that rounding to the step once carried it to. The twin, 60% of
       the way, is the step nearest, 2. */
    await real.commands.realClick(tag(slider("Halves"), "halves"), { fx: 0.99 });
    await real.commands.realClick(tag(slider("Halves"), "halves"), { fx: 0.6 });
    await waitFor(() => expect(changes).toEqual([2.5, 2]));
  },
};

export const ADragLandsAnywhere: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Drag" defaultValue={50} snapPoints={SURE} onCommit={(v) => commits.push(v)} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    commits.length = 0;
    const thumb = () => tag(slider("Drag").querySelector("[data-slider-thumb]")!, "thumb");
    /* Pressing the thumb and letting go where it was moves nothing, and
       commits nothing: the press takes the thumb where it is, rather than
       jumping it to the pointer. */
    await real.commands.realDrag(thumb(), 0, { fx: 0.8 });
    await expect([now("Drag"), commits.length]).toEqual(["50", 0]);
    /* Pressed off its middle and dragged right, the thumb keeps that offset
       under the pointer: it lands where the pointer let go, less how far off
       the middle the press was, read on the page as (x - 22) / 256 of the
       range. Not on a snap point. A grab kept the wrong way round lands
       about six away. */
    let pressed = 0;
    let letGo = 0;
    const onDown = (event: PointerEvent) => (pressed = event.clientX);
    const onUp = (event: PointerEvent) => (letGo = event.clientX);
    const middle = () => {
      const t = slider("Drag").querySelector("[data-slider-thumb]")!.getBoundingClientRect();
      return t.left + t.width / 2;
    };
    const before = middle();
    slider("Drag").addEventListener("pointerdown", onDown);
    slider("Drag").addEventListener("pointerup", onUp);
    try {
      await real.commands.realDrag(thumb(), 33, { fx: 0.9 });
    } finally {
      slider("Drag").removeEventListener("pointerdown", onDown);
      slider("Drag").removeEventListener("pointerup", onUp);
    }
    const grab = before - pressed;
    const box = slider("Drag").getBoundingClientRect();
    const expected = String(Math.round(((letGo + grab - box.left - 22) / 256) * 100));
    await expect(grab < -5).toBe(true);
    await expect(commits).toEqual([Number(expected)]);
    await waitFor(() => expect(now("Drag")).toBe(expected));
    await expect([Number(expected) > 55, SURE.some((p) => String(p.value) === expected)]).toEqual([true, false]);
    await expect(within(slider("Drag").parentElement!).queryAllByRole("button", { pressed: true })).toHaveLength(0);
  },
};

export const AChipSetsItsValue: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Chips" snapPoints={SURE} formatValue={percent} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const chip = (label: string) => within(slider("Chips").parentElement!).getByRole("button", { name: label });
    /* The pressed chip is filled and the rest are clear, so it shows without
       relying on its color. */
    const filled = (label: string) => getComputedStyle(chip(label)).backgroundColor !== "rgba(0, 0, 0, 0)";
    await real.commands.realClick(tag(chip("Likely"), "likely"));
    await waitFor(() =>
      expect([now("Chips"), slider("Chips").getAttribute("aria-valuetext"), chip("Likely").getAttribute("aria-pressed"), filled("Likely"), filled("Certain")]).toEqual([
        "75",
        "75%, Likely",
        "true",
        true,
        false,
      ]),
    );
    /* The twin: another chip, another value, and the first no longer marked. */
    await real.commands.realClick(tag(chip("Certain"), "certain"));
    await waitFor(() =>
      expect([now("Chips"), chip("Likely").getAttribute("aria-pressed"), chip("Certain").getAttribute("aria-pressed"), filled("Likely"), filled("Certain")]).toEqual([
        "100",
        "false",
        "true",
        false,
        true,
      ]),
    );
  },
};

export const TheFirstKeyOnAnEmptySlider: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Arrow" defaultValue={null} />
      <Slider label="Home" defaultValue={null} />
      <Slider label="End" defaultValue={null} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const press = async (name: string, key: string) => {
      slider(name).focus();
      await real.commands.realPress([key]);
      return now(name);
    };
    /* An arrow places the thumb at the start value, the middle; Home and End
       at the ends. */
    await expect([await press("Arrow", "ArrowRight"), await press("Home", "Home"), await press("End", "End")]).toEqual(["50", "0", "100"]);
    /* The twin: once set, an arrow steps. */
    await expect(await press("Arrow", "ArrowRight")).toBe("51");
  },
};

export const AKeyBurstStepsFromTheValue: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Burst" defaultValue={50} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const s = slider("Burst");
    const thumb = s.querySelector<HTMLElement>("[data-slider-thumb]")!;
    const fill = s.querySelector<HTMLElement>("[data-slider-fill]")!;
    /* A slow ease, so the drawn thumb is still on its way when the keys stop. */
    for (const el of [thumb, fill]) el.style.transitionDuration = "10s";
    const said: string[] = [];
    const watch = new MutationObserver(() => said.push(s.getAttribute("aria-valuetext")!));
    watch.observe(s, { attributes: true, attributeFilter: ["aria-valuetext"] });
    s.focus();
    try {
      await real.commands.realPress(Array(10).fill("ArrowRight"));
      await waitFor(() => expect(now("Burst")).toBe("60"));
    } finally {
      watch.disconnect();
    }
    /* Every press counted, each said once, in order. */
    await expect(said).toEqual(["51", "52", "53", "54", "55", "56", "57", "58", "59", "60"]);
    /* The twin: the thumb drawn for 60 is still far short of it, so the keys
       didn't step from where it was drawn. */
    const box = s.getBoundingClientRect();
    const drawn = (thumb.getBoundingClientRect().left + thumb.getBoundingClientRect().width / 2 - box.left - 22) / 256;
    await expect(drawn < 0.58).toBe(true);
  },
};

export const EveryTargetIs44At320: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      {/* "0" is a chip narrower than 44 on its own. */}
      <Slider label="Small" snapPoints={[...SURE, { value: 0, label: "0" }]} defaultValue={0} />
      {/* Narrow enough that its chips wrap onto a second row. */}
      <div style={{ width: 180 }}>
        <Slider label="Narrow" snapPoints={SURE} />
      </div>
      {/* Narrower than its one chip's label. */}
      <div style={{ width: 60 }}>
        <Slider label="Tight" snapPoints={[{ value: 50, label: "Toss-up" }]} />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.page.viewport(320, 720);
    try {
      await waitFor(() => expect(window.innerWidth).toBe(320));
      const s = slider("Small");
      const hits = () => {
        const t = s.querySelector("[data-slider-thumb]")!.getBoundingClientRect();
        const cx = t.left + t.width / 2;
        const cy = t.top + t.height / 2;
        return [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]].map(([x, y]) => s.contains(document.elementFromPoint(x, y)));
      };
      /* The thumb's 44 by 44 is on the slider at both ends of the range. */
      await waitFor(() => expect(hits()).toEqual([true, true, true, true]));
      s.focus();
      await real.commands.realPress(["End"]);
      await waitFor(() => expect(now("Small")).toBe("100"));
      await waitFor(() => expect(hits()).toEqual([true, true, true, true]));
      /* The twin: 23px left of the thumb at the start is off the slider. */
      await real.commands.realPress(["Home"]);
      await waitFor(() => expect(now("Small")).toBe("0"));
      await waitFor(() => {
        const t = s.querySelector("[data-slider-thumb]")!.getBoundingClientRect();
        expect(s.contains(document.elementFromPoint(t.left + t.width / 2 - 23, t.top + t.height / 2))).toBe(false);
      });
      /* Every chip's target is 44 tall and at least 44 wide, and on screen,
         with no sideways scroll. Chip draws its target as an overhang past
         its box, so it's hit-tested rather than measured. The thumb's checks
         above, at 0, ran with the first chip right under it; the narrow
         slider's chips are on two rows, one target above the other. */
      const narrow = within(slider("Narrow").parentElement!).getAllByRole("button");
      await expect(new Set(narrow.map((c) => Math.round(c.getBoundingClientRect().top))).size).toBe(2);
      /* A chip in a row narrower than its label keeps the label inside it,
         rather than squeezing to 44 under it; the twin is the row itself,
         which it overhangs. */
      const tight = within(slider("Tight").parentElement!).getByRole("button");
      await expect([tight.scrollWidth <= tight.clientWidth, tight.getBoundingClientRect().width > 60]).toEqual([true, true]);
      const chips = within(document.body).getAllByRole("button");
      const reach = (dy: number) =>
        chips.map((c) => {
          const b = c.getBoundingClientRect();
          return c.contains(document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2 + dy));
        });
      await expect(
        chips.map((c) => {
          const b = c.getBoundingClientRect();
          return [Math.round(b.width) >= 44, b.left >= 0, b.right <= 320];
        }),
      ).toEqual(chips.map(() => [true, true, true]));
      await expect([reach(-21), reach(21)]).toEqual([chips.map(() => true), chips.map(() => true)]);
      /* The twin: 23px off a chip's middle is off it. */
      await expect([reach(-23), reach(23)]).toEqual([chips.map(() => false), chips.map(() => false)]);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const ARestingPointerSetsNothing: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ height: 2000, paddingTop: 200 }}>
      <Frame>
        <Slider label="Rest" defaultValue={null} />
      </Frame>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const moves: number[] = [];
    const s = slider("Rest");
    const onMove = () => moves.push(Date.now());
    s.addEventListener("pointermove", onMove);
    try {
      /* The pointer comes to rest on the track, and the page scrolls a little
         under it. WebKit sends the track a pointermove for that, with no
         press; Chromium sends none. Neither sets anything. */
      await real.commands.realHover(tag(s, "rest"), { fx: 0.6 });
      moves.length = 0;
      window.scrollBy(0, 12);
      await new Promise((r) => setTimeout(r, 400));
      await expect(now("Rest"), `pointermoves with no press: ${moves.length}`).toBeNull();
      /* And the trap was sprung: WebKit did send its stray pointermove. */
      if (!/Chrome/.test(navigator.userAgent)) await expect(moves.length).toBeGreaterThan(0);
    } finally {
      s.removeEventListener("pointermove", onMove);
      window.scrollTo(0, 0);
    }
    /* The twin: a press there sets it. */
    await real.commands.realClick(tag(s, "rest"), { fx: 0.6 });
    await waitFor(() => expect(now("Rest")).not.toBeNull());
  },
};

/* A touch, dispatched: real touch input needs a touch device. */
const touch = (el: HTMLElement, type: string, x: number, y: number) =>
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: x, clientY: y }));

export const ATouchDecidesWhichWayItGoes: Story = {
  render: () => (
    <Frame>
      <Slider label="Scroll" defaultValue={null} />
      <Slider label="Tap" defaultValue={null} />
      <Slider label="Across" defaultValue={null} />
      <Slider label="Two fingers" defaultValue={null} />
    </Frame>
  ),
  play: async () => {
    const middle = (name: string) => {
      const b = slider(name).getBoundingClientRect();
      return [b.left + b.width / 2, b.top + b.height / 2] as const;
    };
    /* Down the page from the track is a scroll: the browser takes it, and the
       slider sets nothing. */
    let [x, y] = middle("Scroll");
    touch(slider("Scroll"), "pointerdown", x, y);
    touch(slider("Scroll"), "pointermove", x + 2, y + 15);
    touch(slider("Scroll"), "pointercancel", x + 2, y + 15);
    /* No movement is a tap, set when the finger lifts: the middle is 50. */
    [x, y] = middle("Tap");
    touch(slider("Tap"), "pointerdown", x, y);
    const beforeLift = now("Tap");
    touch(slider("Tap"), "pointerup", x, y);
    /* Across is a drag: 10px past the middle is 54. */
    [x, y] = middle("Across");
    touch(slider("Across"), "pointerdown", x, y);
    touch(slider("Across"), "pointermove", x + 10, y + 1);
    touch(slider("Across"), "pointerup", x + 10, y + 1);
    await waitFor(() => expect([now("Scroll"), beforeLift, now("Tap"), now("Across")]).toEqual([null, null, "50", "54"]));
    /* A second finger while one drags is left alone: the first finger's lift
       still ends the drag, and only it moved the value. */
    [x, y] = middle("Two fingers");
    const two = slider("Two fingers");
    touch(two, "pointerdown", x, y);
    touch(two, "pointermove", x + 10, y);
    two.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 8, pointerType: "touch", isPrimary: false, button: 0, buttons: 1, clientX: x - 60, clientY: y }));
    two.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerId: 8, pointerType: "touch", isPrimary: false, button: 0, buttons: 0, clientX: x - 60, clientY: y }));
    touch(two, "pointerup", x + 10, y);
    await waitFor(() => expect([now("Two fingers"), two.hasAttribute("data-dragging")]).toEqual(["54", false]));
  },
};

export const ARealTouchDragsFromTheRail: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ height: 1600 }}>
      <Frame>
        <Slider label="Swipe" defaultValue={20} />
        <Slider label="Scroll past" defaultValue={20} />
      </Frame>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* A finger on the rail, well clear of the thumb, swiped past the end.
       The rail is captured first, and the drag taking the capture for the
       track once stopped it after its first step. */
    const swiped = await real.commands.realTouchSwipe(tag(slider("Swipe"), "swipe"), 400, 0, { fx: 0.5 });
    if (!swiped) return; /* WebKit: Playwright has no real touch there. */
    await waitFor(() => expect([now("Swipe"), document.activeElement === slider("Swipe")]).toEqual(["100", true]));
    /* The twin: the same finger down the page scrolls it, and sets nothing. */
    await real.commands.realTouchSwipe(tag(slider("Scroll past"), "scroll-past"), 0, -150, { fx: 0.5 });
    await new Promise((r) => setTimeout(r, 300));
    /* Nor does it take focus from where it was. */
    await expect([now("Scroll past"), document.activeElement === slider("Scroll past")]).toEqual(["20", false]);
    window.scrollTo(0, 0);
  },
};

export const TheFocusRingIsTheThumbs: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="Before" defaultValue={10} />
      <Slider label="Ringed" defaultValue={40} />
      <Slider label="Empty" defaultValue={null} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const shadow = (el: Element) => getComputedStyle(el).boxShadow !== "none";
    /* The thumb always casts its own shadow, and the ring's offset is a
       layer too: the ring is the layer that reaches past the offset. */
    const thumbOf = () => slider("Ringed").querySelector("[data-slider-thumb]")!;
    /* Tabbed to, the ring is round the thumb, not the track. A real Tab, since
       a press or a script's focus isn't the keyboard's to WebKit, and shows
       no ring after a click, as its own range input doesn't. */
    slider("Before").focus();
    await real.commands.realPress(["Tab"]);
    await waitFor(() =>
      expect([document.activeElement === slider("Ringed"), ringWidth(thumbOf()), shadow(slider("Ringed"))]).toEqual([true, 4, false]),
    );
    /* The twin: with no thumb yet, the track wears it. */
    await real.commands.realPress(["Tab"]);
    await waitFor(() => expect([slider("Empty").querySelector("[data-slider-thumb]"), shadow(slider("Empty"))]).toEqual([null, true]));
  },
};

export const ForcedColorsKeepAFocusOutline: Story = {
  tags: ["real-input"],
  render: () => (
    <Frame>
      <Slider label="First" defaultValue={10} />
      <Slider label="Forced" defaultValue={40} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.commands.realEmulateMedia({ forcedColors: "active" });
    try {
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      /* Forced colors drop the ring's shadow, so the track's focus outline,
         transparent otherwise, is drawn in its place. Chromium paints it in a
         system color; WebKit answers the media query but has no forced
         colors to paint with, so there the outline being solid is the check.
         The twin is the same track before it's focused, with none. */
      const chromium = /Chrome/.test(navigator.userAgent);
      const outline = (el: Element) => [getComputedStyle(el).outlineStyle, chromium ? getComputedStyle(el).outlineColor !== "rgba(0, 0, 0, 0)" : true];
      await expect(outline(slider("Forced"))[0]).toBe("none");
      slider("First").focus();
      await real.commands.realPress(["Tab"]);
      await waitFor(() => expect([document.activeElement === slider("Forced"), ...outline(slider("Forced"))]).toEqual([true, "solid", true]));
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
  },
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <Frame>
        <Slider label="RTL" defaultValue={50} />
      </Frame>
    </div>
  ),
  play: async () => {
    const s = slider("RTL");
    s.focus();
    /* Right is back toward the start, which is on the right. */
    await userEvent.keyboard("{ArrowRight}");
    await expect(now("RTL")).toBe("49");
    /* The fill grows from the right end of the rail; the twin, its left
       end, is toward the middle. */
    await waitFor(() => {
      const box = s.getBoundingClientRect();
      const fill = s.querySelector("[data-slider-fill]")!.getBoundingClientRect();
      expect([Math.round(box.right - fill.right), Math.round(fill.left - box.left) > 100]).toEqual([22, true]);
    });
  },
};

export const ReducedMotionHoldsTheThumbStill: Story = {
  tags: ["reduced-motion"],
  render: () => (
    <Frame>
      <Slider label="Motion" defaultValue={50} />
    </Frame>
  ),
  play: async () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const thumb = slider("Motion").querySelector<HTMLElement>("[data-slider-thumb]")!;
    /* No easing under reduced motion; the twin is this story in the default
       project, where the thumb eases its position. */
    await expect(getComputedStyle(thumb).transitionProperty).toBe(reduced ? "none" : "inset-inline-start");
  },
};

export const ItSaysWhatItIs: Story = {
  tags: ["ax-tree"],
  render: () => (
    <Frame>
      <Slider label="How sure" defaultValue={null} snapPoints={SURE} formatValue={percent} />
      <Slider label="Started" snapPoints={SURE} formatValue={percent} />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const s = slider("How sure");
    s.setAttribute("data-ax-probe", "slider");
    slider("Started").setAttribute("data-ax-probe", "started");
    const read = async () =>
      (await real.commands.axStates(['[data-ax-probe="slider"]', '[data-ax-probe="started"]'])).map((a) => [a.role, a.name, a.valueText]);
    const numbers = async () => (await real.commands.axStates(['[data-ax-probe="started"]', '[data-ax-probe="slider"]'])).map((a) => a.value);
    /* Not set, what's said is that, never a number. (The tree's own number
       is the midpoint when none is given; a screen reader speaks the text.)
       Started, as a slider is unless asked otherwise, it says the middle and
       the snap point there. */
    await expect(await read()).toEqual([
      ["slider", "How sure", "Not set"],
      ["slider", "Started", "50%, Toss-up"],
    ]);
    /* The twin: set, it says the number and the nearest snap point. */
    s.focus();
    await userEvent.keyboard("{End}");
    await expect((await read())[0]).toEqual(["slider", "How sure", "100%, Certain"]);
    /* The tree's own numbers: the started one's middle, and the end it was set to. */
    await expect(await numbers()).toEqual(["50", "100"]);
    s.removeAttribute("data-ax-probe");
    slider("Started").removeAttribute("data-ax-probe");
  },
};

/* Visually hidden, still in the accessibility tree: how a consumer names a
   control with text it doesn't show. */
const VISUALLY_HIDDEN = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

export const ANodeLabelNamesIt: Story = {
  tags: ["ax-tree"],
  render: () => (
    <Frame>
      <Slider
        label={
          <>
            How <strong>sure</strong> are you?
          </>
        }
      />
      <span id="named-elsewhere" style={VISUALLY_HIDDEN}>
        Confidence in the home team
      </span>
      <Slider
        aria-labelledby="named-elsewhere"
        label={
          <>
            How <strong>sure</strong>
          </>
        }
      />
    </Frame>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const sliders = within(document.body).getAllByRole("slider");
    sliders.forEach((el, i) => el.setAttribute("data-ax-probe", `node-${i}`));
    const names = (await real.commands.axStates(['[data-ax-probe="node-0"]', '[data-ax-probe="node-1"]'])).map((a) => a.name);
    /* A label with markup in it is read as its text. The twin: a consumer's
       own name wins over the label shown. */
    await expect(names).toEqual(["How sure are you?", "Confidence in the home team"]);
  },
};
