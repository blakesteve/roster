import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Select } from "../components/atoms/Select/Select";
import { MultiSelect } from "../components/atoms/MultiSelect/MultiSelect";
import { Button } from "../components/atoms/Button/Button";
import { Menu, MenuButton, MenuItem, MenuItems } from "../components/molecules/Menu/Menu";
import { RadioGroup } from "../components/molecules/RadioGroup/RadioGroup";
import { LiquidTabs } from "../components/molecules/LiquidTabs/LiquidTabs";
import { Slider } from "../components/molecules/Slider/Slider";
import { RangeSlider } from "../components/molecules/RangeSlider/RangeSlider";
import { Dialog } from "../components/organisms/Dialog/Dialog";
import { Sheet } from "../components/organisms/Sheet/Sheet";
import { realInputOrSkip } from "../test/real-input";

/**
 * Keyboard focus shows after a click, checked with the real mouse and keys in
 * Chromium and WebKit.
 *
 * Each path is a click, then a key, then a read of whether the element the
 * keys left focused matches Roster's `focus-visible` variant,
 * `:is(:focus-visible, [data-key-focus])`, which is what every ring is drawn
 * on. All eleven must ring in both engines. Without the keyboard-mode
 * tracker, eight drew none in WebKit: script moved focus in answer to the
 * key, and WebKit doesn't count that as the keyboard's once the page was
 * clicked. (Tab inside a dialog is pressed as Option+Tab in WebKit, the way
 * Safari's keyboard users reach a button; it rings natively, and stays as the
 * case that must keep doing so.)
 *
 * In Chromium each path also pins today's native state, `:focus-visible`
 * itself, as the literal the old build gave, and checks that no element
 * carries the mark without matching it: the tracker adds no ring Chromium
 * doesn't already draw.
 *
 * The twin, `AClickAloneNeverRings`, takes the same widgets with the mouse
 * alone, and nothing may ring.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Keyboard focus/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

function All() {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [radio, setRadio] = useState("a");
  const [tab, setTab] = useState("one");
  return (
    <div style={{ display: "grid", gap: 16, width: 320, padding: 16 }}>
      <div data-p="menu">
        <Menu>
          <MenuButton>Menu</MenuButton>
          <MenuItems>
            <MenuItem onSelect={noop}>Alpha</MenuItem>
          </MenuItems>
        </Menu>
      </div>
      <div data-p="select">
        <Select label="Select" options={OPTIONS} value={null} onChange={noop} />
      </div>
      <div data-p="multiselect">
        <MultiSelect label="Multi" options={OPTIONS} value={[]} onChange={noop} />
      </div>
      <div data-p="dialog">
        <Button onClick={() => setDialog(true)}>Open dialog</Button>
        <Dialog isOpen={dialog} onClose={() => setDialog(false)} title="Dialog">
          <p>Body</p>
        </Dialog>
      </div>
      <div data-p="sheet">
        <Button onClick={() => setSheet(true)}>Open sheet</Button>
        <Sheet isOpen={sheet} onClose={() => setSheet(false)} title="Sheet">
          <p>Body</p>
        </Sheet>
      </div>
      <div data-p="radio">
        <RadioGroup
          label="Radio"
          options={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
            { value: "c", label: "C" },
          ]}
          value={radio}
          onChange={setRadio}
        />
      </div>
      <div data-p="tabs">
        <LiquidTabs
          tabs={[
            { id: "one", label: "One" },
            { id: "two", label: "Two" },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      <div data-p="slider">
        <Slider label="Slider" />
      </div>
      <div data-p="range">
        <RangeSlider label="Range" defaultValue={[20, 80]} />
      </div>
    </div>
  );
}

type Real = NonNullable<ReturnType<typeof realInputOrSkip>>;
const q = (p: string, sel: string) => document.querySelector<HTMLElement>(`[data-p="${p}"] ${sel}`)!;
const button = (p: string, name: string) => within(document.querySelector<HTMLElement>(`[data-p="${p}"]`)!).getByRole("button", { name });
const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const tag = (el: Element, n: string) => (el.setAttribute("data-check", n), `[data-check="${n}"]`);
const chromium = () => /Chrome/.test(navigator.userAgent);
/** What every Roster ring is drawn on. */
const ringed = (el: Element) => el.matches(":is(:focus-visible, [data-key-focus])");
/**
 * Whether an element paints a focus ring: a box-shadow layer spreading 2px or
 * more with no offset or blur, or a visible outline. 2px, because a field's
 * resting edge is a 1px ring of the same kind, and every focus ring is wider.
 */
