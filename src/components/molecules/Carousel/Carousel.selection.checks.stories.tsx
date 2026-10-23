import { Profiler, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Carousel, type CarouselHandle } from "./Carousel";
import { Input } from "../../atoms/Input/Input";
import { realInputOrSkip } from "../../../test/real-input";
import { heldOff, settled as ringSettled } from "../../../test/settle";

/**
 * Carousel's selection mode, checked in the browser: with real keys and a
 * real mouse in Chromium and WebKit, the accessibility tree in Chromium, and
 * both motion settings.
 *
 * - **One tab stop** for the whole row, and Tab returns to it; the twin is the
 *   same row in the default mode, a tab stop per item.
 * - **Every key** moves focus, and only focus: the arrows by one without
 *   wrapping, Home and End, the Page keys by the options wholly in view,
 *   type-ahead (a letter, letters typed together, the same letter again), and
 *   each lands wholly in view. Enter and Space select, Enter on the selected
 *   option activates, Escape clears. A key pressed mid-glide aims from where
 *   the glide is going.
 * - **A click** selects, a click on the selected option activates, and a drag
 *   does neither.
 * - **The ring after a click:** keys after a click ring the option they reach
 *   in WebKit too; the clicked option itself never rings.
 * - **Revealing** is smooth, or instant under reduced motion, and a
 *   consumer's own `scrollToIndex` on selecting isn't undone by it.
 * - **Names and states** from Chromium's accessibility tree.
 * - **Filtering** keeps set size and position right and the tab stop on a
 *   sensible option.
 * - **A thousand options:** what mounting and a key cost, logged.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Carousel/Selection checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const NAMES = ["Night Swim", "Paper Suns", "Glasshouse", "Slow Static", "Lantern Year", "Velvet Hours", "Northbound", "Small Fires", "Moonlit Arcade", "Saltwater", "Gold Leaf", "After Hours"];
const CELL: CSSProperties = { height: 64, padding: 8, borderRadius: 12, border: "1px solid rgb(0 0 0 / 0.2)", font: "inherit" };

/* What the row reported, in order. */
const events: string[] = [];

function Strip({ selectable = true, initial = null, children }: { selectable?: boolean; initial?: string | null; children?: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(initial);
  return (
    <div style={{ width: 520 }}>
      <button type="button" data-check="before">
        Before
      </button>
      <div style={{ marginTop: 12 }}>
        <Carousel
          aria-label="Records"
          selectable={selectable}
          selectedKey={selected}
          onSelectionChange={(key) => {
            events.push(`select ${key}`);
            setSelected(key);
          }}
          onActivate={(key) => events.push(`activate ${key}`)}
          clearable
          itemWidth={150}
          gap={12}
          gutter={16}
          arrows="none"
        >
          {children ??
            NAMES.map((n) =>
              selectable ? (
                <div key={n} style={CELL}>
                  {n}
                </div>
              ) : (
                <button key={n} type="button" style={{ ...CELL, width: "100%" }}>
                  {n}
                </button>
              ),
            )}
        </Carousel>
      </div>
      <button type="button" data-check="after" style={{ marginTop: 12 }}>
        After
      </button>
    </div>
  );
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);
/* Safari's keyboard users reach links and buttons with Option+Tab. */
const tab = () => (chromium() ? "Tab" : "Alt+Tab");
const row = () => document.querySelector<HTMLElement>('[aria-label="Records"]')!;
const focused = () => {
  const el = document.activeElement as HTMLElement | null;
  return !el || el === document.body ? "body" : (el.getAttribute("role") === "option" ? el.textContent : el.textContent?.trim()) ?? "";
};
const option = (name: string) => [...row().children].find((o) => o.textContent === name) as HTMLElement;
const tag = (el: Element, n: string) => (el.setAttribute("data-check", n), `[data-check="${n}"]`);
/* The row has arrived: no glide under way, and still for three frames. */
const arrived = async () => {
  await waitFor(
    async () => {
      expect(row()).not.toHaveAttribute("data-settling");
      const at = row().scrollLeft;
      await frame();
      await frame();
      await frame();
      expect(row().scrollLeft).toBe(at);
    },
    { timeout: 3000 },
  );
};
/* Whether an option is wholly inside the row's padding box. */
const inView = (el: Element) => {
  const r = row().getBoundingClientRect();
  const o = el.getBoundingClientRect();
  return o.left >= r.left + 16 - 1 && o.right <= r.right - 16 + 1;
};
const wholeInView = () => [...row().children].filter(inView).length;
const ringed = (el: Element) => el.matches(":is(:focus-visible, [data-key-focus])");
const painted = (el: Element) => {
  const s = getComputedStyle(el);
  return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
};

export const OneTabStopForTheWholeRow: Story = {
  tags: ["real-input"],
  render: () => <Strip initial="Slow Static" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    const walk: string[] = [];
    for (const key of [tab(), tab(), `Shift+${tab()}`, `Shift+${tab()}`]) {
      await real.commands.realPress([key]);
      walk.push(focused());
    }
    console.info(`CAROUSEL SELECTION tab stop | ${walk.join(" > ")}`);
    /* In on the selected option, out past the whole row in one press, and back. */
    await expect(walk).toEqual(["Slow Static", "After", "Slow Static", "Before"]);
  },
};

