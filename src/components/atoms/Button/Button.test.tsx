import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Button } from "./Button";
import "@testing-library/jest-dom";

describe("Button Component", () => {
  it("renders children correctly", () => {
    render(<Button>Click Me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("handles onClick events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows spinner with 'current' variant and shrink-0 protection when isLoading is true", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button isLoading onClick={handleClick}>
        Submit
      </Button>,
    );

    const button = screen.getByRole("button");

    /* Busy, not disabled: a native `disabled` would drop focus to the page. */
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/submit/i)).toBeInTheDocument();

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("rst:border-current");
    expect(spinner).toHaveAttribute("aria-label", "loading");

    expect(spinner.parentElement).toHaveClass(
      "rst:shrink-0",
      "rst:flex",
      "rst:items-center",
    );

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("names the spinner with loadingLabel", () => {
    render(<Button isLoading loadingLabel="enviando">Enviar</Button>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "enviando");
  });

  it("doesn't send its form a second time while loading, and does when it isn't", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const { rerender } = render(
      <form onSubmit={submit}>
        <Button type="submit" isLoading>Save</Button>
      </form>,
    );
    await user.click(screen.getByRole("button"));
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(submit).not.toHaveBeenCalled();

    /* The twin: the same button, done loading, submits. */
    rerender(
      <form onSubmit={submit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    await user.click(screen.getByRole("button"));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("lets Tab leave a loading button even when the app handles its keys", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <>
        <Button isLoading onKeyDown={onKeyDown}>Save</Button>
        <Button>Next</Button>
      </>,
    );
    screen.getByRole("button", { name: /save/i }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it("ignores every press handler while loading, and keeps hover ones", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const log = (name: string) => () => calls.push(name);
    render(
      <Button
        isLoading
        onClickCapture={log("clickCapture")}
        onDoubleClick={log("doubleClick")}
        onPointerDownCapture={log("pointerDownCapture")}
        onMouseUp={log("mouseUp")}
        onMouseEnter={log("mouseEnter")}
      >
        Save
      </Button>,
    );
    await user.dblClick(screen.getByRole("button"));
    expect(calls).toEqual(["mouseEnter"]);
  });

  it("stays natively disabled when disabled, loading or not", () => {
    render(
      <>
        <Button disabled isLoading>Both</Button>
        <Button disabled>Disabled</Button>
      </>,
    );
    const both = screen.getByRole("button", { name: /both/i });
    expect(both).toBeDisabled();
    expect(both).not.toHaveAttribute("aria-busy");
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("adds no aria-disabled or aria-busy when it isn't loading", () => {
    render(<Button>Plain</Button>);
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Can't Click</Button>);
    const button = screen.getByRole("button", { name: /can't click/i });
    expect(button).toBeDisabled();
  });

  it("renders startIcon and endIcon correctly with shrink-0 protection", () => {
    render(
      <Button
        startIcon={<span data-testid="start-icon">Start</span>}
        endIcon={<span data-testid="end-icon">End</span>}
      >
        Content
      </Button>,
    );

    const startIcon = screen.getByTestId("start-icon");
    const endIcon = screen.getByTestId("end-icon");

    expect(startIcon).toBeInTheDocument();
    expect(endIcon).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();

    expect(startIcon.parentElement).toHaveClass("rst:shrink-0", "rst:inline-flex");
    expect(endIcon.parentElement).toHaveClass("rst:shrink-0", "rst:inline-flex");
  });

  it("applies outline variant and color scheme classes correctly", () => {
    render(
      <Button variant="outline" colorScheme="error">
        Error Button
      </Button>,
    );

    const button = screen.getByRole("button", { name: /error button/i });

    expect(button).toHaveClass("rst:border", "rst:border-error-600", "rst:text-error-600");
  });

  it("applies soft variant classes with the light mode colors", () => {
    render(
      <Button variant="soft" colorScheme="teal">
        Soft Teal
      </Button>,
    );

    const button = screen.getByRole("button", { name: /soft teal/i });

    expect(button).toHaveClass("rst:bg-teal-100", "rst:text-teal-800");
  });

  it("applies the correct scale classes for the xs size", () => {
    render(<Button size="xs">Tiny Button</Button>);

    const button = screen.getByRole("button", { name: /tiny button/i });

    expect(button).toHaveClass("rst:h-7", "rst:px-2", "rst:text-xs");
  });

  describe("a long label", () => {
    /* Measured as rendered in Button.wrap.checks.stories.tsx; these pin the
       classes each part asks for. */
    it("wraps, centered and balanced, and grows only past its size's height", () => {
      render(<Button>Save changes</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("rst:whitespace-normal", "rst:text-center", "rst:text-balance", "rst:min-w-fit", "rst:min-h-fit", "rst:h-10");
      expect(button).not.toHaveClass("rst:whitespace-nowrap");
      /* The size's padding is half its height less a line, less the border. */
      expect(button.className).toContain("rst:py-[calc((--spacing(10)-var(--rst-line,1.25rem))/2-var(--roster-border-width,1px))]");
      expect(button).not.toHaveClass("rst:py-2");
    });

    it("lets a caller's own padding win", () => {
      render(<Button className="rst:py-3">Save changes</Button>);
      expect(screen.getByRole("button").className).not.toContain("rst:py-[calc");
    });

    it("keeps its icons beside the first line and the last, in one row", () => {
      render(
        <Button startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
          Content
        </Button>,
      );
      const row = screen.getByText("Content");
      expect(row).toHaveClass("rst:flex", "rst:grow", "rst:min-w-0", "rst:[justify-content:inherit]", "rst:[gap:inherit]");
      expect(screen.getByTestId("start").parentElement).toHaveClass("rst:supports-[height:1lh]:self-start", "rst:supports-[height:1lh]:h-[1lh]");
      expect(screen.getByTestId("end").parentElement).toHaveClass("rst:supports-[height:1lh]:self-end", "rst:supports-[height:1lh]:h-[1lh]");
    });

    it("puts the spinner beside the first line", () => {
      render(<Button isLoading>Saving</Button>);
      expect(screen.getByRole("status").parentElement).toHaveClass("rst:supports-[height:1lh]:self-start");
    });

    it("keeps the icon button's square", () => {
      render(<Button size="icon" aria-label="Close" />);
      expect(screen.getByRole("button")).toHaveClass("rst:h-10", "rst:w-10");
      expect(screen.getByRole("button").className).not.toContain("rst:py-[");
    });
  });

  describe("singleLine", () => {
    it("stays on one line, shrinks to its container and cuts its text with an ellipsis", () => {
      render(
        <Button singleLine startIcon={<span data-testid="icon" />}>
          A label far too long
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("rst:whitespace-nowrap", "rst:max-w-full", "rst:min-w-0");
      expect(button).not.toHaveClass("rst:whitespace-normal", "rst:min-w-fit");
      expect(screen.getByText("A label far too long")).toHaveClass("rst:truncate");
      /* An element child passes through, not into the cut. */
      expect(screen.getByTestId("icon").closest(".rst\\:truncate")).toBeNull();
    });

    it("keeps the whole label as its name", () => {
      render(<Button singleLine>A label far too long</Button>);
      expect(screen.getByRole("button", { name: "A label far too long" })).toBeInTheDocument();
    });

    it("wraps no text without it", () => {
      render(<Button>A label</Button>);
      expect(screen.getByText("A label")).not.toHaveClass("rst:truncate");
    });
  });

  it("forwards refs to the HTML element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Test</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
