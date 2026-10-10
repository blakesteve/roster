import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { expect, userEvent, waitFor } from "storybook/test";
import { Button } from "../../atoms/Button/Button";
import { DataTable, type RosterTableFeatures } from "./DataTable";

/**
 * DataTable's pager, now Pagination's arrows, checked in Chromium.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/DataTable/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Row = { id: number; name: string };
const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Station ${i + 1}` }));
const columns: ColumnDef<RosterTableFeatures, Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

/* Scoped to the DataTable's own wrapper (the pager's grandparent): the test
   page around the story has tables of its own. */
const root = () => document.querySelector("[data-pagination]")!.parentElement!.parentElement!;
const arrow = (name: string) => root().querySelector<HTMLElement>(`[aria-label="${name}"]`)!;
const status = () => document.querySelector("[data-pagination]")!.parentElement!.firstElementChild!.textContent;
const names = () => [...root().querySelectorAll<HTMLElement>("tbody td:nth-child(2)")].map((td) => td.textContent);

export const ThePagerStillPages: Story = {
  render: () => <DataTable columns={columns} data={rows} />,
  play: async () => {
    await expect([status(), names()[0], names().length]).toEqual(["Page 1 of 3", "Station 1", 10]);
    await userEvent.click(arrow("Next page (2)"));
    await waitFor(() => expect(status()).toBe("Page 2 of 3"));
    await expect(names()[0]).toBe("Station 11");
    await userEvent.click(arrow("Last page (3)"));
    await waitFor(() => expect(names()).toEqual(["Station 21", "Station 22", "Station 23", "Station 24", "Station 25"]));
    /* At the end, the arrows that can't go further stay focusable and do nothing. */
    const next = arrow("Next page");
    await expect([next.getAttribute("aria-disabled"), next.hasAttribute("disabled")]).toEqual(["true", false]);
    await userEvent.click(next);
    await expect(status()).toBe("Page 3 of 3");
    /* The twin: the way back goes. */
    await userEvent.click(arrow("First page (1)"));
    await waitFor(() => expect(status()).toBe("Page 1 of 3"));
  },
};

export const EveryArrowIs44: Story = {
  render: () => (
    <>
      <DataTable columns={columns} data={rows} />
      {/* The twin: the small Button the pager used to use, measured the same way. */}
      <Button size="sm" variant="outline" data-old-arrow="">
        x
      </Button>
    </>
  ),
  play: async () => {
    const old = document.querySelector<HTMLElement>("[data-old-arrow]")!.getBoundingClientRect();
    await expect(Math.round(old.height) >= 44).toBe(false);
    const boxes = [...root().querySelectorAll<HTMLElement>("[data-pagination] button")].map((b) => {
      const r = b.getBoundingClientRect();
      return [b.getAttribute("aria-label"), Math.round(r.width) >= 44, Math.round(r.height) >= 44];
    });
    await expect(boxes).toEqual([
      ["First page", true, true],
      ["Previous page", true, true],
      ["Next page (2)", true, true],
      ["Last page (3)", true, true],
    ]);
  },
};
