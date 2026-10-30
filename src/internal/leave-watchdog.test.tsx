import { useEffect, useRef, useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LEAVE_MARGIN_MS, useLeaveWatchdog } from "./leave-watchdog";

/* Headless UI's part, played by hand: the dialog is mounted while open, and
   after a close until `release()` (its leave ending), or forever if nothing
   releases it. Remounted closed, as the watchdog's `key` does, it's gone. */
const headless = { release: () => {}, afterLeave: () => {} };

function FakeHeadlessDialog({ open, rootRef }: { open: boolean; rootRef: React.RefObject<HTMLDivElement | null> }) {
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  useEffect(() => {
    headless.release = () => setShown(false);
  }, []);
  return shown ? <div ref={rootRef} data-testid="dialog" /> : null;
}

function Harness({ open, onAfterClose }: { open: boolean; onAfterClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leave = useLeaveWatchdog(rootRef, open, LEAVE_MS, onAfterClose);
  useEffect(() => {
    headless.afterLeave = leave.afterLeave;
  }, [leave.afterLeave]);
  return <FakeHeadlessDialog key={leave.key} open={open} rootRef={rootRef} />;
}

const LEAVE_MS = 200;
const DEADLINE = LEAVE_MS + LEAVE_MARGIN_MS;
const mounted = () => screen.queryByTestId("dialog") !== null;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

/* Opened, then closed: the start of every case. */
function openThenClose(onAfterClose = vi.fn()) {
  const view = render(<Harness open={false} onAfterClose={onAfterClose} />);
  view.rerender(<Harness open onAfterClose={onAfterClose} />);
  view.rerender(<Harness open={false} onAfterClose={onAfterClose} />);
  return { ...view, onAfterClose };
}

/* What `getAnimations` would list on the dialog: a transition has
   `transitionProperty`, a CSS animation (a spinner) doesn't. */
function animating(list: { transitionProperty?: string; playState: string }[]) {
  screen.getByTestId("dialog").getAnimations = () => list as unknown as Animation[];
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useLeaveWatchdog", () => {
  it("leaves a close that ends to Headless UI, and reports it once", () => {
    const { onAfterClose } = openThenClose();
    advance(LEAVE_MS);
    act(() => headless.afterLeave());
    act(() => headless.release());
    advance(DEADLINE * 4);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([false, 1]);
  });

  it("removes a dialog left mounted with nothing running, after the leave and the margin, and reports it once", () => {
    const { onAfterClose } = openThenClose();
    advance(DEADLINE - 1);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([true, 0]);
    advance(1);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([false, 1]);
    /* Headless UI's own call, if it comes late, is not a second close. */
    act(() => headless.afterLeave());
    advance(DEADLINE * 4);
    expect(onAfterClose).toHaveBeenCalledTimes(1);
  });

  it("finds the dialog gone when it reports", () => {
    const seen: boolean[] = [];
    openThenClose(vi.fn(() => seen.push(mounted())));
    advance(DEADLINE);
    expect(seen).toEqual([false]);
  });

  it("waits while a transition runs, then removes the dialog once it stops", () => {
    const { onAfterClose } = openThenClose();
    const leaving = { transitionProperty: "opacity", playState: "running" };
    animating([leaving]);
    advance(DEADLINE);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([true, 0]);
    leaving.playState = "finished";
    advance(LEAVE_MARGIN_MS);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([false, 1]);
  });

  it("doesn't wait for an animation that isn't a transition, like a spinner inside", () => {
    const { onAfterClose } = openThenClose();
    animating([{ playState: "running" }]);
    advance(DEADLINE);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([false, 1]);
  });

  it("removes a backdrop left behind after the panel's afterLeave, without a second report", () => {
    const { onAfterClose } = openThenClose();
    advance(LEAVE_MS);
    act(() => headless.afterLeave());
    expect(onAfterClose).toHaveBeenCalledTimes(1);
    advance(DEADLINE);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([false, 1]);
  });

  it("calls afterLeave's report once however often it comes", () => {
    const { onAfterClose } = openThenClose();
    act(() => {
      headless.afterLeave();
      headless.afterLeave();
    });
    expect(onAfterClose).toHaveBeenCalledTimes(1);
  });

  it("stops watching when the dialog reopens during the leave, and that close never reports", () => {
    const { onAfterClose, rerender } = openThenClose();
    advance(100);
    rerender(<Harness open onAfterClose={onAfterClose} />);
    act(() => headless.afterLeave());
    advance(DEADLINE * 4);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([true, 0]);
  });

  it("reports nothing when it unmounts during the leave", () => {
    const { onAfterClose, unmount } = openThenClose();
    advance(100);
    unmount();
    advance(DEADLINE * 4);
    expect(onAfterClose).not.toHaveBeenCalled();
  });

  it("ignores afterLeave while open, and a dialog that never opened", () => {
    const onAfterClose = vi.fn();
    const view = render(<Harness open={false} onAfterClose={onAfterClose} />);
    act(() => headless.afterLeave());
    view.rerender(<Harness open={false} onAfterClose={onAfterClose} />);
    advance(DEADLINE * 4);
    view.rerender(<Harness open onAfterClose={onAfterClose} />);
    act(() => headless.afterLeave());
    advance(DEADLINE * 4);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([true, 0]);
  });

  it("watches every close, not only the first", () => {
    const { onAfterClose, rerender } = openThenClose();
    advance(DEADLINE);
    rerender(<Harness open onAfterClose={onAfterClose} />);
    rerender(<Harness open={false} onAfterClose={onAfterClose} />);
    advance(DEADLINE);
    expect([mounted(), onAfterClose.mock.calls.length]).toEqual([false, 2]);
  });

  it("calls the onAfterClose it was last given", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = openThenClose(first);
    rerender(<Harness open={false} onAfterClose={latest} />);
    advance(DEADLINE);
    expect([first.mock.calls.length, latest.mock.calls.length]).toEqual([0, 1]);
  });
});
