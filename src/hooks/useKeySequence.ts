"use client";

import { useEffect, useRef } from "react";

export interface UseKeySequenceOptions {
  /**
   * Milliseconds allowed between keys before progress resets. Without this a
   * sequence can be completed across an arbitrarily long span, which is rarely
   * what anyone means. Set to 0 to disable the timeout entirely.
   */
  timeout?: number;
  /** Match keys case-insensitively. On by default: users hold shift by accident. */
  ignoreCase?: boolean;
  /** Calls preventDefault on keys that advance the sequence. */
  preventDefault?: boolean;
  /** Turns the listener off without unmounting the component. */
  enabled?: boolean;
  /**
   * Ignore keystrokes typed into inputs, textareas, and contenteditable.
   * On by default: a shortcut that fires while someone is filling in a form is
   * a bug, not a feature.
   */
  ignoreWhenTyping?: boolean;
}

const DEFAULTS = {
  timeout: 1500,
  ignoreCase: true,
  preventDefault: false,
  enabled: true,
  ignoreWhenTyping: true,
};

/** The Konami code, for the one time in your life you need it. */
export const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
  "Enter",
] as const;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // The attribute is checked alongside the property because `isContentEditable`
  // is not implemented everywhere (jsdom, notably), and a shortcut firing
  // mid-sentence is worse than one that occasionally does not.
  if (target.isContentEditable) return true;
  const editable = target.getAttribute("contenteditable");
  if (editable !== null && editable !== "false") return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Fires `onMatch` when a sequence of `KeyboardEvent.key` values is typed in
 * order.
 *
 * Useful for keyboard navigation chords (`g` then `i`), debug shortcuts, and
 * easter eggs. Call it more than once to register more than one sequence.
 *
 * ```tsx
 * useKeySequence(["g", "i"], () => router.push("/inbox"));
 * useKeySequence(KONAMI_CODE, () => setPartyMode(true));
 * ```
 *
 * A wrong key resets progress, except when that key is itself the start of the
 * sequence, which begins a fresh attempt rather than costing one. That is what
 * makes a doubled first key ("g g i") still work.
 */
export function useKeySequence(
  sequence: readonly string[],
  onMatch: () => void,
  options: UseKeySequenceOptions = {},
) {
  const { timeout, ignoreCase, preventDefault, enabled, ignoreWhenTyping } = {
    ...DEFAULTS,
    ...options,
  };

  const progress = useRef(0);
  const lastAt = useRef(0);
  const handler = useRef(onMatch);

  // Held in a ref so an inline arrow function does not re-bind the listener on
  // every render.
  useEffect(() => {
    handler.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    if (!enabled || sequence.length === 0) return;

    const normalize = (key: string) => (ignoreCase ? key.toLowerCase() : key);
    const expected = sequence.map(normalize);

    function onKeyDown(event: KeyboardEvent) {
      if (ignoreWhenTyping && isTypingTarget(event.target)) return;

      const now = Date.now();
      if (timeout > 0 && progress.current > 0 && now - lastAt.current > timeout) {
        progress.current = 0;
      }
      lastAt.current = now;

      const key = normalize(event.key);

      if (key === expected[progress.current]) {
        if (preventDefault) event.preventDefault();
        progress.current += 1;

        if (progress.current === expected.length) {
          progress.current = 0;
          handler.current();
        }
        return;
      }

      progress.current = key === expected[0] ? 1 : 0;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sequence, timeout, ignoreCase, preventDefault, enabled, ignoreWhenTyping]);
}
