import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Toast } from "./Toast";
import "@testing-library/jest-dom";

describe("Toast", () => {
  it("renders the message, and a title above it when given one", () => {
    render(<Toast title="Saved">Your picks are locked.</Toast>);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Your picks are locked.")).toBeInTheDocument();
  });

  it("keeps its icon out of the accessible name", () => {
    /* The icon repeats what the color and the words already say; announcing it
       makes every toast start with noise. */
    const { container } = render(<Toast colorScheme="success">Saved</Toast>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("takes icon={null} to render none at all", () => {
    const { container } = render(
      <Toast colorScheme="success" icon={null}>
        Saved
      </Toast>,
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("only offers a dismiss control when it can actually dismiss", () => {
    render(<Toast>Saved</Toast>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    cleanup();
    const onDismiss = vi.fn();
    render(<Toast onDismiss={onDismiss}>Saved</Toast>);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not set a role, because urgency is the queue's to decide", () => {
    /* `Toaster` decides urgency; this body is used for every tone. A role
       baked in here would announce every success as urgently as every
       failure. */
    const { container } = render(<Toast colorScheme="error">Failed</Toast>);
    expect(container.firstElementChild).not.toHaveAttribute("role");

    cleanup();
    render(
      <Toast colorScheme="error" role="alert" aria-live="assertive">
        Failed
      </Toast>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("offers a solid fill for toasts that land over content the app does not own", () => {
    /* A tint is a gamble over arbitrary page content: `bg-success-50` is a
       whisper on a white page and illegible over a photograph. Solid uses the
       same `-500` fills and ink tokens as Pill and Chip, so the three do not
       disagree about what a solid success looks like. */
    const { container } = render(
      <Toast variant="solid" colorScheme="success">
        Saved
      </Toast>,
    );
    const body = container.firstElementChild?.className ?? "";

    expect(body).toContain("rst:bg-success-500");
    expect(body).toContain("rst:text-success-500-ink");
    expect(body).not.toContain("rst:bg-success-50 ");
  });

  it("keeps glass neutral, with the tone on the border rather than the fill", () => {
    /* The colored version failed: white ink on a success fill composited over
       a white backdrop is 2.60:1, and more translucency made it 2.28. The ink
       token is chosen for the fill, and under glass the fill is partly
       whatever is behind it. A neutral surface with normal text is 17.49 over
       white and 8.25 over black. */
    const { container } = render(
      <Toast variant="glass" colorScheme="success">
        Saved
      </Toast>,
    );
    const body = container.firstElementChild?.className ?? "";

    expect(body).toContain("rst:backdrop-blur-xl");
    expect(body).toContain("rst:bg-white/60");
    expect(body).toContain("rst:border-success-400/60");
    expect(body).not.toContain("rst:bg-success-500/80");
    expect(body).not.toContain("rst:text-success-500-ink");
  });

  it("draws neutral from the floating surface tokens", () => {
    /* A toast with no semantic color IS the popover surface, so an app that
       themed its menus should get this without doing anything else. */
    const { container } = render(<Toast>Saved</Toast>);
    expect(container.firstElementChild?.className).toContain(
      "rst:bg-[var(--roster-popover-bg)]",
    );
  });
});
