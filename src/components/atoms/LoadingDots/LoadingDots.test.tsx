import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { LoadingDots } from "./LoadingDots";

describe("LoadingDots", () => {
  it("says what it's waiting on a moment after it arrives, and hides the dots", async () => {
    const { container } = render(<LoadingDots label="Writing a reply" />);
    /* Empty as it arrives, so the words are a change a screen reader reads. */
    expect(screen.getByRole("status").textContent).toBe("");
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Writing a reply"));
    const dots = [...container.querySelectorAll("[data-loading-dots] > [aria-hidden]")];
    expect(dots).toHaveLength(3);
    expect(dots.every((d) => d.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("rests at 1, 0.6 and 0.3, so a still frame reads as movement", () => {
    const { container } = render(<LoadingDots />);
    const dots = [...container.querySelectorAll<HTMLElement>("[data-loading-dots] > [aria-hidden]")];
    expect(dots.map((d) => ["rst:opacity-100", "rst:opacity-60", "rst:opacity-30"].find((c) => d.classList.contains(c)))).toEqual([
      "rst:opacity-100",
      "rst:opacity-60",
      "rst:opacity-30",
    ]);
    expect(dots.map((d) => d.style.animationDelay)).toEqual(["0s", "0.2s", "0.4s"]);
    expect(dots.every((d) => d.classList.contains("rst:animate-dot"))).toBe(true);
  });

  it("says Loading by default", async () => {
    render(<LoadingDots />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Loading"));
  });

  it("leaves the announcing to a log it sits in, and keeps its words", () => {
    const { container } = render(<LoadingDots label="Writing a reply" announce={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.textContent).toBe("Writing a reply");
  });

  it("holds a waiting dot on its first frame, so it doesn't pop", () => {
    const { container } = render(<LoadingDots />);
    const dots = [...container.querySelectorAll<HTMLElement>("[data-loading-dots] > [aria-hidden]")];
    expect(dots.map((d) => d.style.animationFillMode)).toEqual(["backwards", "backwards", "backwards"]);
  });
});
