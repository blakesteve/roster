import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { StepProgress } from "./StepProgress";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * StepProgress in Chromium: connectors that fill behind the current step,
 * markers that clear 3:1, a phone's width, and what a screen reader hears.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/StepProgress/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = ["Account", "Profile", "Shelf", "Invite", "Done"];
const all = (s: string) => [...document.querySelectorAll<HTMLElement>(s)];

const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const lum = (c: string) =>
  rgb(c)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const ConnectorsFillBehindTheCurrentStep: Story = {
  render: () => {
    function Walk() {
      const [current, setCurrent] = useState(3);
      return (
        <div style={{ width: 520 }}>
          <StepProgress steps={STEPS} current={current} />
          <button type="button" data-next="" onClick={() => setCurrent((c) => c + 1)}>
            Next
          </button>
        </div>
      );
    }
    return <Walk />;
  },
  play: async () => {
    const fills = () => all("[data-step-connector]").map((c) => getComputedStyle(c).backgroundColor);
    const filled = "rgb(10, 79, 122)";
    const empty = "rgb(231, 229, 228)";
    await expect(fills()).toEqual([filled, filled, empty, empty]);
    document.querySelector<HTMLButtonElement>("[data-next]")!.click();
    /* The twin: one step on, one more connector filled. */
    await waitFor(() => expect(fills()).toEqual([filled, filled, filled, empty]));
    /* The markers sit centered on the line. */
    const marker = all("[data-step-marker]")[0].getBoundingClientRect();
    const line = all("[data-step-connector]")[0].getBoundingClientRect();
    await expect(Math.round(marker.top + marker.height / 2)).toBe(Math.round(line.top + line.height / 2));
  },
};

export const MarkersClearThreeToOne: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {["light", "dark"].map((theme) => (
        <div key={theme} className={theme === "dark" ? "dark" : undefined} data-theme-test={theme} style={{ background: theme === "dark" ? "#1c1917" : "#ffffff", padding: 16, width: 520 }}>
          <StepProgress steps={STEPS} current={3} />
        </div>
      ))}
    </div>
  ),
  play: async () => {
    const measured = ["light", "dark"].flatMap((theme) => {
      const root = document.querySelector<HTMLElement>(`[data-theme-test="${theme}"]`)!;
      const page = getComputedStyle(root).backgroundColor;
      return [...root.querySelectorAll<HTMLElement>("[data-step]")].map((li) => {
        const marker = getComputedStyle(li.querySelector("[data-step-marker]")!);
        const state = li.dataset.step;
        /* A done marker is its fill; the current one is its border. Both must stand off the page. */
        const edge = state === "current" ? marker.borderTopColor : marker.backgroundColor;
        return [theme, state, contrast(edge, page) >= 3];
      });
    });
    await expect(measured.filter(([, state]) => state !== "upcoming").every(([, , ok]) => ok)).toBe(true);
    await expect(measured.filter(([, state]) => state !== "upcoming")).toHaveLength(6);
    /* The twin: an upcoming marker's fill is the quiet track, and doesn't; its number does the work. */
    await expect(measured.filter(([, state]) => state === "upcoming").some(([, , ok]) => !ok)).toBe(true);
  },
};

export const FitsAPhone: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ padding: "0 16px" }}>
      <StepProgress steps={STEPS} current={2} />
      <div style={{ height: 24 }} />
      <StepProgress steps={STEPS} current={4} variant="segmented" />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    try {
      await real.page.viewport(320, 600);
      await waitFor(() => expect(document.documentElement.clientWidth).toBe(320));
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
      const markers = all("[data-step-marker]").map((m) => m.getBoundingClientRect());
      /* Every marker on one row, inside the screen. */
      await expect([new Set(markers.map((m) => Math.round(m.top))).size, markers.every((m) => m.left >= 0 && m.right <= 320)]).toEqual([1, true]);
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const InForcedColorsTheStateStillShows: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ width: 520 }}>
      <StepProgress steps={STEPS} current={3} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const marker = (state: string) => getComputedStyle(document.querySelector(`[data-step="${state}"] [data-step-marker]`)!);
    const connector = (kind: string) => getComputedStyle(document.querySelector(`[data-step-connector="${kind}"]`)!).backgroundColor;
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect({
        doneDiffers: marker("done").backgroundColor !== marker("upcoming").backgroundColor,
        currentBorder: marker("current").borderTopWidth,
        connectorsDiffer: connector("filled") !== connector("empty"),
      }).toEqual({ doneDiffers: true, currentBorder: "2px", connectorsDiffer: true });
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
  },
};

export const ItSaysWhereYouAre: Story = {
  tags: ["ax-tree"],
  render: () => <StepProgress steps={STEPS} current={3} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const items = all("[data-step]");
    document.querySelector("[data-step-progress] ol")!.setAttribute("data-ax-probe", "list");
    items[0].setAttribute("data-ax-probe", "first");
    items[0].querySelector("[data-step-marker]")!.setAttribute("data-ax-probe", "marker");
    const states = await real.commands.axStates(['[data-ax-probe="list"]', '[data-ax-probe="first"]', '[data-ax-probe="marker"]']);
    await expect(states.map((s) => [s.role, s.name, s.ignored])).toEqual([
      ["list", "Progress", false],
      ["listitem", "", false],
      ["none", "", true],
    ]);
    await expect([items[0].textContent, items[2].getAttribute("aria-current")]).toEqual(["Account, done", "step"]);
    await expect(document.querySelector("[data-step-status]")!.textContent).toBe("Step 3 of 5: Shelf");
  },
};
