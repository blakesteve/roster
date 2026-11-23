import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Button } from "./Button";
import { Button522 } from "../../../test/Button522";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A Button's label wraps when it can't fit, and a label that fits keeps
 * today's button to the pixel, measured as rendered in Chromium and WebKit
 * (tagged `real-input` for the project that runs both).
 *
 * - **One line keeps its footprint:** 105 cases, each beside the same case
 *   as 5.22 drew it (`src/test/Button522.tsx`) in the same page, engine and
 *   fonts, compared box, text and icons to 0.05px. Five variants by four
 *   sizes with text, a start icon, an end icon and loading; icon-only
 *   buttons; a Button beside a wrapping heading and beside a growing field in
 *   each size; full width; and apps' shapes, their own classes as inline
 *   styles, which win the way an app's layer above Roster's does. The heights
 *   are literals too, 28, 36, 40 and 44px and the 40px square, since a
 *   footprint compared with a twin would also pass if both moved. The one
 *   that moves is the post composer, 40 to 46px: its own 12px padding, which
 *   the fixed height clipped, now applies (approved). Compared again focused
 *   and disabled, all 105, and hovered by a real pointer, one of each variant
 *   (Chromium: WebKit's hover is the dev CSS's). A held press can't be read.
 * - **A long label wraps** at 320px and 200% text: a large label in a 288px
 *   column stays inside it, two lines, 128px. The twin spills past it. So
 *   does a pseudo-locale's label at 375px, at 100%. Two
 *   lines are 44, 56, 60 and 64px (`xs` 42 in WebKit, which lays its 15.9996px
 *   line at 15); a start icon and the spinner sit beside the first line, an
 *   end icon beside the last.
 * - **The floor:** beside a wrapping heading, a Button stays one line at 100%;
 *   without `min-width: fit-content` it wraps.
 * - **`singleLine`** stays one line at the size's height, cut with an
 *   ellipsis, inside its container; the twin spills. Text inside an element
 *   child, which the cut doesn't reach, still stays on one line.
 *
 * Positions and heights are read; widths of text are compared with the twin,
 * never pinned, since they're the platform's fonts.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Button/Wrap checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
