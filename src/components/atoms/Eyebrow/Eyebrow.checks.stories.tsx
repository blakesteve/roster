import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Eyebrow } from "./Eyebrow";
import { LabeledDivider } from "../LabeledDivider/LabeledDivider";
import { Stat } from "../Stat/Stat";
import { SkeletonStat } from "../../molecules/SkeletonPresets/SkeletonPresets";
import { cn } from "../../../lib/utils";

/**
 * Eyebrow's line, measured in Chromium and WebKit (tagged `real-input` for
 * the project that runs both; nothing here takes input).
 *
 * One line takes its size, 10, 11 and 12px for xs, sm and md, as a flex item
 * and as a block, and sits on its parent's line inline. A label of words that
 * wraps has its lines 14, 15 and 16px apart. Every expected figure is a
 * literal, written from the requirement.
 *
 * The twins: an Eyebrow holding an element, which keeps the 1em line every
 * Eyebrow had through 5.19 and must show the old figures; a naive fix, the
 * line height without the margins, which must grow the one-line box; and the
 * class order 5.7.0 wrote, which lost the line height to tailwind-merge.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Eyebrow/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = ["xs", "sm", "md"] as const;
/* Two lines at every size in a 110px column: "Weeks since" fits, with 15px
   to spare at md, and "release" doesn't join it. */
const LONG = "Weeks since release";

const rect = (el: Element) => el.getBoundingClientRect();
const round = (n: number) => Math.round(n * 100) / 100;
const height = (root: HTMLElement, selector: string) => round(rect(root.querySelector(selector)!).height);
/* The space an element takes in its column: the distance between the spacers
   either side of it, so its margins count and its painted box doesn't. */
const footprint = (root: HTMLElement, selector: string) => {
  const holder = root.querySelector(selector)!;
  const [before, after] = [holder.firstElementChild!, holder.lastElementChild!];
  return round(rect(after).top - rect(before).bottom);
};
/* The tops of an element's lines of text, from the text itself. */
const lineTops = (el: Element) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return [...new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => round(r.top)))];
};
const pitch = (root: HTMLElement, selector: string) => {
  const tops = lineTops(root.querySelector(selector)!);
  return tops.length === 2 ? round(tops[1] - tops[0]) : `${tops.length} lines`;
};
const spacer = <div style={{ height: 5 }} />;

/* Each Eyebrow between two spacers, in a flex column (a flex item makes its
   own line) and in a flow-root (a block). */
function Stacked({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <>
      <div data-k={`${id}-flex`} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {spacer}
        {children}
        {spacer}
      </div>
      <div data-k={`${id}-block`} style={{ display: "flow-root" }}>
        {spacer}
        {children}
        {spacer}
      </div>
    </>
  );
}

export const OneLineTakesItsSize: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.5, width: 400 }}>
      {SIZES.map((s) => (
        <div key={s}>
          <Stacked id={`words-${s}`}>
            <Eyebrow size={s} as="p">Projects</Eyebrow>
          </Stacked>
          <Stacked id={`span-${s}`}>
            <Eyebrow size={s} style={{ display: "block" }}>Projects</Eyebrow>
          </Stacked>
          {/* Twin: the old line, an Eyebrow holding an element. */}
          <Stacked id={`element-${s}`}>
            <Eyebrow size={s} as="p">
              <span>Projects</span>
            </Eyebrow>
          </Stacked>
          {/* Twin: a naive fix, the line height without the margins (an
              inline style: a class here would ship in roster.css). */}
          <Stacked id={`naive-${s}`}>
            <Eyebrow size={s} as="p" style={{ marginBlock: 0 }}>Projects</Eyebrow>
          </Stacked>
        </div>
      ))}
      {/* Twin: 5.7.0's order, line height before size, in a flex column. */}
      <div data-k="old" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {spacer}
        <span className={cn("rst:font-mono rst:uppercase rst:leading-none", "rst:text-[0.625rem] rst:tracking-[0.16em]")}>Projects</span>
        {spacer}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const each = (id: string, form: string) => SIZES.map((s) => footprint(canvasElement, `[data-k="${id}-${s}-${form}"]`));
    for (const form of ["flex", "block"]) {
      await expect(each("words", form)).toEqual([10, 11, 12]);
      await expect(each("span", form)).toEqual([10, 11, 12]);
      await expect(each("element", form)).toEqual([10, 11, 12]);
      await expect(each("naive", form)).toEqual([14, 15, 16]);
    }
    /* Its letters sit where the old line put them, to the pixel. */
    for (const s of SIZES) {
      const top = (id: string) => {
        const holder = canvasElement.querySelector(`[data-k="${id}-${s}-flex"]`)!;
        return round(lineTops(holder.children[1])[0] - rect(holder).top);
      };
      await expect(top("words")).toBe(top("element"));
    }
    await expect(footprint(canvasElement, '[data-k="old"]')).toBe(15);
  },
};

