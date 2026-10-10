import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { Skeleton, SkeletonRegion } from "./Skeleton";

/* jsdom has no layout, so these pin structure and accessibility. That a
   skeleton is the size of what replaces it is measured in Chromium
   (Skeleton.checks.stories.tsx). */
describe("Skeleton", () => {
  it("is hidden from screen readers in every shape", () => {
    const { container } = render(
      <>
        <Skeleton />
        <Skeleton shape="block" />
        <Skeleton shape="circle" />
      </>,
    );
    const shapes = [...container.querySelectorAll("[data-skeleton]")];
    expect(shapes.map((el) => [el.getAttribute("data-skeleton"), el.getAttribute("aria-hidden")])).toEqual([
      ["line", "true"],
      ["block", "true"],
      ["circle", "true"],
    ]);
  });

  it("sets a line in the text size it stands in for", () => {
    const { container } = render(
      <>
        <Skeleton size="sm" />
        <Skeleton size="md" />
        <Skeleton size="lg" />
        <Skeleton size="inherit" />
      </>,
    );
    const lines = [...container.querySelectorAll('[data-skeleton="line"]')];
    expect(lines.map((el) => ["rst:text-xs", "rst:text-sm", "rst:text-base"].find((c) => el.classList.contains(c)) ?? "inherit")).toEqual([
      "rst:text-xs",
      "rst:text-sm",
      "rst:text-base",
      "inherit",
    ]);
  });

  it("holds each line open with a space, so it's one line box tall", () => {
    const { container } = render(<Skeleton lines={3} width="40%" />);
    const rows = [...container.querySelector('[data-skeleton="line"]')!.children] as HTMLElement[];
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.textContent)).toEqual(["\u00a0", "\u00a0", "\u00a0"]);
    /* The last line is the short one. */
    expect(rows.map((r) => r.style.width)).toEqual(["", "", "40%"]);
  });

  it("draws a circle at Avatar's sizes and a block at its height", () => {
    const { container } = render(
      <>
        <Skeleton shape="circle" size="lg" />
        <Skeleton shape="block" height={120} radius="xl" />
      </>,
    );
    expect(container.querySelector('[data-skeleton="circle"]')).toHaveClass("rst:h-12", "rst:w-12", "rst:rounded-full");
    const block = container.querySelector<HTMLElement>('[data-skeleton="block"]')!;
    expect(block.style.height).toBe("120px");
    expect(block).toHaveClass("rst:rounded-xl");
  });

  it("lets a grid of regions say loading once", async () => {
    render(
      <>
        <SkeletonRegion loading skeleton={<Skeleton />} label="Loading cards" />
        <SkeletonRegion loading skeleton={<Skeleton />} label="Loading cards" announce={false} />
      </>,
    );
    await waitFor(() => expect(screen.getAllByRole("status").map((s) => s.textContent)).toEqual(["Loading cards", ""]));
  });

  it("shimmers, with the class that stops under reduced motion", () => {
    const { container } = render(<Skeleton shape="block" />);
    expect(container.querySelector('[data-skeleton="block"]')).toHaveClass("rst:animate-skeleton");
  });
});

describe("SkeletonRegion", () => {
  it("is busy while loading, says so a moment later, and hides the skeleton", async () => {
    const { container, rerender } = render(
      <SkeletonRegion loading skeleton={<Skeleton lines={2} />} label="Loading the schedule">
        <p>Week 6</p>
      </SkeletonRegion>,
    );
    const region = container.querySelector("[data-skeleton-region]")!;
    expect(region).toHaveAttribute("aria-busy", "true");
    /* The status sits beside the busy region, not in it: some screen readers
       hold a busy region's announcements until it's done. */
    expect(region.contains(screen.getByRole("status"))).toBe(false);
    /* Empty as it arrives, so the words that follow are a change a screen reader reads. */
    expect(screen.getByRole("status").textContent).toBe("");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Loading the schedule"));
    expect(screen.queryByText("Week 6")).toBeNull();
    /* The twin: loaded, it's the content, and the status falls silent. */
    rerender(
      <SkeletonRegion loading={false} skeleton={<Skeleton lines={2} />} label="Loading the schedule">
        <p>Week 6</p>
      </SkeletonRegion>,
    );
    expect(region).not.toHaveAttribute("aria-busy");
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe(""));
    expect(screen.getByText("Week 6")).toBeInTheDocument();
    expect(container.querySelector("[data-skeleton]")).toBeNull();
  });
});