const VARIANTS = ["solid", "soft", "outline", "ghost", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;
type Size = (typeof SIZES)[number];
const ONE_LINE: Record<Size, number> = { xs: 28, sm: 36, default: 40, lg: 44 };
const TWO_LINES: Record<Size, number> = { xs: 44, sm: 56, default: 60, lg: 64 };
/* WebKit lays a line at whole pixels, and `text-xs`'s line is 0.75rem times
   4/3, 15.9996px, so two `xs` lines are 15 each there: 42px, the same padding
   and border. One line is the size's fixed 28 in both. */
const twoLines = (size: Size) => (size === "xs" && !navigator.userAgent.includes("Chrome") ? 42 : TWO_LINES[size]);

const Icon = () => (
  <svg data-icon="" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" style={{ display: "block" }}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
  </svg>
);

type Content = "text" | "start" | "end" | "loading" | "icon";
type Case = {
  id: string;
  variant?: (typeof VARIANTS)[number];
  size?: Size | "icon";
  content: Content;
  label?: ReactNode;
  style?: CSSProperties;
  className?: string;
  container?: "heading" | "field" | "full";
};

/* The 105 one-line cases. */
const CASES: Case[] = [
  ...VARIANTS.flatMap((variant) =>
    SIZES.flatMap((size) => (["text", "start", "end", "loading"] as const).map((content) => ({ id: `${variant}-${size}-${content}`, variant, size, content }))),
  ),
  ...VARIANTS.map((variant) => ({ id: `${variant}-icon`, variant, size: "icon" as const, content: "icon" as const })),
  ...SIZES.map((size) => ({ id: `heading-${size}`, size, content: "text" as const, container: "heading" as const })),
  ...SIZES.map((size) => ({ id: `field-${size}`, size, content: "text" as const, container: "field" as const })),
  { id: "full-width", content: "text", className: "rst:w-full", container: "full" },
  /* Apps' shapes, from their own classes. */
  { id: "pill", variant: "soft", content: "start", style: { height: "auto", gap: 6, borderRadius: 9999, border: "1px solid", padding: "6px 14px" } },
  { id: "post-composer", variant: "outline", content: "text", container: "full", style: { width: "100%", justifyContent: "flex-start", borderRadius: 12, padding: "12px 16px", textAlign: "left" }, label: "Share something with the crew" },
  { id: "thread-action", variant: "ghost", size: "xs", content: "text", style: { padding: "0 4px", fontSize: 11, lineHeight: 1, height: "auto", minHeight: 0 }, label: "Reply" },
  { id: "reaction-chip", variant: "ghost", size: "xs", content: "text", style: { borderRadius: 9999, gap: 4 }, label: "🔥 3" },
  { id: "touch-picker", variant: "ghost", size: "xs", content: "text", style: { minHeight: 44 }, label: "Steam Deck" },
  { id: "child-icons", variant: "outline", content: "text", label: <>Open <Icon /></>, style: { gap: 6 } },
  { id: "dismiss-28", variant: "ghost", size: "icon", content: "icon", style: { height: 28, width: 28, borderRadius: 9999, border: 0, fontSize: 16, lineHeight: "24px" } },
  { id: "dismiss-24", variant: "ghost", size: "icon", content: "icon", style: { height: 24, width: 20, border: 0, fontSize: 16, lineHeight: "24px" } },
  { id: "icon-32", variant: "ghost", size: "icon", content: "icon", style: { height: 32, width: 32, marginTop: 4, flexShrink: 0 } },
  { id: "text-base", content: "text", style: { fontSize: 16, lineHeight: "24px" } },
  { id: "text-xs", content: "text", style: { fontSize: 12, lineHeight: "16px" } },
];

function Contents({ content, label }: { content: Content; label?: ReactNode }) {
  return content === "icon" ? <Icon /> : <>{label ?? "Save changes"}</>;
}

function OneOf({ which, c }: { which: "new" | "old"; c: Case }) {
  const props = {
    variant: c.variant,
    size: c.size,
    className: c.className,
    style: c.style,
    isLoading: c.content === "loading",
    startIcon: c.content === "start" ? <Icon /> : undefined,
    endIcon: c.content === "end" ? <Icon /> : undefined,
    "aria-label": c.content === "icon" ? "Dismiss" : undefined,
  };
  const button =
    which === "new" ? (
      <Button {...props}>
        <Contents content={c.content} label={c.label} />
      </Button>
    ) : (
      <Button522 {...props}>
        <Contents content={c.content} label={c.label} />
      </Button522>
    );
  if (c.container === "heading")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: 360 }}>
        <h3 style={{ flex: "1 1 auto", margin: 0, fontSize: 16 }}>A card heading long enough to wrap onto a second line</h3>
        {button}
      </div>
    );
  if (c.container === "field")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 360 }}>
        <input aria-label="Field" style={{ flex: "1 1 auto", minWidth: 0 }} />
        {button}
      </div>
    );
  if (c.container === "full") return <div style={{ width: 320 }}>{button}</div>;
  return <div>{button}</div>;
}

function Cases({ cases }: { cases: Case[] }) {
  return (
    <div style={{ display: "grid", gap: 8, padding: 16 }}>
      <style>{STILL}</style>
      {cases.map((c) => (
        <div key={c.id} data-case={c.id} style={{ display: "grid", gap: 4 }}>
          <div data-which="new">
            <OneOf which="new" c={c} />
          </div>
          <div data-which="old">
            <OneOf which="old" c={c} />
          </div>
        </div>
      ))}
    </div>
  );
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/* The text's line boxes, from the button's own text nodes. */
function lines(button: Element): DOMRect[] {
  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  const rects: DOMRect[] = [];
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    rects.push(...range.getClientRects());
  }
  /* One rect a line: merge those that share a line. */
  const merged: DOMRect[] = [];
  for (const rect of rects.sort((a, b) => a.top - b.top)) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.top - rect.top) < 2) {
      const left = Math.min(last.left, rect.left);
      const right = Math.max(last.right, rect.right);
      merged[merged.length - 1] = new DOMRect(left, Math.min(last.top, rect.top), right - left, Math.max(last.bottom, rect.bottom) - Math.min(last.top, rect.top));
    } else merged.push(rect);
  }
  return merged;
}

/** Box, text and icons, relative to the button. */
function footprint(button: HTMLElement) {
  const b = button.getBoundingClientRect();
  const rel = (r: DOMRect) => [r2(r.left - b.left), r2(r.top - b.top), r2(r.width), r2(r.height)];
  const text = lines(button);
  return {
    box: [r2(b.width), r2(b.height)],
    text: text.length ? rel(new DOMRect(Math.min(...text.map((t) => t.left)), text[0].top, Math.max(...text.map((t) => t.right)) - Math.min(...text.map((t) => t.left)), text[text.length - 1].bottom - text[0].top)) : [],
    /* Icons, and the spinner, which is a ring drawn on a div. */
    icons: [...button.querySelectorAll('svg, [role="status"]')].map((el) => rel(el.getBoundingClientRect())),
  };
}

