import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Avatar } from "../Avatar/Avatar";
import { Card } from "../Card/Card";
import { Spinner } from "../Spinner/Spinner";
import { Stat } from "../Stat/Stat";
import { Table, TableBody, TableCell, TableRow } from "../../organisms/Table/Table";
import { SkeletonAvatar, SkeletonCard, SkeletonStat, SkeletonTableRow } from "../../molecules/SkeletonPresets/SkeletonPresets";
import { Skeleton, SkeletonRegion } from "./Skeleton";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Skeleton's promise, checked in Chromium: content lands in the box its
 * skeleton held, so nothing moves. Each pair is measured after fonts load
 * and with no transition running (a skeleton animates its background, never
 * its box). Every expected value is a literal, each with a twin that must
 * come out differently.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Skeleton/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const q = <E extends Element = HTMLElement>(s: string) => document.querySelector<E>(s)!;
const box = (s: string) => {
  const r = q(s).getBoundingClientRect();
  return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
};

const TITLE = { margin: 0, fontSize: 16, lineHeight: "24px", fontWeight: 600 } as const;
const BODY = { margin: "8px 0 0", fontSize: 14, lineHeight: "20px" } as const;

export const ContentLandsAtTheSkeletonsSize: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "300px 300px", gap: 24, alignItems: "start" }}>
      <div data-pair="card-skeleton">
        <SkeletonCard media={140} lines={2} />
      </div>
      <div data-pair="card-content">
        <Card>
          <div style={{ height: 140, marginBottom: 16, borderRadius: 8, background: "#9bcce9" }} />
          <h3 style={TITLE}>Ridge loop</h3>
          <p style={BODY}>
            Clear to the saddle.
            <br />
            Mud past the second creek.
          </p>
        </Card>
      </div>

      <div data-pair="text-skeleton">
        <Skeleton lines={3} />
      </div>
      <p data-pair="text-content" style={{ ...BODY, margin: 0 }}>
        One.
        <br />
        Two.
        <br />
        Three.
      </p>

      <div data-pair="avatar-skeleton" style={{ width: "fit-content" }}>
        <SkeletonAvatar size="lg" />
      </div>
      <div data-pair="avatar-content" style={{ width: "fit-content" }}>
        <Avatar size="lg" initials="MK" />
      </div>

      <div data-pair="stat-skeleton" style={{ width: 160 }}>
        <SkeletonStat size="sm" semantics="standalone" />
      </div>
      <div data-pair="stat-content" style={{ width: 160 }}>
        <Stat size="sm" value="412" label="Entries this year" semantics="standalone" />
      </div>

      {/* Stat's default form, in a list, with and without its source line. */}
      <dl data-pair="statdl-skeleton" style={{ width: 160, margin: 0 }}>
        <SkeletonStat size="md" />
      </dl>
      <dl data-pair="statdl-content" style={{ width: 160, margin: 0 }}>
        <Stat size="md" value="412" label="Entries this year" />
      </dl>
      <dl data-pair="statsrc-skeleton" style={{ width: 160, margin: 0 }}>
        <SkeletonStat size="lg" source />
      </dl>
      <dl data-pair="statsrc-content" style={{ width: 160, margin: 0 }}>
        <Stat size="lg" value="412" label="Entries this year" source="trail log, 2026" />
      </dl>

      <div data-pair="row-skeleton">
        <Table>
          <TableBody>
            <SkeletonTableRow columns={3} />
          </TableBody>
        </Table>
      </div>
      <div data-pair="row-content">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Ridge loop</TableCell>
              <TableCell>8.4 mi</TableCell>
              <TableCell>1,900 ft</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* The twin: the placeholder people hand-roll, a 16px bar for a line of 20px text. */}
      <div data-pair="handrolled" style={{ height: 16, background: "#e7e5e4", borderRadius: 4 }} />
      <p data-pair="line-content" style={{ ...BODY, margin: 0 }}>
        One line.
      </p>
    </div>
  ),
  play: async () => {
    await document.fonts.ready;
    const pair = (name: string) => ({
      skeleton: box(`[data-pair="${name}-skeleton"] > *`),
      content: box(`[data-pair="${name}-content"] > *`),
    });
    for (const name of ["card", "avatar", "stat", "statdl", "statsrc"]) {
      const p = pair(name);
      await expect(p.skeleton, name).toEqual(p.content);
    }
    /* Text and rows: the same height (widths are the column's). */
    await expect(box('[data-pair="text-skeleton"] > *')[1]).toBe(box('[data-pair="text-content"]')[1]);
    await expect(box('[data-pair="text-skeleton"] > *')[1]).toBe(60);
    await expect(box('[data-pair="row-skeleton"] tr')[1]).toBe(box('[data-pair="row-content"] tr')[1]);
    /* The twin: the hand-rolled bar is 4px short of the line it stands for. */
    await expect([box('[data-pair="handrolled"]')[1], box('[data-pair="line-content"]')[1]]).toEqual([16, 20]);
  },
};

