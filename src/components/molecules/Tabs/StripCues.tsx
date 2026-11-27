import type { MouseEvent } from "react";
import { cueClassName } from "./strip-scroll";

const CHEVRON = {
  left: "M6.5 1 1.5 7l5 6",
  right: "m1.5 1 5 6-5 6",
};

/* A press on a chevron moves no focus: it isn't a stop, and a press there
   would otherwise take focus off the tab that has it. */
const keepFocus = (event: MouseEvent) => event.preventDefault();

/**
 * The chevrons of a strip that scrolls (`strip-scroll.ts`): one on each side
 * with more, 8 × 14px in its zone. For a mouse, which has no sideways wheel:
 * a press pages the strip. Hidden from assistive technology, out of the tab
 * order, and selects nothing; the arrow keys and the tablist already serve
 * everyone else.
 */
export function StripCues({ tone, onPage }: { tone: "plain" | "liquid"; onPage: (side: "left" | "right") => void }) {
  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <span key={side} aria-hidden="true" data-strip-cue={side} className={cueClassName(side, tone)} onMouseDown={keepFocus} onClick={() => onPage(side)}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d={CHEVRON[side]} />
          </svg>
        </span>
      ))}
    </>
  );
}
