import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { StepProgress } from "./StepProgress";

const STEPS = ["Account", "Profile", "Shelf", "Done"];

describe("StepProgress", () => {
  it("lists every step, marks the current one, and says the finished ones are done", () => {
    render(<StepProgress steps={STEPS} current={3} />);
    const list = screen.getByRole("list", { name: "Progress" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((li) => [li.textContent, li.getAttribute("aria-current")])).toEqual([
      ["Account, done", null],
      ["Profile, done", null],
      ["3Shelf", "step"],
      ["4Done", null],
    ]);
  });

  it("fills the connectors up to the current step", () => {
    const { container } = render(<StepProgress steps={STEPS} current={3} />);
    const connectors = [...container.querySelectorAll("[data-step-connector]")].map((c) => c.getAttribute("data-step-connector"));
    expect(connectors).toEqual(["filled", "filled", "empty"]);
  });

  it("says where you are", () => {
    const { rerender } = render(<StepProgress steps={STEPS} current={2} />);
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 4: Profile");
    rerender(<StepProgress steps={STEPS} current={5} />);
    expect(screen.getByRole("status")).toHaveTextContent("Step 4 of 4");
  });

  it("always shows step x of y in the segmented form, with the step's name", () => {
    const { container } = render(<StepProgress steps={STEPS} current={2} variant="segmented" />);
    expect(container.querySelector("[data-step-position]")!.textContent).toBe("Step 2 of 4");
    expect(container.querySelector("[data-step-name]")!.textContent).toBe("Profile");
    expect([...container.querySelectorAll("[data-segment]")].map((s) => s.getAttribute("data-segment"))).toEqual(["done", "current", "remaining", "remaining"]);
    /* Its bar doesn't speak too: the one status is StepProgress's. */
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("renders nothing for no steps", () => {
    const { container } = render(<StepProgress steps={[]} current={1} />);
    expect(container.innerHTML).toBe("");
  });

  it("draws the current step with a border, which forced colors keep", () => {
    const { container } = render(<StepProgress steps={STEPS} current={2} />);
    const marker = container.querySelector('[aria-current="step"] [data-step-marker]')!;
    expect(marker).toHaveClass("rst:border-2");
    expect([...marker.classList].some((c) => c.includes("ring"))).toBe(false);
  });

  it("treats a current step out of range as the nearest end", () => {
    const { container, rerender } = render(<StepProgress steps={STEPS} current={0} />);
    expect(container.querySelector('[aria-current="step"]')!.textContent).toBe("1Account");
    rerender(<StepProgress steps={STEPS} current={Number.NaN} />);
    expect(container.querySelector('[aria-current="step"]')!.textContent).toBe("1Account");
  });

  it("says nothing in English once every label is replaced", () => {
    const { container } = render(
      <StepProgress
        steps={["Cuenta", "Perfil"]}
        current={2}
        labels={{ nav: "Progreso", position: (c, t) => `Paso ${c} de ${t}`, done: "hecho", number: (n) => `#${n}` }}
      />,
    );
    const said = [container.textContent, screen.getByRole("list").getAttribute("aria-label")].join(" ");
    for (const english of ["Step", "done", "Progress", " of "]) expect(said, english).not.toContain(english);
    expect(said).toContain("Paso 2 de 2");
    expect(said).toContain("#2");
  });
});
