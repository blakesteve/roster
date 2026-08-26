import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./components/atoms/Button/Button";

/**
 * `animate-in` and `animate-shimmer`, which components asked for long before
 * either existed.
 *
 * `Tooltip` referenced `animate-in`, `fade-in-0`, `zoom-in-95` and four
 * `slide-in-from-*` classes — `tailwindcss-animate`'s API, for a plugin this
 * library has never depended on. `Countdown` referenced `animate-pulse` and two
 * gradient stops naming a color family that does not exist. None of them emitted
 * a single rule, so the tooltip appeared instantly and the "gradient" was a
 * two-stop ramp.
 *
 * The entrance is 150ms, matching the plugin whose names it borrows. That is
 * short on purpose and genuinely hard to catch, which is what the slow-motion
 * control below is for.
 */

const MODIFIERS = [
  {
    label: "animate-in",
    classes: "",
    note: "no modifier: the keyframe's defaults, so nothing moves",
  },
  {
    label: "fade-in-0",
    classes: "rst:fade-in-0",
    note: "--rst-enter-opacity: 0",
  },
  {
    label: "zoom-in-95",
    classes: "rst:zoom-in-95",
    note: "--rst-enter-scale: 0.95",
  },
  {
    label: "slide-in-from-top-2",
    classes: "rst:slide-in-from-top-2",
    note: "--rst-enter-translate-y: -0.5rem",
  },
  {
    label: "slide-in-from-bottom-2",
    classes: "rst:slide-in-from-bottom-2",
    note: "--rst-enter-translate-y: 0.5rem",
  },
  {
    label: "slide-in-from-left-2",
    classes: "rst:slide-in-from-left-2",
    note: "--rst-enter-translate-x: -0.5rem",
  },
  {
    label: "slide-in-from-right-2",
    classes: "rst:slide-in-from-right-2",
    note: "--rst-enter-translate-x: 0.5rem",
  },
  {
    label: "all three, as Tooltip composes them",
    classes: "rst:fade-in-0 rst:zoom-in-95 rst:slide-in-from-top-2",
    note: "one animation, not three fighting over transform",
  },
] as const;

/** Internal knob, exposed here only so 150ms is observable. */
type SpeedVars = CSSProperties & { "--rst-enter-duration"?: string };

function Tile({
  label,
  classes,
  note,
}: {
  label: string;
  classes: string;
  note: string;
}) {
  return (
    <div className="rst:flex rst:min-w-0 rst:flex-col rst:gap-2">
      <div
        className={`rst:flex rst:h-20 rst:items-center rst:justify-center rst:rounded-xl rst:border rst:border-gray-200 rst:bg-white rst:text-xs rst:font-semibold rst:text-gray-700 rst:shadow-sm rst:dark:border-gray-700 rst:dark:bg-gray-900 rst:dark:text-gray-200 rst:animate-in ${classes}`}
      >
        {label}
      </div>
      <p className="rst:font-mono rst:text-[10px] rst:leading-snug rst:text-gray-500 rst:dark:text-gray-400">
        {note}
      </p>
    </div>
  );
}

function Entrance() {
  const [run, setRun] = useState(0);
  const [slow, setSlow] = useState(true);
  const speed: SpeedVars = slow ? { "--rst-enter-duration": "1200ms" } : {};

  return (
    <section className="rst:flex rst:flex-col rst:gap-5 rst:p-6">
      <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-3">
        <Button
          size="sm"
          colorScheme="primary"
          onClick={() => setRun((n) => n + 1)}
        >
          Replay
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSlow((s) => !s)}>
          {slow ? "Slow motion (1200ms)" : "Real speed (150ms)"}
        </Button>
        <p className="rst:text-xs rst:text-gray-500 rst:dark:text-gray-400">
          Replay remounts the tiles, which is what re-fires the entrance.
        </p>
      </div>

      <div
        key={run}
        style={speed}
        className="rst:grid rst:grid-cols-2 rst:gap-4 rst:sm:grid-cols-4"
      >
        {MODIFIERS.map((m) => (
          <Tile
            key={m.label}
            label={m.label}
            classes={m.classes}
            note={m.note}
          />
        ))}
      </div>
    </section>
  );
}

function ShimmerRow({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={
        (mode === "dark" ? "dark rst:bg-gray-950" : "rst:bg-white") +
        " rst:flex rst:flex-1 rst:flex-col rst:gap-3 rst:p-6"
      }
    >
      <p className="rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
        {mode} mode
      </p>
      <p className="rst:animate-shimmer rst:bg-clip-text rst:font-mono rst:text-5xl rst:font-bold rst:text-transparent rst:tabular-nums">
        12 : 04 : 39
      </p>
      <p className="rst:text-xs rst:text-gray-500 rst:dark:text-gray-400">
        {mode === "dark"
          ? "primary-400 base, white highlight"
          : "primary-700 base, primary-300 highlight"}
      </p>
    </div>
  );
}

const meta = {
  title: "Foundations/Motion",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Two hand-rolled utilities. Neither is a dependency: seven entrance classes do not justify a package in a library that already ships compiled CSS, and keeping them in `index.css` is the same reasoning as not bundling a preflight.\n\n### `animate-in`\n\nOne `rst-enter` keyframe reads four custom properties, and each modifier sets one. That is why `fade-in-0 zoom-in-95 slide-in-from-top-2` compose into a **single** animation instead of three rules fighting over `transform`. `animate-in` on its own is a no-op by design — the keyframe's defaults are the element's own resting state, so a modifier is what gives it something to animate from.\n\n`Tooltip` keys the slide direction off Radix's `data-side`, so the panel always rises from the side collision detection lands it on.\n\nThe default duration is **150ms**, matching `tailwindcss-animate`. At that speed a `zoom-in-95` on a small element moves about two pixels, which is why the slow-motion toggle exists. `--rst-enter-duration` and `--rst-enter-easing` are internal knobs, not public API — the public theming surface is `--roster-*`.\n\n### `animate-shimmer`\n\nA highlight travels across a base and rests between passes. `Countdown`'s `gradient` variant uses it. Retint with two variables:\n\n```css\n:root {\n  --roster-shimmer-base:      #084063;\n  --roster-shimmer-highlight: #9bcce9;\n}\n.dark { /* … */ }\n```\n\nThe base carries the text whenever the highlight is elsewhere, so it has to be readable on its own. The highlight is deliberately exempt from the 3:1 bar — it is a specular pass on screen for a fraction of a second per glyph.\n\n### Reduced motion\n\nBoth stop under `prefers-reduced-motion: reduce`. The shimmer does **not** park its highlight mid-glyph: `primary-300` on white is 1.72:1, and holding it there would leave a permanent sub-3:1 band across the numerals for exactly the users least likely to want it. With the animation off, the digits fall back to flat `primary-700` at 10.92:1.\n\nEmulate it in DevTools under **Rendering → Emulate CSS prefers-reduced-motion** to check: Replay should produce no movement, and the digits above should sit flat and readable.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Motion: Story = {
  render: () => (
    <div className="rst:w-full rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800">
      <Entrance />
      <div className="rst:flex rst:border-t rst:border-gray-200 rst:dark:border-gray-800">
        <ShimmerRow mode="light" />
        <ShimmerRow mode="dark" />
      </div>
    </div>
  ),
};
