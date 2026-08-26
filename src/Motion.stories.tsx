import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./components/atoms/Button/Button";

/**
 * `animate-in` and `animate-shimmer`.
 *
 * Both were referenced by components long before either existed. `Tooltip`
 * asked for `animate-in`, `fade-in-0`, `zoom-in-95` and four `slide-in-from-*`
 * classes — `tailwindcss-animate`'s API, for a plugin this library has never
 * depended on. `Countdown` asked for `animate-pulse` and two gradient stops
 * naming a color family that does not exist. None emitted a single rule.
 *
 * The numbers in the names are `tailwindcss-animate`'s, kept deliberately: see
 * the docs blurb for what each one means.
 */

const EASINGS = {
  "cubic-bezier(0.16, 1, 0.3, 1)": "expo out (Roster default)",
  "cubic-bezier(0.4, 0, 0.2, 1)": "ease in-out",
  "cubic-bezier(0.34, 1.56, 0.64, 1)": "back out (overshoots)",
  linear: "linear",
} as const;

type EntranceArgs = {
  slide: "none" | "top" | "bottom" | "left" | "right";
  fade: boolean;
  zoom: boolean;
  duration: number;
  easing: keyof typeof EASINGS;
  stagger: number;
};

/**
 * The knobs `animate-in` reads. They are internal — the public theming surface
 * is `--roster-*` — but a control panel has to reach them to be a control panel.
 */
type EnterVars = CSSProperties & {
  "--rst-enter-duration"?: string;
  "--rst-enter-easing"?: string;
};

/* Spelled out rather than interpolated. Tailwind scans source as text, so
   `rst:slide-in-from-${slide}-2` is a class it can never see — which is the
   same failure mode this whole foundation exists to fix. */
const SLIDE = {
  none: "",
  top: "rst:slide-in-from-top-2",
  bottom: "rst:slide-in-from-bottom-2",
  left: "rst:slide-in-from-left-2",
  right: "rst:slide-in-from-right-2",
} as const;

function classesFor({ slide, fade, zoom }: EntranceArgs) {
  return [
    "rst:animate-in",
    fade && "rst:fade-in-0",
    zoom && "rst:zoom-in-95",
    SLIDE[slide],
  ]
    .filter(Boolean)
    .join(" ");
}

const CARDS = ["One", "Two", "Three", "Four"];

