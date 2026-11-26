/**
 * The cursor every control shows. Anything a person can press shows the
 * pointer, and nothing they can't press does: Tailwind's preflight leaves a
 * `<button>` on the arrow, so a control without a cursor of its own shows the
 * arrow, which reads as not pressable.
 *
 * Run after every story in the docs (`.storybook/vitest.setup.ts`), over the
 * whole page so a popup's controls count, as the story's play left it. Text
 * fields are left out: they show the text cursor, rightly. Test-only: `src/test`
 * is outside the package.
 */

const CONTROLS = [
  "button",
  "a[href]",
  "summary",
  "select",
  "input:not([type=hidden])",
  "label",
  ...["button", "link", "tab", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "switch", "checkbox", "radio", "slider"].map(
    (role) => `[role=${role}]`,
  ),
].join(",");

/* An input a person types in, which shows the text cursor. */
const TYPED = /^(|text|email|password|search|tel|url|number|date|time|datetime-local|month|week)$/;
const TOGGLES = "input[type=checkbox], input[type=radio], [role=switch], [role=checkbox], [role=radio]";

const typedIn = (el: Element) =>
  el instanceof HTMLTextAreaElement ||
  (el instanceof HTMLInputElement && TYPED.test(el.getAttribute("type") ?? "")) ||
  (el as HTMLElement).isContentEditable;

const isDisabled = (el: Element) => el.matches(":disabled") || el.getAttribute("aria-disabled") === "true";

/* What a pointer can land on: drawn, bigger than a visually hidden input's
   pixel, and not inert or passed through. */
const reachable = (el: Element) => {
  if (el.closest("[inert]")) return false;
  const style = getComputedStyle(el);
  if (style.visibility === "hidden" || style.pointerEvents === "none") return false;
  const box = el.getBoundingClientRect();
  return box.width > 1 && box.height > 1;
};

const named = (el: Element) => {
  const text = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
  const role = el.getAttribute("role");
  return `<${el.tagName.toLowerCase()}${role ? ` role=${role}` : ""}> "${text.slice(0, 40)}"`;
};

/**
 * Every control read, and what's wrong, one line each: an enabled control, or anything inside it a
 * pointer can land on, that doesn't show the pointer, and a disabled control
 * that does. A label counts when it toggles a checkbox, a radio or a switch,
 * and takes its control's state. Other labels only focus a field.
 */
export function readCursors(root: ParentNode = document): { read: Element[]; faults: string[] } {
  const read: Element[] = [];
  const faults: string[] = [];
  for (const el of root.querySelectorAll(CONTROLS)) {
    if (typedIn(el)) continue;
    let off = isDisabled(el);
    if (el instanceof HTMLLabelElement) {
      const control = el.control ?? el.querySelector(TOGGLES);
      if (!control || !control.matches(TOGGLES)) continue;
      off ||= isDisabled(control);
    }
    if (!reachable(el)) continue;
    read.push(el);
    const cursor = getComputedStyle(el).cursor;
    if (off) {
      if (cursor === "pointer") faults.push(`${named(el)} is disabled and shows the pointer`);
      continue;
    }
    if (cursor !== "pointer") {
      faults.push(`${named(el)} shows ${cursor}`);
      continue;
    }
    /* Its own parts: an icon or a word that sets a cursor of its own. A control
       inside it is read on its own. */
    for (const part of el.querySelectorAll("*")) {
      if (part.matches(CONTROLS) || typedIn(part) || !reachable(part)) continue;
      const own = getComputedStyle(part).cursor;
      if (own !== "pointer") faults.push(`${named(el)}: a part of it, ${named(part)}, shows ${own}`);
    }
  }
  return { read, faults };
}
