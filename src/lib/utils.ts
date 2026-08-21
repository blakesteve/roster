import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Roster's own utilities carry an `rst:` prefix so a host app using the same
 * class name cannot override them. `tailwind-merge` has to be told, or it stops
 * recognising them as utilities entirely and its conflict resolution quietly
 * degrades to concatenation: `cn("rst:p-2", "rst:p-4")` would keep both, and
 * which one wins falls back to stylesheet order rather than call order.
 *
 * The failure is invisible in a snapshot and obvious in a browser, which is the
 * worst combination, so it is pinned by a unit test rather than trusted.
 */
const merge = extendTailwindMerge({ prefix: "rst" });

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
