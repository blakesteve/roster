import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { Slider, type SliderSnapPoint } from "./Slider";

/* Structure, keys and the form, in jsdom. The pointer, the thumb's place and
   its targets are measured in Chromium and WebKit (Slider.checks.stories.tsx). */

const SURE: SliderSnapPoint[] = [
  { value: 100, label: "Certain" },
  { value: 75, label: "Likely" },
  { value: 50, label: "Toss-up" },
];

const state = (el: HTMLElement) => [el.getAttribute("aria-valuenow"), el.getAttribute("aria-valuetext")];

describe("Slider", () => {
  it("starts with the thumb in the middle, or at startValue, or at defaultValue over both", () => {
    render(
      <>
        <Slider label="Middle" />
        <Slider label="Start" startValue={0} />
        <Slider label="Default" startValue={0} defaultValue={80} />
        <Slider label="Odd" min={1} max={4} />
      </>,
    );
    const now = (name: string) => screen.getByRole("slider", { name }).getAttribute("aria-valuenow");
    /* The middle lands on a step: 2.5 isn't one, between 1 and 4. */
    expect(["Middle", "Start", "Default", "Odd"].map(now)).toEqual(["50", "0", "80", "3"]);
  });

  it("starts not set when asked: no number, no thumb, and says so", () => {
    const { container } = render(<Slider label="How sure" defaultValue={null} />);
    const slider = screen.getByRole("slider", { name: "How sure" });
    expect(state(slider)).toEqual([null, "Not set"]);
    expect([slider.getAttribute("aria-valuemin"), slider.getAttribute("aria-valuemax")]).toEqual(["0", "100"]);
    expect([container.querySelector("[data-slider-thumb]"), container.querySelector("[data-slider-fill]")]).toEqual([null, null]);
    expect(container.querySelector("[data-slider-readout]")).toHaveTextContent("Not set");
  });

  it("says its value with the nearest snap point's name", () => {
    render(<Slider label="How sure" defaultValue={72} snapPoints={SURE} formatValue={(v) => `${v}%`} />);
    expect(state(screen.getByRole("slider"))).toEqual(["72", "72%, Likely"]);
    /* The twin: with no snap points, just the number. */
    render(<Slider label="Plain" defaultValue={72} />);
    expect(state(screen.getByRole("slider", { name: "Plain" }))).toEqual(["72", "72"]);
  });

  it("places the thumb on the first arrow at the start value, and Home and End at the ends", async () => {
    render(
      <>
        <Slider label="Arrow" defaultValue={null} />
        <Slider label="Down" defaultValue={null} startValue={30} />
        <Slider label="Home" defaultValue={null} />
        <Slider label="End" defaultValue={null} />
        <Slider label="Page" defaultValue={null} />
      </>,
    );
    const press = async (name: string, key: string) => {
      screen.getByRole("slider", { name }).focus();
      await userEvent.keyboard(key);
      return screen.getByRole("slider", { name }).getAttribute("aria-valuenow");
    };
    /* Placed, not stepped: an arrow either way lands on the start, the middle
       by default. */
    expect([await press("Arrow", "{ArrowRight}"), await press("Down", "{ArrowLeft}"), await press("Home", "{Home}"), await press("End", "{End}"), await press("Page", "{PageUp}")]).toEqual([
      "50",
      "30",
      "0",
      "100",
      "50",
    ]);
  });

  it("steps by step and pageStep, stops at the ends, and leaves combinations alone", async () => {
    const onChange = vi.fn();
    render(<Slider label="Steps" defaultValue={95} step={5} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    /* At the end a key does nothing: no change reported. */
    expect(onChange.mock.calls).toEqual([[100]]);
    await userEvent.keyboard("{PageDown}");
    expect(slider).toHaveAttribute("aria-valuenow", "90");
    await userEvent.keyboard("{Meta>}{ArrowLeft}{/Meta}");
    expect(slider).toHaveAttribute("aria-valuenow", "90");
  });

  it("lands every value on a step, decimals included", async () => {
    render(<Slider label="Fine" min={0} max={1} step={0.1} defaultValue={0.2} />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "0.5");
  });

  it("moves to a snap point's value from its chip, and marks the chip it's on", async () => {
    const onCommit = vi.fn();
    render(<Slider label="Sure" snapPoints={SURE} onCommit={onCommit} />);
    /* It starts in the middle, which is a snap point's value, so that chip is marked. */
    expect(SURE.map((p) => screen.getByRole("button", { name: p.label }).getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
    await userEvent.click(screen.getByRole("button", { name: "Likely" }));
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "75");
    expect(SURE.map((p) => screen.getByRole("button", { name: p.label }).getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    expect(onCommit.mock.calls).toEqual([[75]]);
    /* Pressed again, a chip stays: it moves the value to itself, never away. */
    await userEvent.click(screen.getByRole("button", { name: "Likely" }));
    expect([screen.getByRole("slider").getAttribute("aria-valuenow"), onCommit.mock.calls.length]).toEqual(["75", 1]);
    /* The chips run in the track's order, low to high, whatever order they came in. */
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Toss-up", "Likely", "Certain"]);
    /* The twin: a step off it, and no chip is marked. */
    screen.getByRole("slider").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(SURE.map((p) => screen.getByRole("button", { name: p.label }).getAttribute("aria-pressed"))).toEqual(["false", "false", "false"]);
  });

  it("can be controlled, and cleared back to not set", async () => {
    function Clearable() {
      const [value, setValue] = useState<number | null>(40);
      return (
        <>
          <Slider label="Sure" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(null)}>
            Clear
          </button>
        </>
      );
    }
    const { container } = render(<Clearable />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "41");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect([...state(slider), container.querySelector("[data-slider-thumb]")]).toEqual([null, "Not set", null]);
    /* Cleared, the first key places it again. */
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  it("counts every key that arrives before a render", () => {
    const onChange = vi.fn();
    render(<Slider label="Burst" defaultValue={50} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    /* Three presses in one batch: React renders once, after all three. */
    act(() => {
      for (let i = 0; i < 3; i++) fireEvent.keyDown(slider, { key: "ArrowRight" });
    });
    expect([onChange.mock.calls, slider.getAttribute("aria-valuenow")]).toEqual([[[51], [52], [53]], "53"]);
  });

  it("steps from the value a controlling owner keeps, not one it turned down", async () => {
    const onChange = vi.fn();
    function AtLeastHalf() {
      const [value, setValue] = useState<number | null>(50);
      return (
        <Slider
          label="Half"
          value={value}
          onChange={(v) => {
            onChange(v);
            setValue(v === null ? v : Math.max(50, v));
          }}
        />
      );
    }
    render(<AtLeastHalf />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect([onChange.mock.calls, slider.getAttribute("aria-valuenow")]).toEqual([[[49], [49], [49]], "50"]);
    /* The twin: one press up is one step up from what it kept. */
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange.mock.calls.at(-1)).toEqual([51]);
  });

  it("keeps what it shows and says in range, and leaves out snap points outside it", () => {
    render(
      <>
        <Slider label="Over" value={150} />
        <Slider label="Under" value={-5} />
        <Slider label="Points" defaultValue={100} snapPoints={[...SURE, { value: 120, label: "Beyond" }]} />
      </>,
    );
    expect([screen.getByRole("slider", { name: "Over" }), screen.getByRole("slider", { name: "Under" })].map((s) => s.getAttribute("aria-valuenow"))).toEqual(["100", "0"]);
    expect([screen.queryByRole("button", { name: "Beyond" }), screen.getByRole("slider", { name: "Points" }).getAttribute("aria-valuetext")]).toEqual([null, "100, Certain"]);
  });

  it("steps to the next value on the grid from one off it, and never past an end", async () => {
    render(
      <>
        <Slider label="Thirds" min={0} max={1} step={0.3} defaultValue={1} />
        <Slider label="Halfway" min={0} max={2.5} step={1} defaultValue={2} />
        <Slider label="Tiny" min={0} max={1} step={1e-7} defaultValue={0} />
        <Slider label="Between" value={72.4} />
      </>,
    );
    const press = async (name: string, key: string) => {
      screen.getByRole("slider", { name }).focus();
      await userEvent.keyboard(key);
      return screen.getByRole("slider", { name }).getAttribute("aria-valuenow");
    };
    /* Left from 1 on a 0.3 step is 0.9, the step below, not 0.6. Right from 2
       with a max of 2.5 stops at 2.5, where rounding to the step once carried
       it to 3. A step written 1e-7 still moves. */
    expect([await press("Thirds", "{ArrowLeft}"), await press("Halfway", "{ArrowRight}"), await press("Tiny", "{ArrowRight}")]).toEqual(["0.9", "2.5", "1e-7"]);
    /* Off the grid, each way goes to the step that way: 73 up from 72.4. */
    const onChange = vi.fn();
    render(<Slider label="Off" value={72.4} onChange={onChange} />);
    screen.getByRole("slider", { name: "Off" }).focus();
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}");
    expect(onChange.mock.calls).toEqual([[73], [72]]);
  });

  it("names the snap point halfway between two the same, whatever order they came in", () => {
    render(
      <>
        <Slider label="Given" value={62.5} snapPoints={SURE} />
        <Slider label="Reversed" value={62.5} snapPoints={[...SURE].reverse()} />
      </>,
    );
    expect(["Given", "Reversed"].map((name) => screen.getByRole("slider", { name }).getAttribute("aria-valuetext"))).toEqual(["62.5, Toss-up", "62.5, Toss-up"]);
  });

  it("takes a consumer's name and handlers alongside its own", async () => {
    const onKeyDown = vi.fn();
    render(
      <>
        <span id="outer">Outer name</span>
        <Slider aria-labelledby="outer" defaultValue={50} onKeyDown={onKeyDown} snapPoints={SURE} />
        <Slider label="Claimed" defaultValue={50} onKeyDown={(e) => e.key === "Home" && e.preventDefault()} />
      </>,
    );
    const named = screen.getByRole("slider", { name: "Outer name" });
    named.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect([onKeyDown.mock.calls.length, named.getAttribute("aria-valuenow")]).toEqual([1, "51"]);
    /* The chips are a group with the slider's name. */
    expect(screen.getByRole("group", { name: "Outer name" })).toContainElement(screen.getByRole("button", { name: "Likely" }));
    /* The twin: a key the owner handled is left to it, and one it didn't isn't. */
    const claimed = screen.getByRole("slider", { name: "Claimed" });
    claimed.focus();
    await userEvent.keyboard("{Home}");
    expect(claimed.getAttribute("aria-valuenow")).toBe("50");
    await userEvent.keyboard("{End}");
    expect(claimed.getAttribute("aria-valuenow")).toBe("100");
  });

  it("puts an uncontrolled value back on a form reset", async () => {
    const { container } = render(
      <form>
        <Slider label="Sure" name="sure" />
        <Slider label="Empty" name="empty" defaultValue={null} />
      </form>,
    );
    const form = container.querySelector("form")!;
    for (const name of ["Sure", "Empty"]) {
      screen.getByRole("slider", { name }).focus();
      await userEvent.keyboard("{End}");
    }
    expect(Object.fromEntries(new FormData(form))).toEqual({ sure: "100", empty: "100" });
    act(() => form.reset());
    expect([Object.fromEntries(new FormData(form)), screen.getByRole("slider", { name: "Empty" }).getAttribute("aria-valuetext")]).toEqual([
      { sure: "50", empty: "" },
      "Not set",
    ]);
  });

  it("submits its value under its name, and an empty string while not set", async () => {
    const { container } = render(
      <form>
        <Slider label="Sure" name="sure" defaultValue={null} />
        <Slider label="Started" name="started" />
      </form>,
    );
    const form = () => Object.fromEntries(new FormData(container.querySelector("form")!));
    expect(form()).toEqual({ sure: "", started: "50" });
    screen.getByRole("slider", { name: "Sure" }).focus();
    await userEvent.keyboard("{End}");
    expect(form()).toEqual({ sure: "100", started: "50" });
  });

  it("does nothing while disabled, takes no focus, and isn't submitted", async () => {
    const { container } = render(
      <form>
        <Slider label="Off" name="off" defaultValue={20} snapPoints={SURE} disabled />
        <Slider label="On" name="on" defaultValue={20} />
      </form>,
    );
    const slider = screen.getByRole("slider", { name: "Off" });
    expect([slider.getAttribute("aria-disabled"), slider.getAttribute("tabindex")]).toEqual(["true", null]);
    /* The twin beside it is submitted. */
    expect(Object.fromEntries(new FormData(container.querySelector("form")!))).toEqual({ on: "20" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByRole("button", { name: "Likely" })).toBeDisabled();
  });

  it("marks itself invalid with an error, is described by it, and drops both when it's cleared", () => {
    const { rerender } = render(<Slider label="Sure" helperText="At least 50." errorMessage="Pick at least 50." />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-invalid", "true");
    expect(slider).toHaveAccessibleDescription("Pick at least 50.");
    /* The twin: the owner clears the error, and the helper text is back. */
    rerender(<Slider label="Sure" helperText="At least 50." />);
    expect(slider.getAttribute("aria-invalid")).toBeNull();
    expect(slider).toHaveAccessibleDescription("At least 50.");
  });
});
