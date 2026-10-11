import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Navbar } from "./Navbar";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Navbar's promises, checked in Chromium: its accessibility tree and its
 * rendered boxes. Expected values are literals from the requirement, each
 * with a twin.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Navbar/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* A one-pixel image, so the logo has something to draw without a network. */
const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export const TheBrandIsReadOnce: Story = {
  tags: ["ax-tree"],
  render: () => (
    <>
      <Navbar logoSrc={LOGO} brandName="Tidewater" items={[{ label: "Charts", path: "/charts" }]} />
      {/* The twin: a logo with its own alt beside the same name, as 5.4.0 drew it. */}
      <a href="/" data-twin="">
        <img src={LOGO} alt="Tidewater Logo" />
        <span>Tidewater</span>
      </a>
    </>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const logo = canvasElement.querySelector<HTMLImageElement>(`nav img[src="${LOGO}"]`)!;
    const home = logo.closest("a")!;
    const twin = canvasElement.querySelector<HTMLElement>("[data-twin]")!;
    const ids = [logo, home, twin].map((el, i) => {
      const id = `nav-${i}-${Math.random().toString(36).slice(2)}`;
      el.setAttribute("data-ax-probe", id);
      return `[data-ax-probe="${id}"]`;
    });
    const states = await real.commands.axStates(ids);
    [logo, home, twin].forEach((el) => el.removeAttribute("data-ax-probe"));
    await expect(states.map((s) => [s.role, s.name])).toEqual([
      ["none", ""],
      ["link", "Tidewater"],
      ["link", "Tidewater Logo Tidewater"],
    ]);
  },
};

/* A wide lockup, 240 by 32: what a wordmark beside its mark looks like. */
const LOCKUP =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='32' viewBox='0 0 240 32'%3E%3Crect width='240' height='32' fill='%230a4f7a'/%3E%3C/svg%3E";

export const AWideLogoKeepsItsShape: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <div data-site="wide">
        <Navbar logoSrc={LOCKUP} logoHeight={32} brandName="Tidewater" brandElement={<span />} position="static" items={[{ label: "Charts", path: "/charts" }]} />
      </div>
      {/* The twin: the same lockup through the square logoSize, as before. */}
      <div data-site="square">
        <Navbar logoSrc={LOCKUP} logoSize={32} brandName="Tidewater" brandElement={<span />} position="static" items={[{ label: "Charts", path: "/charts" }]} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const box = (site: string, where: string) => {
      const img = canvasElement.querySelector<HTMLImageElement>(`[data-site="${site}"] ${where} img[src="${LOCKUP}"]`)!;
      const { width, height } = img.getBoundingClientRect();
      return [Math.round(width), Math.round(height)];
    };
    try {
      /* A phone, where the menu panel is the one that opens. */
      await real.page.viewport(414, 896);
      await waitFor(() => expect(window.innerWidth).toBe(414));
      await waitFor(() => expect(box("wide", "a")).toEqual([240, 32]));
      await expect(box("square", "a"), "the twin, squashed").toEqual([32, 32]);
      /* The panel's copy of the logo takes the same box. Its panel scales in,
         so wait for the box to settle before reading it. */
      canvasElement.querySelector<HTMLButtonElement>('[data-site="wide"] [data-roster-hamburger] button')!.click();
      await waitFor(() => expect(box("wide", "[data-roster-mobile-panel]")).toEqual([240, 32]));
      canvasElement.querySelector<HTMLButtonElement>('[data-site="square"] [data-roster-hamburger] button')!.click();
      await waitFor(() => expect(box("square", "[data-roster-mobile-panel]"), "the twin's panel").toEqual([32, 32]));
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const AFittedLogoSitsAtTheStartEdge: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["ltr", "rtl"] as const).map((dir) => (
        <div key={dir} dir={dir} data-dir={dir}>
          {/* A box wider than the lockup, so the image is fitted inside it. */}
          <Navbar logoSrc={LOCKUP} logoWidth={320} logoHeight={32} brandName="Tidewater" position="static" items={[]} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fit = (dir: string) => {
      const img = canvasElement.querySelector<HTMLImageElement>(`[data-dir="${dir}"] nav img[src="${LOCKUP}"]`)!;
      const style = getComputedStyle(img);
      return [style.objectFit, style.objectPosition];
    };
    await expect(fit("ltr")).toEqual(["contain", "0% 50%"]);
    /* The twin: a right-to-left page puts it against the right edge. */
    await expect(fit("rtl")).toEqual(["contain", "100% 50%"]);
  },
};