export const InTheDefaultModeEachItemIsAStop: Story = {
  tags: ["real-input"],
  render: () => <Strip selectable={false} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    let presses = 0;
    while (focused() !== "After" && presses < 30) {
      await real.commands.realPress([tab()]);
      presses++;
    }
    /* The twin: twelve buttons, twelve stops, and the thirteenth press leaves. */
    await expect(presses).toBe(13);
  },
};

export const EveryKeyMovesFocusAndOnlyFocus: Story = {
  tags: ["real-input"],
  render: () => <Strip />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    events.length = 0;
    document.querySelector<HTMLElement>('[data-check="before"]')!.focus();
    await real.commands.realPress([tab()]);
    const steps: [string, string, boolean, number][] = [];
    const press = async (keys: string[], label = keys.join(" ")) => {
      const step = label.startsWith("Page") ? wholeInView() : 0;
      await real.commands.realPress(keys);
      await arrived();
      const el = document.activeElement!;
      steps.push([label, focused(), inView(el), step]);
    };
    for (const k of ["ArrowRight", "ArrowRight", "ArrowLeft", "End", "ArrowRight", "Home", "ArrowLeft", "PageDown", "PageDown", "PageUp"]) await press([k]);
    /* Type-ahead: "g", then "l" on its heels; after a pause, "s" and "s" again. */
    await press(["g", "l"], "g l");
    await wait(800);
    await press(["s"]);
    await press(["s"]);
    const selectedBefore = [...row().children].filter((o) => o.getAttribute("aria-selected") === "true").length;
    const eventsBefore = events.length;
    await press(["Enter"]);
    await press(["Enter"], "Enter again");
    await press(["ArrowRight"], "ArrowRight after");
    await press(["Space"]);
    await press(["Space"], "Space again");
    await press(["Escape"]);
    console.info(`CAROUSEL SELECTION keys\n${steps.map((s) => s.join(" | ")).join("\n")}\nevents: ${events.join(", ")}`);
    await expect(steps.map(([label, name, whole]) => [label, name, whole])).toEqual([
      ["ArrowRight", "Paper Suns", true],
      ["ArrowRight", "Glasshouse", true],
      ["ArrowLeft", "Paper Suns", true],
      ["End", "After Hours", true],
      ["ArrowRight", "After Hours", true],
      ["Home", "Night Swim", true],
      ["ArrowLeft", "Night Swim", true],
      ["PageDown", "Slow Static", true],
      ["PageDown", "Northbound", true],
      ["PageUp", "Slow Static", true],
      ["g l", "Glasshouse", true],
      ["s", "Slow Static", true],
      ["s", "Small Fires", true],
      ["Enter", "Small Fires", true],
      ["Enter again", "Small Fires", true],
      ["ArrowRight after", "Moonlit Arcade", true],
      ["Space", "Moonlit Arcade", true],
      ["Space again", "Moonlit Arcade", true],
      ["Escape", "Moonlit Arcade", true],
    ]);
    /* The Page keys moved by the options wholly in view when pressed: three. */
    await expect(steps.filter(([label]) => label.startsWith("Page")).map(([, , , n]) => n)).toEqual([3, 3, 3]);
    /* Nothing was selected by moving: no selection and no event until Enter. */
    await expect([selectedBefore, eventsBefore]).toEqual([0, 0]);
    await expect(events).toEqual(["select Small Fires", "activate Small Fires", "select Moonlit Arcade", "select null"]);
  },
};