/* What the reader sees when data lands: the region keeps its box, and the
   thing below it doesn't move. */
function Swap({ spinner = false }: { spinner?: boolean }) {
  const [loading, setLoading] = useState(true);
  const content = (
    <Card>
      <h3 style={TITLE}>Ridge loop</h3>
      <p style={BODY}>
        Clear to the saddle.
        <br />
        Mud past the second creek.
      </p>
    </Card>
  );
  return (
    <div style={{ width: 300 }} data-swap={spinner ? "spinner" : "skeleton"}>
      {spinner ? (
        <div>{loading ? <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner /></div> : content}</div>
      ) : (
        <SkeletonRegion loading={loading} skeleton={<SkeletonCard lines={2} />} label="Loading the trail">
          {content}
        </SkeletonRegion>
      )}
      <p data-below="" style={{ margin: "12px 0 0" }}>
        Below the card
      </p>
      <button type="button" data-land="" onClick={() => setLoading(false)}>
        Land
      </button>
    </div>
  );
}

export const NothingMovesWhenDataLands: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <Swap />
      <Swap spinner />
    </div>
  ),
  play: async () => {
    await document.fonts.ready;
    const below = (kind: string) => Math.round(q(`[data-swap="${kind}"] [data-below]`).getBoundingClientRect().top);
    const before = { skeleton: below("skeleton"), spinner: below("spinner") };
    q<HTMLButtonElement>('[data-swap="skeleton"] [data-land]').click();
    q<HTMLButtonElement>('[data-swap="spinner"] [data-land]').click();
    await waitFor(() => expect(q('[data-swap="skeleton"] [data-skeleton-region]').getAttribute("data-skeleton-region")).toBe("ready"));
    /* The skeleton's page holds still; the spinner's (the twin) jumps. */
    await expect(below("skeleton") - before.skeleton).toBe(0);
    await expect(below("spinner") - before.spinner).not.toBe(0);
  },
};

export const TheShimmerStopsUnderReducedMotion: Story = {
  tags: ["reduced-motion"],
  render: () => (
    <div style={{ width: 300, display: "grid", gap: 8 }}>
      <div data-k="shimmer">
        <Skeleton shape="block" height={40} />
      </div>
      <div data-k="pulse">
        <Skeleton shape="block" height={40} animation="pulse" />
      </div>
    </div>
  ),
  play: async () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const read = (k: string) => {
      const style = getComputedStyle(q(`[data-k="${k}"] [data-skeleton="block"]`));
      return [style.animationName, style.backgroundColor, style.opacity];
    };
    /* Both hold still under reduced motion, on the token's fill (gray-200)
       at full strength. The twin is this story in the default project, where
       both move. */
    await expect([read("shimmer"), read("pulse")]).toEqual([
      [reduced ? "none" : "rst-shimmer", "rgb(231, 229, 228)", "1"],
      [reduced ? "none" : "rst-skeleton-pulse", "rgb(231, 229, 228)", "1"],
    ]);
  },
};

