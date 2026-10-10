import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { Progress } from "./Progress";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const status = () => screen.getByRole("status").textContent;
const fill = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-progress-fill]")!;

describe("Progress", () => {
  it("hides the bar and says the value in a status beside it", () => {
    const { container } = render(<Progress value={45} label="Uploading photos" />);
    expect(container.querySelector("[data-progress-track]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(status()).toBe("Uploading photos: 45%");
    expect(fill(container).style.width).toBe("45%");
  });

  it("fills a share of max, clamped to the track", () => {
    const { container, rerender } = render(<Progress value={3} max={12} />);
    expect(fill(container).style.width).toBe("25%");
    rerender(<Progress value={30} max={12} />);
    expect(fill(container).style.width).toBe("100%");
    rerender(<Progress value={-5} />);
    expect(fill(container).style.width).toBe("0%");
  });

  it("keeps a low value a dot, and nothing at all as nothing", () => {
    const { container, rerender } = render(<Progress value={1} />);
    expect(fill(container).style.minWidth).toBe("0.625rem");
    rerender(<Progress value={0} />);
    expect(fill(container).style.minWidth).toBe("");
  });

  it("is indeterminate without a value: a traveling pill, said as loading", () => {
    const { container } = render(<Progress />);
    expect(fill(container)).toHaveAttribute("data-progress-fill", "indeterminate");
    expect(fill(container)).toHaveClass("rst:animate-progress-travel");
    expect(status()).toBe("Loading");
  });

  it("breathes while busy, and not otherwise", () => {
    const { container, rerender } = render(<Progress value={100} busy />);
    expect(container.querySelector("[data-progress-track]")).toHaveClass("rst:animate-pulse", "rst:motion-reduce:animate-none");
    rerender(<Progress value={100} />);
    expect(container.querySelector("[data-progress-track]")).not.toHaveClass("rst:animate-pulse");
  });

  it("takes a solid fill for each status", () => {
    const fills = (["default", "success", "warning", "error"] as const).map((s) => {
      const { container, unmount } = render(<Progress value={50} status={s} />);
      const cls = [...fill(container).classList].filter((c) => c.startsWith("rst:bg-") || c.startsWith("rst:dark:bg-"));
      unmount();
      return cls;
    });
    expect(fills).toEqual([
      ["rst:bg-primary-600", "rst:dark:bg-primary-400"],
      ["rst:bg-success-600", "rst:dark:bg-success-400"],
      ["rst:bg-amber-700", "rst:dark:bg-amber-400"],
      ["rst:bg-error-600", "rst:dark:bg-error-400"],
    ]);
  });

  it("counts segments from a value, and says the count", () => {
    const { container } = render(<Progress variant="segmented" value={3} max={8} label="Picks" />);
    const cells = [...container.querySelectorAll("[data-segment]")].map((c) => c.getAttribute("data-segment"));
    expect(cells).toEqual(["done", "done", "done", "remaining", "remaining", "remaining", "remaining", "remaining"]);
    expect(status()).toBe("Picks: 3 of 8");
  });

  it("draws each segment's own state, and doesn't count the ones that don't apply", () => {
    const { container } = render(<Progress variant="segmented" segments={["done", "na", "done", "current", "remaining"]} />);
    const cells = [...container.querySelectorAll<HTMLElement>("[data-segment]")];
    expect(cells.map((c) => c.getAttribute("data-segment"))).toEqual(["done", "na", "done", "current", "remaining"]);
    expect(cells[1]).toHaveClass("rst:border-dashed");
    /* Under way: solid, the track inside a border of the fill. */
    expect(cells[3]).toHaveClass("rst:border-2", "rst:border-primary-600");
    expect(cells[3]).not.toHaveClass("rst:opacity-50");
    expect(status()).toBe("2 of 4");
  });

  it("draws nothing to do as an empty bar, not a hundred segments", () => {
    const { container, rerender } = render(<Progress variant="segmented" value={0} max={0} />);
    expect(container.querySelectorAll("[data-segment]")).toHaveLength(0);
    expect(status()).toBe("0 of 0");
    rerender(<Progress value={5} max={0} />);
    expect(fill(container).style.width).toBe("0%");
  });

  it("never says 0% for a dot it shows, or 100% short of the end", () => {
    const { rerender } = render(<Progress value={0.3} />);
    expect(status()).toBe("1%");
    rerender(<Progress value={99.7} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(status()).toBe("99%");
  });

  it("says its own words for the value when given", () => {
    render(<Progress value={3} max={8} label="Uploading" valueText="3 of 8 files" />);
    expect(status()).toBe("Uploading: 3 of 8 files");
  });

  it("doesn't hold up a change after a value comes back to what was said", () => {
    const { rerender } = render(<Progress value={10} label="Sync" />);
    rerender(<Progress value={20} label="Sync" />);
    act(() => vi.advanceTimersByTime(0));
    expect(status()).toBe("Sync: 20%");
    act(() => vi.advanceTimersByTime(2000));
    /* Back to what's said, then on: the move on goes at once. */
    rerender(<Progress value={20} label="Sync" />);
    rerender(<Progress value={30} label="Sync" />);
    act(() => vi.advanceTimersByTime(0));
    expect(status()).toBe("Sync: 30%");
  });

  it("rounds each cell into a capsule, or keeps them square", () => {
    const { container, rerender } = render(<Progress variant="segmented" value={1} max={3} />);
    expect([...container.querySelectorAll("[data-segment]")].every((c) => c.classList.contains("rst:rounded-full"))).toBe(true);
    rerender(<Progress variant="segmented" value={1} max={3} rounded={false} />);
    expect([...container.querySelectorAll("[data-segment]")].every((c) => c.classList.contains("rst:rounded-sm"))).toBe(true);
  });

  it("says a changing value no more than once every 1.5 seconds, and the end at once", () => {
    const { rerender } = render(<Progress value={0} label="Sync" />);
    rerender(<Progress value={10} label="Sync" />);
    act(() => vi.advanceTimersByTime(0));
    expect(status()).toBe("Sync: 10%");
    rerender(<Progress value={20} label="Sync" />);
    rerender(<Progress value={30} label="Sync" />);
    act(() => vi.advanceTimersByTime(1000));
    /* Still the last one said. */
    expect(status()).toBe("Sync: 10%");
    act(() => vi.advanceTimersByTime(500));
    expect(status()).toBe("Sync: 30%");
    rerender(<Progress value={40} label="Sync" />);
    rerender(<Progress value={100} label="Sync" />);
    act(() => vi.advanceTimersByTime(0));
    expect(status()).toBe("Sync: 100%");
  });

  it("says nothing when told another part says it", () => {
    render(<Progress value={50} announce={false} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("says nothing in English once every label is replaced", () => {
    render(
      <>
        <Progress value={45} label="Subiendo" labels={{ percent: (p) => `${p} %`, status: (l, v) => `${l}, ${v}` }} />
        <Progress labels={{ indeterminate: "Cargando" }} />
        <Progress variant="segmented" value={2} max={5} labels={{ count: (d, t) => `${d} de ${t}` }} />
      </>,
    );
    expect(screen.getAllByRole("status").map((s) => s.textContent)).toEqual(["Subiendo, 45 %", "Cargando", "2 de 5"]);
  });
});