export const AKeyMidGlideAimsFromWhereItsGoing: Story = {
  tags: ["real-input"],
  render: () => <Strip />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    option("Night Swim").focus();
    /* End starts a glide to the end, 1444; Left on its heels lands on Gold
       Leaf (1636 to 1786), whole at 1444 but not where the glide has got to.
       Aimed from where it's going, the glide goes on; from where it is, it
       would turn back to 1296, the first stop showing Gold Leaf. */
    await real.commands.realPress(["End", "ArrowLeft"]);
    await arrived();
    await expect([focused(), row().scrollLeft]).toEqual(["Gold Leaf", 1444]);
  },
};

export const AClickSelectsAndASecondActivates: Story = {
  tags: ["real-input"],
  render: () => <Strip />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    events.length = 0;
    await real.commands.realClick(tag(option("Glasshouse"), "glass"));
    await real.commands.realClick('[data-check="glass"]');
    await real.commands.realClick(tag(option("Paper Suns"), "paper"));
    const clicked = [...events];
    /* The twin: a drag that starts on an option selects nothing. */
    await real.commands.realDrag('[data-check="glass"]', -140, { steps: 8 });
    await arrived();
    await expect([clicked, events.length]).toEqual([["select Glasshouse", "activate Glasshouse", "select Paper Suns"], 3]);
  },
};

export const KeysAfterAClickRing: Story = {
  tags: ["real-input"],
  render: () => <Strip />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const paper = option("Paper Suns");
    await real.commands.realClick(tag(paper, "paper"));
    await heldOff(paper);
    const afterClick = [document.activeElement === paper, ringed(paper), painted(paper)];
    await real.commands.realPress(["ArrowRight"]);
    const glass = option("Glasshouse");
    await ringSettled(glass);
    const afterKey = [document.activeElement === glass, ringed(glass), painted(glass)];
    console.info(`CAROUSEL SELECTION ring | ${chromium() ? "chromium" : "webkit"} | click ${afterClick} | key ${afterKey}, native ${glass.matches(":focus-visible")}`);
    /* A click focuses without a ring; the key after it rings, in both engines. */
    await expect([afterClick, afterKey]).toEqual([
      [true, false, false],
      [true, true, true],
    ]);
  },
};

export const KeyFocusIsRevealedSmoothlyOrAtOnce: Story = {
  tags: ["reduced-motion"],
  render: () => <Strip />,
  play: async () => {
    const first = option("Night Swim");
    first.focus();
    await userEvent.keyboard("{End}");
    await frame();
    /* 12 options of 150 with 12 between and 16 each end: 1964 wide in 520. */
    const target = 1964 - 520;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(row().scrollLeft).toBe(target);
    } else {
      await expect(row().scrollLeft).toBeLessThan(target);
      await arrived();
      await expect(row().scrollLeft).toBe(target);
    }
  },
};

function Recentering() {
  const ref = useRef<CarouselHandle>(null);
  return (
    <div style={{ width: 520 }}>
      <Carousel
        ref={ref}
        aria-label="Records"
        selectable
        onSelectionChange={() => ref.current?.scrollToIndex(0)}
        itemWidth={150}
        gap={12}
        gutter={16}
        arrows="none"
      >
        {NAMES.map((n) => (
          <div key={n} style={CELL}>
            {n}
          </div>
        ))}
      </Carousel>
    </div>
  );
}

