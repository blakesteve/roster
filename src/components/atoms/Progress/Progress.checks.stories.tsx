import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Progress, type ProgressStatus } from "./Progress";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Progress's promises, checked in Chromium: the contrast its fills keep, the
 * status a screen reader hears and how often, its motion, and its shape.
 * Expected values are literals from the requirement, each with a twin.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Progress/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const q = <E extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<E>(s)!;

/* WCAG's relative luminance and contrast, from computed rgb() colors. */
const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const lum = (c: string) =>
  rgb(c)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

const STATUSES: ProgressStatus[] = ["default", "success", "warning", "error"];

export const EveryFillClearsThreeToOne: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {[
        { theme: "light", page: "#ffffff" },
        { theme: "dark", page: "#1c1917" },
      ].map(({ theme, page }) => (
        <div key={theme} className={theme === "dark" ? "dark" : undefined} data-theme-test={theme} data-page={page} style={{ background: page, padding: 16, display: "grid", gap: 8 }}>
          {STATUSES.map((s) => (
            <Progress key={s} value={50} status={s} label={s} />
          ))}
          <Progress variant="segmented" segments={["done", "current", "remaining"]} />
        </div>
      ))}
      {/* The twin: a hand-rolled bar on dark glass, its track a 25% white. */}
      <div data-glass="" style={{ background: "#071016", padding: 16 }}>
        <div data-alpha-track="" style={{ height: 10, borderRadius: 9999, background: "rgba(255,255,255,0.25)" }} />
      </div>
    </div>
  ),
  play: async () => {
    const measured = ["light", "dark"].flatMap((theme) => {
      const root = q(`[data-theme-test="${theme}"]`);
      const page = getComputedStyle(root).backgroundColor;
      return [...root.querySelectorAll<HTMLElement>('[data-progress="continuous"]')].map((p) => {
        const fill = getComputedStyle(q("[data-progress-fill]", p)).backgroundColor;
        const track = getComputedStyle(q("[data-progress-track]", p)).backgroundColor;
        return { theme, status: p.dataset.status, againstTrack: contrast(fill, track), againstPage: contrast(fill, page) };
      });
    });
    /* Done against not yet, and the fill against the page: 3:1 or better, everywhere. */
    await expect(measured.filter((m) => m.againstTrack < 3 || m.againstPage < 3)).toEqual([]);
    await expect(measured).toHaveLength(8);
    /* The twin: the translucent track, composited over the glass it sits on as
       the browser paints it, doesn't stand off the glass. */
    const glass = getComputedStyle(q("[data-glass]")).backgroundColor;
    const [r, g, b, a] = (getComputedStyle(q("[data-alpha-track]")).backgroundColor.match(/[\d.]+/g) ?? []).map(Number);
    const under = rgb(glass);
    const painted = `rgb(${[r, g, b].map((c, i) => Math.round(c * a + under[i] * (1 - a))).join(", ")})`;
    await expect(contrast(painted, glass) < 3).toBe(true);
    /* And the current segment's border clears 3:1 against the track it rings, in both themes. */
    const currentPairs = [...document.querySelectorAll<HTMLElement>("[data-theme-test] [data-segment=current]")].map((cell) => {
      const st = getComputedStyle(cell);
      return contrast(st.borderTopColor, st.backgroundColor) >= 3;
    });
    await expect(currentPairs).toEqual([true, true]);
  },
};

export const TheStatusSaysTheValueAndWaitsBetween: Story = {
  render: () => {
    function Rising() {
      const [value, setValue] = useState(10);
      return (
        <>
          <Progress value={value} label="Copying" />
          <button type="button" data-step="" onClick={() => setValue((v) => Math.min(100, v + 10))}>
            Step
          </button>
          <button type="button" data-finish="" onClick={() => setValue(100)}>
            Finish
          </button>
        </>
      );
    }
    return <Rising />;
  },
  play: async () => {
    const said = () => q("[data-progress-status]").textContent;
    await expect(said()).toBe("Copying: 10%");
    q<HTMLButtonElement>("[data-step]").click();
    await waitFor(() => expect(said()).toBe("Copying: 20%"));
    /* Two more steps at once: the region waits out its 1.5 seconds and then says the latest. */
    q<HTMLButtonElement>("[data-step]").click();
    q<HTMLButtonElement>("[data-step]").click();
    await new Promise((r) => setTimeout(r, 300));
    await expect(said()).toBe("Copying: 20%");
    await waitFor(() => expect(said()).toBe("Copying: 40%"), { timeout: 2500 });
    /* The end goes at once. */
    q<HTMLButtonElement>("[data-finish]").click();
    await waitFor(() => expect(said()).toBe("Copying: 100%"), { timeout: 200 });
  },
};