function Playground(args: EntranceArgs) {
  const [run, setRun] = useState(0);
  const classes = classesFor(args);
  const vars: EnterVars = {
    "--rst-enter-duration": `${args.duration}ms`,
    "--rst-enter-easing": args.easing,
  };

  return (
    <section className="rst:flex rst:flex-col rst:gap-5 rst:p-6">
      <h3 className="rst:text-sm rst:font-semibold rst:text-gray-800 rst:dark:text-gray-200">
        Compose an entrance
      </h3>

      <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-3">
        <Button
          size="sm"
          colorScheme="primary"
          onClick={() => setRun((n) => n + 1)}
        >
          Replay composition
        </Button>
        <p className="rst:text-xs rst:text-gray-500 rst:dark:text-gray-400">
          Plays all four cards together, offset by the stagger control.
          Remounting is what re-fires an entrance.
        </p>
      </div>

      <code className="rst:block rst:overflow-x-auto rst:rounded-lg rst:bg-gray-100 rst:px-3 rst:py-2 rst:font-mono rst:text-[11px] rst:text-gray-700 rst:dark:bg-gray-900 rst:dark:text-gray-300">
        {classes.replaceAll("rst:", "") || "animate-in"}
      </code>

      <div key={run} style={vars} className="rst:flex rst:flex-wrap rst:gap-4">
        {CARDS.map((label, i) => (
          <div
            key={label}
            style={{ animationDelay: `${i * args.stagger}ms` }}
            className={`rst:flex rst:h-28 rst:w-28 rst:items-center rst:justify-center rst:rounded-xl rst:border rst:border-gray-200 rst:bg-white rst:text-sm rst:font-semibold rst:text-gray-700 rst:shadow-sm rst:dark:border-gray-700 rst:dark:bg-gray-900 rst:dark:text-gray-200 ${classes}`}
          >
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Every modifier the library ships, with the value each one actually sets. */
const MODIFIERS = [
  { cls: "rst:fade-in-0", name: "fade-in-0", sets: "opacity: 0 → 1" },
  { cls: "rst:zoom-in-95", name: "zoom-in-95", sets: "scale: 95% → 100%" },
  {
    cls: "rst:slide-in-from-top-2",
    name: "slide-in-from-top-2",
    sets: "y: −0.5rem → 0",
  },
  {
    cls: "rst:slide-in-from-bottom-2",
    name: "slide-in-from-bottom-2",
    sets: "y: +0.5rem → 0",
  },
  {
    cls: "rst:slide-in-from-left-2",
    name: "slide-in-from-left-2",
    sets: "x: −0.5rem → 0",
  },
  {
    cls: "rst:slide-in-from-right-2",
    name: "slide-in-from-right-2",
    sets: "x: +0.5rem → 0",
  },
] as const;

/**
 * One modifier, one trigger. Firing all six at once is a wall of movement that
 * teaches nothing about any single one of them.
 */
function ModifierCard({
  cls,
  name,
  sets,
}: {
  cls: string;
  name: string;
  sets: string;
}) {
  const [run, setRun] = useState(0);

  return (
    <div className="rst:flex rst:flex-col rst:gap-2">
      <Button
        key={run}
        variant="outline"
        onClick={() => setRun((n) => n + 1)}
        className={`rst:h-24 rst:w-full rst:font-mono rst:text-[11px] rst:animate-in ${cls}`}
      >
        {name}
      </Button>
      <p className="rst:font-mono rst:text-[10px] rst:text-gray-500 rst:dark:text-gray-400">
        {sets}
      </p>
    </div>
  );
}

function EveryModifier() {
  /* 900ms, because at the library default a `-2` slide covers 8px in 150ms —
     right for a tooltip, far too small to study. */
  const vars: EnterVars = { "--rst-enter-duration": "900ms" };

  return (
    <section className="rst:flex rst:flex-col rst:gap-5 rst:border-t rst:border-gray-200 rst:p-6 rst:dark:border-gray-800">
      <div className="rst:flex rst:flex-col rst:gap-1">
        <h3 className="rst:text-sm rst:font-semibold rst:text-gray-800 rst:dark:text-gray-200">
          One modifier at a time
        </h3>
        <p className="rst:text-xs rst:text-gray-500 rst:dark:text-gray-400">
          Click any card to replay just that one, at 900ms so the movement is
          legible. <code>animate-in</code> is not shown alone: with no modifier
          the keyframe starts at the element&apos;s resting state, so there is
          nothing to animate from.
        </p>
      </div>

      <div
        style={vars}
        className="rst:grid rst:grid-cols-2 rst:gap-4 rst:sm:grid-cols-3"
      >
        {MODIFIERS.map((m) => (
          <ModifierCard key={m.name} cls={m.cls} name={m.name} sets={m.sets} />
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
      <p className="rst:animate-shimmer rst:bg-clip-text rst:font-mono rst:text-5xl rst:font-bold rst:tabular-nums rst:text-transparent">
        12 : 04 : 39
      </p>
      <p className="rst:font-mono rst:text-[10px] rst:text-gray-500 rst:dark:text-gray-400">
        {mode === "dark"
          ? "base primary-400, highlight white"
          : "base primary-700, highlight primary-300"}
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
          "Two hand-rolled utilities. Neither is a dependency: seven entrance classes do not justify a package in a library that already ships compiled CSS, and keeping them in `index.css` is the same reasoning as not bundling a preflight.\n\n### What the numbers mean\n\nThe names are `tailwindcss-animate`'s, kept exactly, because the components were already written against that API and anyone arriving from it should not have to relearn the vocabulary. Each suffix is the value the modifier sets:\n\n| Class | Suffix | Animates from |\n| --- | --- | --- |\n| `fade-in-0` | opacity `0` | invisible to its own opacity |\n| `zoom-in-95` | scale `95%` | 95% to 100% |\n| `slide-in-from-top-2` | Tailwind spacing step `2` = `0.5rem` | 8px above its resting position |\n\nSo `-2` is a distance on the spacing scale, `95` is a percentage, and `0` is an opacity. Only the steps Roster's own components use are implemented — `Tooltip` needs all four directions at `-2`, and nothing yet needs `-4` or `zoom-in-90`. Adding a step is one line each.\n\n### `animate-in`\n\nOne `rst-enter` keyframe reads four custom properties, and each modifier sets one. That is why `fade-in-0 zoom-in-95 slide-in-from-top-2` compose into a **single** animation rather than three rules fighting over `transform`.\n\n`animate-in` alone does nothing, and that is the design: with no modifier the keyframe's start values are the element's own resting state. It is the engine; a modifier is the thing to animate from.\n\nThe default duration is **150ms**, matching the plugin. At that speed a `-2` slide covers 8px, which is right for a tooltip and reads as a twitch on anything larger — so the playground opens slower than the default. `Tooltip` keys its direction off Radix's `data-side`, so the panel always rises from the side collision detection lands it on.\n\n`animation-fill-mode: backwards` is set, which is what makes the stagger control work: without it a delayed element paints at its resting state, then jumps back to the start when the delay elapses.\n\n### `animate-shimmer`\n\nA highlight travels across a base and rests between passes; `Countdown`'s `gradient` variant uses it. Retint with two variables, set in **both** scopes:\n\n```css\n:root { --roster-shimmer-base: #084063; --roster-shimmer-highlight: #9bcce9; }\n.dark  { --roster-shimmer-base: #5ea3de; --roster-shimmer-highlight: #ffffff; }\n```\n\nThe base carries the text whenever the highlight is elsewhere, so it has to be readable alone. The highlight is deliberately exempt from the 3:1 bar — it is a specular pass on screen for a fraction of a second per glyph.\n\n### Reduced motion\n\nBoth stop under `prefers-reduced-motion: reduce`. The shimmer does **not** park its highlight mid-glyph: `primary-300` on white is 1.72:1, and holding it there would leave a permanent sub-3:1 band across the numerals for exactly the users least likely to want it. With the animation off the digits fall back to flat `primary-700` at 10.92:1. Emulate it under **Rendering → Emulate CSS prefers-reduced-motion** to check.",
      },
    },
  },
  argTypes: {
    slide: {
      control: "inline-radio",
      options: ["none", "top", "bottom", "left", "right"],
      description: "Which `slide-in-from-*-2` to apply, if any.",
    },
    fade: { control: "boolean", description: "Apply `fade-in-0`." },
    zoom: { control: "boolean", description: "Apply `zoom-in-95`." },
    duration: {
      control: { type: "range", min: 100, max: 2000, step: 50 },
      description: "`--rst-enter-duration`. The library default is 150ms.",
    },
    easing: {
      control: "select",
      options: Object.keys(EASINGS),
      description: "`--rst-enter-easing`.",
    },
    stagger: {
      control: { type: "range", min: 0, max: 300, step: 10 },
      description:
        "Per-card `animation-delay`, to show `fill-mode: backwards`.",
    },
  },
  args: {
    slide: "bottom",
    fade: true,
    zoom: true,
    duration: 600,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 80,
  },
} satisfies Meta<EntranceArgs>;

export default meta;
type Story = StoryObj<EntranceArgs>;

export const Entrance: Story = {
  render: (args) => (
    <div className="rst:w-full rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800">
      <Playground {...args} />
      <EveryModifier />
    </div>
  ),
};

export const Shimmer: Story = {
  /* Inherited so the type lines up; the entrance args are unused here. */
  args: meta.args,
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="rst:flex rst:w-full rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800">
      <ShimmerRow mode="light" />
      <ShimmerRow mode="dark" />
    </div>
  ),
};
