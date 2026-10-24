import type { ReactNode } from "react";
import { shownCount, type TabsLabels } from "./liquid-count";

/**
 * A tab's or a link's label, with its count beside it when it has one.
 *
 * The mark is drawn from the item's own text color: its number in that color,
 * its fill a light tint of it. So it follows the item through every state it
 * already styles (at rest, selected on the pill, hovered, focused), in both
 * themes and both variants, and through any palette a consumer sets on the
 * `--roster-lt-*` tokens. Badge and Pill each draw from a fixed palette, which
 * on the selected tab would be a gray or brand chip sitting on the pill.
 *
 * The tint is 12% of the ink: enough to read as a mark, and light enough
 * that the number still clears 4.5:1 against it in every state on Roster's
 * own tokens (4.88:1 at the least, the selected tab and the dark strip at
 * rest), where 15% left one state at 4.61.
 *
 * The mark is hidden from assistive technology. The count is said by the
 * item's `aria-label` when its label is a string (`countName`), and by text
 * hidden beside the label otherwise, so the name is "Open, 12 items" rather
 * than "Open12" either way. The hidden text stays under an `aria-label` too,
 * for a link component that doesn't forward one. Render it only for a count that shows (`shownCount`): with
 * none, the item takes its label as it always has, wrapper and all.
 */
export function LiquidCount({ label, count, labels }: { label: ReactNode; count: number | undefined; labels: TabsLabels }) {
  if (!shownCount(count)) return <>{label}</>;
  return (
    <span className="rst:inline-flex rst:items-center rst:justify-center rst:gap-1.5">
      {label}
      <span
        aria-hidden="true"
        data-tab-count=""
        className="rst:inline-flex rst:h-5 rst:min-w-5 rst:items-center rst:justify-center rst:rounded-full rst:bg-current/12 rst:px-1.5 rst:text-xs rst:font-semibold rst:leading-none rst:tabular-nums"
      >
        {labels.countMark(count)}
      </span>
      <span className="rst:sr-only">{`, ${labels.count(count)}`}</span>
    </span>
  );
}