const pair = (canvas: Element, id: string) => {
  const holder = canvas.querySelector(`[data-case="${id}"]`)!;
  return {
    now: holder.querySelector<HTMLElement>('[data-which="new"] button')!,
    then: holder.querySelector<HTMLElement>('[data-which="old"] button')!,
  };
};

/* Every number of `a` within `tol` of `b`'s. */
function within(a: ReturnType<typeof footprint>, b: ReturnType<typeof footprint>, tol: number) {
  const flat = (f: ReturnType<typeof footprint>) => [...f.box, ...f.text, ...f.icons.flat()];
  const x = flat(a);
  const y = flat(b);
  return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) <= tol);
}

export const OneLineKeepsItsFootprint: Story = {
  render: () => <Cases cases={CASES} />,
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    await expect(CASES).toHaveLength(105);
    const moved: Record<string, unknown> = {};
    const heights: string[] = [];
    for (const c of CASES) {
      const { now, then } = pair(canvasElement, c.id);
      const a = footprint(now);
      const b = footprint(then);
      if (c.id !== "post-composer" && !within(a, b, 0.05)) moved[c.id] = { now: a, then: b };
      /* One line, at 100%. */
      if (c.content !== "icon" && lines(now).length !== 1) heights.push(`${c.id}: ${lines(now).length} lines`);
      if (!c.style && c.size !== "icon" && a.box[1] !== ONE_LINE[(c.size ?? "default") as Size]) heights.push(`${c.id}: ${a.box[1]}px`);
      if (!c.style && c.size === "icon" && a.box.join() !== "40,40") heights.push(`${c.id}: ${a.box.join("x")}`);
    }
    console.info(`BUTTON FOOTPRINT moved: ${JSON.stringify(moved)}`);
    await expect(moved).toEqual({});
    await expect(heights).toEqual([]);

    /* The one that moves, as approved: its own 12px padding applies. */
    const composer = pair(canvasElement, "post-composer");
    await expect([r2(composer.now.getBoundingClientRect().height), r2(composer.then.getBoundingClientRect().height)]).toEqual([46, 40]);

    /* And in the other states it can be put in from here: focused, disabled,
       and under a real pointer for one of each variant. A held press can't
       be read. */
    const inStates: Record<string, unknown> = {};
    for (const c of CASES) {
      if (c.id === "post-composer") continue;
      const { now, then } = pair(canvasElement, c.id);
      now.focus();
      const focusedNow = footprint(now);
      then.focus();
      const focusedThen = footprint(then);
      then.blur();
      if (!within(focusedNow, focusedThen, 0.05)) inStates[`${c.id} focused`] = { now: focusedNow, then: focusedThen };
      now.setAttribute("disabled", "");
      then.setAttribute("disabled", "");
      const [a, b] = [footprint(now), footprint(then)];
      now.removeAttribute("disabled");
      then.removeAttribute("disabled");
      if (!within(a, b, 0.05)) inStates[`${c.id} disabled`] = { now: a, then: b };
    }
    const real = realInputOrSkip();
    if (real && navigator.userAgent.includes("Chrome")) {
      for (const variant of VARIANTS) {
        const id = `${variant}-default-text`;
        const read: ReturnType<typeof footprint>[] = [];
        for (const which of ["new", "old"]) {
          await real.commands.realHover(`[data-case="${id}"] [data-which="${which}"] button`);
          read.push(footprint(canvasElement.querySelector<HTMLElement>(`[data-case="${id}"] [data-which="${which}"] button`)!));
        }
        if (!within(read[0], read[1], 0.05)) inStates[`${id} hovered`] = { now: read[0], then: read[1] };
      }
    }
    console.info(`BUTTON FOOTPRINT in states: ${JSON.stringify(inStates)}`);
    await expect(inStates).toEqual({});
  },
};

/* Sets the page's text size for `run`: rem-based, as a browser's text size is. */
async function atTextSize(percent: number, run: () => Promise<void>) {
  const root = document.documentElement;
  const was = root.style.fontSize;
  root.style.fontSize = `${percent}%`;
  try {
    await new Promise((r) => requestAnimationFrame(r));
    await run();
  } finally {
    root.style.fontSize = was;
  }
}

