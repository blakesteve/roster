import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { AvatarStrip } from "./AvatarStrip";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * The dismiss button as Chromium's accessibility tree hands it to a screen
 * reader (.storybook/ax-tree.ts): named by `labels.dismiss` and described by
 * the strip's label, so it's heard with what it dismisses. The twin is a
 * strip with no label, whose button has no description. The expected values
 * are literals, written from the requirement, not read from the component.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/AvatarStrip/Accessibility tree",
  /* `ax-tree` runs these in their own project (vite.config.ts). */
  tags: ["!dev", "!autodocs", "ax-tree"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { key: "a", label: "Ann" },
  { key: "b", label: "Bo" },
  { key: "c", label: "Cy" },
];

export const TheDismissIsDescribedByTheLabel: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      <div data-case="label">
        <AvatarStrip items={ITEMS} onDismiss={() => {}} label={<span>3 other players prefer Controller</span>} />
      </div>
      <div data-case="none">
        <AvatarStrip items={ITEMS} onDismiss={() => {}} labels={{ dismiss: "Hide" }} />
      </div>
    </div>
  ),
  play: async () => {
    const input = realInputOrSkip();
    if (!input) return;
    const selectors = ["label", "none"].map((c) => {
      const probe = `${c}-${Math.random().toString(36).slice(2)}`;
      document.querySelector(`[data-case="${c}"] [data-testid="avatar-strip-dismiss"]`)!.setAttribute("data-ax-probe", probe);
      return `[data-ax-probe="${probe}"]`;
    });
    const states = await input.commands.axStates(selectors);
    for (const selector of selectors) document.querySelector(selector)?.removeAttribute("data-ax-probe");
    const read = states.map((s) => `${s.role} "${s.name}" described "${s.description}"`);
    console.info(`AVATARSTRIP TREE ${JSON.stringify(read)}`);
    await expect(read).toEqual(['button "Dismiss" described "3 other players prefer Controller"', 'button "Hide" described ""']);
  },
};