export const MotionStopsUnderReducedMotion: Story = {
  tags: ["reduced-motion"],
  render: () => (
    <div style={{ width: 300, display: "grid", gap: 12 }}>
      <div data-case="indeterminate">
        <Progress />
      </div>
      <div data-case="busy">
        <Progress value={100} busy />
      </div>
      <div data-case="still">
        <Progress value={40} />
      </div>
    </div>
  ),
  play: async () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pill = q('[data-case="indeterminate"] [data-progress-fill]');
    const track = (c: string) => getComputedStyle(q(`[data-case="${c}"] [data-progress-track]`));
    await expect([getComputedStyle(pill).animationName, track("busy").animationName]).toEqual(
      reduced ? ["none", "none"] : ["rst-progress-travel", "pulse"],
    );
    if (reduced) {
      /* At rest in the middle, 35% to 65%, where no determinate bar starts. */
      const t = q('[data-case="indeterminate"] [data-progress-track]').getBoundingClientRect();
      const p = pill.getBoundingClientRect();
      await expect([Math.round(((p.left - t.left) / t.width) * 100), Math.round(((p.right - t.left) / t.width) * 100)]).toEqual([35, 65]);
    }
    /* The twin: a bar with a value doesn't move in either mode. */
    await expect(track("still").animationName).toBe("none");
  },
};

export const ALowValueIsADotAndCellsAreCapsules: Story = {
  render: () => (
    <div style={{ width: 300, display: "grid", gap: 12 }}>
      <div data-case="low">
        <Progress value={1} />
      </div>
      <div data-case="none">
        <Progress value={0} />
      </div>
      <div data-case="cells">
        <Progress variant="segmented" value={2} max={6} />
      </div>
      <div data-case="square">
        <Progress variant="segmented" value={2} max={6} rounded={false} />
      </div>
    </div>
  ),
  play: async () => {
    const fill = q('[data-case="low"] [data-progress-fill]').getBoundingClientRect();
    /* As wide as it is tall: a dot, round at both ends. */
    await expect([Math.round(fill.width), Math.round(fill.height)]).toEqual([10, 10]);
    /* The twin: nothing is nothing, not a dot. */
    await expect(Math.round(q('[data-case="none"] [data-progress-fill]').getBoundingClientRect().width)).toBe(0);
    const cells = (c: string) => [...document.querySelectorAll<HTMLElement>(`[data-case="${c}"] [data-segment]`)];
    /* Whether each cell's corners are fully round: a radius of at least half its height. */
    const capsules = (c: string) =>
      cells(c).map((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) >= el.getBoundingClientRect().height / 2);
    /* Every cell rounded, not only the two ends; the twin keeps them square. */
    await expect([capsules("cells"), capsules("square")]).toEqual([
      [true, true, true, true, true, true],
      [false, false, false, false, false, false],
    ]);
    const widths = new Set(cells("cells").map((el) => Math.round(el.getBoundingClientRect().width)));
    await expect(widths.size).toBe(1);
  },
};

export const InForcedColorsTheBarStillShows: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 300, display: "grid", gap: 12 }}>
      <Progress value={40} />
      <Progress variant="segmented" segments={["done", "current", "remaining", "na"]} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const read = () => {
      const page = getComputedStyle(document.body).backgroundColor;
      const fill = getComputedStyle(q("[data-progress-fill]"));
      const track = getComputedStyle(q('[data-progress="continuous"] [data-progress-track]'));
      const cell = (state: string) => getComputedStyle(q(`[data-segment="${state}"]`));
      return {
        fillStandsOut: fill.backgroundColor !== page && fill.backgroundColor !== track.backgroundColor,
        trackOutlined: track.outlineStyle,
        doneStandsOut: cell("done").backgroundColor !== cell("remaining").backgroundColor,
        currentBorder: cell("current").borderTopWidth,
        remainingOutlined: cell("remaining").outlineStyle,
      };
    };
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(read()).toEqual({ fillStandsOut: true, trackOutlined: "solid", doneStandsOut: true, currentBorder: "2px", remainingOutlined: "solid" });
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
    /* The twin: outside forced colors there's no outline; the fills say it. */
    await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(false));
    await expect([read().trackOutlined, read().remainingOutlined]).toEqual(["none", "none"]);
  },
};

export const TheBarIsHiddenAndTheStatusSpeaks: Story = {
  tags: ["ax-tree"],
  render: () => <Progress value={45} label="Uploading photos" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    q("[data-progress-track]").setAttribute("data-ax-probe", "track");
    q("[data-progress-status]").setAttribute("data-ax-probe", "status");
    const states = await real.commands.axStates(['[data-ax-probe="track"]', '[data-ax-probe="status"]']);
    await expect(states.map((s) => [s.role, s.ignored])).toEqual([
      ["none", true],
      ["status", false],
    ]);
    await expect(q("[data-progress-status]").textContent).toBe("Uploading photos: 45%");
  },
};
