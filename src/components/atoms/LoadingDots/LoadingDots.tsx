import { useEffect, useState } from "react";
import { cn } from "../../../lib/utils";

export interface LoadingDotsProps {
  /** What a screen reader hears: "Writing a reply". */
  label?: string;
  /**
   * Say `label` in a polite status of its own (the default). Off inside a
   * chat log or any live region that already announces what's added to it,
   * where it would be said twice; the label is still there to be read.
   */
  announce?: boolean;
  className?: string;
}

/* Each dot's resting opacity and its place in the beat. At rest (and under
   reduced motion) the three read 1, 0.6 and 0.3: a still frame of movement. */
const DOTS = [
  { rest: "rst:opacity-100", delay: "0s" },
  { rest: "rst:opacity-60", delay: "0.2s" },
  { rest: "rst:opacity-30", delay: "0.4s" },
];

/**
 * Three dots for a model that's generating and hasn't sent anything yet.
 *
 * It stands in for text, so it's sized and colored by the text around it (em
 * and `currentColor`), and it goes the moment the first token arrives: render
 * the text instead of it, never beside it.
 */
function LoadingDots({ label = "Loading", announce = true, className }: LoadingDotsProps) {
  /* The words go in a moment after the status arrives: a status that arrives
     already holding its text usually isn't read out. */
  const [said, setSaid] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSaid(label), 50);
    return () => clearTimeout(timer);
  }, [label]);
  return (
    <span
      role={announce ? "status" : undefined}
      className={cn("rst:inline-flex rst:items-center rst:gap-[0.25em] rst:align-middle", className)}
      data-loading-dots=""
    >
      {DOTS.map((dot, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "rst:block rst:h-[0.4em] rst:w-[0.4em] rst:rounded-full rst:bg-current rst:animate-dot",
            /* Forced colors drop backgrounds; these keep the text's color. */
            "rst:forced-colors:forced-color-adjust-none rst:forced-colors:bg-[CanvasText]",
            dot.rest,
          )}
          /* `backwards`: while a dot waits for its beat it holds the beat's
             first frame, not its resting opacity, so it doesn't pop. */
          style={{ animationDelay: dot.delay, animationFillMode: "backwards" }}
        />
      ))}
      <span className="rst:sr-only">{announce ? said : label}</span>
    </span>
  );
}

export { LoadingDots };