export const AnEmptyEyebrowTakesNothing: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <div data-k="empty-flex" style={{ display: "flex", flexDirection: "column" }}>
        {spacer}
        <Eyebrow>{""}</Eyebrow>
        {spacer}
      </div>
      <div data-k="blank-flex" style={{ display: "flex", flexDirection: "column" }}>
        {spacer}
        <Eyebrow>{" "}</Eyebrow>
        {spacer}
      </div>
      <div data-k="empty-block" style={{ display: "flow-root" }}>
        {spacer}
        <Eyebrow as="p">{""}</Eyebrow>
        {spacer}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* No line, so no margins: a label that hasn't arrived doesn't pull its
       neighbors in. */
    await expect(["empty-flex", "blank-flex", "empty-block"].map((k) => footprint(canvasElement, `[data-k="${k}"]`))).toEqual([0, 0, 0]);
  },
};

export const BetweenMarginsItTakesItsSize: Story = {
  render: () => (
    /* Paragraph margins either side collapse with the Eyebrow's own. */
    <div style={{ width: 400 }}>
      {SIZES.map((s) => (
        <div key={s} data-k={`collapse-${s}`}>
          <p style={{ margin: "0 0 16px" }}>Above</p>
          <Eyebrow size={s} as="p">Projects</Eyebrow>
          <p style={{ margin: "8px 0 0" }}>Below</p>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gaps = SIZES.map((s) => {
      const ps = canvasElement.querySelectorAll(`[data-k="collapse-${s}"] p`);
      return round(rect(ps[2]).top - rect(ps[0]).bottom);
    });
    /* 16, the size, and 8: what the line took at `leading-none`. */
    await expect(gaps).toEqual([34, 35, 36]);
  },
};

export const InlineItSitsOnItsParentsLine: Story = {
  render: () => (
    <div style={{ lineHeight: "24px", fontSize: 16 }}>
      {SIZES.map((s) => (
        <div key={s} data-line={s}>
          Read <Eyebrow size={s}>Projects</Eyebrow> here
        </div>
      ))}
      <div data-line="without">Read Projects here</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* Inline in running text, its line is the parent's. The control is the
       same line with no Eyebrow in it; the twin that must differ is the
       naive fix above. */
    await expect([...SIZES, "without"].map((s) => height(canvasElement, `[data-line="${s}"]`))).toEqual([24, 24, 24, 24]);
  },
};

export const WrappedLinesHaveAir: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", lineHeight: 1.5 }}>
      {SIZES.map((s) => (
        <div key={s} style={{ display: "flex", flexDirection: "column", gap: 16, width: 110 }}>
          <Stacked id={`two-${s}`}>
            <Eyebrow size={s} as="p">{LONG}</Eyebrow>
          </Stacked>
          {/* Words and a number, as `{count} weeks` renders. */}
          <Eyebrow size={s} as="p" data-k={`mixed-${s}`} style={{ marginBlock: 0 }}>
            Weeks since release {2}
          </Eyebrow>
          {/* Twin: the old line, an Eyebrow holding an element. */}
          <Eyebrow size={s} data-k={`element-${s}`}>
            <span>{LONG}</span>
          </Eyebrow>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const each = (id: string) => SIZES.map((s) => pitch(canvasElement, `[data-k="${id}-${s}"]`));
    const lines = (form: string) => SIZES.map((s) => pitch(canvasElement, `[data-k="two-${s}-${form}"] > :nth-child(2)`));
    await expect(lines("flex")).toEqual([14, 15, 16]);
    await expect(lines("block")).toEqual([14, 15, 16]);
    await expect(each("mixed")).toEqual([14, 15, 16]);
    /* Two lines take one line's size and one more line: 10 + 14, 11 + 15,
       12 + 16. */
    const taken = (form: string) => SIZES.map((s) => footprint(canvasElement, `[data-k="two-${s}-${form}"]`));
    await expect(taken("flex")).toEqual([24, 26, 28]);
    await expect(taken("block")).toEqual([24, 26, 28]);
    await expect(each("element")).toEqual([10, 11, 12]);
  },
};

export const AWrappedStatLabelHasAir: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", lineHeight: 1.5 }}>
      <dl data-k="one" style={{ margin: 0 }}>
        <Stat size="sm" value="2,500" label="Sheets" />
      </dl>
      <dl data-k="two" style={{ margin: 0, width: 100 }}>
        <Stat size="sm" value="2,500" label="Weeks since release" />
      </dl>
      <div data-k="two-standalone" style={{ width: 100 }}>
        <Stat size="sm" semantics="standalone" value="2,500" label="Weeks since release" />
      </div>
      {/* Twin: a label holding an element keeps the old line. */}
      <dl data-k="element" style={{ margin: 0, width: 100 }}>
        <Stat size="sm" value="2,500" label={<span>Weeks since release</span>} />
      </dl>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const label = (k: string) => canvasElement.querySelector(`[data-k="${k}"] .rst\\:font-mono`)!;
    const labelPitch = (k: string) => {
      const tops = lineTops(label(k));
      return tops.length === 2 ? round(tops[1] - tops[0]) : `${tops.length} lines`;
    };
    await expect(height(canvasElement, '[data-k="one"] > div')).toBe(33);
    await expect(labelPitch("two")).toBe(14);
    await expect(labelPitch("two-standalone")).toBe(14);
    await expect(height(canvasElement, '[data-k="two"] dt')).toBe(24);
    await expect(height(canvasElement, '[data-k="two"] > div')).toBe(47);
    await expect(height(canvasElement, '[data-k="two-standalone"] > div')).toBe(47);
    await expect(labelPitch("element")).toBe(10);
    await expect(height(canvasElement, '[data-k="element"] > div')).toBe(43);
  },
};

export const AWrappedStatSourceHasAir: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", lineHeight: 1.5 }}>
      <dl data-k="one" style={{ margin: 0 }}>
        <Stat size="sm" value="2,500" label="Sheets" source="a sample" />
      </dl>
      <dl data-k="two" style={{ margin: 0, width: 80 }}>
        <Stat size="sm" value="2,500" label="Sheets" source="a sample, not a count" />
      </dl>
      <div data-k="two-standalone" style={{ width: 80 }}>
        <Stat size="sm" semantics="standalone" value="2,500" label="Sheets" source="a sample, not a count" />
      </div>
      {/* Twins: a source holding an element keeps the old line. */}
      <dl data-k="element-one" style={{ margin: 0 }}>
        <Stat size="sm" value="2,500" label="Sheets" source={<span>a sample</span>} />
      </dl>
      <dl data-k="element" style={{ margin: 0, width: 80 }}>
        <Stat size="sm" value="2,500" label="Sheets" source={<span>a sample, not a count</span>} />
      </dl>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* The source is 8.5px, which WebKit draws on a line of 8 and Chromium on
       8.5, so these figures are each engine's: 12 and 12.5 between lines. */
    const webkit = !navigator.userAgent.includes("Chrome");
    const source = (k: string) => canvasElement.querySelector(`[data-k="${k}"] .rst\\:text-\\[0\\.53125rem\\]`)!;
    const sourcePitch = (k: string) => {
      const tops = lineTops(source(k));
      return tops.length === 2 ? round(tops[1] - tops[0]) : `${tops.length} lines`;
    };
    const stat = (k: string) => height(canvasElement, `[data-k="${k}"] > *`);
    await expect(stat("one")).toBe(webkit ? 44 : 44.5);
    await expect(sourcePitch("two")).toBe(webkit ? 12 : 12.5);
    await expect(sourcePitch("two-standalone")).toBe(webkit ? 12 : 12.5);
    await expect(stat("two")).toBe(webkit ? 56 : 57);
    await expect(sourcePitch("element")).toBe(webkit ? 8 : 8.5);
    await expect(stat("element")).toBe(webkit ? 52 : 53);
    /* One line's letters sit where the old line put them. */
    const glyphTop = (k: string) => round(lineTops(source(k))[0] - rect(canvasElement.querySelector(`[data-k="${k}"] > *`)!).top);
    await expect(glyphTop("one")).toBe(glyphTop("element-one"));
  },
};

