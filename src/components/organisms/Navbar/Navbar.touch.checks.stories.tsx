import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Navbar } from "./Navbar";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";
import { MenuButtons524 } from "../../../test/MenuButtons524";
import { NAVBAR, TWIN, closed, ringOn, type Pair } from "../../../test/navbar-rings";

/**
 * Navbar's menu with a finger, in Chromium and WebKit with a touch screen (the
 * `storybook-touch` project): a tap leaves no ring on the close button it
 * focuses, and none on the menu button when the close button is tapped. The
 * mouse and the keys are in `Navbar.checks.stories.tsx`, with the reason.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Navbar/Touch checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
const chromium = () => navigator.userAgent.includes("Chrome");

async function tapped(real: RealInput, pair: Pair) {
  await real.commands.realTap(pair.menu);
  const closeOnOpen = await ringOn(pair.close);
  await real.commands.realTap(pair.close);
  const menuOnClose = await ringOn(pair.menu);
  await closed(pair);
  return [closeOnOpen.ring, menuOnClose.ring];
}

/* The twin, 5.24's pair, rings the menu button after a tap in Chromium. */
export const ATapLeavesNoRing: Story = {
  tags: ["touch"],
  render: () => (
    <div style={{ minHeight: 700 }}>
      <Navbar logoSrc={LOGO} brandName="Tidewater" position="static" items={[{ label: "Charts", path: "/charts" }]} />
      <div style={{ padding: 16 }}>
        <MenuButtons524 />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.page.viewport(375, 700);
    try {
      await waitFor(() => expect(window.innerWidth).toBe(375));
      const navbar = await tapped(real, NAVBAR);
      const twin = await tapped(real, TWIN);
      console.info(`NAVBAR TAP RINGS ${chromium() ? "chromium" : "webkit"} ${JSON.stringify({ navbar, twin })}`);
      await expect(navbar).toEqual([false, false]);
      await expect(twin).toEqual([false, chromium()]);
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};