export const TheConsumersScrollIsntFought: Story = {
  tags: ["real-input"],
  render: () => <Recentering />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    option("Night Swim").focus();
    await real.commands.realPress(["End"]);
    await arrived();
    const revealed = row().scrollLeft;
    /* Selecting asks the row back to the start: it goes, and stays. */
    await real.commands.realPress(["Enter"]);
    await arrived();
    await wait(300);
    await expect([revealed, row().scrollLeft, focused()]).toEqual([1444, 0, "After Hours"]);
  },
};

function Named() {
  return (
    <div style={{ width: 520, display: "flow-root" }}>
      <p id="how">Enter selects. Enter again plays it.</p>
      <Carousel aria-label="Records" aria-describedby="how" selectable defaultSelectedKey="Glasshouse" itemWidth={150}>
        {NAMES.slice(0, 4).map((n) => (
          <div key={n} style={CELL}>
            {n}
          </div>
        ))}
      </Carousel>
      <Carousel aria-label="Labeled" selectable getOptionLabel={(key, i) => `${key}, ${i + 1} of 4`} itemWidth={150}>
        {NAMES.slice(0, 4).map((n) => (
          <div key={n} style={CELL}>
            {n}
          </div>
        ))}
      </Carousel>
    </div>
  );
}

export const NamesAndStates: Story = {
  tags: ["ax-tree"],
  render: () => <Named />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const [records, labeled] = [...document.querySelectorAll('[role="listbox"]')];
    tag(records, "records");
    tag(records.children[2], "glass");
    tag(records.children[3], "slow");
    tag(labeled.children[0], "labeled");
    const read = await real.commands.axStates(['[data-check="records"]', '[data-check="glass"]', '[data-check="slow"]', '[data-check="labeled"]']);
    console.info(`CAROUSEL SELECTION ax ${JSON.stringify(read.map((a) => [a.role, a.name, a.description, a.selected]))}`);
    await expect(read.map((a) => [a.role, a.name, a.description, a.selected])).toEqual([
      ["listbox", "Records", "Enter selects. Enter again plays it.", null],
      ["option", "Glasshouse", "", true],
      ["option", "Slow Static", "", false],
      ["option", "Night Swim, 1 of 4", "", false],
    ]);
  },
};

