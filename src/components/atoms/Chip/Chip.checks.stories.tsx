import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Chip } from "./Chip";
import { Slider } from "../../molecules/Slider/Slider";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A selectable chip keeps its size when it's pressed, checked with the real
 * mouse in Chromium and WebKit: in a filter row that swaps `outline` for
 * `solid`, the documented pattern, and in a slider's snap chips, which do the
 * same. Every chip's box is measured before and after the press. The twin is
 * the press itself: the chip's pressed state and fill must change, so a row
 * that held still did so with the press landed.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Chip/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = ["Baseball", "Fishing", "Outdoors"];

function FilterRow() {
  const [on, setOn] = useState<string[]>([]);
  return (
    <div data-row="filters" style={{ display: "flex", gap: 8 }}>
      {TAGS.map((tag) => (
        <Chip
          key={tag}
          selected={on.includes(tag)}
          onSelectedChange={() => setOn((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]))}
          colorScheme={on.includes(tag) ? "primary" : "neutral"}
          variant={on.includes(tag) ? "solid" : "outline"}
        >
          {tag}
        </Chip>
      ))}
    </div>
  );
}

/** Each chip's box in a row, rounded to the pixel. */
const boxes = (row: Element) =>
  [...row.querySelectorAll("button")].map((b) => {
    const r = b.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.width), Math.round(r.height)];
  });

export const APressedChipKeepsItsSize: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "grid", gap: 24, width: 360 }}>
      <FilterRow />
      <div data-row="snaps">
        <Slider label="How sure" snapPoints={[{ value: 50, label: "Toss-up" }, { value: 75, label: "Likely" }, { value: 100, label: "Certain" }]} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    for (const [row, name] of [
      ["filters", "Fishing"],
      ["snaps", "Likely"],
    ] as const) {
      const scope = canvasElement.querySelector(`[data-row="${row}"]`)!;
      const chips = scope.querySelector("[data-slider-snaps]") ?? scope;
      const chip = within(chips as HTMLElement).getByRole("button", { name });
      const before = boxes(chips);
      const fill = getComputedStyle(chip).backgroundColor;
      chip.setAttribute("data-check", `${row}-press`);
      await real.commands.realClick(`[data-check="${row}-press"]`);
      /* The twin: the press landed, so the chip's state and fill changed. */
      await waitFor(() => expect([chip.getAttribute("aria-pressed"), getComputedStyle(chip).backgroundColor !== fill]).toEqual(["true", true]));
      /* And no chip in the row moved or changed size. */
      await expect(boxes(chips), `${row}: before ${JSON.stringify(before)}`).toEqual(before);
    }
  },
};
