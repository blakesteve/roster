import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Select } from "../components/atoms/Select/Select";
import { Combobox } from "../components/atoms/Combobox/Combobox";
import { MultiSelect } from "../components/atoms/MultiSelect/MultiSelect";
import { Menu, MenuButton, MenuItem, MenuItems } from "../components/molecules/Menu/Menu";
import { backgroundOf, contrast, paint } from "../test/painted";
import { realInputOrSkip } from "../test/real-input";

/**
 * The popups' rows, checked rendered: Select, Combobox and MultiSelect (one
 * shared option row) and Menu.
 *
 * - **A row is a click target,** so its cursor is the pointer. Its twin, a
 *   disabled row, is `not-allowed`.
 * - **A focused row is seen on any surface:** an inset ring in the focus token
 *   reaches 3:1 against the panel, on the default surface and a consumer's, in
 *   both themes. Its twin is the tint alone, measured the same way, which must
 *   fall short: the tint isn't the indicator.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Popups/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie", disabled: true },
];

function Popups() {
  return (
    <div style={{ display: "grid", gap: 16, width: 280 }}>
      <div data-popup="select">
        <Select label="Select" options={OPTIONS} value={null} onChange={noop} />
      </div>
      <div data-popup="combobox">
        <Combobox label="Combobox" options={OPTIONS} value={null} onChange={noop} />
      </div>
      <div data-popup="multiselect">
        <MultiSelect label="MultiSelect" options={OPTIONS} value={[]} onChange={noop} />
      </div>
      <div data-popup="menu">
        <Menu>
          <MenuButton>Menu</MenuButton>
          <MenuItems>
            <MenuItem onSelect={noop}>Alpha</MenuItem>
            <MenuItem onSelect={noop}>Bravo</MenuItem>
            <MenuItem disabled onSelect={noop}>
              Charlie
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </div>
  );
}

const body = () => within(document.body);
const opener = (popup: string) =>
  document.querySelector<HTMLElement>(popup === "combobox" ? `[data-popup="combobox"] input` : `[data-popup="${popup}"] button`)!;
const rowRole = (popup: string) => (popup === "menu" ? "menuitem" : "option");
const POPUPS = ["select", "combobox", "multiselect", "menu"];

export const EveryRowIsAPointer: Story = {
  render: () => <Popups />,
  play: async () => {
    const cursors: string[][] = [];
    for (const popup of POPUPS) {
      if (popup === "combobox") await userEvent.type(opener(popup), "a");
      else await userEvent.click(opener(popup));
      const row = (name: string) => body().findByRole(rowRole(popup), { name });
      cursors.push([popup, getComputedStyle(await row("Alpha")).cursor, getComputedStyle(await row("Charlie")).cursor]);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body().queryByRole(rowRole(popup), { name: "Alpha" })).toBeNull());
    }
    /* Each popup's row is the pointer; the twin, its disabled row, isn't. */
    await expect(cursors).toEqual(POPUPS.map((p) => [p, "pointer", "not-allowed"]));
  },
};

/* A consumer's own surface and ramp, set through Roster's tokens as the
   README sets them, in a stylesheet on `:root` and `.dark` (a Menu panel
   carries `.dark` itself, so a token set only on <html> wouldn't reach it):
   its popover surface is its page surface, near-black in dark. */
const CONSUMER = {
  "--roster-primary-100": "#dbedff",
  "--roster-primary-400": "#52a8ff",
  "--roster-primary-500": "#1f8fff",
  "--roster-primary-900": "#0a335c",
};
const SURFACES: { name: string; dark: boolean; tokens: Record<string, string> }[] = [
  { name: "default, light", dark: false, tokens: {} },
  { name: "default, dark", dark: true, tokens: {} },
  { name: "consumer, light", dark: false, tokens: { ...CONSUMER, "--roster-popover-bg": "#ffffff" } },
  { name: "consumer, dark", dark: true, tokens: { ...CONSUMER, "--roster-popover-bg": "#1c1917", "--roster-popover-text": "var(--roster-gray-50)" } },
];

/** The color of an element's inset ring, the box-shadow layer drawn inside it. */
function ringColor(el: Element): string | null {
  const layers = getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/);
  const ring = layers.map((l) => l.trim()).find((l) => / inset$/.test(l) && !/ 0px$/.test(l.replace(/ inset$/, "")));
  return ring ? ring.replace(/\s+-?\d+(\.\d+)?px.*$/, "") : null;
}

