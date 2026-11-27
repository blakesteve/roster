/**
 * Tab strips (`Tabs`, `LiquidTabs`, `LiquidNav`) as 5.24 drew them, made
 * from strips drawn now: the box that scrolls taken out (its children put
 * back in the strip), the chevrons taken out, the strip's marks removed, and
 * the classes that only apply to a strip that scrolls dropped. Nothing else
 * differs, which `LiquidTabs.unchanged.checks` proves by reading today's
 * strips through it against 5.14's digests.
 *
 * It changes `root` in place, so it's for a copy.
 */
const ADDED_TO_STRIP = [
  "rst:max-w-full",
  "rst:[--rst-strip-cue:32px]",
  "rst:data-[roster-cue-narrow]:[--rst-strip-cue:16px]",
  "rst:data-[roster-strip=scroll]:relative",
];
const MARKS = ["data-roster-strip", "data-roster-more-left", "data-roster-more-right", "data-roster-cue-narrow"];

export function asStrips524(root: ParentNode) {
  for (const cue of root.querySelectorAll("[data-strip-cue]")) cue.remove();
  for (const box of root.querySelectorAll("[data-strip-scroller]")) box.replaceWith(...box.childNodes);
  for (const el of root.querySelectorAll("[class]")) {
    const kept = [...el.classList].filter(
      /* The variant without its prefix: a whole prefixed string here would
         read as a class to the build's check that every class emits CSS. */
      (c) => !ADDED_TO_STRIP.includes(c) && !c.includes(":in-data-[roster-strip=scroll]:"),
    );
    if (kept.length !== el.classList.length) el.setAttribute("class", kept.join(" "));
  }
  for (const el of root.querySelectorAll(MARKS.map((m) => `[${m}]`).join(","))) for (const m of MARKS) el.removeAttribute(m);
}

/** What 5.24's strips didn't have: the box that scrolls, and the chevrons. */
export const isStripAddition = (el: Element) => el.hasAttribute("data-strip-scroller") || el.closest("[data-strip-cue]") !== null;
