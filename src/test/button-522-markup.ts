/* Roster's Button markup written back as 5.22 drew it, for checks pinned to
   an older build: see `as522` and `styleAs522`. Button522.tsx is the twin
   component itself. */

/* Classes 5.23 added to `buttonVariants`' base, and the one it replaced. */
const ADDED = ["rst:text-center", "rst:text-balance", "rst:min-w-fit", "rst:min-h-fit", "rst:supports-[height:1lh]:[--rst-line:1lh]"];
const MARK = "rst:supports-[height:1lh]:[--rst-line:1lh]";
const ROW = "rst:pointer-events-none rst:flex rst:grow rst:min-w-0 rst:items-center rst:[justify-content:inherit] rst:[gap:inherit]";
/* Prefixes, joined from parts so the build's class check doesn't read them
   as classes that should exist. */
const OTHER_PADDING = [7, 9, 11].map((n) => ["rst", `py-[calc((--spacing(${n})-var(--rst-line,`].join(":"));
const SLOT_LINE = ["rst", "supports-[height:1lh]:"].join(":");

/**
 * HTML with every Roster Button written back as 5.22 drew it: its classes
 * (`whitespace-nowrap` for the wrap, `default`'s `py-2` for the size padding,
 * no width or height floor), its icon slots without their line, and no row
 * span. For checks pinned to an older build's HTML, so they keep comparing
 * everything else with it; the Button's own change is pinned by
 * `Button.wrap.checks.stories.tsx`. Only elements carrying 5.23's base mark
 * are touched.
 */
export function as522(html: string): string {
  const t = document.createElement("template");
  t.innerHTML = html;
  for (const el of t.content.querySelectorAll<HTMLElement>("[class]")) {
    if (!el.classList.contains(MARK)) continue;
    const classes = el.getAttribute("class")!.split(" ").flatMap((c) => {
      if (c === "rst:whitespace-normal") return ["rst:whitespace-nowrap"];
      if (ADDED.includes(c)) return [];
      if (c === "rst:py-[calc((--spacing(10)-var(--rst-line,1.25rem))/2-var(--roster-border-width,1px))]") return ["rst:py-2"];
      if (OTHER_PADDING.some((prefix) => c.startsWith(prefix))) return [];
      return [c];
    });
    el.setAttribute("class", classes.join(" "));
    const row = [...el.children].find((c) => c.getAttribute("class") === ROW);
    if (row) row.replaceWith(...row.childNodes);
  }
  for (const slot of t.content.querySelectorAll<HTMLElement>("[class*='supports-[height:1lh]:h-[1lh]']")) {
    slot.setAttribute(
      "class",
      slot
        .getAttribute("class")!
        .split(" ")
        .filter((c) => !c.startsWith(SLOT_LINE))
        .join(" "),
    );
  }
  return t.innerHTML;
}

/** Button's 5.23 row span, which 5.22 didn't have: skip it in a style walk. */
export const isRow523 = (el: Element) => el.getAttribute("class") === ROW;

/**
 * A computed style as 5.22's Button gave it, for the properties 5.23 moved on
 * a Button and its icon slots: the size's vertical padding (`default` 8px,
 * the others none), the height floor, and an icon slot's height (its icon's,
 * where 5.23 makes it a line). Anything else passes through.
 */
export function styleAs522(el: Element, prop: string, value: string): string {
  const cls = el.getAttribute("class") ?? "";
  if (el.classList.contains(MARK)) {
    if (prop === "min-height") return "auto";
    if (prop === "padding-top" || prop === "padding-bottom") {
      if (cls.includes("--spacing(10)")) return "8px";
      if (/--spacing\((7|9|11)\)/.test(cls)) return "0px";
    }
  }
  if (prop === "height" && cls.includes("rst:supports-[height:1lh]:h-[1lh]") && el.firstElementChild) {
    return getComputedStyle(el.firstElementChild).height;
  }
  return value;
}