const PSEUDO = "[Šåvé ýöûŕ çĥåñĝéš ţö ţĥé ŕöçķ çåƀîñéţ åñð ŝĥåŕé ţĥéɱ ŵîţĥ ýöûŕ çŕéŵ ñöŵ]";

export const ALongLabelWrapsInItsColumn: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <style>{STILL}</style>
      <div data-column="now" style={{ width: 288 }}>
        <Button size="lg">Open the book</Button>
      </div>
      <div data-column="then" style={{ width: 288 }}>
        <Button522 size="lg">Open the book</Button522>
      </div>
      <div data-column="start" style={{ width: 288 }}>
        <Button size="lg" startIcon={<Icon />}>Open the book</Button>
      </div>
      {/* A pseudo-locale's longer words, in a 375px phone's column. */}
      <div data-column="pseudo" style={{ width: 343 }}>
        <Button>{PSEUDO}</Button>
      </div>
      <div data-column="pseudo-then" style={{ width: 343 }}>
        <Button522>{PSEUDO}</Button522>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    await atTextSize(200, async () => {
      const read = (col: string) => {
        const column = canvasElement.querySelector(`[data-column="${col}"]`)!.getBoundingClientRect();
        const button = canvasElement.querySelector(`[data-column="${col}"] button`)!;
        const box = button.getBoundingClientRect();
        return { past: r2(Math.max(0, box.right - column.right, button.scrollWidth - button.clientWidth)), lines: lines(button).length, height: r2(box.height) };
      };
      const all = { now: read("now"), then: read("then"), start: read("start") };
      console.info(`BUTTON WRAP 288 at 200%: ${JSON.stringify(all)}`);
      await expect(all.now).toEqual({ past: 0, lines: 2, height: 128 });
      await expect(all.start.past).toBe(0);
      await expect(all.start.lines).toBe(2);
      /* The twin: one line, past its column. */
      await expect(all.then.lines).toBe(1);
      await expect(all.then.past).toBeGreaterThan(0);
    });
    /* The pseudo-locale at 100%, at 375px: wraps inside its column; 5.22's spills. */
    const box = (col: string) => {
      const column = canvasElement.querySelector(`[data-column="${col}"]`)!.getBoundingClientRect();
      const button = canvasElement.querySelector(`[data-column="${col}"] button`)!;
      return { past: r2(Math.max(0, button.getBoundingClientRect().right - column.right)), lines: lines(button).length };
    };
    const pseudo = { now: box("pseudo"), then: box("pseudo-then") };
    console.info(`BUTTON WRAP pseudo-locale at 375: ${JSON.stringify(pseudo)}`);
    await expect(pseudo.now.past).toBe(0);
    await expect(pseudo.now.lines).toBeGreaterThan(1);
    await expect(pseudo.then.past).toBeGreaterThan(0);
  },
};

/* A two-word label in a column three quarters of its one-line width: two lines,
   whatever the font. */
function TwoLines({ size, content }: { size: Size; content: "text" | "start" | "end" | "loading" }) {
  return (
    <div data-two={`${size}-${content}`} style={{ width: "max-content" }}>
      <Button
        size={size}
        variant="outline"
        isLoading={content === "loading"}
        startIcon={content === "start" ? <Icon /> : undefined}
        endIcon={content === "end" ? <Icon /> : undefined}
      >
        Wrapping wording
      </Button>
    </div>
  );
}

