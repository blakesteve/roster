import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Disclosure } from "./Disclosure";

/**
 * Disclosure's wiring, checked in Chromium. Expected values are literals
 * from the requirement, each with a twin.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Disclosure/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The button's `aria-controls` names the panel for exactly as long as the
 * panel exists: set as it opens, kept while it closes, removed once it has
 * gone. A closed panel is unmounted, and `aria-controls` may only name an
 * element that is there.
 */
export const PanelWiring: Story = {
  render: () => (
    <Disclosure variant="soft" title="Shipping details">
      Ships in two to three working days.
    </Disclosure>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Shipping details" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).not.toHaveAttribute("aria-controls");

    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const id = button.getAttribute("aria-controls")!;
    await expect(document.getElementById(id)).toHaveTextContent("Ships in two to three working days.");

    /* Closing, every change to the page is read as it lands, so the leave
       is seen however fast it runs: reading it after the click's own awaits
       could find it already over on a busy machine. */
    const states: string[] = [];
    const watch = new MutationObserver(() => {
      const named = button.getAttribute("aria-controls");
      const target = named ? (document.getElementById(named) ? "names the panel" : "names nothing") : "no controls";
      states.push(`${button.getAttribute("aria-expanded")}, ${target}, ${document.getElementById(id) ? "there" : "gone"}`);
    });
    watch.observe(canvasElement, { subtree: true, childList: true, attributes: true });
    await userEvent.click(button);
    await waitFor(() => expect(document.getElementById(id)).toBeNull());
    watch.disconnect();
    const closing = states.slice(states.findIndex((state) => state.startsWith("false")));
    // Still leaving, so still there and still named; then gone, and unnamed.
    await expect(closing.filter((state, i) => state !== closing[i - 1])).toEqual([
      "false, names the panel, there",
      "false, no controls, gone",
    ]);
  },
};
