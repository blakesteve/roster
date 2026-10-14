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

/* Each fill's movement, by the utility it carries. Every fill keeps its
   forced-colors outline, whichever. */
const MOVES = {
  shimmer: "rst:animate-skeleton",
  pulse: "rst:animate-skeleton-pulse",
  none: "rst:skeleton-fill",
} as const;
const movesOf = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>("[class*='rst:animate-skeleton'], [class*='rst:skeleton-fill']")].map((el) => {
    const move = (Object.keys(MOVES) as (keyof typeof MOVES)[]).find((k) => el.classList.contains(MOVES[k]));
    return [move, el.classList.contains("rst:forced-colors:outline-solid")];
  });

describe("Skeleton animation", () => {
  it("shimmers by default, and pulses or holds still when asked, in every shape", () => {
    const { container } = render(
      <>
        <Skeleton />
        <Skeleton shape="block" animation="pulse" />
        <Skeleton shape="circle" animation="none" />
      </>,
    );
    expect(movesOf(container)).toEqual([
      ["shimmer", true],
      ["pulse", true],
      ["none", true],
    ]);
  });

  it("takes a region's animation, unless it asks for its own", () => {
    const { container } = render(
      <>
        <div data-region="pulse">
          <SkeletonRegion
            loading
            animation="pulse"
            skeleton={
              <>
                <Skeleton lines={2} />
                <Skeleton shape="block" animation="none" />
              </>
            }
          />
        </div>
        {/* The twin: a region that says nothing leaves them shimmering. */}
        <div data-region="plain">
          <SkeletonRegion loading skeleton={<Skeleton shape="block" />} />
        </div>
        {/* A region inside a pulsing one's skeleton, saying nothing itself,
            keeps the outer one's. */}
        <div data-region="nested">
          <SkeletonRegion loading animation="pulse" skeleton={<SkeletonRegion loading skeleton={<Skeleton shape="block" />} />} />
        </div>
      </>,
    );
    expect(movesOf(container.querySelector('[data-region="nested"]')!)).toEqual([["pulse", true]]);
    expect([movesOf(container.querySelector('[data-region="pulse"]')!), movesOf(container.querySelector('[data-region="plain"]')!)]).toEqual([
      [
        ["pulse", true],
        ["pulse", true],
        ["none", true],
      ],
      [["shimmer", true]],
    ]);
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