/* 5.9.0's Skeleton, as it rendered and computed: read from that release's own
   build, not this one. */
const SHIMMER_59 = {
  name: "rst-shimmer",
  duration: "1.8s",
  timing: "linear",
  count: "infinite",
  image: "linear-gradient(90deg, rgb(231, 229, 228) 42%, rgb(245, 245, 244) 50%, rgb(231, 229, 228) 58%)",
  size: "260%",
  repeat: "no-repeat",
  color: "rgb(231, 229, 228)",
  opacity: "1",
};
const animationOf = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    name: s.animationName,
    duration: s.animationDuration,
    timing: s.animationTimingFunction,
    count: s.animationIterationCount,
    image: s.backgroundImage,
    size: s.backgroundSize,
    repeat: s.backgroundRepeat,
    color: s.backgroundColor,
    opacity: s.opacity,
  };
};

export const APulseHoldsStillInForcedColors: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 300 }}>
      <Skeleton shape="block" height={40} animation="pulse" />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const block = q('[data-skeleton="block"]');
    const read = () => {
      const style = getComputedStyle(block);
      return [style.animationName, style.outlineStyle, style.opacity];
    };
    try {
      /* The fill is dropped, and the outline that stands in for it stays at
         full strength: the pulse stops rather than fade it. */
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(read()).toEqual(["none", "solid", "1"]));
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
    /* The twin: out of forced colors, it pulses. */
    await waitFor(() => expect(read()[0]).toBe("rst-skeleton-pulse"));
  },
};

export const TheDefaultIsTheShimmerItWas: Story = {
  render: () => (
    <div style={{ width: 300, display: "grid", gap: 8 }}>
      <div data-k="block">
        <Skeleton shape="block" height={40} />
      </div>
      <div data-k="line">
        <Skeleton />
      </div>
      <div data-k="circle">
        <Skeleton shape="circle" />
      </div>
      <div data-k="pulse">
        <Skeleton shape="block" height={40} animation="pulse" />
      </div>
    </div>
  ),
  play: async () => {
    const block = q('[data-k="block"] [data-skeleton="block"]');
    const bar = q('[data-k="line"] [data-skeleton="line"] span span');
    const circle = q('[data-k="circle"] [data-skeleton="circle"]');
    /* 5.9.0's classes, letter for letter, but for one: a block's corners are
       `rounded-skeleton`, which reads `--roster-skeleton-radius` and falls back
       to the `rounded-lg` they were, the same 8px. */
    await expect([block.className, bar.className, circle.className]).toEqual([
      "rst:block rst:w-full rst:rounded-skeleton rst:animate-skeleton rst:forced-colors:outline-solid rst:forced-colors:outline-1",
      "rst:absolute rst:inset-x-0 rst:top-1/2 rst:h-[0.7em] rst:-translate-y-1/2 rst:rounded-sm rst:animate-skeleton rst:forced-colors:outline-solid rst:forced-colors:outline-1",
      "rst:block rst:shrink-0 rst:rounded-full rst:border rst:border-transparent rst:h-10 rst:w-10 rst:animate-skeleton rst:forced-colors:outline-solid rst:forced-colors:outline-1",
    ]);
    await expect([animationOf(block), animationOf(circle), getComputedStyle(block).borderTopLeftRadius]).toEqual([SHIMMER_59, SHIMMER_59, "8px"]);
    /* The twin: a pulse isn't a shimmer. */
    await expect(animationOf(q('[data-k="pulse"] [data-skeleton="block"]'))).not.toEqual(SHIMMER_59);
  },
};

