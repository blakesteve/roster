import { useRef, useState, type ReactNode } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { Sheet, type SheetProps } from "./Sheet";
import { pageRegions, hiddenFromAssistiveTech } from "../../../test/page-regions";

/* Headless UI keeps a panel mounted while it transitions, so these tests
   assert state (`aria-modal`, `inert`, focus, callbacks) rather than whether a
   node is in the document, wherever the two could disagree. */

function Harness({
  initiallyOpen = false,
  sheet,
  children = <p>Body text</p>,
}: {
  initiallyOpen?: boolean;
  sheet?: Partial<SheetProps>;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details" {...sheet}>
        {children}
      </Sheet>
    </>
  );
}

const dialog = () => screen.getByRole("dialog");
const panel = () => screen.getByTestId("sheet-panel");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sheet", () => {
  describe("ARIA", () => {
    it("is a modal dialog named by its title and described by its description", async () => {
      render(<Harness initiallyOpen sheet={{ description: "More about this item" }} />);
      const d = await screen.findByRole("dialog");
      expect(d).toHaveAttribute("aria-modal", "true");
      expect(d).toHaveAccessibleName("Details");
      expect(d).toHaveAccessibleDescription("More about this item");
      expect(screen.getByRole("heading", { level: 2, name: "Details" })).toBeInTheDocument();
    });

    it("has no aria-describedby without a description", async () => {
      render(<Harness initiallyOpen />);
      expect(await screen.findByRole("dialog")).not.toHaveAttribute("aria-describedby");
    });

    it("keeps the title as the name when it is hidden", async () => {
      render(<Harness initiallyOpen sheet={{ hideTitle: true }} />);
      expect(await screen.findByRole("dialog")).toHaveAccessibleName("Details");
      expect(screen.getByRole("heading", { name: "Details" })).toHaveClass("rst:sr-only");
    });

    it("sets aria-busy on the content region only while busy", async () => {
      const { rerender } = render(
        <Sheet isOpen onClose={vi.fn()} title="Details" busy>
          <p>Loading</p>
        </Sheet>,
      );
      await screen.findByRole("dialog");
      expect(screen.getByTestId("sheet-content")).toHaveAttribute("aria-busy", "true");
      rerender(
        <Sheet isOpen onClose={vi.fn()} title="Details">
          <p>Loaded</p>
        </Sheet>,
      );
      expect(screen.getByTestId("sheet-content")).not.toHaveAttribute("aria-busy");
    });

    it("makes the rest of the page inert while open, and only then", async () => {
      /* Headless UI sets the `inert` PROPERTY, which a browser reflects to
         the attribute and jsdom does not, so this reads the property. The
         Default story checks the attribute in a real browser. */
      const { container } = render(<Harness />);
      const inert = () => (container as HTMLElement & { inert?: boolean }).inert;
      expect(inert()).toBeFalsy();
      await userEvent.click(screen.getByText("Open"));
      await screen.findByRole("dialog");
      await waitFor(() => expect(inert()).toBe(true));
      expect(container).toHaveAttribute("aria-hidden", "true");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(inert()).toBeFalsy());
      expect(container).not.toHaveAttribute("aria-hidden");
    });

    it("marks the header and footer beside it too, and restores them after", async () => {
      /* Headless UI marks only the body child the sheet is rendered from. */
      const page = pageRegions();
      page.header.setAttribute("aria-hidden", "false");
      try {
        render(<Harness />, { container: page.main });
        await userEvent.click(screen.getByText("Open"));
        await screen.findByRole("dialog");
        await waitFor(() => expect(hiddenFromAssistiveTech(page.main)).toBe(true));
        expect(hiddenFromAssistiveTech(page.header)).toBe(true);
        expect(hiddenFromAssistiveTech(page.footer)).toBe(true);

        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(hiddenFromAssistiveTech(page.main)).toBe(false));
        expect(hiddenFromAssistiveTech(page.footer)).toBe(false);
        expect(page.footer).not.toHaveAttribute("aria-hidden");
        /* What the page had, not a blank. */
        expect(page.header).toHaveAttribute("aria-hidden", "false");
      } finally {
        page.remove();
      }
    });

    it.each([
      ["while open", false],
      ["part-way through closing", true],
    ])("gives the whole page back when unmounted %s", async (_, closeFirst) => {
      /* A route change unmounts a sheet without closing it. */
      const page = pageRegions();
      try {
        const { unmount } = render(<Harness />, { container: page.main });
        await userEvent.click(screen.getByText("Open"));
        await screen.findByRole("dialog");
        await waitFor(() => expect(hiddenFromAssistiveTech(page.main)).toBe(true));
        await waitFor(() => expect(hiddenFromAssistiveTech(page.header)).toBe(true));
        if (closeFirst) await userEvent.keyboard("{Escape}");
        unmount();
        await waitFor(() => {
          for (const el of [page.header, page.main, page.footer]) {
            expect(hiddenFromAssistiveTech(el)).toBe(false);
          }
        });
      } finally {
        page.remove();
      }
    });
  });

  describe("dismissing", () => {
    it("closes on Escape", async () => {
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      await userEvent.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("closes on a backdrop click", async () => {
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      await userEvent.click(screen.getByTestId("sheet-backdrop"));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not close on a click inside the panel", async () => {
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details"><p>Body text</p></Sheet>);
      await screen.findByRole("dialog");
      await userEvent.click(screen.getByText("Body text"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the close button, which is always there", async () => {
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details" dragToDismiss={false}>x</Sheet>);
      const close = await screen.findByRole("button", { name: "Close" });
      await userEvent.click(close);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("gives the close button a 44x44 box and an inline SVG, not Font Awesome", async () => {
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      const close = await screen.findByRole("button", { name: "Close" });
      expect(close).toHaveClass("rst:size-11");
      const svg = close.querySelector("svg")!;
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).not.toHaveClass("svg-inline--fa");
      expect(svg).not.toHaveAttribute("data-icon");
    });
  });

  describe("drag to dismiss", () => {
    /* The thresholds are the drag function's, tested with literals in
       sheet-drag.test.ts. These check the wiring: where a drag may start, the
       axis lock, the tap slop, and click suppression. The panel is given a
       600px height, since jsdom has none. */
    const height600 = () =>
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
        () => ({ top: 0, left: 0, width: 375, height: 600, right: 375, bottom: 600, x: 0, y: 0 }) as DOMRect,
      );

    /* jsdom stamps events with `Date.now()`, so a drag's speed would depend
       on whether its events happened to straddle a millisecond. The clock is
       held still instead, and each step advances it by `stepMs`: 50ms a step
       is a slow, deliberate pull, well under the 0.5 px/ms flick. */
    const drag = (
      el: Element,
      moves: Array<[number, number]>,
      pointerType = "touch",
      stepMs = 50,
    ) => {
      const now = vi.spyOn(Date, "now");
      let t = 1_000_000;
      const at = () => now.mockReturnValue((t += stepMs));
      at();
      fireEvent.pointerDown(el, { pointerId: 1, pointerType, button: 0, clientX: 100, clientY: 100 });
      for (const [dx, dy] of moves) {
        at();
        fireEvent.pointerMove(el, { pointerId: 1, pointerType, clientX: 100 + dx, clientY: 100 + dy });
      }
      const [dx, dy] = moves[moves.length - 1] ?? [0, 0];
      at();
      fireEvent.pointerUp(el, { pointerId: 1, pointerType, clientX: 100 + dx, clientY: 100 + dy });
      now.mockRestore();
    };

    it("closes on a drag down the handle past 30%", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      drag(screen.getByTestId("sheet-handle"), [[0, 20], [0, 100], [0, 200]]);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("closes on a drag down the header, too", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      drag(await screen.findByRole("heading", { name: "Details" }), [[0, 20], [0, 200]]);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("springs back and stays on a short drag", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      /* 100px of 600 is under 30%. 20px every 50ms, then a last step in
         place: 20px over the final 100ms, 0.2 px/ms, under the flick. */
      drag(screen.getByTestId("sheet-handle"), [[0, 20], [0, 40], [0, 60], [0, 80], [0, 100], [0, 100]]);
      expect(onClose).not.toHaveBeenCalled();
      expect(panel().style.getPropertyValue("--rst-sheet-drag")).toBe("0px");
      expect(panel()).not.toHaveAttribute("data-dragging");
    });

    it("closes on a short, fast flick", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      /* 40px in 3 steps of 10ms: 1.5 px/ms over the last 100ms, past 16px. */
      drag(screen.getByTestId("sheet-handle"), [[0, 10], [0, 25], [0, 40]], "touch", 10);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("follows the finger while dragging, and never above its resting place", async () => {
      height600();
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      const handle = screen.getByTestId("sheet-handle");
      await screen.findByRole("dialog");
      fireEvent.pointerDown(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
      fireEvent.pointerMove(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 150 });
      expect(panel().style.getPropertyValue("--rst-sheet-drag")).toBe("50px");
      expect(panel()).toHaveAttribute("data-dragging");
      fireEvent.pointerMove(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 60 });
      expect(panel().style.getPropertyValue("--rst-sheet-drag")).toBe("0px");
    });

    it("never starts from the content, so reading never dismisses", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details"><p>Body text</p></Sheet>);
      await screen.findByRole("dialog");
      drag(screen.getByText("Body text"), [[0, 20], [0, 400]]);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("leaves a drag that starts sideways to the content", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      /* 12px right and 6px down by the time it stops being a tap. */
      drag(screen.getByTestId("sheet-handle"), [[12, 6], [20, 300]]);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("lets a tap within 8px click a header button", async () => {
      height600();
      const onAction = vi.fn();
      render(
        <Sheet isOpen onClose={vi.fn()} title="Details" actions={<button onClick={onAction}>Next</button>}>
          x
        </Sheet>,
      );
      const next = await screen.findByRole("button", { name: "Next" });
      fireEvent.pointerDown(next, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
      fireEvent.pointerMove(next, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 108 });
      fireEvent.pointerUp(next, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 108 });
      fireEvent.click(next);
      expect(onAction).toHaveBeenCalledOnce();
    });

    it("does not click a header button a drag started on", async () => {
      height600();
      const onAction = vi.fn();
      render(
        <Sheet isOpen onClose={vi.fn()} title="Details" actions={<button onClick={onAction}>Next</button>}>
          x
        </Sheet>,
      );
      const next = await screen.findByRole("button", { name: "Next" });
      drag(next, [[0, 20], [0, 60]]);
      // `detail: 1`: a click that came from a pointer.
      fireEvent.click(next, { detail: 1 });
      expect(onAction).not.toHaveBeenCalled();

      // And the next genuine click is not swallowed.
      fireEvent.pointerDown(next, { pointerId: 2, pointerType: "touch", clientX: 100, clientY: 100 });
      fireEvent.pointerUp(next, { pointerId: 2, pointerType: "touch", clientX: 100, clientY: 100 });
      fireEvent.click(next, { detail: 1 });
      expect(onAction).toHaveBeenCalledOnce();
    });

    it("never swallows a keyboard click, even straight after a drag", async () => {
      /* A touch drag fires no click after it, so the suppression can still be
         armed when Enter arrives on a header button. */
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      const header = await screen.findByRole("heading", { name: "Details" });
      drag(header, [[0, 20], [0, 60]]);
      const close = screen.getByRole("button", { name: "Close" });
      close.focus();
      await userEvent.keyboard("{Enter}");
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("ignores a second finger while one is dragging", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      const handle = await screen.findByTestId("sheet-handle");
      fireEvent.pointerDown(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
      fireEvent.pointerMove(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 200 });
      // A second finger taps the header, then lifts.
      const header = screen.getByRole("heading", { name: "Details" });
      fireEvent.pointerDown(header, { pointerId: 2, pointerType: "touch", clientX: 50, clientY: 150 });
      fireEvent.pointerUp(header, { pointerId: 2, pointerType: "touch", clientX: 50, clientY: 150 });
      // The first finger carries on and releases past 30%.
      fireEvent.pointerMove(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 350 });
      fireEvent.pointerUp(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 350 });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("hands the drag's offset to the leave, with the drag's own styling off", async () => {
      /* The leave transition starts from where the finger let go: the offset
         stays, and `data-dragging` (which turns transitions off) does not. */
      height600();
      render(<Sheet isOpen onClose={() => {}} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      drag(screen.getByTestId("sheet-handle"), [[0, 20], [0, 100], [0, 250]]);
      expect(panel().style.getPropertyValue("--rst-sheet-drag")).toBe("250px");
      expect(panel()).not.toHaveAttribute("data-dragging");
    });

    it("goes back up when the consumer refuses the close", async () => {
      height600();
      const refuse = vi.fn();
      render(<Sheet isOpen onClose={refuse} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      drag(screen.getByTestId("sheet-handle"), [[0, 20], [0, 100], [0, 250]]);
      expect(refuse).toHaveBeenCalledOnce();
      await waitFor(() => expect(panel().style.getPropertyValue("--rst-sheet-drag")).toBe("0px"));
    });

    it("lets go of a drag when closed by something else mid-drag", async () => {
      height600();
      const { rerender } = render(<Sheet isOpen onClose={() => {}} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      const handle = screen.getByTestId("sheet-handle");
      fireEvent.pointerDown(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
      fireEvent.pointerMove(handle, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 180 });
      expect(panel()).toHaveAttribute("data-dragging");
      rerender(<Sheet isOpen={false} onClose={() => {}} title="Details">x</Sheet>);
      expect(panel()).not.toHaveAttribute("data-dragging");
      expect(panel().style.getPropertyValue("--rst-sheet-drag")).toBe("80px");
    });

    it("drags with a mouse from the handle, but not from the header", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      drag(screen.getByRole("heading", { name: "Details" }), [[0, 20], [0, 300]], "mouse");
      expect(onClose).not.toHaveBeenCalled();
      drag(screen.getByTestId("sheet-handle"), [[0, 20], [0, 300]], "mouse");
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does nothing with dragToDismiss off", async () => {
      height600();
      const onClose = vi.fn();
      render(<Sheet isOpen onClose={onClose} title="Details" dragToDismiss={false}>x</Sheet>);
      await screen.findByRole("dialog");
      drag(screen.getByTestId("sheet-handle"), [[0, 20], [0, 400]]);
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId("sheet-drag-zone")).not.toHaveClass("rst:touch-none");
    });

    it("stops the browser panning on the drag zone, and only there", async () => {
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      expect(screen.getByTestId("sheet-drag-zone")).toHaveClass("rst:touch-none");
      expect(screen.getByTestId("sheet-content")).not.toHaveClass("rst:touch-none");
      expect(screen.getByTestId("sheet-content")).toHaveClass("rst:overscroll-contain", "rst:overflow-y-auto");
    });
  });

  describe("focus", () => {
    it("goes to the close button on open", async () => {
      render(<Harness />);
      await userEvent.click(screen.getByText("Open"));
      await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    });

    it("goes to the close button even when header actions come first", async () => {
      /* The actions sit before the close button in the DOM, so "the first
         focusable element" would be Previous. */
      render(
        <Sheet isOpen onClose={vi.fn()} title="Details" actions={<button>Previous</button>}>
          <button>In the content</button>
        </Sheet>,
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    });

    it("goes to the close button on a touch device too", async () => {
      /* On a coarse pointer Headless UI skips `initialFocus` and focuses the
         dialog element, to keep the keyboard down. The close button opens
         no keyboard, so the sheet puts focus there itself. */
      vi.spyOn(window, "matchMedia").mockImplementation(
        (query: string) =>
          ({
            matches: query.includes("pointer: coarse"),
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );
      render(<Harness />);
      await userEvent.click(screen.getByText("Open"));
      await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    });

    it("goes to initialFocus when given", async () => {
      function WithInitial() {
        const ref = useRef<HTMLInputElement>(null);
        return (
          <Sheet isOpen onClose={vi.fn()} title="Details" initialFocus={ref}>
            <input ref={ref} aria-label="Search" />
          </Sheet>
        );
      }
      render(<WithInitial />);
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus());
    });

    it("returns to the opener on close", async () => {
      render(<Harness />);
      const opener = screen.getByText("Open");
      await userEvent.click(opener);
      await screen.findByRole("dialog");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(opener).toHaveFocus());
    });

    it("returns to the opener from the close button too", async () => {
      render(<Harness />);
      const opener = screen.getByText("Open");
      await userEvent.click(opener);
      await userEvent.click(await screen.findByRole("button", { name: "Close" }));
      await waitFor(() => expect(opener).toHaveFocus());
    });

    it("returns to returnFocus instead, when given", async () => {
      function WithReturn() {
        const [open, setOpen] = useState(false);
        const target = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <button ref={target}>Somewhere else</button>
            <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details" returnFocus={target}>
              x
            </Sheet>
          </>
        );
      }
      render(<WithReturn />);
      await userEvent.click(screen.getByText("Open"));
      await screen.findByRole("dialog");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.getByText("Somewhere else")).toHaveFocus());
      // And it stays there once everything has settled.
      await act(() => new Promise((r) => setTimeout(r, 50)));
      expect(screen.getByText("Somewhere else")).toHaveFocus();
    });

    it("gives a deep-linked sheet somewhere to return to", async () => {
      /* Open on first render, as from a URL: nothing was focused before it,
         so without returnFocus focus would fall to <body>. */
      function DeepLinked() {
        const [open, setOpen] = useState(true);
        const heading = useRef<HTMLHeadingElement>(null);
        return (
          <>
            <h1 ref={heading} tabIndex={-1}>Page</h1>
            <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details" returnFocus={heading}>
              x
            </Sheet>
          </>
        );
      }
      render(<DeepLinked />);
      await screen.findByRole("dialog");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.getByText("Page")).toHaveFocus());
    });
  });

  describe("content swap", () => {
    it("moves focus to the new title, without re-mounting or re-animating", async () => {
      const onAfterClose = vi.fn();
      const { rerender } = render(
        <Sheet isOpen onClose={vi.fn()} onAfterClose={onAfterClose} title="First item">
          <p>First body</p>
        </Sheet>,
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
      await waitFor(() => expect(panel()).not.toHaveAttribute("data-enter"));
      const before = panel();

      rerender(
        <Sheet isOpen onClose={vi.fn()} onAfterClose={onAfterClose} title="Second item">
          <p>Second body</p>
        </Sheet>,
      );

      const title = screen.getByRole("heading", { name: "Second item" });
      expect(title).toHaveFocus();
      expect(title).toHaveAttribute("tabindex", "-1");
      expect(dialog()).toHaveAccessibleName("Second item");
      /* The same panel node, still open and not transitioning: nothing left
         and nothing entered. */
      expect(panel()).toBe(before);
      expect(panel()).not.toHaveAttribute("data-closed");
      expect(panel()).not.toHaveAttribute("data-enter");
      expect(panel()).not.toHaveAttribute("data-leave");
      expect(onAfterClose).not.toHaveBeenCalled();
    });

    it("does not treat a title refined while busy as a swap", async () => {
      /* Opened with a provisional title while loading; the reader is already
         in a field when the real title arrives. Their place stays. */
      const { rerender } = render(
        <Sheet isOpen onClose={vi.fn()} title="Song" busy>
          <input aria-label="Note" />
        </Sheet>,
      );
      await screen.findByRole("dialog");
      const field = screen.getByRole("textbox", { name: "Note" });
      act(() => field.focus());
      rerender(
        <Sheet isOpen onClose={vi.fn()} title="Song, by Artist">
          <input aria-label="Note" />
        </Sheet>,
      );
      expect(field).toHaveFocus();
      expect(screen.getByRole("dialog")).toHaveAccessibleName("Song, by Artist");
    });

    it("starts a swapped-in body at its top", async () => {
      const { rerender } = render(<Sheet isOpen onClose={vi.fn()} title="First">a</Sheet>);
      await screen.findByRole("dialog");
      const content = screen.getByTestId("sheet-content");
      content.scrollTop = 120;
      expect(content.scrollTop).toBe(120);
      rerender(<Sheet isOpen onClose={vi.fn()} title="Second">b</Sheet>);
      expect(content.scrollTop).toBe(0);
    });

    it("counts a contentKey change as a swap under an unchanged title", async () => {
      const { rerender } = render(
        <Sheet isOpen onClose={vi.fn()} title="Details" contentKey={1}>a</Sheet>,
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
      rerender(<Sheet isOpen onClose={vi.fn()} title="Details" contentKey={2}>b</Sheet>);
      expect(screen.getByRole("heading", { name: "Details" })).toHaveFocus();
    });

    it("is not a swap when the title changes in the same render that opens it", async () => {
      /* Every focus is recorded, not only where it ends: the close button
         takes focus a moment later either way, so a stray focus on the title
         would otherwise go unseen. */
      const focused: string[] = [];
      const record = (e: FocusEvent) => focused.push((e.target as HTMLElement).tagName);
      document.addEventListener("focusin", record);
      try {
        const { rerender } = render(
          <Sheet isOpen={false} onClose={vi.fn()} title="Old">x</Sheet>,
        );
        rerender(<Sheet isOpen onClose={vi.fn()} title="New">x</Sheet>);
        await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
        expect(focused).not.toContain("H2");
      } finally {
        document.removeEventListener("focusin", record);
      }
    });

    it("takes a node as its title, named by the node's text", async () => {
      render(
        <Harness
          initiallyOpen
          sheet={{
            title: (
              <>
                Night of <time dateTime="2026-10-02">2 Oct</time>
              </>
            ),
          }}
        />,
      );
      expect(await screen.findByRole("dialog")).toHaveAccessibleName("Night of 2 Oct");
      expect(screen.getByRole("heading", { level: 2, name: "Night of 2 Oct" })).toBeInTheDocument();
    });

    it("does not count a node title re-created with the same words as a swap", async () => {
      /* A node is a new object every render. Compared as the prop, every
         re-render of the parent moved focus to the title. */
      function Rerendering() {
        const [n, setN] = useState(0);
        return (
          <Sheet
            isOpen
            onClose={() => {}}
            title={<span>Night of 2 Oct</span>}
            actions={<button onClick={() => setN((x) => x + 1)}>Re-render {n}</button>}
          >
            x
          </Sheet>
        );
      }
      render(<Rerendering />);
      const button = await screen.findByRole("button", { name: /Re-render/ });
      button.focus();
      await userEvent.click(button);
      await userEvent.click(button);
      expect(screen.getByRole("button", { name: "Re-render 2" })).toHaveFocus();
    });

    it("counts a node title whose words change as a swap", async () => {
      function Swapping() {
        const [n, setN] = useState(1);
        return (
          <Sheet
            isOpen
            onClose={() => {}}
            title={<span>Night {n}</span>}
            actions={<button onClick={() => setN((x) => x + 1)}>Next</button>}
          >
            x
          </Sheet>
        );
      }
      render(<Swapping />);
      await userEvent.click(await screen.findByRole("button", { name: "Next" }));
      expect(screen.getByRole("heading", { name: "Night 2" })).toHaveFocus();
    });

    it("still returns focus to the original opener after a swap", async () => {
      function Swapping() {
        const [open, setOpen] = useState(false);
        const [n, setN] = useState(1);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <Sheet
              isOpen={open}
              onClose={() => setOpen(false)}
              title={`Item ${n}`}
              actions={<button onClick={() => setN((x) => x + 1)}>Next</button>}
            >
              x
            </Sheet>
          </>
        );
      }
      render(<Swapping />);
      const opener = screen.getByText("Open");
      await userEvent.click(opener);
      await userEvent.click(await screen.findByRole("button", { name: "Next" }));
      expect(screen.getByRole("heading", { name: "Item 2" })).toHaveFocus();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(opener).toHaveFocus());
    });
  });

  describe("onAfterClose", () => {
    it("fires once the leave has finished, not when closing starts", async () => {
      const onAfterClose = vi.fn();
      const { rerender } = render(
        <Sheet isOpen onClose={vi.fn()} onAfterClose={onAfterClose} title="Details">x</Sheet>,
      );
      await screen.findByRole("dialog");
      rerender(<Sheet isOpen={false} onClose={vi.fn()} onAfterClose={onAfterClose} title="Details">x</Sheet>);
      expect(onAfterClose).not.toHaveBeenCalled();
      await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("motion", () => {
    const reduce = (on: boolean) =>
      vi.spyOn(window, "matchMedia").mockImplementation(
        (query: string) =>
          ({
            matches: on && query.includes("prefers-reduced-motion"),
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );

    it("slides the panel and fades the backdrop by default", async () => {
      reduce(false);
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      expect(panel()).toHaveClass(
        "rst:data-closed:translate-y-full",
        "rst:duration-(--roster-sheet-enter-duration)",
        "rst:data-leave:duration-(--roster-sheet-leave-duration)",
      );
      expect(panel()).not.toHaveClass("rst:data-closed:opacity-0");
      expect(screen.getByTestId("sheet-backdrop")).toHaveClass("rst:data-closed:opacity-0");
    });

    it("fades instead, with no slide, under reduced motion", async () => {
      reduce(true);
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      expect(panel()).toHaveClass(
        "rst:data-closed:opacity-0",
        "rst:transition-opacity",
        "rst:duration-(--roster-sheet-fade-duration)",
      );
      expect(panel()).not.toHaveClass("rst:data-closed:translate-y-full");
      expect(panel()).not.toHaveClass("rst:transition-transform");
      expect(screen.getByTestId("sheet-backdrop")).toHaveClass(
        "rst:duration-(--roster-sheet-fade-duration)",
      );
    });
  });

  describe("layout", () => {
    it("caps at 92dvh with rounded top corners and the safe area below", async () => {
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      expect(panel()).toHaveClass(
        "rst:max-h-[min(92dvh,var(--rst-sheet-keyboard-cap,92dvh))]",
        "rst:rounded-t-2xl",
        "rst:pb-[env(safe-area-inset-bottom)]",
        "rst:w-full",
        "rst:md:max-w-(--rst-sheet-max-width)",
      );
    });

    it("takes maxWidth as px, or as any CSS length", async () => {
      const { rerender } = render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      await screen.findByRole("dialog");
      expect(panel().style.getPropertyValue("--rst-sheet-max-width")).toBe("560px");
      rerender(<Sheet isOpen onClose={vi.fn()} title="Details" maxWidth="40rem">x</Sheet>);
      expect(panel().style.getPropertyValue("--rst-sheet-max-width")).toBe("40rem");
    });

    it("puts the actions in the header, before the close button", async () => {
      render(
        <Sheet isOpen onClose={vi.fn()} title="Details" actions={<button>Previous</button>}>
          x
        </Sheet>,
      );
      const previous = await screen.findByRole("button", { name: "Previous" });
      const close = screen.getByRole("button", { name: "Close" });
      expect(screen.getByTestId("sheet-drag-zone")).toContainElement(previous);
      expect(previous.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getByTestId("sheet-content")).not.toContainElement(previous);
    });

    it("makes the content a named, focusable region, so it scrolls from the keyboard", async () => {
      render(<Sheet isOpen onClose={vi.fn()} title="Details"><p>Body text</p></Sheet>);
      await screen.findByRole("dialog");
      const region = screen.getByRole("region", { name: "Details" });
      expect(region).toBe(screen.getByTestId("sheet-content"));
      expect(region).toHaveAttribute("tabindex", "0");
    });

    it("keeps the header out of the scroller, so it never covers focus", async () => {
      render(<Sheet isOpen onClose={vi.fn()} title="Details"><p>Body text</p></Sheet>);
      await screen.findByRole("dialog");
      const heading = screen.getByRole("heading", { name: "Details" });
      expect(screen.getByTestId("sheet-content")).not.toContainElement(heading);
      expect(screen.getByTestId("sheet-content")).toContainElement(screen.getByText("Body text"));
    });

    it("follows the visual viewport while a field inside has focus", async () => {
      const viewport = Object.assign(new EventTarget(), { height: 612.4 });
      Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
      try {
        render(
          <Sheet isOpen onClose={vi.fn()} title="Details">
            <input aria-label="Note" />
            <input type="checkbox" aria-label="Pin" />
          </Sheet>,
        );
        await screen.findByRole("dialog");
        const cap = () => panel().style.getPropertyValue("--rst-sheet-keyboard-cap");
        expect(cap()).toBe("");

        act(() => screen.getByRole("textbox", { name: "Note" }).focus());
        expect(cap()).toBe("612px");

        act(() => {
          viewport.height = 300;
          viewport.dispatchEvent(new Event("resize"));
        });
        expect(cap()).toBe("300px");

        // Leaving the field lets the sheet grow back.
        act(() => screen.getByRole("textbox", { name: "Note" }).blur());
        expect(cap()).toBe("");

        // A checkbox opens no keyboard.
        act(() => screen.getByRole("textbox", { name: "Note" }).focus());
        expect(cap()).toBe("300px");
        act(() => screen.getByRole("checkbox", { name: "Pin" }).focus());
        expect(cap()).toBe("");
      } finally {
        Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
      }
    });
  });

  describe("dark scope", () => {
    it("carries a scoped .dark across the portal", async () => {
      render(
        <div className="dark">
          <Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>
        </div>,
      );
      expect(await screen.findByRole("dialog")).toHaveClass("dark");
    });

    it("adds nothing outside one", async () => {
      render(<Sheet isOpen onClose={vi.fn()} title="Details">x</Sheet>);
      expect(await screen.findByRole("dialog")).not.toHaveClass("dark");
    });
  });
});
