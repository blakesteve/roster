import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CallToAction } from "./CallToAction";
import { Button } from "../../atoms/Button/Button";
import "@testing-library/jest-dom";


describe("CallToAction Molecule", () => {
  it("renders title and standard string description correctly", () => {
    render(
      <CallToAction
        title="Welcome Back"
        description="Don't forget to check your picks."
      />,
    );

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByText("Don't forget to check your picks."),
    ).toBeInTheDocument();
  });

  it("renders a complex ReactNode injected into the title prop", () => {
    render(
      <CallToAction
        title={
          <span data-testid="rich-title">
            <span data-testid="badge-in-title">New</span>
            {" "}Quick Vote
          </span>
        }
      />,
    );

    expect(screen.getByTestId("rich-title")).toBeInTheDocument();
    expect(screen.getByTestId("badge-in-title")).toBeInTheDocument();
    expect(screen.getByText("Quick Vote", { exact: false })).toBeInTheDocument();
  });

  it("renders a complex ReactNode injected into the description prop", () => {
    render(
      <CallToAction
        title="Embedded Component"
        description={
          <div data-testid="complex-node">
            <span className="rst:font-bold">Rich Text</span>
            <button>Embedded Button</button>
          </div>
        }
      />,
    );

    expect(screen.getByTestId("complex-node")).toBeInTheDocument();
    expect(screen.getByText("Rich Text")).toBeInTheDocument();
    expect(screen.getByText("Embedded Button")).toBeInTheDocument();
  });

  it("renders the action element when provided", () => {
    render(<CallToAction title="Test" action={<Button>Click Me</Button>} />);

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", () => {
    const handleDismiss = vi.fn();

    render(<CallToAction title="Dismiss Me" onDismiss={handleDismiss} />);

    // LabelText check for accessibility compliance
    const closeBtn = screen.getByLabelText("Dismiss");
    fireEvent.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does NOT render the close button if onDismiss is missing", () => {
    render(<CallToAction title="Permanent Banner" />);

    const closeBtn = screen.queryByLabelText("Dismiss");
    expect(closeBtn).not.toBeInTheDocument();
  });

  it("renders the icon when provided", () => {
    render(
      <CallToAction
        title="Icon Test"
        icon={<span data-testid="test-icon">🚀</span>}
      />,
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByTestId("test-icon").parentElement).toHaveClass(
      "rst:shrink-0",
      "rst:text-current",
    );
  });

  it("applies primary and error variant styling including rich dark mode support", () => {
    const { container, rerender } = render(
      <CallToAction title="Primary Test" variant="primary" />,
    );

    // Light mode check
    expect(container.firstChild).toHaveClass(
      "rst:bg-primary-100",
      "rst:text-primary-900",
    );

    expect(container.firstChild).toHaveClass(
      "rst:dark:bg-primary-900/30",
      "rst:dark:text-primary-200",
    );

    rerender(<CallToAction title="Error Test" variant="error" />);
    expect(container.firstChild).toHaveClass(
      "rst:bg-error-100",
      "rst:dark:bg-error-900/30",
    );
  });

  it("applies the warning variant properly", () => {
    const { container } = render(
      <CallToAction title="Warning" variant="warning" />,
    );

    expect(container.firstChild).toHaveClass(
      "rst:bg-amber-100",
      "rst:dark:bg-amber-900/30",
    );
  });

  // success variant test
  it("applies the new success variant properly", () => {
    const { container } = render(
      <CallToAction title="Success" variant="success" />,
    );

    expect(container.firstChild).toHaveClass(
      "rst:bg-success-100",
      "rst:dark:bg-success-900/30",
    );
  });

  // info variant test
  it("applies the new info variant properly", () => {
    const { container } = render(<CallToAction title="Info" variant="info" />);

    expect(container.firstChild).toHaveClass(
      /* `info-*`, not Tailwind's stock `blue-*`. Roster ships the ramp,
         and the old classes resolved to a palette no `--roster-*` override
         could reach. */
      "rst:bg-info-100",
      "rst:dark:bg-info-900/30",
    );
  });

  it("passes additional HTML attributes through", () => {
    render(
      <CallToAction title="Attrs" data-testid="cta-wrapper" id="custom-id" />,
    );

    const wrapper = screen.getByTestId("cta-wrapper");
    expect(wrapper).toHaveAttribute("id", "custom-id");
  });

  it("merges custom classNames with variants", () => {
    const { container } = render(
      <CallToAction title="Custom" className="rst:my-custom-class" />,
    );

    expect(container.firstChild).toHaveClass("rst:my-custom-class");
    // Should still have base variants
    /* `flex` moved to the inner layout element: the card is the container
       query host and an element cannot query itself, so the row/column switch
       had to live one level in. The card keeps its own chrome. */
    expect(container.firstChild).toHaveClass(
      "rst:relative",
      "rst:rounded-lg",
      "rst:@container",
    );
  });

  it("draws a -600 border on every variant", () => {
    /* The load-bearing half of the surface fix, and it was unguarded: the
       fills had assertions and the borders had none, so reverting -600 to
       -200 left the suite green. The fill only reaches 1.12:1 against a light
       page; the border is what makes the block visible. */
    const borders = {
      primary: "rst:border-primary-600",
      neutral: "rst:border-gray-600",
      warning: "rst:border-amber-600",
      error: "rst:border-error-600",
      success: "rst:border-success-600",
      info: "rst:border-info-600",
    } as const;

    for (const [variant, expected] of Object.entries(borders)) {
      const { container, unmount } = render(
        <CallToAction
          title={`${variant} border`}
          variant={variant as keyof typeof borders}
        />,
      );
      expect(container.firstChild).toHaveClass(expected);
      unmount();
    }
  });

  it("keeps the neutral variant on a white fill", () => {
    /* Deepening this one to gray-100 measured 1.04:1 against the page, which
       is exactly what white already measured — it would have traded the
       raised-white-card reading for no contrast at all. */
    const { container } = render(
      <CallToAction title="Neutral" variant="neutral" />,
    );
    expect(container.firstChild).toHaveClass("rst:bg-white");
    expect(container.firstChild).not.toHaveClass("rst:bg-gray-100");
  });

  it("gives the action full width in a narrow card and hands it back in a wide one", () => {
    const { container } = render(
      <CallToAction title="With action" action={<button>Go</button>} />,
    );
    const wrapper = container.querySelector("button")!.parentElement!;

    /* Full width in a narrow card, natural width in a wide one — keyed to the
       CARD's width, not the window's. `md:` was the bug: a 228px card on a
       1200px page laid out as a row and squeezed the text column until it
       overflowed. */
    expect(wrapper).toHaveClass("rst:w-full", "rst:@[32rem]:w-auto");
    expect(wrapper).not.toHaveClass("rst:self-end");
  });

});
