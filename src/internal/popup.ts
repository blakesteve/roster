import * as React from "react";

/**
 * The presentation shared by every anchored popup Roster opens off a control:
 * `Select`'s menu, `Combobox`'s and `MultiSelect`'s, and whatever anchored
 * popup comes next.
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
 * options through `.dark *`.
 *
 * **Only when the portal leaves the scope.** When `.dark` is on `<html>` or
 * `<body>`, the panel is already inside it and needs nothing. The class isn't
 * harmless there either: it carries Roster's own `.dark` token block, which
 * declares the default palette on the panel itself, over whatever the page set
 * above it. A consumer's `--roster-*` set inline on `<html>`, or under
 * `html.dark`, stopped at every panel, which drew Roster's grays under the
 * consumer's trigger.
 *
 * Read once, on mount. A theme TOGGLE does not need this at all: it flips
 * `.dark` on `<html>`, and the portal is already a descendant of `<html>`. The
 * only case this covers is a scoped `.dark`, which is part of a page's
 * structure rather than something that changes at runtime.
 */
/**
 * Whether a panel portaled out from beside `el` must carry `.dark` itself:
 * `el` is in a `.dark` scope, and the scope doesn't contain `<body>`, where
 * the portal lands. See `useDarkScope` for why carrying it otherwise is wrong.
 */
export function carriesDark(el: Element | null | undefined): boolean {
  const scope = el?.closest(".dark");
  return !!scope && !scope.contains(document.body);
}

export function useDarkScope<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  inDarkScope: boolean;
} {
  const ref = React.useRef<T>(null);
  const [inDarkScope, setInDarkScope] = React.useState(false);

  React.useLayoutEffect(() => {
    setInDarkScope(carriesDark(ref.current));
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
  "rst:z-50 rst:rounded-md rst:py-1 rst:elevation-anchored rst:ring rst:focus:outline-hidden",
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
/**
 * Whether the panel should render on the dark palette.
 *
 * Two reasons it might, and they are unrelated:
 *
 * - the control sits inside a `.dark` subtree, which the portaled panel does
 *   not inherit — that is `inDarkScope`, above.
 * - the control's own variant NAMES a dark surface. `slate` paints `gray-700`
 *   in light mode, and its panel was rendering white: a dark trigger opening a
 *   white sheet, which is the exact mismatch `--roster-popover-*` was
 *   introduced to stop. The token family only ever covered the variant that
 *   reads tokens; the ones that name a surface were left behind.
 *
 * The fix reuses the dark palette rather than inventing a slate one, because
 * every state in that palette already exists and has already been measured —
 * `dark:data-focus:bg-primary-900/30` and `dark:data-selected:bg-gray-700/50`
 * are designed for a dark sheet. Painting a bespoke slate panel would have
 * meant a third set of option states with no contrast pass behind them.
 *
 * Shared here rather than repeated in three components, for the same reason
 * everything else in this module is.
 */
export function popupInDarkPalette(
  inDarkScope: boolean,
  variant: string | null | undefined,
): boolean {
  return inDarkScope || variant === "slate";
}

/**
 * The panel's width: the control's width as laid out, `--rst-popup-width`,
 * which `usePopupWidth` measures, falling back to Headless UI's own variable
 * until the first measure (and where there's no ResizeObserver).
 *
 * Headless UI's `--input-width` and `--button-width` are the control's box
 * as painted, read every frame. Inside a `Dialog` that's still scaling in,
 * that box grows a little each frame, so the panel's width changed each
 * frame, and floating-ui's resize observer, repositioning it, resized it
 * again in the same frame: a "ResizeObserver loop" page error on every open
 * during the entrance, up to 18 in WebKit. The width as laid out doesn't
 * move under a transform.
 */
export const POPUP_WIDTH_OF_BUTTON = "rst:w-[var(--rst-popup-width,var(--button-width))]";
export const POPUP_WIDTH_OF_INPUT = "rst:w-[var(--rst-popup-width,var(--input-width))]";

/* The border box's width as laid out, which a transform doesn't change (the
   painted box, `getBoundingClientRect`, does), to a fraction of a pixel
   (`offsetWidth` rounds). Exported for its test. */
export function laidOutWidth(el: Element): number {
  const s = getComputedStyle(el);
  const width = parseFloat(s.width) || 0;
  if (s.boxSizing === "border-box") return width;
  const px = (v: string) => parseFloat(v) || 0;
  return width + px(s.paddingLeft) + px(s.paddingRight) + px(s.borderLeftWidth) + px(s.borderRightWidth);
}

/**
 * Measures the control a panel takes its width from, as laid out, for
 * `POPUP_WIDTH_OF_*`. Pass `measure` as the control's `ref`, and put `style`
 * on the panel.
 *
 * Read from the laid-out border box before the first paint, and again only
 * when a ResizeObserver reports the control's own size changed. Set as state,
 * so a change lands in a render after the observer has delivered, never
 * inside its delivery.
 */
export function usePopupWidth<T extends HTMLElement>(): {
  measure: (el: T | null) => void;
  style: React.CSSProperties | undefined;
} {
  const [el, setEl] = React.useState<T | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  /* Read once before the first paint too: a control mounted with its Dialog
     can be opened before the observer first delivers, and a panel that took
     the painted width until then changed width mid-entrance. */
  React.useLayoutEffect(() => {
    if (el) setWidth(laidOutWidth(el));
  }, [el]);
  React.useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const next = laidOutWidth(el);
      setWidth((was) => (was === next ? was : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  const style = React.useMemo(
    () => (width === null ? undefined : ({ "--rst-popup-width": `${width}px` } as React.CSSProperties)),
    [width],
  );
  return { measure: setEl, style };
}

/** Where an anchored panel opens, and the only value Roster uses. */
export const POPUP_ANCHOR = "bottom start" as const;