export const AFocusedRowIsSeenOnAnySurface: Story = {
  tags: ["real-input"],
  render: () => <Popups />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const root = document.documentElement;
    const sheet = document.createElement("style");
    const measured: string[] = [];
    const results: (string | boolean)[][] = [];
    for (const surface of SURFACES) {
      sheet.textContent = `:root, .dark { ${Object.entries(surface.tokens).map(([k, v]) => `${k}: ${v};`).join(" ")} }`;
      document.head.append(sheet);
      root.classList.toggle("dark", surface.dark);
      try {
        for (const popup of POPUPS) {
          /* By the keyboard, as the person who needs to see focus gets there.
             Opening doesn't always focus a row (a multiple listbox waits for
             the next key), so ArrowDown until one is. */
          opener(popup).focus();
          const current = () => document.querySelector<HTMLElement>(popup === "menu" ? '[role="menuitem"]:focus' : '[role="option"][data-focus]');
          for (let i = 0; i < 3 && !current(); i++) {
            await real.commands.realPress(["ArrowDown"]);
            await new Promise((r) => setTimeout(r, 100));
          }
          const focused = await waitFor(() => {
            const row = current();
            if (!row) throw new Error(`${popup}: no focused row`);
            return row;
          });
          const panel = focused.closest<HTMLElement>(popup === "menu" ? '[role="menu"]' : '[role="listbox"]')!;
          const ground = paint(backgroundOf(panel));
          const ring = ringColor(focused);
          const byRing = ring ? contrast(paint([...backgroundOf(panel), ring]), ground) : 0;
          const byTint = contrast(paint(backgroundOf(focused)), ground);
          measured.push(`${surface.name} ${popup}: ring ${byRing.toFixed(2)}, tint ${byTint.toFixed(2)}`);
          /* The ring holds 3:1; the twin, the tint alone, doesn't. */
          results.push([surface.name, popup, byRing >= 3, byTint < 3]);
          await real.commands.realPress(["Escape"]);
          await waitFor(() => expect(body().queryByRole(rowRole(popup), { name: "Alpha" })).toBeNull());
        }
      } finally {
        sheet.remove();
        root.classList.remove("dark");
      }
    }
    /* The numbers behind the verdicts, kept in the run's log. */
    console.info(`focused rows, against the panel:\n${measured.join("\n")}`);
    await expect(results, measured.join("\n")).toEqual(SURFACES.flatMap((s) => POPUPS.map((p) => [s.name, p, true, true])));
  },
};

export const MenuRingsOnlyForTheKeyboard: Story = {
  tags: ["real-input"],
  render: () => <Popups />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    /* Opened with the mouse, the pointer moves focus to the row it rests on:
       the tint shows, and no ring. */
    opener("menu").setAttribute("data-check", "menu-open");
    await real.commands.realClick('[data-check="menu-open"]');
    const bravo = await body().findByRole("menuitem", { name: "Bravo" });
    bravo.setAttribute("data-check", "bravo");
    await real.commands.realHover('[data-check="bravo"]');
    await waitFor(() => expect(document.activeElement).toBe(bravo));
    const byPointer = ringColor(bravo);
    /* The twin: a key moves focus, and the ring comes on. */
    await real.commands.realPress(["ArrowUp"]);
    const alpha = body().getByRole("menuitem", { name: "Alpha" });
    await waitFor(() => expect([document.activeElement === alpha, byPointer, ringColor(alpha) !== null]).toEqual([true, null, true]));
    /* Back to the pointer: the ring leaves the row the keys had, and doesn't
       come to the one under the pointer. */
    await real.commands.realHover('[data-check="bravo"]', { fx: 0.4 });
    await waitFor(() => expect([document.activeElement === bravo, ringColor(alpha), ringColor(bravo)]).toEqual([true, null, null]));
    await real.commands.realPress(["Escape"]);
  },
};

export const InForcedColorsAFocusedRowIsOutlined: Story = {
  tags: ["real-input"],
  render: () => <Popups />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.commands.realEmulateMedia({ forcedColors: "active" });
    try {
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      const outlines: string[][] = [];
      for (const popup of POPUPS) {
        opener(popup).focus();
        const current = () => document.querySelector<HTMLElement>(popup === "menu" ? '[role="menuitem"]:focus' : '[role="option"][data-focus]');
        for (let i = 0; i < 3 && !current(); i++) {
          await real.commands.realPress(["ArrowDown"]);
          await new Promise((r) => setTimeout(r, 100));
        }
        const focused = await waitFor(() => {
          const row = current();
          if (!row) throw new Error(`${popup}: no focused row`);
          return row;
        });
        /* Forced colors drop the tint and the ring, so the focused row is
           outlined. The twin, a row beside it, isn't. */
        const other = body().getAllByRole(rowRole(popup)).find((r) => r !== focused)!;
        outlines.push([popup, getComputedStyle(focused).outlineStyle, getComputedStyle(other).outlineStyle]);
        await real.commands.realPress(["Escape"]);
        await waitFor(() => expect(body().queryByRole(rowRole(popup), { name: "Alpha" })).toBeNull());
      }
      await expect(outlines).toEqual(POPUPS.map((p) => [p, "solid", "none"]));
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
  },
};
