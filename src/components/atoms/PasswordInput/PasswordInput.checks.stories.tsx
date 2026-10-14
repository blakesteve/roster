import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { PasswordInput } from "./PasswordInput";

/**
 * PasswordInput's reveal button, checked rendered in Chromium: it's a click
 * target, so its cursor is the pointer. The twin, the same button on a
 * disabled field, is `not-allowed`.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/PasswordInput/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TheRevealButtonIsAPointer: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, width: 280 }}>
      <div data-field="on">
        <PasswordInput label="Password" defaultValue="Secret123" />
      </div>
      <div data-field="off">
        <PasswordInput label="Locked" defaultValue="Secret123" disabled />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const reveal = (field: string) => within(canvasElement.querySelector<HTMLElement>(`[data-field="${field}"]`)!).getByRole("button", { name: "Show password" });
    await expect([getComputedStyle(reveal("on")).cursor, getComputedStyle(reveal("off")).cursor]).toEqual(["pointer", "not-allowed"]);
  },
};