/* An animation held at a moment, so a frame can be read without timing it. */
const at = (el: HTMLElement, ms: number) => {
  const [animation] = el.getAnimations();
  animation.pause();
  animation.currentTime = ms;
  const style = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { opacity: style.opacity, position: style.backgroundPosition, box: [r.left, r.top, r.width, r.height].map(Math.round) };
};

export const APulseFadesAndNothingMoves: Story = {
  render: () => (
    <div style={{ width: 300, display: "grid", gap: 8 }}>
      <div data-k="pulse">
        <Skeleton shape="block" height={40} animation="pulse" />
      </div>
      <div data-k="shimmer">
        <Skeleton shape="block" height={40} />
      </div>
      {/* An app's own rhythm, through the hooks. */}
      <div data-k="tuned" style={{ "--roster-skeleton-pulse-duration": "1.6s", "--roster-skeleton-pulse-opacity": "0.3" } as CSSProperties}>
        <Skeleton shape="block" height={40} animation="pulse" />
      </div>
      <div data-k="none">
        <Skeleton shape="block" height={40} animation="none" />
      </div>
    </div>
  ),
  play: async () => {
    const el = (k: string) => q(`[data-k="${k}"] [data-skeleton="block"]`);
    const pulse = el("pulse");
    await expect([getComputedStyle(pulse).animationName, getComputedStyle(pulse).animationDuration, getComputedStyle(pulse).backgroundImage]).toEqual([
      "rst-skeleton-pulse",
      "2s",
      "none",
    ]);
    /* A breath: full at the start, half at the middle, and the box and the
       fill's position the same throughout. */
    await expect([at(pulse, 0), at(pulse, 1000)]).toEqual([
      { opacity: "1", position: "0% 0%", box: at(pulse, 0).box },
      { opacity: "0.5", position: "0% 0%", box: at(pulse, 0).box },
    ]);
    /* The twin: the shimmer moves its highlight and keeps its opacity. */
    const shimmer = el("shimmer");
    const [early, late] = [at(shimmer, 200), at(shimmer, 600)];
    await expect([early.opacity, late.opacity, early.position === late.position]).toEqual(["1", "1", false]);
    /* The hooks: 1.6s, down to 0.3 at the middle. */
    const tuned = el("tuned");
    await expect([getComputedStyle(tuned).animationDuration, at(tuned, 800).opacity]).toEqual(["1.6s", "0.3"]);
    /* None holds still on the fill. */
    await expect([getComputedStyle(el("none")).animationName, getComputedStyle(el("none")).backgroundColor]).toEqual(["none", "rgb(231, 229, 228)"]);
  },
};