const painted = (el: Element) => {
  const style = getComputedStyle(el);
  const spreads = [...style.boxShadow.matchAll(/0px 0px 0px (\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
  const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0 && style.outlineColor !== "rgba(0, 0, 0, 0)";
  return spreads.some((n) => n >= 2) || outline;
};
/** Marked elements Chromium's own `:focus-visible` doesn't match: none, ever. */
const markedOnly = () => [...document.querySelectorAll("[data-key-focus]")].filter((el) => !el.matches(":focus-visible"));

/**
 * A path: a click, then keys, returning the element the keys left focused.
 * The story checks it's focused and ringed in both engines, and in Chromium
 * that `:focus-visible` matches it as it did before the tracker existed (the
 * old build's literal, `true` on every path) with no mark beyond it.
 */
function path(
  label: string,
  run: (real: Real) => Promise<Element>,
  /* The element that paints the ring, when it isn't the focused one; null when the ring isn't drawn on focus-visible at all. */
  holder: (el: Element) => Element | null = (el) => el,
): Pick<Story, "render" | "play"> {
  return {
    render: () => <All />,
    play: async () => {
      const real = realInputOrSkip();
      if (!real) return;
      const el = await run(real);
      await wait();
      const state = {
        focused: document.activeElement === el,
        ringed: ringed(el),
        native: el.matches(":focus-visible"),
        markedOnly: markedOnly().length,
        painted: holder(el) ? painted(holder(el)!) : null,
        on: `${el.tagName.toLowerCase()} ${el.getAttribute("role") ?? ""} ${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 20)}`,
      };
      console.info(`KEY FOCUS ${chromium() ? "chromium" : "webkit"} | ${label} | ${JSON.stringify(state)}`);
      /* Focused, matched by the variant, and the ring painted where the
         component draws it. */
      await expect([state.focused, state.ringed, state.painted]).toEqual([true, true, holder(el) ? true : null]);
      if (chromium()) await expect([state.native, state.markedOnly]).toEqual([true, 0]);
    },
  };
}

export const EscapeBackToTheMenuButton: Story = {
  tags: ["real-input"],
  ...path("menu button after a click, Escape", async (real) => {
    const b = q("menu", "button");
    await real.commands.realClick(tag(b, "menu"));
    await wait();
    await real.commands.realPress(["Escape"]);
    return b;
  }),
};

export const EscapeBackToTheSelect: Story = {
  tags: ["real-input"],
  ...path("select trigger after a click, Escape", async (real) => {
    const b = q("select", "button");
    await real.commands.realClick(tag(b, "select"));
    await wait();
    await real.commands.realPress(["Escape"]);
    return b;
  }),
};

export const EnterBackToTheSelect: Story = {
  tags: ["real-input"],
  ...path("select trigger after a click, ArrowDown, Enter", async (real) => {
    const b = q("select", "button");
    await real.commands.realClick(tag(b, "select"));
    await wait();
    await real.commands.realPress(["ArrowDown", "Enter"]);
    return b;
  }),
};

export const EscapeBackToTheMultiSelect: Story = {
  tags: ["real-input"],
  ...path("multiselect trigger after a click, Escape", async (real) => {
    const b = q("multiselect", "button");
    await real.commands.realClick(tag(b, "multi"));
    await wait();
    await real.commands.realPress(["Escape"]);
    return b;
    /* Its shell rings on focus-within, after a click too: not a focus-visible ring. */
  }, () => null),
};

export const EscapeBackToTheDialogOpener: Story = {
  tags: ["real-input"],
  ...path("dialog opener after a click, Escape", async (real) => {
    const b = button("dialog", "Open dialog");
    await real.commands.realClick(tag(b, "dialog"));
    await wait(500);
    await real.commands.realPress(["Escape"]);
    await wait(500);
    return b;
  }),
};

export const TabInsideADialog: Story = {
  tags: ["real-input"],
  ...path("inside a dialog after a click opened it, Tab", async (real) => {
    await real.commands.realClick(tag(button("dialog", "Open dialog"), "dialog"));
    await wait(500);
    /* Option+Tab in WebKit: Safari's Tab reaches text fields only, by
       default, and Option+Tab is how its keyboard users reach a button. */
    await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
    return document.activeElement!;
  }),
};

function TwoButtonDialog() {
  const [open, setOpen] = useState(false);
  return (
    <div data-p="wrap" style={{ padding: 16 }}>
      <Button onClick={() => setOpen(true)}>Open the two-button dialog</Button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Wrap">
        <Button onClick={noop}>Inside</Button>
      </Dialog>
    </div>
  );
}

export const TabWrapsInsideADialog: Story = {
  tags: ["real-input"],
  render: () => <TwoButtonDialog />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const key = chromium() ? "Tab" : "Alt+Tab";
    await real.commands.realClick(tag(button("wrap", "Open the two-button dialog"), "wrap"));
    await wait(500);
    /* Tab through the dialog's two buttons and on: the trap's sentinel sends
       focus back to the first by script, which only the tracker marks in
       WebKit, and only if Option+Tab counts as the keyboard's. */
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      await real.commands.realPress([key]);
      await wait(150);
      seen.push((document.activeElement?.textContent || document.activeElement?.getAttribute("aria-label") || "").trim());
    }
    const el = document.activeElement!;
    const state = { seen, ringed: ringed(el), painted: painted(el), markedOnly: markedOnly().length };
    console.info(`KEY FOCUS ${chromium() ? "chromium" : "webkit"} | dialog trap wrap | ${JSON.stringify(state)}`);
    await expect([state.ringed, state.painted]).toEqual([true, true]);
    if (chromium()) await expect(state.markedOnly).toBe(0);
  },
};

export const EscapeBackToTheSheetOpener: Story = {
  tags: ["real-input"],
  ...path("sheet opener after a click, Escape", async (real) => {
    const b = button("sheet", "Open sheet");
    await real.commands.realClick(tag(b, "sheet"));
    await wait(600);
    await real.commands.realPress(["Escape"]);
    await wait(600);
    return b;
  }),
};

export const ArrowToTheNextRadio: Story = {
  tags: ["real-input"],
  ...path("radio after a click, ArrowDown", async (real) => {
    const radios = document.querySelectorAll<HTMLElement>('[data-p="radio"] [role="radio"]');
    await real.commands.realClick(tag(radios[0], "radio"));
    await wait();
    await real.commands.realPress(["ArrowDown"]);
    await waitFor(() => expect(document.activeElement).toBe(radios[1]));
    return radios[1];
  }),
};

export const ArrowToTheNextTab: Story = {
  tags: ["real-input"],
  ...path("tab after a click, ArrowRight", async (real) => {
    const tabs = document.querySelectorAll<HTMLElement>('[data-p="tabs"] [role="tab"]');
    await real.commands.realClick(tag(tabs[0], "tab"));
    await wait();
    await real.commands.realPress(["ArrowRight"]);
    return tabs[1];
  }),
};

export const ArrowOnASlider: Story = {
  tags: ["real-input"],
  ...path("slider after a click on its track, ArrowRight", async (real) => {
    const s = q("slider", '[role="slider"]');
    await real.commands.realClick(tag(s, "slider"), { fx: 0.3 });
    await wait();
    await real.commands.realPress(["ArrowRight"]);
    return s;
    /* The ring is the thumb's. */
  }, (el) => el.querySelector("[data-slider-thumb]")),
};

export const ArrowOnARangeThumb: Story = {
  tags: ["real-input"],
  ...path("range thumb after a click on it, ArrowRight", async (real) => {
    const thumb = q("range", '[role="slider"]');
    await real.commands.realClick(tag(thumb, "range"));
    await wait();
    await real.commands.realPress(["ArrowRight"]);
    return thumb;
  }),
};

/**
 * The twin: the same widgets with the mouse alone. Focus lands on each, by
 * the press or by script after it, and nothing rings: not the engine's own
 * `:focus-visible` and not the mark.
 */
export const AClickAloneNeverRings: Story = {
  tags: ["real-input"],
  render: () => <All />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const seen: [string, boolean, boolean, boolean][] = [];
    const read = (label: string, el: Element, ring: Element = el) => seen.push([label, document.activeElement === el, ringed(el), painted(ring)]);

    /* A menu opened and closed by clicking its button, focus back on it. */
    const menu = q("menu", "button");
    await real.commands.realClick(tag(menu, "menu"));
    await wait();
    await real.commands.realClick(tag(menu, "menu"));
    await wait();
    read("menu button", menu);

    /* A select's option picked with the mouse: focus goes back to the trigger by script. */
    const select = q("select", "button");
    await real.commands.realClick(tag(select, "select"));
    const option = await within(document.body).findByRole("option", { name: "Bravo" });
    await real.commands.realClick(tag(option, "option"));
    await wait();
    read("select trigger", select);

    /* A dialog opened and closed with the mouse: focus goes back to its opener by script. */
    const opener = button("dialog", "Open dialog");
    await real.commands.realClick(tag(opener, "dialog"));
    await wait(500);
    await real.commands.realClick(tag(within(document.body).getByRole("button", { name: /close/i }), "close"));
    await wait(500);
    read("dialog opener", opener);

    /* A radio and a slider pressed. */
    const radio = document.querySelectorAll<HTMLElement>('[data-p="radio"] [role="radio"]')[2];
    await real.commands.realClick(tag(radio, "radio"));
    await wait();
    read("radio", radio);
    const slider = q("slider", '[role="slider"]');
    await real.commands.realClick(tag(slider, "slider"), { fx: 0.3 });
    await wait();
    read("slider", slider, slider.querySelector("[data-slider-thumb]")!);

    console.info(`KEY FOCUS ${chromium() ? "chromium" : "webkit"} | click alone | ${JSON.stringify(seen)}`);
    /* Focus where the click left it, and no ring anywhere. Focus is checked
       where a click focuses in both engines; WebKit doesn't focus a clicked
       button, so for those only the ring is read. */
    await expect(seen.map(([label, , ring, paint]) => [label, ring, paint])).toEqual([
      ["menu button", false, false],
      ["select trigger", false, false],
      ["dialog opener", false, false],
      ["radio", false, false],
      ["slider", false, false],
    ]);
    await expect(document.querySelectorAll("[data-key-focus]").length).toBe(0);
  },
};