function Filtered() {
  const [text, setText] = useState("");
  const shown = NAMES.filter((n) => n.toLowerCase().includes(text.toLowerCase()));
  return (
    <div style={{ width: 520 }}>
      <Input label="Find" value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <Carousel aria-label="Records" selectable itemWidth={150} gap={12} gutter={16} arrows="none">
          {shown.map((n) => (
            <div key={n} style={CELL}>
              {n}
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
}

export const FilteringKeepsTheSetRight: Story = {
  render: () => <Filtered />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = () => [...row().children].map((o) => `${o.textContent} ${o.getAttribute("aria-posinset")}/${o.getAttribute("aria-setsize")}${(o as HTMLElement).tabIndex === 0 ? " *" : ""}`);
    option("Night Swim").focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    const field = canvas.getByLabelText("Find");
    await userEvent.click(field);
    await userEvent.type(field, "s");
    const withS = state();
    await userEvent.type(field, "l");
    /* Slow Static was the stop and still matches "sl": it keeps it. */
    const withSl = state();
    await userEvent.type(field, "o");
    /* "s" leaves eight, Slow Static fourth and still the stop; "sl" leaves it
       alone; "slo" changes nothing; and focus never left the field. */
    await expect([withS, withSl, state(), document.activeElement === field]).toEqual([
      ["Night Swim 1/8", "Paper Suns 2/8", "Glasshouse 3/8", "Slow Static 4/8 *", "Velvet Hours 5/8", "Small Fires 6/8", "Saltwater 7/8", "After Hours 8/8"],
      ["Slow Static 1/1 *"],
      ["Slow Static 1/1 *"],
      true,
    ]);
    await userEvent.clear(field);
    await userEvent.type(field, "ight");
    /* Slow Static is gone: the stop goes to its nearest neighbor still shown,
       in the old order. None after it matches, so the one before. */
    await expect(state()).toEqual(["Night Swim 1/1 *"]);
  },
};

/* ── A thousand options ─────────────────────────────────────────────────── */

const THOUSAND = Array.from({ length: 1000 }, (_, i) => `Option ${String(i + 1).padStart(4, "0")}`);
const commits: number[] = [];
let mountedAt = 0;

const mounts: string[] = [];

/* Records, once per mount, how long the row beside it took to commit and to
   reach the next frame, from the click that asked for it. */
function Mounted({ mode }: { mode: string }) {
  useLayoutEffect(() => {
    const committed = performance.now();
    requestAnimationFrame(() => mounts.push(`${mode} commit ${(committed - mountedAt).toFixed(1)}ms, frame ${(performance.now() - mountedAt).toFixed(1)}ms`));
  }, [mode]);
  return null;
}

function Thousand() {
  const [mode, setMode] = useState<"none" | "default" | "selection">("none");
  return (
    <div style={{ width: 520 }}>
      <button type="button" data-check="none" onClick={() => setMode("none")}>
        None
      </button>
      <button type="button" data-check="default" onClick={() => ((mountedAt = performance.now()), setMode("default"))}>
        Default
      </button>
      <button type="button" data-check="selection" onClick={() => ((mountedAt = performance.now()), setMode("selection"))}>
        Selection
      </button>
      {mode !== "none" && (
        <Profiler id="row" onRender={(_, phase, duration) => phase === "update" && commits.push(duration)}>
          <Carousel aria-label="Records" selectable={mode === "selection"} itemWidth={120} gap={8} gutter={16} arrows="none">
            {THOUSAND.map((n) => (
              <div key={n} style={{ ...CELL, height: 40 }}>
                {n}
              </div>
            ))}
          </Carousel>
          <Mounted key={mode} mode={mode} />
        </Profiler>
      )}
    </div>
  );
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? NaN;

export const AThousandOptions: Story = {
  tags: ["real-input"],
  render: () => <Thousand />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real || !chromium()) return;
    mounts.length = 0;
    for (const mode of ["default", "selection", "none", "default", "selection"]) {
      await real.commands.realClick(`[data-check="${mode}"]`);
      await wait(400);
    }
    /* Key to focus, and key to the next frame, from the events' own clocks. */
    let down = 0;
    const toFocus: number[] = [];
    const toFrame: number[] = [];
    const onDown = (e: KeyboardEvent) => (down = e.timeStamp);
    const onFocus = (e: FocusEvent) => {
      toFocus.push(e.timeStamp - down);
      requestAnimationFrame((t) => toFrame.push(t - down));
    };
    (row().children[0] as HTMLElement).focus();
    await wait(100);
    commits.length = 0;
    document.addEventListener("keydown", onDown, true);
    document.addEventListener("focusin", onFocus, true);
    for (let i = 0; i < 30; i++) await real.commands.realPress(["ArrowRight"]);
    await real.commands.realPress(["End"]);
    await arrived();
    await real.commands.realPress(["Home"]);
    await arrived();
    for (let i = 0; i < 5; i++) await real.commands.realPress(["PageDown"]);
    await arrived();
    document.removeEventListener("keydown", onDown, true);
    document.removeEventListener("focusin", onFocus, true);
    const report = `mount: ${mounts.join("; ")}\nkeys: ${toFocus.length}, key to focus median ${median(toFocus).toFixed(2)}ms max ${Math.max(...toFocus).toFixed(2)}ms; key to frame median ${median(toFrame).toFixed(1)}ms max ${Math.max(...toFrame).toFixed(1)}ms; React commit median ${median(commits).toFixed(2)}ms max ${Math.max(...commits).toFixed(2)}ms over ${commits.length}`;
    console.info(`CAROUSEL SELECTION thousand\n${report}`);
    /* Every key moved focus, ending five pages in from the start. */
    await expect([toFocus.length, focused()?.startsWith("Option ")]).toEqual([37, true]);
  },
};