export const TheRadiusTokenRoundsBlocksAndNothingElse: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "260px 260px", gap: 24, alignItems: "start" }}>
      <div data-zone="token" style={{ "--roster-skeleton-radius": "14px", display: "grid", gap: 8 } as CSSProperties}>
        <div data-k="block">
          <Skeleton shape="block" height={40} />
        </div>
        <div data-k="prop">
          <Skeleton shape="block" height={40} radius="sm" />
        </div>
        <div data-k="line">
          <Skeleton />
        </div>
        <div data-k="circle">
          <Skeleton shape="circle" />
        </div>
        <div data-k="preset">
          <SkeletonCard media={60} lines={1} />
        </div>
        <div data-k="card">
          <Card>A card beside them</Card>
        </div>
      </div>
      <div data-zone="plain" style={{ display: "grid", gap: 8 }}>
        <div data-k="block">
          <Skeleton shape="block" height={40} />
        </div>
        <div data-k="circle">
          <Skeleton shape="circle" />
        </div>
        <div data-k="card">
          <Card>A card beside them</Card>
        </div>
      </div>
    </div>
  ),
  play: async () => {
    const radius = (zone: string, selector: string) => getComputedStyle(q(`[data-zone="${zone}"] ${selector}`)).borderTopLeftRadius;
    const read = () => ({
      block: radius("token", '[data-k="block"] [data-skeleton="block"]'),
      prop: radius("token", '[data-k="prop"] [data-skeleton="block"]'),
      line: radius("token", '[data-k="line"] [data-skeleton="line"] span span'),
      circle: radius("token", '[data-k="circle"] [data-skeleton="circle"]'),
      presetMedia: radius("token", '[data-k="preset"] [data-skeleton="block"]'),
      presetCard: radius("token", '[data-k="preset"] [data-skeleton="card"]'),
      card: radius("token", '[data-k="card"] > *'),
      plainBlock: radius("plain", '[data-k="block"] [data-skeleton="block"]'),
      plainCircle: radius("plain", '[data-k="circle"] [data-skeleton="circle"]'),
      plainCard: radius("plain", '[data-k="card"] > *'),
    });
    /* Set on a wrapper: its blocks, the preset's media block among them, take
       14px. The `radius` prop still wins, a line keeps its small step, a
       circle stays round, and the cards keep the shared scale's corners. The
       twin: a block outside the wrapper is the 8px it was. */
    const wrapper = read();
    await expect(wrapper).toEqual({
      block: "14px",
      prop: "4px",
      line: "4px",
      circle: wrapper.plainCircle,
      presetMedia: "14px",
      presetCard: wrapper.plainCard,
      card: wrapper.plainCard,
      plainBlock: "8px",
      plainCircle: wrapper.plainCircle,
      plainCard: wrapper.plainCard,
    });
    await expect([wrapper.plainCard === "14px", wrapper.plainCircle === "14px"]).toEqual([false, false]);
    /* Unset, a block still follows the shared scale's lg step, as it did. */
    document.documentElement.style.setProperty("--roster-radius-lg", "10px");
    try {
      await expect([read().plainBlock, read().block]).toEqual(["10px", "14px"]);
    } finally {
      document.documentElement.style.removeProperty("--roster-radius-lg");
    }
    /* Set on :root, it reaches every block; the wrapper's own value still wins
       inside it. */
    document.documentElement.style.setProperty("--roster-skeleton-radius", "20px");
    try {
      const root = read();
      await expect([root.plainBlock, root.block, root.plainCard, root.plainCircle]).toEqual(["20px", "14px", wrapper.plainCard, wrapper.plainCircle]);
    } finally {
      document.documentElement.style.removeProperty("--roster-skeleton-radius");
    }
  },
};

export const ARegionIsBusyAndItsSkeletonIsHidden: Story = {
  tags: ["ax-tree"],
  render: () => {
    function Region() {
      const [loading, setLoading] = useState(true);
      return (
        <>
          <SkeletonRegion loading={loading} skeleton={<SkeletonCard lines={2} />} label="Loading the trail">
            <p>Ridge loop</p>
          </SkeletonRegion>
          <button type="button" data-land="" onClick={() => setLoading(false)}>
            Land
          </button>
        </>
      );
    }
    return <Region />;
  },
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const probe = async (selectors: string[]) => real.commands.axStates(selectors);
    q("[data-skeleton-region]").setAttribute("data-ax-probe", "region");
    q('[data-skeleton="card"]').setAttribute("data-ax-probe", "card");
    const loading = await probe(['[data-ax-probe="region"]', '[data-ax-probe="card"]']);
    await expect(loading.map((s) => [s.busy, s.ignored])).toEqual([
      [true, false],
      [false, true],
    ]);
    await waitFor(() => expect(q("[data-skeleton-status]").textContent).toBe("Loading the trail"));
    /* The twin: landed, it isn't busy. */
    q<HTMLButtonElement>("[data-land]").click();
    await waitFor(() => expect(q("[data-skeleton-region]").getAttribute("data-skeleton-region")).toBe("ready"));
    const ready = await probe(['[data-ax-probe="region"]']);
    await expect(ready[0].busy).toBe(false);
  },
};
