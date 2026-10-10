import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { LoadingDots } from "./LoadingDots";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * LoadingDots in Chromium: the resting frame under reduced motion, sizing by
 * the text around it, and what a screen reader hears.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/LoadingDots/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const dots = (root: ParentNode = document) => [...root.querySelectorAll<HTMLElement>("[data-loading-dots] > [aria-hidden]")];

export const AtRestItReadsAsMovement: Story = {
  tags: ["reduced-motion"],
  render: () => <LoadingDots />,
  play: async () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = dots().map((d) => getComputedStyle(d));
    await expect(styles.map((s) => s.animationName)).toEqual(reduced ? ["none", "none", "none"] : ["rst-dot", "rst-dot", "rst-dot"]);
    if (reduced) await expect(styles.map((s) => s.opacity)).toEqual(["1", "0.6", "0.3"]);
  },
};

export const ItTakesTheTextsSizeAndColor: Story = {
  render: () => (
    <div>
      <span data-at="14" style={{ fontSize: 14, color: "rgb(10, 79, 122)" }}>
        <LoadingDots />
      </span>
      <span data-at="28" style={{ fontSize: 28 }}>
        <LoadingDots />
      </span>
    </div>
  ),
  play: async () => {
    const at = (n: number) => dots(document.querySelector(`[data-at="${n}"]`)!)[0];
    /* 0.4em across: 5.6px in 14px text, 11.2px in 28px. */
    await expect([Math.round(at(14).getBoundingClientRect().width * 10) / 10, Math.round(at(28).getBoundingClientRect().width * 10) / 10]).toEqual([5.6, 11.2]);
    await expect(getComputedStyle(at(14)).backgroundColor).toBe("rgb(10, 79, 122)");
  },
};

export const InForcedColorsTheDotsStillShow: Story = {
  tags: ["real-input"],
  render: () => <LoadingDots />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const page = () => getComputedStyle(document.body).backgroundColor;
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(dots().every((d) => getComputedStyle(d).backgroundColor !== page())).toBe(true);
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
  },
};

export const ItSaysWhatsComing: Story = {
  tags: ["ax-tree"],
  render: () => <LoadingDots label="Writing a reply" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    document.querySelector("[data-loading-dots]")!.setAttribute("data-ax-probe", "dots");
    dots()[0].setAttribute("data-ax-probe", "dot");
    const states = await real.commands.axStates(['[data-ax-probe="dots"]', '[data-ax-probe="dot"]']);
    await expect(states.map((s) => [s.role, s.ignored])).toEqual([
      ["status", false],
      ["none", true],
    ]);
    await waitFor(() => expect(document.querySelector("[data-loading-dots]")!.textContent).toBe("Writing a reply"));
  },
};
