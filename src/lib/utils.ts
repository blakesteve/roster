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
const merge = extendTailwindMerge({
  prefix: "rst",
  extend: {
    classGroups: {
      /* The elevation levels are custom utilities, so tailwind-merge does not
         know they set `box-shadow` and conflict with `shadow-*` and with each
         other. Without this, `cn(cardVariants(), "rst:elevation-overlay")`
         kept BOTH and the winner fell to stylesheet order — which emits
         anchored, overlay, raised, so the family resolved in the inverse of
         its own depth order and a consumer's override was a no-op. Exactly the
         degradation the comment above describes, on the newest utility. */
      shadow: [
        "elevation-raised",
        "elevation-anchored",
        "elevation-overlay",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
