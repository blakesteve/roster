import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ProgressField } from "./ProgressField";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * ProgressField's promises in Chromium: label and value on one baseline, a
 * column of fields aligned, and one thing said to a screen reader.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/ProgressField/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

let root: ParentNode = document;
const all = (s: string) => [...root.querySelectorAll<HTMLElement>(s)];

export const LabelAndValueShareABaselineAndAColumnLinesUp: Story = {
  render: () => (
    <div style={{ width: 360, display: "grid", gap: 20 }}>
      <ProgressField label="Uploading photos" value={45} detail="3.2 MB of 7.1 MB" />
      <ProgressField label="Reading your history, which takes a while the first time" value={8} />
      <ProgressField label="Picks" variant="segmented" value={12} max={16} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    root = canvasElement;
    await document.fonts.ready;
    /* The same size text on one baseline has the same bottom edge. */
    const rows = all("[data-progress-field]").map((f) => {
      const label = f.querySelector<HTMLElement>("[data-progress-label]")!.getBoundingClientRect();
      const value = f.querySelector<HTMLElement>("[data-progress-value]")!.getBoundingClientRect();
      return [Math.round(label.bottom - value.bottom), label.right <= value.left];
    });
    await expect(rows).toEqual([
      [0, true],
      [0, true],
      [0, true],
    ]);
    /* A long label truncates rather than wrapping the row. */
    const long = all("[data-progress-label]")[1];
    await expect(long.scrollWidth > long.clientWidth).toBe(true);
    /* The tracks line up down the column. */
    const edges = new Set(all("[data-progress-track]").map((t) => `${Math.round(t.getBoundingClientRect().left)}-${Math.round(t.getBoundingClientRect().right)}`));
    await expect(edges.size).toBe(1);
  },
};

export const OneThingIsSaid: Story = {
  tags: ["ax-tree"],
  render: () => <ProgressField label="Uploading photos" value={45} detail="3.2 MB of 7.1 MB" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const row = document.querySelector<HTMLElement>("[data-progress-label]")!.parentElement!;
    row.setAttribute("data-ax-probe", "row");
    document.querySelector("[data-progress-detail]")!.setAttribute("data-ax-probe", "detail");
    document.querySelector("[data-progress-status]")!.setAttribute("data-ax-probe", "status");
    const states = await real.commands.axStates(['[data-ax-probe="row"]', '[data-ax-probe="detail"]', '[data-ax-probe="status"]']);
    /* The visible label and value are hidden; the detail is read; the status says both. */
    await expect(states.map((s) => [s.role, s.ignored])).toEqual([
      ["none", true],
      ["paragraph", false],
      ["status", false],
    ]);
    await expect(document.querySelector("[data-progress-status]")!.textContent).toBe("Uploading photos: 45%");
  },
};
