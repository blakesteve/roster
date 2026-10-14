import { render } from "@testing-library/react";
import { SkeletonRegion } from "../../atoms/Skeleton/Skeleton";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { Table, TableBody } from "../../organisms/Table/Table";
import { SkeletonAvatar, SkeletonCard, SkeletonStat, SkeletonTableRow } from "./SkeletonPresets";

/* Structure only: each preset is the real container with skeleton lines in
   it. The sizes are measured against real content in Chromium. */
describe("Skeleton presets", () => {
  it("passes its animation to every skeleton in it, or takes its region's", () => {
    const moving = (root: ParentNode) =>
      [...root.querySelectorAll("[class*='rst:animate-skeleton'], [class*='rst:skeleton-fill']")].map((el) =>
        el.classList.contains("rst:animate-skeleton-pulse") ? "pulse" : el.classList.contains("rst:skeleton-fill") ? "none" : "shimmer",
      );
    const { container } = render(
      <>
        <div data-k="own">
          <SkeletonCard media={40} lines={1} animation="none" />
          <SkeletonAvatar withName animation="none" />
          <dl>
            <SkeletonStat source animation="none" />
          </dl>
          <Table>
            <TableBody>
              <SkeletonTableRow columns={2} animation="none" />
            </TableBody>
          </Table>
        </div>
        <div data-k="region">
          <SkeletonRegion loading animation="pulse" skeleton={<SkeletonCard lines={1} />} />
        </div>
        {/* The twin: a preset on its own shimmers. */}
        <div data-k="plain">
          <SkeletonAvatar withName />
        </div>
      </>,
    );
    expect([moving(container.querySelector('[data-k="own"]')!), moving(container.querySelector('[data-k="region"]')!), moving(container.querySelector('[data-k="plain"]')!)]).toEqual([
      Array(10).fill("none"),
      ["pulse", "pulse"],
      ["shimmer", "shimmer"],
    ]);
  });

  it("draws a card as a real Card: media, title, body lines", () => {
    const { container } = render(<SkeletonCard media={160} lines={2} />);
    const card = container.querySelector('[data-skeleton="card"]')!;
    expect(card).toHaveAttribute("aria-hidden", "true");
    expect(card).toHaveClass("rst:rounded-xl", "rst:p-6");
    expect([...card.querySelectorAll("[data-skeleton]")].map((s) => s.getAttribute("data-skeleton"))).toEqual(["block", "line", "line"]);
    expect(card.querySelectorAll('[data-skeleton="line"]')[1].children).toHaveLength(2);
  });

  it("draws a table row as the table's own row and cells", () => {
    const { container } = render(
      <Table>
        <TableBody>
          <SkeletonTableRow columns={4} />
        </TableBody>
      </Table>,
    );
    const row = container.querySelector('[data-skeleton="table-row"]')!;
    expect(row.tagName).toBe("TR");
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(row.querySelectorAll("td")).toHaveLength(4);
    expect(row.querySelector("td")).toHaveClass("rst:p-4");
  });

  it("draws an avatar at its size, with or without a name", () => {
    const { container, rerender } = render(<SkeletonAvatar size="sm" />);
    expect(container.querySelector('[data-skeleton="circle"]')).toHaveClass("rst:h-8", "rst:w-8");
    rerender(<SkeletonAvatar size="sm" withName />);
    expect(container.querySelector('[data-skeleton="avatar"]')!.querySelectorAll("[data-skeleton]")).toHaveLength(2);
  });

  it("draws a stat in Stat's own markup, in either form", () => {
    const { container, rerender } = render(
      <dl>
        <SkeletonStat size="sm" />
      </dl>,
    );
    const tags = () => [...container.querySelector('[data-skeleton="stat"]')!.children].map((c) => c.tagName);
    /* Stat's default: a dt and a dd, for a dl. */
    expect(tags()).toEqual(["DT", "DD"]);
    expect(container.querySelector("dd")).toHaveClass("rst:text-xl");
    rerender(
      <dl>
        <SkeletonStat size="sm" source />
      </dl>,
    );
    expect(container.querySelector("dd")!.children).toHaveLength(2);
    rerender(<SkeletonStat size="sm" semantics="standalone" />);
    expect(tags()).toEqual(["SPAN", "SPAN"]);
  });
});
