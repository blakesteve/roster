import * as React from "react";

/**
 * Keyboard focus that shows in every engine.
 *
 * Roster draws its focus rings on `:focus-visible`, and Roster's
 * `focus-visible` variant is `:is(:focus-visible, [data-key-focus])`
 * (`src/index.css`). This module sets that attribute where an engine's own
 * `:focus-visible` falls short: WebKit doesn't match it on an element that
 * script focuses in answer to a key, once a click has set the mode. Escape
 * handing focus back to a trigger, a focus trap moving Tab, a radio group's
 * arrows: each draws no ring in Safari after the page was clicked, while
 * Chromium draws them all.
 *
 * The rules:
 *
 * - **Keyboard mode starts on a navigation key:** Tab, the arrows, Escape,
 *   Enter, Space, Home, End, PageUp and PageDown, without Ctrl or Meta, and
 *   without Alt except on Tab. Those are the keys that move focus or act on
 *   it, the ones a person using the keyboard to get around presses. Option+Tab
 *   counts because it's how Safari's keyboard users reach a button: its plain
 *   Tab stops at text fields by default. Typing a character doesn't start it:
 *   that's text, not navigation, and counting it would ring a field's
 *   neighbor when a script moves focus mid-word. A component whose typeahead
 *   moves focus marks the item itself, as `Menu` does.
 * - **Keyboard mode ends on pointer input:** a pointer press, which also
 *   clears every mark, and a pointer move that actually moves, which leaves
 *   the ring already shown in place. A move ends the mode because some
 *   components move focus on hover, and a ring must not follow the mouse.
 *   WebKit sends a pointermove with no movement when content scrolls under a
 *   resting pointer; that one changes nothing.
 * - **On every `focusin` in keyboard mode, the target is marked**
 *   `data-key-focus`, and the mark comes off on its `focusout`. Script-moved
 *   focus after a key counts as the keyboard's, which is the point; focus
 *   moved by script after a click doesn't, because the press ended the mode.
 * - **Chromium is unchanged.** Its own `:focus-visible` already matches
 *   everything marked here: script focus after a key, and anything the keys
 *   reach. The mode only ever marks a subset of what it matches, because a
 *   move or a press ends the mode where Chromium keeps the keyboard's.
 * - **One set of listeners,** on `document` in the capture phase, so the
 *   mode is set before any component's own key handler moves focus. They're
 *   added when the first component that uses this mounts and removed when the
 *   last one unmounts, marks included. Nothing runs on the server: the
 *   listeners are added in an effect.
 */

const NAVIGATION = new Set([
  "Tab",
  "Enter",
  " ",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

export const KEY_FOCUS = "data-key-focus";

let users = 0;
let keyboard = false;
/* Where the pointer last was, to tell a move from a scroll under it. */
let at: [number, number] | null = null;

const clearMarks = () => {
  for (const el of document.querySelectorAll(`[${KEY_FOCUS}]`)) el.removeAttribute(KEY_FOCUS);
};

function onKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || (event.altKey && event.key !== "Tab")) return;
  if (NAVIGATION.has(event.key)) keyboard = true;
}

function onPointerDown(event: PointerEvent) {
  at = [event.clientX, event.clientY];
  keyboard = false;
  clearMarks();
}

/* A move is one that changes where the pointer is. `movementX` would say
   so in Chromium, but WebKit reports 0 for real moves too. */
function onPointerMove(event: PointerEvent) {
  const moved = !at || at[0] !== event.clientX || at[1] !== event.clientY;
  at = [event.clientX, event.clientY];
  if (moved) keyboard = false;
}

function onFocusIn(event: FocusEvent) {
  if (keyboard && event.target instanceof Element) event.target.setAttribute(KEY_FOCUS, "");
}

function onFocusOut(event: FocusEvent) {
  if (event.target instanceof Element) event.target.removeAttribute(KEY_FOCUS);
}

const LISTENERS = [
  ["keydown", onKeyDown],
  ["pointerdown", onPointerDown],
  ["pointermove", onPointerMove],
  ["focusin", onFocusIn],
  ["focusout", onFocusOut],
] as const;

function install() {
  users += 1;
  if (users > 1) return;
  for (const [type, listener] of LISTENERS) document.addEventListener(type, listener as EventListener, { capture: true, passive: true });
}

function uninstall() {
  users -= 1;
  if (users > 0) return;
  for (const [type, listener] of LISTENERS) document.removeEventListener(type, listener as EventListener, { capture: true });
  keyboard = false;
  at = null;
  clearMarks();
}

/**
 * Keeps the keyboard-mode listeners installed while the calling component is
 * mounted. Every component that moves focus by script, or opens something
 * that does, calls it.
 */
export function useKeyFocus() {
  React.useEffect(() => {
    install();
    return uninstall;
  }, []);
}
