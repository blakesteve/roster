import * as React from "react";

/**
 * The presentation shared by every anchored popup Roster opens off a control:
 * `Select`'s menu and `Combobox`'s, and whatever anchored popup comes next.
 *
 * Internal, and not exported from the package. Its contract is with those
 * components, not with consumers — the escape hatch a consumer reaches for is
 * `optionsClassName` on the component itself.
 *
 * It exists because the alternative is copying two subtle things into each
 * one. Both have already been got wrong in a real app:
 *
 * - the `.dark` carry below, which is why a consumer's menu once rendered in
 *   Roster's grays while the trigger above it took their palette
 * - the absence of a height utility in `POPUP_PANEL`, which reads like an
 *   oversight until you know Headless UI writes `max-height` inline
 */

/**
 * Carries a subtree-scoped `.dark` across the portal.
 *
 * Headless UI attaches an anchored panel to `<body>`, so it leaves whatever
 * `.dark` subtree the trigger sits in. That is fine when `.dark` is on
 * `<html>` — the portal is still a descendant — and wrong when a page scopes
 * dark mode to part of itself, which Roster's README explicitly permits: the
 * panel renders light against a dark page.
 *
 * `closest` finds the NEAREST `.dark`, which is exactly what
 * `@custom-variant dark (&:where(.dark, .dark *))` matches, so this reproduces
 * the cascade rather than second-guessing it. Applying the class to the panel
 * covers the panel itself through the `&:where(.dark, …)` half, and its
 * options through `.dark *`. Idempotent when `.dark` is already on the root.
 *
 * Read once, on mount. A theme TOGGLE does not need this at all: it flips
 * `.dark` on `<html>`, and the portal is already a descendant of `<html>`. The
 * only case this covers is a scoped `.dark`, which is part of a page's
 * structure rather than something that changes at runtime.
 */
export function useDarkScope<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  inDarkScope: boolean;
} {
  const ref = React.useRef<T>(null);
  const [inDarkScope, setInDarkScope] = React.useState(false);

  React.useLayoutEffect(() => {
    setInDarkScope(!!ref.current?.closest(".dark"));
  }, []);

  return { ref, inDarkScope };
}

/**
 * The panel's own classes, minus anything a caller should decide.
 *
 * Deliberately no `max-h-*` and no `overflow-*`. Headless UI's `size`
 * middleware writes both INLINE on this element whenever `anchor` is set:
 *
 *     Object.assign(floating.style, {
 *       overflow: "auto",
 *       maxHeight: `min(var(--anchor-max-height, 100vh), Npx)`,
 *     })
 *
 * so the panel has always been capped at the space between the trigger and the
 * viewport edge, and has always scrolled. A utility here would lose to that
 * inline rule anyway. `--anchor-max-height` is READ by that expression and
 * never set by Headless UI — it is an author hook like `--anchor-gap` — so a
 * consumer wanting a shorter menu sets the variable, not a height:
 * `optionsClassName="rst:[--anchor-max-height:20rem]"`.
 *
 * The surface comes from `--roster-popover-*`, so a consumer who repaints the
 * trigger with `--roster-control-*` does not open a hardcoded white sheet
 * under it.
 */
export const POPUP_PANEL = [
  /* `font-ui` on the panel, not on each row. Put on the rows it is missed by
     anything else in the panel — the empty message rendered in the host's
     prose face while the options beside it did not. */
  "rst:font-ui",
  "rst:z-50 rst:rounded-md rst:py-1 rst:shadow-lg rst:ring-1 rst:focus:outline-hidden",
  "rst:bg-[var(--roster-popover-bg)] rst:text-[var(--roster-popover-text)] rst:ring-[var(--roster-popover-border)]",
  "rst:[--anchor-gap:4px]",
].join(" ");

/**
 * Matching the panel's width to the control it opens from — and WHICH control
 * that is depends on the component, which is why this is not folded into
 * `POPUP_PANEL`.
 *
 * Headless UI writes both variables inline on the panel. For a `Listbox` the
 * button IS the whole trigger, so `--button-width` is right. For a `Combobox`
 * the trigger is the text input and the button is the little chevron beside
 * it, so `--button-width` is about 20px and the panel renders as an
 * unreadable sliver. Use `--input-width` there.
 */
export const POPUP_WIDTH_OF_BUTTON = "rst:w-(--button-width)";
export const POPUP_WIDTH_OF_INPUT = "rst:w-(--input-width)";

/** Where an anchored panel opens, and the only value Roster uses. */
export const POPUP_ANCHOR = "bottom start" as const;