export const ANestedEyebrowKeepsItsLine: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 400, lineHeight: 1.5 }}>
      <LabeledDivider data-k="words" label="Where you differed" />
      <LabeledDivider data-k="nested" label={<Eyebrow tone="faint">Where you differed</Eyebrow>} />
      <LabeledDivider
        data-k="heading"
        label={
          <h2 style={{ margin: 0 }}>
            <Eyebrow tone="faint">Open to join</Eyebrow>
          </h2>
        }
      />
      <Eyebrow data-k="outer">
        Weeks <Eyebrow tone="primary">since</Eyebrow> release
      </Eyebrow>
      {/* Twin: the same Eyebrow in a 1em line that isn't an Eyebrow's,
          which it grows, as a nested one would without the rule. */}
      <span data-k="tight" style={{ display: "flex", fontSize: 10, lineHeight: 1 }}>
        <span>
          <Eyebrow tone="faint">Where you differed</Eyebrow>
        </span>
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(["words", "nested", "heading", "outer"].map((k) => height(canvasElement, `[data-k="${k}"]`))).toEqual([10, 10, 10, 10]);
    await expect(height(canvasElement, '[data-k="tight"]')).toBe(14);
  },
};

export const SkeletonStatStillMatchesStat: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", lineHeight: 1.5 }}>
      <dl data-k="real" style={{ margin: 0 }}>
        <Stat size="sm" value="412" label="Entries this year" />
      </dl>
      <div data-k="skeleton">
        <SkeletonStat size="sm" />
      </div>
      <dl data-k="real-source" style={{ margin: 0 }}>
        <Stat size="sm" value="412" label="Entries this year" source="trail log, 2026" />
      </dl>
      <div data-k="skeleton-source">
        <SkeletonStat size="sm" source />
      </div>
      <div data-k="real-standalone">
        <Stat size="sm" semantics="standalone" value="412" label="Entries this year" />
      </div>
      <div data-k="skeleton-standalone">
        <SkeletonStat size="sm" semantics="standalone" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = (k: string) => height(canvasElement, `[data-k="${k}"] > *`);
    await expect([box("real"), box("skeleton"), box("real-standalone"), box("skeleton-standalone")]).toEqual([33, 33, 33, 33]);
    /* The source line is 8.5px, drawn at 8 in WebKit, so this pair is
       compared rather than pinned; Stat's own checks pin it in Chromium. */
    await expect(box("skeleton-source")).toBe(box("real-source"));
  },
};

