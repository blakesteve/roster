import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Select } from "../components/atoms/Select/Select";
import { Button } from "../components/atoms/Button/Button";
import { Menu, MenuButton, MenuItem, MenuItems } from "../components/molecules/Menu/Menu";
import { Sheet } from "../components/organisms/Sheet/Sheet";

/**
 * A portaled panel takes the page's tokens, checked rendered in Chromium.
 *
 * A consumer sets its popover surface three ways: inline on `<html>`, under
 * `html.dark`, and under `:root, .dark`, each in dark mode. A Menu, a Select
 * and a Sheet panel must each paint the consumer's surface, not Roster's
 * default. The panel used to carry `.dark` even when the page's `.dark` was
 * on `<html>`, and the class re-declared Roster's palette on the panel.
 *
 * The twin is a scoped `.dark`, on part of a light page and setting nothing:
 * the portal leaves that scope, so the panel still carries `.dark` and paints
 * Roster's dark default.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Dark scope/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

function Surfaces({ group }: { group: string }) {
  const [sheet, setSheet] = useState(false);
  return (
    <div data-group={group} style={{ display: "grid", gap: 12, width: 260, padding: 12 }}>
      <Menu>
        <MenuButton>Menu {group}</MenuButton>
        <MenuItems>
          <MenuItem onSelect={noop}>Alpha</MenuItem>
        </MenuItems>
      </Menu>
      <Select label={`Select ${group}`} options={OPTIONS} value={null} onChange={noop} />
      <Button onClick={() => setSheet(true)}>Sheet {group}</Button>
      <Sheet isOpen={sheet} onClose={() => setSheet(false)} title={`Sheet ${group}`}>
        <p>Inside</p>
      </Sheet>
    </div>
  );
}

const body = () => within(document.body);
/** The element in a panel that paints the popover surface. */
const surfaceOf = (panel: Element) =>
  panel.matches('[class*="roster-popover-bg"]') ? panel : panel.querySelector('[class*="roster-popover-bg"]')!;

/** Opens each surface in a group and reads the background its panel paints. */
async function paintedIn(group: string): Promise<string[]> {
  const scope = within(document.querySelector<HTMLElement>(`[data-group="${group}"]`)!);
  const painted: string[] = [];

  await userEvent.click(scope.getByRole("button", { name: `Menu ${group}` }));
  const menu = await body().findByRole("menu");
  painted.push(getComputedStyle(surfaceOf(menu)).backgroundColor);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("menu")).toBeNull());

  await userEvent.click(scope.getByRole("button", { name: new RegExp(`Select ${group}`) }));
  const listbox = await body().findByRole("listbox");
  painted.push(getComputedStyle(surfaceOf(listbox)).backgroundColor);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());

  await userEvent.click(scope.getByRole("button", { name: `Sheet ${group}` }));
  const sheet = await body().findByRole("dialog", { name: `Sheet ${group}` });
  painted.push(getComputedStyle(surfaceOf(sheet)).backgroundColor);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  return painted;
}

/**
 * Sets a consumer's dark page up before the story renders, as a page is set up
 * before its components mount: the panels that read their scope once, on
 * mount, have to meet the page as it will be.
 */
function consumerPage(way: "inline" | "html.dark" | ":root, .dark", color: string): Story["beforeEach"] {
  return () => {
    const root = document.documentElement;
    const sheet = document.createElement("style");
    root.classList.add("dark");
    if (way === "inline") root.style.setProperty("--roster-popover-bg", color);
    else {
      sheet.textContent = `${way === "html.dark" ? "html.dark" : ":root, .dark"} { --roster-popover-bg: ${color}; }`;
      document.head.append(sheet);
    }
    return () => {
      root.classList.remove("dark");
      root.style.removeProperty("--roster-popover-bg");
      sheet.remove();
    };
  };
}

const Page = () => <Surfaces group="page" />;

/* Menu, Select and Sheet each paint the consumer's surface. */
export const TokensInlineOnHtml: Story = {
  beforeEach: consumerPage("inline", "rgb(10, 20, 30)"),
  render: Page,
  play: async () => {
    await expect(await paintedIn("page")).toEqual(["rgb(10, 20, 30)", "rgb(10, 20, 30)", "rgb(10, 20, 30)"]);
  },
};

export const TokensUnderHtmlDark: Story = {
  beforeEach: consumerPage("html.dark", "rgb(40, 50, 60)"),
  render: Page,
  play: async () => {
    await expect(await paintedIn("page")).toEqual(["rgb(40, 50, 60)", "rgb(40, 50, 60)", "rgb(40, 50, 60)"]);
  },
};

export const TokensUnderRootAndDark: Story = {
  beforeEach: consumerPage(":root, .dark", "rgb(70, 80, 90)"),
  render: Page,
  play: async () => {
    await expect(await paintedIn("page")).toEqual(["rgb(70, 80, 90)", "rgb(70, 80, 90)", "rgb(70, 80, 90)"]);
  },
};

/* The twin: a scoped `.dark` on a light page, setting nothing. The portal
   leaves it, so the panel carries `.dark` and paints Roster's dark default,
   gray-800, not the light page's white. */
export const AScopedDarkIsStillCarried: Story = {
  render: () => (
    <div className="dark" style={{ background: "#0c0a09" }}>
      <Surfaces group="scoped" />
    </div>
  ),
  play: async () => {
    await expect(await paintedIn("scoped")).toEqual(["rgb(41, 37, 36)", "rgb(41, 37, 36)", "rgb(41, 37, 36)"]);
  },
};
