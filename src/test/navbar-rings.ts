import { expect, waitFor } from "storybook/test";
import { heldOff } from "./settle";

/* The rings of Navbar's menu button and its menu's close button, read for the
   checks in Navbar.checks and Navbar.touch.checks, on Navbar and on 5.24's
   pair (`MenuButtons524.tsx`). Test-only. */

/** Where to find a menu button, its menu's close button, and what's before it in Tab order. */
export type Pair = { menu: string; close: string; before: string };
export const NAVBAR: Pair = {
  menu: "[data-roster-hamburger] button",
  close: "[data-roster-mobile-panel] button",
  before: "nav a",
};
export const TWIN: Pair = {
  menu: "[data-rings524-menu]",
  close: "[data-rings524-close]",
  before: "[data-rings524-before]",
};

const el = (selector: string) => document.querySelector<HTMLElement>(selector)!;

/** Whether the element draws a ring: a shadow with a color and a spread. */
export const ringed = (element: Element) => /rgb\(\d+, \d+, \d+\) 0px 0px 0px [1-9]/.test(getComputedStyle(element).boxShadow);

/** Waits for `selector` to hold focus, then for any ring on its way, and reads it. */
export async function ringOn(selector: string) {
  await waitFor(() => expect(document.activeElement).toBe(el(selector)));
  await heldOff(el(selector));
  return { ring: ringed(el(selector)), outline: getComputedStyle(el(selector)).outlineStyle };
}

/** Until the menu has closed and its panel gone, so the next press opens it again. */
export async function closed(pair: Pair) {
  await waitFor(() => expect(document.querySelector(pair.close)).toBeNull());
}