/**
 * A tap after keys ends keyboard mode. A touch press comes with no pointer
 * move before it, so the press itself has to end the mode, not the move a
 * mouse would make on its way. Real touch runs in Chromium only; WebKit has
 * none under Playwright.
 */
export const ATapAfterKeysDoesntRing: Story = {
  tags: ["real-input"],
  render: () => <All />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const radios = document.querySelectorAll<HTMLElement>('[data-p="radio"] [role="radio"]');
    await real.commands.realClick(tag(radios[0], "radio-a"));
    await wait();
    await real.commands.realPress(["ArrowDown"]);
    await waitFor(() => expect(document.activeElement).toBe(radios[1]));
    const keyed = ringed(radios[1]);
    /* A finger lands on the third radio, and lifts where it landed. */
    const tapped = await real.commands.realTouchSwipe(tag(radios[2], "radio-c"), 0, 0, { steps: 1 });
    if (!tapped) return; /* WebKit: Playwright has no real touch there. */
    await wait();
    /* The keys' radio rang; the twin, the tapped one, doesn't, and no mark is left. */
    await expect([keyed, document.activeElement === radios[2], ringed(radios[2]), document.querySelectorAll("[data-key-focus]").length]).toEqual([true, true, false, 0]);
  },
};

/**
 * Chromium's rings, step by step through a mixed walk of clicks, keys and
 * Tabs, are what the build before the tracker drew: these literals were read
 * from that build. At every step no element carries the mark without
 * `:focus-visible` matching it too. In WebKit the walk is the tracker's job,
 * checked path by path above, so this runs in Chromium only.
 */
