import { useLayoutEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { LiquidTabs, type TabItem } from "./LiquidTabs";
import { LiquidTabPanel } from "./LiquidTabPanel";
import { LiquidNav, type LiquidNavItem } from "./LiquidNav";
import { Tabs } from "../Tabs/Tabs";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * LiquidTabs and LiquidNav, pinned to 5.14.0's build, in Chromium and WebKit,
 * and `Tabs` with the liquid variant pinned to the same: the migration from
 * one to the other changes nothing a person or a stylesheet can see.
 *
 * Rows in the shapes apps use them: the pill with counts and one panel that
 * swaps its content; the filled strip at `lg` with a panel per tab, one kept
 * mounted; the pill full width with manual activation, a label render
 * function and replaced count words; a filled strip with nothing selected and
 * a consumer's class; LiquidNav with counts; and the first two again in dark.
 *
 * Each row is read at rest, under a real pointer, after a real click, and
 * along a real keyboard walk through every row (arrows, Home, End, Enter and
 * Space on the manual strip). What's pinned, as SHA-256 digests: each row's
 * HTML, and the computed styles of every element in it (colors, borders,
 * corners, type, padding, outline, cursor, opacity, transform, heights). Also
 * pinned: where focus is at each step of the walk, whether every pill sits
 * on its selected item, and whether it was already showing at first paint.
 *
 * Widths and positions aren't in the digests: they come from the system font,
 * which differs between macOS and Linux, where CI runs. The HTML's pixel
 * values are masked for the same reason, and the pill's place is checked
 * against its item instead. A mismatch logs everything it read.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/LiquidTabs/Unchanged checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* What renders a strip, so the same rows can be read through another
   component that claims to render them the same. */
type StripRenderer = (props: Parameters<typeof LiquidTabs>[0]) => ReactNode;

const PILL_TABS: TabItem[] = [
  { id: "open", label: "Open", count: 12, panelId: "pin-pill-panel" },
  { id: "done", label: "Done", count: 0, panelId: "pin-pill-panel" },
  { id: "plain", label: "Plain", panelId: "pin-pill-panel" },
  { id: "node", label: <span>Node</span>, count: 3, panelId: "pin-pill-panel" },
];

function PillRow({ Strip, id, dark = false }: { Strip: StripRenderer; id: string; dark?: boolean }) {
  const [tab, setTab] = useState("open");
  const panel = `${id}-panel`;
  return (
    <div className={dark ? "dark" : undefined} style={{ display: "grid", gap: 8, padding: 8, background: dark ? "#0c0a09" : "#ffffff", justifyItems: "start" }}>
      <Strip id={id} aria-label={dark ? "Pill, dark" : "Pill"} tabs={PILL_TABS.map((t) => ({ ...t, panelId: panel }))} activeTab={tab} onChange={setTab} />
      <LiquidTabPanel tabsId={id} id={panel} tab={tab}>
        <p style={{ margin: 0 }}>The {tab} list</p>
      </LiquidTabPanel>
    </div>
  );
}

function FilledRow({ Strip, id, dark = false }: { Strip: StripRenderer; id: string; dark?: boolean }) {
  const [tab, setTab] = useState("waiting");
  return (
    <div className={dark ? "dark" : undefined} style={{ display: "grid", gap: 8, padding: 8, width: 360, background: dark ? "#0c0a09" : "#ffffff" }}>
      <Strip
        id={id}
        aria-label={dark ? "Moderation, dark" : "Moderation"}
        variant="filled"
        size="lg"
        tabs={[
          { id: "waiting", label: "Waiting", count: 5, panelId: `${id}-waiting` },
          { id: "declined", label: "Declined", count: 0, panelId: `${id}-declined` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />
      <LiquidTabPanel tabsId={id} id={`${id}-waiting`} tab="waiting" activeTab={tab}>
        <p style={{ margin: 0 }}>Five waiting</p>
      </LiquidTabPanel>
      <LiquidTabPanel tabsId={id} id={`${id}-declined`} tab="declined" activeTab={tab} keepMounted>
        <button type="button">Restore</button>
      </LiquidTabPanel>
    </div>
  );
}

function ManualRow({ Strip }: { Strip: StripRenderer }) {
  const [tab, setTab] = useState("live");
  return (
    <div style={{ width: 420 }}>
      <Strip
        id="pin-manual"
        aria-label="Manual"
        fullWidth
        activation="manual"
        className="pin-extra"
        labels={{ count: (n) => `${n} games`, countMark: (n) => `${n}!` }}
        tabs={[
          { id: "live", label: (active) => (active ? "Live now" : "Live"), count: 2 },
          { id: "later", label: "Later", count: 1 },
          { id: "past", label: "Past" },
        ]}
        activeTab={tab}
        onChange={setTab}
      />
    </div>
  );
}

function NoneRow({ Strip }: { Strip: StripRenderer }) {
  return (
    <div style={{ width: 300 }}>
      <Strip
        id="pin-none"
        aria-label="Nothing selected"
        variant="filled"
        className="keyline-tabs"
        tabs={[
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ]}
        activeTab="nope"
        onChange={() => {}}
      />
    </div>
  );
}

const NAV: LiquidNavItem[] = [
  { id: "inbox", label: "Inbox", count: 3, href: "#inbox" },
  { id: "sent", label: "Sent", href: "#sent" },
  { id: "drafts", label: "Drafts", count: 0, href: "#drafts" },
];

function NavRow() {
  const [at, setAt] = useState("inbox");
  /* Bubbles after the link's own handler, so LiquidNav still sees a plain
     click; only the navigation is stopped. */
  return (
    <div onClick={(e) => e.preventDefault()}>
      <LiquidNav aria-label="Mail" items={NAV} activeTab={at} onChange={setAt} />
    </div>
  );
}

/* Each pill as the first paint will show it: read in the layout phase, after
   every row's own layout effects and before the browser paints. A pill that
   arrives a frame late is still hidden here. */
let firstPaint = "";

function Rows({ Strip }: { Strip: StripRenderer }) {
  useLayoutEffect(() => {
    firstPaint = ROWS.map((name) => `${name} ${row(name).querySelector<HTMLElement>('[data-testid="liquid-tabs-pill"]')!.style.opacity}`).join(", ");
  }, []);
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <button type="button" data-pin-before="">
        Before
      </button>
      <div data-pin="pill">
        <PillRow Strip={Strip} id="pin-pill" />
      </div>
      <div data-pin="filled">
        <FilledRow Strip={Strip} id="pin-filled" />
      </div>
      <div data-pin="manual">
        <ManualRow Strip={Strip} />
      </div>
      <div data-pin="none">
        <NoneRow Strip={Strip} />
      </div>
      <div data-pin="nav">
        <NavRow />
      </div>
      <div data-pin="pill-dark">
        <PillRow Strip={Strip} id="pin-pill-dark" dark />
      </div>
      <div data-pin="filled-dark">
        <FilledRow Strip={Strip} id="pin-filled-dark" dark />
      </div>
      <button type="button">After</button>
    </div>
  );
}

const ROWS = ["pill", "filled", "manual", "none", "nav", "pill-dark", "filled-dark"] as const;
type Row = (typeof ROWS)[number];
const row = (name: Row) => document.querySelector<HTMLElement>(`[data-pin="${name}"]`)!;

/* Every pixel value masked (see above), and React's generated ids too. */
const html = (name: Row) =>
  row(name)
    .innerHTML.replace(/-?\d+(\.\d+)?px/g, "#px")
    .replace(/[«:_]r[0-9a-z]+[»:_]/g, "ID");

const PROPS = [
  "display", "position", "box-sizing", "color", "background-color",
  "border-top-style", "border-top-width", "border-top-color", "border-bottom-width", "border-bottom-color",
  "border-left-width", "border-right-width", "border-top-left-radius", "border-bottom-right-radius",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-decoration-line",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-left",
  "gap", "flex-grow", "flex-shrink", "justify-content", "align-items", "overflow-x",
  "outline-style", "outline-width", "outline-color", "outline-offset", "box-shadow",
  "cursor", "opacity", "transform", "z-index", "visibility", "height", "min-height",
  "transition-property", "transition-duration",
];
const styles = (name: Row) =>
  [...row(name).querySelectorAll("*")]
    .map((el) => {
      const s = getComputedStyle(el);
      return `${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[${el.getAttribute("role")}]` : ""} ${PROPS.map((p) => s.getPropertyValue(p)).join(";")}`;
    })
    .join("\n");

async function digest(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Every row: its HTML's digest, then its styles'. */
const read = async (names: readonly Row[] = ROWS) => {
  const out: Record<string, string> = {};
  for (const name of names) out[name] = `${await digest(html(name))} ${await digest(styles(name))}`;
  return out;
};

/* Each strip's pill on its selected item, to the pixel; "-" where nothing is
   selected and no pill shows. */
const pills = () =>
  ROWS.map((name) => {
    const strip = row(name).querySelector<HTMLElement>('[role="tablist"], nav')!;
    const pill = strip.querySelector<HTMLElement>('[data-testid="liquid-tabs-pill"]')!;
    const on = strip.querySelector<HTMLElement>('[aria-selected="true"], [aria-current="page"]');
    if (!on) return `${name} ${getComputedStyle(pill).opacity === "0" ? "-" : "pill with nothing selected"}`;
    const [p, t] = [pill.getBoundingClientRect(), on.getBoundingClientRect()];
    const fits = Math.abs(p.left - t.left) < 1 && Math.abs(p.width - t.width) < 1 && getComputedStyle(pill).opacity === "1";
    return `${name} ${fits ? "on" : "off"} ${on.dataset.tabId}`;
  }).join(", ");

const where = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return "body";
  const name = el.getAttribute("aria-label") ?? el.textContent?.trim();
  const pin = el.closest("[data-pin]")?.getAttribute("data-pin") ?? "page";
  return `${pin}: ${el.getAttribute("role") ?? el.tagName.toLowerCase()} ${name}${el.hasAttribute("data-key-focus") ? " (marked)" : ""}`;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);
/* Past the pill's two phases (130ms and 160ms) and a margin. */
const MOVE = 500;

type Pinned = {
  rest: Record<string, string>;
  hovered: Record<string, string>;
  clicked: Record<string, string>;
  keyed: Record<string, string>;
  walked: Record<string, string>;
  walk: string[];
};

/* Read from e20aef7, whose LiquidTabs, LiquidNav and styles are 5.14.0's
   (79389a3) byte for byte, 23 Oct 2026. */
const OLD_BUILD: Record<"chromium" | "webkit", Pinned> = {
  chromium: {
    rest: {
      pill: "862dda90f9da5718 4e63de0213565c34",
      filled: "7d008ad454bd8893 fff7be8350a46402",
      manual: "baec2adb0f891635 9fcae7707fa86fd8",
      none: "0256f3460b1427a2 3e0b8c778cd334a0",
      nav: "b107ec8445fefd28 5fbdbd6bf6439b4e",
      "pill-dark": "328a3bf25ded566a 682b5bf3e0511eb3",
      "filled-dark": "d41a11d278b3c91d acb4ba2f269c8bb8",
    },
    hovered: {
      pill: "862dda90f9da5718 09705f68fb1fe810",
      filled: "7d008ad454bd8893 10885b872c350eeb",
      manual: "baec2adb0f891635 5241e1693a1d95f6",
      nav: "b107ec8445fefd28 2463bc824e486e85",
    },
    clicked: {
      pill: "b18477226d93a274 d71a0a7e214db95a",
      filled: "7d008ad454bd8893 fff7be8350a46402",
      manual: "baec2adb0f891635 9fcae7707fa86fd8",
      none: "0256f3460b1427a2 3e0b8c778cd334a0",
      nav: "43fef0a546813961 b42ce15940673ab0",
      "pill-dark": "328a3bf25ded566a 682b5bf3e0511eb3",
      "filled-dark": "d41a11d278b3c91d acb4ba2f269c8bb8",
    },
    keyed: {
      pill: "bcd0e66d1f4b2db3 b6fb383bef20cf95",
      filled: "70b6379c14bb2512 b43614b846b71223",
      manual: "0701d1d62d970eae d5478e547e4edd02",
    },
    walked: {
      pill: "c5f88a2388fb57fa 058cca520ab0b7c0",
      filled: "70b6379c14bb2512 b43614b846b71223",
      manual: "13905699f4b83b8a 690d86149136f1a8",
      none: "0256f3460b1427a2 3e0b8c778cd334a0",
      nav: "43fef0a546813961 b42ce15940673ab0",
      "pill-dark": "328a3bf25ded566a 682b5bf3e0511eb3",
      "filled-dark": "d41a11d278b3c91d acb4ba2f269c8bb8",
    },
    walk: [
      "first paint: pill 1, filled 1, manual 1, none 0, nav 1, pill-dark 1, filled-dark 1",
      "rest: pill on open, filled on waiting, manual on live, none -, nav on inbox, pill-dark on open, filled-dark on waiting",
      "clicked: nav: a Sent",
      "clicked: pill on done, filled on waiting, manual on live, none -, nav on sent, pill-dark on open, filled-dark on waiting",
      "Tab: pill: tab Done, 0 items (marked)",
      "ArrowRight: pill: tab Plain (marked)",
      "End: pill: tab Node3, 3 items (marked)",
      "Home: pill: tab Open, 12 items (marked)",
      "ArrowLeft: pill: tab Node3, 3 items (marked)",
      "Tab: pill: tabpanel The node list (marked)",
      "Tab: filled: tab Waiting, 5 items (marked)",
      "ArrowRight: filled: tab Declined, 0 items (marked)",
      "Tab: filled: button Restore (marked)",
      "Tab: manual: tab Live now, 2 games (marked)",
      "ArrowRight: manual: tab Later, 1 games (marked)",
      "Enter: manual: tab Later, 1 games (marked)",
      "ArrowRight: manual: tab Past (marked)",
      " : manual: tab Past (marked)",
      "keyed: pill on node, filled on declined, manual on past, none -, nav on sent, pill-dark on open, filled-dark on waiting",
      "Tab: none: tab Alpha (marked)",
      "Tab: nav: a Inbox, 3 items (marked)",
      "Tab: nav: a Sent (marked)",
      "Tab: nav: a Drafts, 0 items (marked)",
      "Tab: pill-dark: tab Open, 12 items (marked)",
      "Tab: pill-dark: tabpanel The open list (marked)",
      "Tab: filled-dark: tab Waiting, 5 items (marked)",
      "Tab: filled-dark: tabpanel Five waiting (marked)",
      "Tab: page: button After (marked)",
      "walked: pill on node, filled on declined, manual on past, none -, nav on sent, pill-dark on open, filled-dark on waiting",
    ],
  },
  webkit: {
    rest: {
      pill: "0ee46e9c19a8fb39 4f10fa42010e9a68",
      filled: "c90377e8bc92a1e2 6b06977fbc42960d",
      manual: "afcc44b09989bff6 f3b8b66895cbeb86",
      none: "0256f3460b1427a2 8a1ed11971ca3998",
      nav: "b107ec8445fefd28 e8c93f3a153c742e",
      "pill-dark": "63b8bdf67f6462ac b68120f4bdad9c08",
      "filled-dark": "c5f8b78874842b25 9ee56152bb780852",
    },
    hovered: {
      pill: "0ee46e9c19a8fb39 4f10fa42010e9a68",
      filled: "c90377e8bc92a1e2 6b06977fbc42960d",
      manual: "afcc44b09989bff6 f3b8b66895cbeb86",
      nav: "b107ec8445fefd28 e8c93f3a153c742e",
    },
    clicked: {
      pill: "ff58345b8a6908d4 43dc98a21f2e951b",
      filled: "c90377e8bc92a1e2 6b06977fbc42960d",
      manual: "afcc44b09989bff6 f3b8b66895cbeb86",
      none: "0256f3460b1427a2 8a1ed11971ca3998",
      nav: "43fef0a546813961 472609b63c50b14f",
      "pill-dark": "63b8bdf67f6462ac b68120f4bdad9c08",
      "filled-dark": "c5f8b78874842b25 9ee56152bb780852",
    },
    keyed: {
      pill: "aa6da1a51ce33470 8ae0faa92147b6bc",
      filled: "50975bd483a4b716 a6be132e18e9872a",
      manual: "904906bdf25bf32c f60b214befc01489",
    },
    walked: {
      pill: "aef5620731717150 cdeee9454e563a81",
      filled: "50975bd483a4b716 a6be132e18e9872a",
      manual: "0e4f38d1d311d0fd 7acd39ee16ea4e2a",
      none: "0256f3460b1427a2 8a1ed11971ca3998",
      nav: "43fef0a546813961 472609b63c50b14f",
      "pill-dark": "63b8bdf67f6462ac b68120f4bdad9c08",
      "filled-dark": "c5f8b78874842b25 9ee56152bb780852",
    },
    walk: [
      "first paint: pill 1, filled 1, manual 1, none 0, nav 1, pill-dark 1, filled-dark 1",
      "rest: pill on open, filled on waiting, manual on live, none -, nav on inbox, pill-dark on open, filled-dark on waiting",
      "clicked: the link, or where focus was",
      "clicked: pill on done, filled on waiting, manual on live, none -, nav on sent, pill-dark on open, filled-dark on waiting",
      "Tab: pill: tab Done, 0 items (marked)",
      "ArrowRight: pill: tab Plain (marked)",
      "End: pill: tab Node3, 3 items (marked)",
      "Home: pill: tab Open, 12 items (marked)",
      "ArrowLeft: pill: tab Node3, 3 items (marked)",
      "Tab: pill: tabpanel The node list (marked)",
      "Tab: filled: tab Waiting, 5 items (marked)",
      "ArrowRight: filled: tab Declined, 0 items (marked)",
      "Tab: filled: button Restore (marked)",
      "Tab: manual: tab Live now, 2 games (marked)",
      "ArrowRight: manual: tab Later, 1 games (marked)",
      "Enter: manual: tab Later, 1 games (marked)",
      "ArrowRight: manual: tab Past (marked)",
      " : manual: tab Past (marked)",
      "keyed: pill on node, filled on declined, manual on past, none -, nav on sent, pill-dark on open, filled-dark on waiting",
      "Tab: none: tab Alpha (marked)",
      "Tab: nav: a Inbox, 3 items (marked)",
      "Tab: nav: a Sent (marked)",
      "Tab: nav: a Drafts, 0 items (marked)",
      "Tab: pill-dark: tab Open, 12 items (marked)",
      "Tab: pill-dark: tabpanel The open list (marked)",
      "Tab: filled-dark: tab Waiting, 5 items (marked)",
      "Tab: filled-dark: tabpanel Five waiting (marked)",
      "Tab: page: button After (marked)",
      "walked: pill on node, filled on declined, manual on past, none -, nav on sent, pill-dark on open, filled-dark on waiting",
    ],
  },
};

/** Reads every row through every state, as `OLD_BUILD` was read. */
async function readEveryState(label: string): Promise<Pinned | null> {
  const real = realInputOrSkip();
  if (!real) return null;
  const engine = chromium() ? "chromium" : "webkit";
  await document.fonts.ready;
  /* The pointer starts off every row: a story before this one leaves it
     wherever its last click was, which may be over an item here. */
  await real.commands.realHover("[data-pin-before]");
  await wait(MOVE);
  const now: Pinned = { rest: await read(), hovered: {}, clicked: {}, keyed: {}, walked: {}, walk: [] };
  now.walk.push(`first paint: ${firstPaint}`);
  now.walk.push(`rest: ${pills()}`);

  /* The pointer on an item that isn't selected, one row at a time. Headless
     WebKit answers no to (hover: hover), so there hover styles don't apply
     and these read as at rest; Chromium's are the hovered ones. */
  for (const [name, item] of [["pill", "plain"], ["filled", "declined"], ["manual", "past"], ["nav", "drafts"]] as const) {
    await real.commands.realHover(`[data-pin="${name}"] [data-tab-id="${item}"]`);
    await wait(250);
    Object.assign(now.hovered, await read([name]));
  }

  /* A real click on an item that isn't selected selects it, and the pill moves. */
  await real.commands.realClick('[data-pin="pill"] [data-tab-id="done"]');
  await real.commands.realClick('[data-pin="nav"] [data-tab-id="sent"]');
  await wait(MOVE);
  now.clicked = await read();
  /* Where a click leaves focus, per engine: Chromium focuses the clicked
     item; WebKit does on Linux, where CI runs, and leaves it where it was on
     macOS. Either is pinned as one; anything else fails. */
  const sent = row("nav").querySelector('[data-tab-id="sent"]');
  if (chromium() || (document.activeElement !== sent && document.activeElement !== document.body)) now.walk.push(`clicked: ${where()}`);
  else now.walk.push("clicked: the link, or where focus was");
  now.walk.push(`clicked: ${pills()}`);

  /* The keyboard, from the button before every row. Safari's keyboard users
     reach links and buttons with Option+Tab. */
  document.querySelector<HTMLElement>("[data-pin-before]")!.focus();
  const tab = chromium() ? "Tab" : "Alt+Tab";
  const press = async (key: string, settle = 200) => {
    await real.commands.realPress([key]);
    await wait(settle);
    now.walk.push(`${key === tab ? "Tab" : key}: ${where()}`);
  };
  await press(tab);
  await press("ArrowRight", MOVE);
  await press("End", MOVE);
  await press("Home", MOVE);
  await press("ArrowLeft", MOVE);
  now.keyed = await read(["pill"]);
  await press(tab);
  await press(tab);
  await press("ArrowRight", MOVE);
  await press(tab);
  await press(tab);
  await press("ArrowRight");
  await press("Enter", MOVE);
  await press("ArrowRight");
  await press(" ", MOVE);
  Object.assign(now.keyed, await read(["filled", "manual"]));
  now.walk.push(`keyed: ${pills()}`);
  for (let i = 0; i < 9; i++) await press(tab);
  now.walked = await read();
  now.walk.push(`walked: ${pills()}`);

  console.info(`LIQUID UNCHANGED ${label} ${engine} ${JSON.stringify(now)}`);
  if (JSON.stringify(now) !== JSON.stringify(OLD_BUILD[engine])) {
    for (const name of ROWS) console.info(`LIQUID UNCHANGED ${label} ${engine} ${name} html: ${html(name)}\nstyles:\n${styles(name)}`);
  }
  return now;
}

export const LiquidTabsIsUnchanged: Story = {
  tags: ["real-input"],
  render: () => <Rows Strip={LiquidTabs} />,
  play: async () => {
    const now = await readEveryState("LiquidTabs");
    if (!now) return;
    await expect(now).toEqual(OLD_BUILD[chromium() ? "chromium" : "webkit"]);
  },
};

/* The migration: `variant` moves to `liquidStyle`, everything else as it was. */
const LiquidVariant: StripRenderer = ({ variant, ...rest }) => <Tabs {...rest} variant="liquid" liquidStyle={variant} />;

export const TabsLiquidIsLiquidTabs: Story = {
  tags: ["real-input"],
  render: () => <Rows Strip={LiquidVariant} />,
  play: async () => {
    const now = await readEveryState("Tabs liquid");
    if (!now) return;
    await expect(now).toEqual(OLD_BUILD[chromium() ? "chromium" : "webkit"]);
  },
};