export const TwoLinesAndTheirIcons: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, padding: 16 }}>
      <style>{STILL}</style>
      {SIZES.flatMap((size) => (["text", "start", "end", "loading"] as const).map((content) => <TwoLines key={`${size}-${content}`} size={size} content={content} />))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const holders = [...canvasElement.querySelectorAll<HTMLElement>("[data-two]")];
    /* Narrow each column to three quarters of its button's one-line width. */
    for (const holder of holders) holder.style.width = `${holder.querySelector("button")!.getBoundingClientRect().width * 0.75}px`;
    await new Promise((r) => requestAnimationFrame(r));
    const off: string[] = [];
    const seen: Record<string, unknown> = {};
    for (const holder of holders) {
      const [size, content] = holder.dataset.two!.split("-") as [Size, string];
      const button = holder.querySelector("button")!;
      const ls = lines(button);
      const height = r2(button.getBoundingClientRect().height);
      seen[holder.dataset.two!] = { lines: ls.length, height };
      if (ls.length !== 2 || height !== twoLines(size)) off.push(`${holder.dataset.two}: ${ls.length} lines, ${height}px`);
      /* The icon beside its line: the first for a start icon and the spinner, the last for an end icon. */
      const icon = button.querySelector(content === "loading" ? '[role="status"]' : "svg")?.getBoundingClientRect();
      if (icon && ls.length === 2) {
        const line = content === "end" ? ls[1] : ls[0];
        const off_ = Math.abs(icon.top + icon.height / 2 - (line.top + line.height / 2));
        if (off_ > 0.75) off.push(`${holder.dataset.two}: the icon is ${r2(off_)}px off its line`);
      }
    }
    console.info(`BUTTON TWO LINES ${JSON.stringify(seen)}`);
    await expect(off).toEqual([]);
  },
};

export const TheFloorKeepsOneLineBesideAHeading: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, padding: 16 }}>
      <style>{STILL}</style>
      {SIZES.flatMap((size) =>
        [false, true].map((noFloor) => (
          <div key={`${size}-${noFloor}`} data-floor={`${size}-${noFloor ? "none" : "kept"}`} style={{ display: "flex", alignItems: "center", gap: 12, width: 280 }}>
            <h3 style={{ flex: "1 1 auto", margin: 0, fontSize: 16 }}>A card heading long enough to wrap onto a second line</h3>
            {/* The twin: the floor taken off with an inline style. */}
            <Button size={size} style={noFloor ? { minWidth: "auto" } : undefined}>
              Save changes
            </Button>
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const read: Record<string, number> = {};
    for (const row of canvasElement.querySelectorAll<HTMLElement>("[data-floor]")) read[row.dataset.floor!] = lines(row.querySelector("button")!).length;
    console.info(`BUTTON FLOOR ${JSON.stringify(read)}`);
    for (const size of SIZES) {
      await expect(read[`${size}-kept`], size).toBe(1);
      await expect(read[`${size}-none`], `${size}, no floor`).toBeGreaterThan(1);
    }
  },
};

export const SingleLineCutsWithAnEllipsis: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, padding: 16 }}>
      <style>{STILL}</style>
      <div data-single="now" style={{ width: 170 }}>
        <Button singleLine startIcon={<Icon />}>
          A label far too long for its column
        </Button>
      </div>
      <div data-single="then" style={{ width: 170 }}>
        <Button522 startIcon={<Icon />}>A label far too long for its column</Button522>
      </div>
      {/* Text the cut doesn't reach, inside an element child: the button's own
          `nowrap` keeps it on one line. */}
      <div data-single="fragment" style={{ width: 170 }}>
        <Button singleLine>
          <>
            A label far too long <Icon />
          </>
        </Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const read = () =>
      Object.fromEntries(
        ["now", "then"].map((k) => {
          const col = canvasElement.querySelector(`[data-single="${k}"]`)!.getBoundingClientRect();
          const button = canvasElement.querySelector<HTMLElement>(`[data-single="${k}"] button`)!;
          const cut = button.querySelector<HTMLElement>(".rst\\:truncate");
          return [
            k,
            {
              height: r2(button.getBoundingClientRect().height),
              past: r2(Math.max(0, button.getBoundingClientRect().right - col.right)),
              lines: lines(button).length,
              ellipsis: !!cut && getComputedStyle(cut).textOverflow === "ellipsis" && cut.scrollWidth > cut.clientWidth,
              name: button.textContent,
            },
          ];
        }),
      );
    const at100 = read();
    let at200: Record<string, unknown> = {};
    await atTextSize(200, async () => {
      at200 = read();
    });
    console.info(`BUTTON SINGLE LINE ${JSON.stringify({ at100, at200 })}`);
    const want = (height: number) => ({ height, past: 0, lines: 1, ellipsis: true, name: "A label far too long for its column" });
    await expect(at100.now).toEqual(want(40));
    await expect(at200.now).toEqual(want(80));
    /* The twin spills. */
    await expect((at100.then as { past: number }).past).toBeGreaterThan(0);
    /* Text in an element child stays on one line at the size's height. */
    const fragment = canvasElement.querySelector("[data-single=fragment] button")!;
    await expect([lines(fragment).length, r2(fragment.getBoundingClientRect().height)]).toEqual([1, 40]);
  },
};