export const ChromiumRingsAreUnchanged: Story = {
  tags: ["real-input"],
  render: () => <All />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real || !chromium()) return;
    const steps: [string, boolean][] = [];
    const extra: string[] = [];
    const step = async (label: string) => {
      await wait();
      const active = document.activeElement!;
      steps.push([label, ringed(active)]);
      if (markedOnly().length) extra.push(label);
    };
    const menu = q("menu", "button");
    await real.commands.realClick(tag(menu, "menu"));
    await step("menu opened by a click");
    await real.commands.realPress(["ArrowDown"]);
    await step("ArrowDown in the menu");
    await real.commands.realPress(["Escape"]);
    await step("Escape to its button");
    const select = q("select", "button");
    await real.commands.realClick(tag(select, "select"));
    await step("select opened by a click");
    const option = await within(document.body).findByRole("option", { name: "Bravo" });
    await real.commands.realClick(tag(option, "option"));
    await step("option picked by a click");
    await real.commands.realPress(["Tab"]);
    await step("Tab onward");
    await real.commands.realPress(["Shift+Tab"]);
    await step("Shift+Tab back");
    const radio = document.querySelectorAll<HTMLElement>('[data-p="radio"] [role="radio"]')[2];
    await real.commands.realClick(tag(radio, "radio"));
    await step("radio clicked");
    await real.commands.realPress(["ArrowUp"]);
    await step("ArrowUp to the radio before");
    const slider = q("slider", '[role="slider"]');
    await real.commands.realClick(tag(slider, "slider"), { fx: 0.3 });
    await step("slider track clicked");
    await real.commands.realPress(["ArrowRight"]);
    await step("ArrowRight on the slider");
    console.info(`KEY FOCUS chromium | walk | ${JSON.stringify(steps)}`);
    await expect(extra).toEqual([]);
    await expect(steps).toEqual(WALK);
  },
};

/* Read from the build before the tracker (main at 95c9b35), in Chromium. A
   click that a component answers by moving focus (the select's list, the
   slider's own focus call) leaves Chromium's earlier keyboard mode in place,
   so those steps ring there; that's Chromium's behavior, pinned as is. */
const WALK: [string, boolean][] = [
  ["menu opened by a click", false],
  ["ArrowDown in the menu", true],
  ["Escape to its button", true],
  ["select opened by a click", true],
  ["option picked by a click", false],
  ["Tab onward", true],
  ["Shift+Tab back", true],
  ["radio clicked", false],
  ["ArrowUp to the radio before", true],
  ["slider track clicked", true],
  ["ArrowRight on the slider", true],
];
