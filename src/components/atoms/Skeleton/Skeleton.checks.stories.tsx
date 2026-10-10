import { useState } from "react";
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
    <div style={{ width: 300 }}>
      <Skeleton shape="block" height={40} />
    </div>
  ),
  play: async () => {
    const style = getComputedStyle(q('[data-skeleton="block"]'));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Moving or not, the resting fill is the token's: gray-200. */
    await expect([style.animationName, style.backgroundColor]).toEqual([reduced ? "none" : "rst-shimmer", "rgb(231, 229, 228)"]);
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
