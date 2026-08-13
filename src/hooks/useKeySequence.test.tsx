import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { useKeySequence, KONAMI_CODE } from "./useKeySequence";
import "@testing-library/jest-dom";

function Probe({
  sequence,
  onMatch,
  options,
}: {
  sequence: readonly string[];
  onMatch: () => void;
  options?: Parameters<typeof useKeySequence>[2];
}) {
  useKeySequence(sequence, onMatch, options);
  return (
    <div>
      <input aria-label="field" />
      <div contentEditable aria-label="editor" suppressContentEditableWarning />
    </div>
  );
}

describe("useKeySequence", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.useRealTimers());

  it("fires when the sequence is typed in order", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.keyboard("gi");
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it("does not fire on a partial sequence", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.keyboard("g");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("resets on a wrong key", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.keyboard("gxi");
    expect(onMatch).not.toHaveBeenCalled();
  });

  // "g g i" should still work: the second g restarts rather than costing a try.
  it("treats a repeated first key as a fresh start", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.keyboard("ggi");
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it("can fire more than once", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.keyboard("gigi");
    expect(onMatch).toHaveBeenCalledTimes(2);
  });

  it("matches case-insensitively by default", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.keyboard("GI");
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it("respects ignoreCase false", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} options={{ ignoreCase: false }} />);

    await userEvent.keyboard("GI");
    expect(onMatch).not.toHaveBeenCalled();
  });

  // A shortcut that fires while someone fills in a form is a bug.
  it("ignores keystrokes typed into an input", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.click(screen.getByLabelText("field"));
    await userEvent.keyboard("gi");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("ignores keystrokes typed into contenteditable", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} />);

    await userEvent.click(screen.getByLabelText("editor"));
    await userEvent.keyboard("gi");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("can be told to listen while typing", async () => {
    const onMatch = vi.fn();
    render(
      <Probe sequence={["g", "i"]} onMatch={onMatch} options={{ ignoreWhenTyping: false }} />,
    );

    await userEvent.click(screen.getByLabelText("field"));
    await userEvent.keyboard("gi");
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={["g", "i"]} onMatch={onMatch} options={{ enabled: false }} />);

    await userEvent.keyboard("gi");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("does nothing for an empty sequence", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={[]} onMatch={onMatch} />);

    await userEvent.keyboard("g");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("matches the Konami code", async () => {
    const onMatch = vi.fn();
    render(<Probe sequence={KONAMI_CODE} onMatch={onMatch} />);

    await userEvent.keyboard(
      "{ArrowUp}{ArrowUp}{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowRight}{ArrowLeft}{ArrowRight}ba{Enter}",
    );
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it("exposes the Konami code as a constant", () => {
    expect(KONAMI_CODE).toHaveLength(11);
    expect(KONAMI_CODE[0]).toBe("ArrowUp");
  });
});
