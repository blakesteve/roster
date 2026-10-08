import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Navbar } from "./Navbar";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Navbar's promises, checked in Chromium's accessibility tree. Expected
 * values are literals from the requirement, each with a twin.
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
