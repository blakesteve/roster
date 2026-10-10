import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { ProgressField } from "./ProgressField";

describe("ProgressField", () => {
  it("shows its label and value, and says them once, together", () => {
    const { container } = render(<ProgressField label="Uploading photos" value={45} detail="3.2 MB of 7 MB" />);
    const visible = container.querySelector("[data-progress-label]")!.parentElement!;
    expect(visible).toHaveAttribute("aria-hidden", "true");
    expect([container.querySelector("[data-progress-label]")!.textContent, container.querySelector("[data-progress-value]")!.textContent]).toEqual([
      "Uploading photos",
      "45%",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Uploading photos: 45%");
    /* The detail is ordinary text, read where it sits. */
    expect(screen.getByText("3.2 MB of 7 MB")).not.toHaveAttribute("aria-hidden");
  });

  it("says the words it shows", () => {
    render(<ProgressField label="Uploading" value={3} max={8} valueText="3 of 8 files" />);
    expect(screen.getByRole("status")).toHaveTextContent("Uploading: 3 of 8 files");
  });

  it("lets its visible label and value be read when it isn't announcing", () => {
    const { container } = render(<ProgressField label="Uploading photos" value={45} announce={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.querySelector("[data-progress-label]")!.parentElement).not.toHaveAttribute("aria-hidden");
  });

  it("shows the same percent it says, rounded the same way", () => {
    const { container } = render(<ProgressField label="Sync" value={0.3} />);
    expect(container.querySelector("[data-progress-value]")!.textContent).toBe("1%");
    expect(screen.getByRole("status")).toHaveTextContent("Sync: 1%");
  });

  it("shows a count for a segmented bar, and its own words when given", () => {
    const { container, rerender } = render(<ProgressField label="Picks" variant="segmented" value={12} max={16} />);
    expect(container.querySelector("[data-progress-value]")!.textContent).toBe("12 of 16");
    rerender(<ProgressField label="Picks" variant="segmented" value={12} max={16} valueText="12 picked" />);
    expect(container.querySelector("[data-progress-value]")!.textContent).toBe("12 picked");
  });

  it("shows no value while indeterminate, and no detail unless given", () => {
    const { container } = render(<ProgressField label="Syncing" />);
    expect(container.querySelector("[data-progress-value]")).toBeNull();
    expect(container.querySelector("[data-progress-detail]")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Syncing: Loading");
  });

  it("puts label and value on one baseline, label first", () => {
    const { container } = render(<ProgressField label="Sync" value={10} />);
    const row = container.querySelector("[data-progress-label]")!.parentElement!;
    expect(row).toHaveClass("rst:flex", "rst:items-baseline", "rst:justify-between");
    expect([...row.children].map((c) => c.getAttribute("data-progress-label") !== null)).toEqual([true, false]);
  });
});
