import React from "react";

/* A small mono line of words, an Eyebrow or a Stat's source, wraps with air
   between its lines: its size and 0.2em more each side, rounded to a whole
   pixel (14, 15 and 16px for an Eyebrow's xs, sm and md). The block margins,
   (1em - 1lh) / 2 each side, take that extra back from a single line, which
   keeps the 1em it had at `leading-none` as a flex or grid item or as a block,
   its letters where they were. Inline in running text the margins do nothing,
   and the parent's line, taller than this at these sizes, is unchanged.

   Whole pixels because WebKit draws a line at a whole pixel and `1lh` is
   exact: at 1.4 times 11px, the margins took back 0.4px more than the line
   grew. And the same on both sides because an odd pixel splits into halves
   the engines round apart, which moved the letters of a single line half a
   pixel. A browser without `round()` or `lh` keeps `leading-none`, and with
   it a 1em line and no margins.

   The line height reads a custom property first. A line holding anything but
   words keeps `leading-none` and no margins, and sets that property to 1 for
   what it holds, so an Eyebrow nested in another one (a LabeledDivider's
   label slot given an Eyebrow) keeps the 1em line it sits on. */
export const WORDS =
  "rst:supports-[(line-height:round(1em,1px))_and_(margin:1lh)]:leading-[var(--rst-eyebrow-leading,calc(1em+2*round(0.2em,1px)))] rst:my-[calc((1em-1lh)/2)]";
export const NOT_WORDS = "rst:[--rst-eyebrow-leading:1]";

/* Every child a string or a number, and something to read: `{count} squads`
   counts, an element anywhere in it doesn't. An empty or blank line has no
   line for the margins to take back from, so it keeps the old box, nothing. */
export function isText(children: React.ReactNode): boolean {
  const kids = React.Children.toArray(children);
  return (
    kids.every((kid) => typeof kid === "string" || typeof kid === "number") &&
    kids.join("").trim() !== ""
  );
}