export const WhatStillMoves: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.5, width: 400 }}>
      {SIZES.map((s) => (
        <div key={s}>
          {/* A painted box: a link's, as its focus ring would draw it. */}
          <div style={{ display: "flex" }}>
            <Eyebrow size={s} as="a" href="#" data-k={`link-${s}`}>
              Projects
            </Eyebrow>
          </div>
          {/* A margin of the page's own on one side replaces Roster's there:
              an inline style stands in for a host utility class, which sits
              in a layer above Roster's. */}
          <div data-k={`margin-${s}`} style={{ display: "flow-root" }}>
            {spacer}
            <Eyebrow size={s} as="p" style={{ marginBottom: 8 }}>Projects</Eyebrow>
            {spacer}
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(SIZES.map((s) => height(canvasElement, `[data-k="link-${s}"]`))).toEqual([14, 15, 16]);
    /* The size, the 8px margin, and the half of the line's extra height
       that Roster's own bottom margin took back: 2px at every size. */
    await expect(SIZES.map((s) => footprint(canvasElement, `[data-k="margin-${s}"]`))).toEqual([20, 21, 22]);
  },
};

export const ABrowserWithoutRoundOrLhKeepsTheOldLine: Story = {
  render: () => <Eyebrow data-k="probe">Projects</Eyebrow>,
  play: async () => {
    /* The taller line is set only under `@supports` for `round()` and `lh`.
       Without them, `leading-none` stands and the margins are 0 (or, with no
       `lh`, dropped). Read
       from the stylesheet, since every browser that runs this has it. */
    const guarded: string[] = [];
    const bare: string[] = [];
    /* Every rule, through layers, @supports and nesting, noting the
       @supports it sits in. */
    const walk = (rules: CSSRuleList, condition: string | null) => {
      for (const rule of rules) {
        const style = (rule as CSSStyleRule).style as CSSStyleDeclaration | undefined;
        if (style?.lineHeight.includes("--rst-eyebrow-leading")) {
          (condition ? guarded : bare).push(`${condition ?? ""} ${style.lineHeight}`.trim());
        }
        const inner = (rule as CSSGroupingRule).cssRules as CSSRuleList | undefined;
        if (inner) walk(inner, rule instanceof CSSSupportsRule ? rule.conditionText : condition);
      }
    };
    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules, null);
      } catch {
        /* A cross-origin sheet: not Roster's. */
      }
    }
    await expect(bare).toEqual([]);
    await expect(guarded.length).toBeGreaterThan(0);
    for (const rule of guarded) {
      const flat = rule.replace(/\s+/g, "");
      await expect(flat).toContain("(line-height:round(1em,1px))");
      await expect(flat).toContain("(margin:1lh)");
    }
  },
};
