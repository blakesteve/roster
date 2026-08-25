import { useCallback, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./components/atoms/Badge/Badge";
import { Pill } from "./components/atoms/Pill/Pill";
import { Button } from "./components/atoms/Button/Button";

/**
 * A solid fill is the one place a component chooses both a background and the
 * text on top of it, which means it can get the pair wrong on its own — no
 * consumer involved. Roster shipped eleven such pairs below WCAG AA, including
 * solid teal at 2.49:1 and solid info at 2.77:1, roughly half the threshold.
 *
 * `src/contrast.test.ts` is the guard; this is the eye test. It measures what
 * the browser actually painted rather than reading the tokens, so it stays true
 * under a consuming app's palette overrides — point it at game-verdict's theme
 * and it reports game-verdict's ratios.
 */

function parse(rgb: string): [number, number, number] | null {
  const m = rgb.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number | null {
  const [x, y] = [parse(a), parse(b)];
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Wraps a control, measures its painted colors, and prints the ratio underneath.
 *
 * Only meaningful for opaque fills, which is all this story renders. A
 * translucent one would be measured wrong rather than skipped: `bg-transparent`
 * computes to `rgba(0, 0, 0, 0)` and would score against black, and Tailwind's
 * `/10` opacity shorthand compiles to `color-mix(in oklab, ...)`, which the
 * parser does not read at all. Adding a soft or outline row here means
 * compositing against the parent background first.
 */
function Measured({ label, children }: { label: string; children: ReactNode }) {
  const [ratio, setRatio] = useState<number | null>(null);

  /*
   * A ref callback rather than an effect. The measurement has to happen once
   * the node exists and not before, but doing it in `useLayoutEffect` means
   * calling setState inside an effect, which the lint rule rightly objects to
   * as a cascading render. A ref callback runs at exactly the same moment and
   * is not an effect.
   */
  const measure = useCallback((node: HTMLDivElement | null) => {
    const el = node?.firstElementChild;
    if (!el) return;
    const style = getComputedStyle(el);
    setRatio(contrast(style.backgroundColor, style.color));
  }, []);

  const passes = ratio !== null && ratio >= 4.5;

  return (
    <div className="rst:flex rst:flex-col rst:items-start rst:gap-1">
      <div ref={measure}>{children}</div>
      <span className="rst:font-mono rst:text-[10px] rst:text-gray-500 rst:dark:text-gray-400">
        {label}
      </span>
      <span
        className={
          "rst:font-mono rst:text-[10px] rst:font-semibold " +
          (passes
            ? "rst:text-success-700 rst:dark:text-success-400"
            : "rst:text-error-700 rst:dark:text-error-400")
        }
      >
        {ratio === null ? "—" : `${ratio.toFixed(2)}:1 ${passes ? "✓" : "✗"}`}
      </span>
    </div>
  );
}

const BADGE_VARIANTS = [
  "primary",
  "orange",
  "teal",
  "purple",
  "amber",
  "success",
  "error",
  "neutral",
] as const;

const PILL_SCHEMES = ["primary", "success", "error", "amber", "info", "neutral"] as const;

const BUTTON_SCHEMES = [
  "primary",
  "orange",
  "teal",
  "purple",
  "amber",
  "success",
  "error",
  "neutral",
] as const;

function Panel({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={
        (mode === "dark" ? "dark rst:bg-gray-950" : "rst:bg-white") +
        " rst:flex-1 rst:p-6 rst:flex rst:flex-col rst:gap-6"
      }
    >
      <p className="rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
        {mode} mode
      </p>

      <section className="rst:flex rst:flex-col rst:gap-2">
        <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
          Badge · solid
        </h3>
        <div className="rst:flex rst:flex-wrap rst:gap-4">
          {BADGE_VARIANTS.map((v) => (
            <Measured key={v} label={v}>
              <Badge variant={v} fill="solid" size="sm">
                Shipped
              </Badge>
            </Measured>
          ))}
        </div>
      </section>

      <section className="rst:flex rst:flex-col rst:gap-2">
        <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
          Pill · solid
        </h3>
        <div className="rst:flex rst:flex-wrap rst:gap-4">
          {PILL_SCHEMES.map((c) => (
            <Measured key={c} label={c}>
              <Pill colorScheme={c} variant="solid" size="sm">
                Shipped
              </Pill>
            </Measured>
          ))}
        </div>
      </section>

      <section className="rst:flex rst:flex-col rst:gap-2">
        <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
          Button · solid
        </h3>
        <div className="rst:flex rst:flex-wrap rst:gap-4">
          {BUTTON_SCHEMES.map((c) => (
            <Measured key={c} label={c}>
              <Button colorScheme={c} variant="solid" size="sm">
                Shipped
              </Button>
            </Measured>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "Foundations/Solid fill contrast",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Every solid fill, measured as painted. A solid variant picks its own background **and** its own foreground, so it is the one case where a component can fail contrast without any help from the consuming app.\n\nRatios are read from the rendered elements with `getComputedStyle`, not from the token file, so this reflects whatever palette is actually in play. **4.5:1** is WCAG AA for text at these sizes. Nothing here qualifies for the 3:1 large-text allowance \u2014 Badge runs 10-14px, Pill 12-14px, and Button's `lg` size changes only its height, not its 14px type.\n\nEleven pairings were previously below the line — solid teal at 2.49:1, solid info at 2.77:1. They were fixed by changing the foreground rather than the fill, which keeps the saturation and visual weight the solid variant exists for. The trade is that a near-black foreground assumes the fill stays light: a consumer who retints `--roster-teal-500` much darker gets a worse result than the `text-white` this replaced. That is what the live measurement above is for. `src/contrast.test.ts` fails the build if a new variant lands under the threshold.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EverySolidFill: Story = {
  render: () => (
    <div className="rst:flex rst:w-full rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800">
      <Panel mode="light" />
      <Panel mode="dark" />
    </div>
  ),
};
