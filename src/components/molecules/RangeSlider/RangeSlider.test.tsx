import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { RangeSlider, type RangeValue } from "./RangeSlider";
import type { SliderSnapPoint } from "../Slider/Slider";

/* Structure, keys and the form, in jsdom. The pointer, the thumbs' places and
   their targets are measured in Chromium and WebKit (RangeSlider.checks.stories.tsx). */

const SURE: SliderSnapPoint[] = [
  { value: 100, label: "Certain" },
  { value: 75, label: "Likely" },
  { value: 50, label: "Toss-up" },
];

const thumbs = (name = "Price") => [screen.getByRole("slider", { name: `${name} Minimum` }), screen.getByRole("slider", { name: `${name} Maximum` })];
const state = (el: HTMLElement) => ["aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"].map((a) => el.getAttribute(a));

describe("RangeSlider", () => {
  it("starts at the whole range, as two sliders named for their ends, each running to the other", () => {
    const { container } = render(<RangeSlider label="Price" />);
    expect(screen.getByRole("group", { name: "Price" })).toBeInTheDocument();
    expect(thumbs().map(state)).toEqual([
      ["0", "100", "0", "0"],
      ["0", "100", "100", "100"],
    ]);
    expect(container.querySelector("[data-slider-readout]")).toHaveTextContent("0 – 100");
    /* The twin: set apart, each one's range stops at the other. */
    render(<RangeSlider label="Set" defaultValue={[20, 80]} snapPoints={SURE} />);
    expect(thumbs("Set").map(state)).toEqual([
      ["0", "80", "20", "20, Toss-up"],
      ["20", "100", "80", "80, Likely"],
    ]);
  });

  it("steps each thumb with its own keys, and Home and End go as far as the other", async () => {
    const onChange = vi.fn();
    render(<RangeSlider label="Price" defaultValue={[20, 80]} onChange={onChange} />);
    const [low, high] = thumbs();
    low.focus();
    await userEvent.keyboard("{ArrowRight}{End}");
    high.focus();
    await userEvent.keyboard("{Home}{ArrowLeft}");
    /* End on the low thumb meets the high one; the high one's Home and Left
       can't pass the low. */
    expect(onChange.mock.calls).toEqual([[[21, 80]], [[80, 80]]]);
    expect([low, high].map((t) => t.getAttribute("aria-valuenow"))).toEqual(["80", "80"]);
    /* The twin: once they've met, the low one still goes down. */
    low.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange.mock.calls.at(-1)).toEqual([[79, 80]]);
  });

  it("counts every key that arrives before a render", () => {
    const onChange = vi.fn();
    render(<RangeSlider label="Price" defaultValue={[20, 80]} onChange={onChange} />);
    const [low] = thumbs();
    act(() => {
      for (let i = 0; i < 3; i++) fireEvent.keyDown(low, { key: "ArrowRight" });
    });
    expect(onChange.mock.calls).toEqual([[[21, 80]], [[22, 80]], [[23, 80]]]);
  });

  it("moves the nearer thumb from a chip, and marks the chips the thumbs are on", async () => {
    const onCommit = vi.fn();
    render(<RangeSlider label="Price" defaultValue={[10, 100]} snapPoints={SURE} onCommit={onCommit} />);
    const pressed = () => SURE.map((p) => screen.getByRole("button", { name: p.label }).getAttribute("aria-pressed"));
    expect(pressed()).toEqual(["true", "false", "false"]);
    /* 50 is nearer the low thumb at 10 than the high one at 100. */
    await userEvent.click(screen.getByRole("button", { name: "Toss-up" }));
    expect([onCommit.mock.calls, pressed()]).toEqual([[[[50, 100]]], ["true", "false", "true"]]);
    /* Halfway between, at 75, the low one goes. */
    await userEvent.click(screen.getByRole("button", { name: "Likely" }));
    expect(onCommit.mock.calls.at(-1)).toEqual([[75, 100]]);
    /* The chips are a group with the slider's name, in the track's order. */
    expect(screen.getAllByRole("group", { name: "Price" })).toHaveLength(2);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Toss-up", "Likely", "Certain"]);
  });

  it("keeps what it shows in range and in order, whatever it's given", () => {
    render(
      <>
        <RangeSlider label="Swapped" value={[80, 20]} />
        <RangeSlider label="Wide" value={[-5, 150]} />
      </>,
    );
    expect([...thumbs("Swapped"), ...thumbs("Wide")].map((t) => t.getAttribute("aria-valuenow"))).toEqual(["20", "80", "0", "100"]);
  });

  it("steps from the values a controlling owner keeps", async () => {
    const onChange = vi.fn();
    function Capped() {
      const [value, setValue] = useState<RangeValue>([20, 60]);
      return (
        <RangeSlider
          label="Price"
          value={value}
          onChange={(v) => {
            onChange(v);
            setValue([v[0], Math.min(60, v[1])]);
          }}
        />
      );
    }
    render(<Capped />);
    const [, high] = thumbs();
    high.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect([onChange.mock.calls, high.getAttribute("aria-valuenow")]).toEqual([[[[20, 61]], [[20, 61]]], "60"]);
  });

  it("submits both values under its name, low first, and resets", async () => {
    const { container } = render(
      <form>
        <RangeSlider label="Price" name="price" defaultValue={[20, 80]} />
        <RangeSlider label="Off" name="off" disabled />
      </form>,
    );
    const form = container.querySelector("form")!;
    expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);
    thumbs()[0].focus();
    await userEvent.keyboard("{Home}");
    expect(new FormData(form).getAll("price")).toEqual(["0", "80"]);
    act(() => form.reset());
    /* The twin beside it is disabled, and submits nothing. */
    expect([new FormData(form).getAll("price"), new FormData(form).getAll("off")]).toEqual([["20", "80"], []]);
  });

  it("does nothing while disabled, and takes no focus", () => {
    render(<RangeSlider label="Price" defaultValue={[20, 80]} disabled />);
    const [low, high] = thumbs();
    expect([low, high].map((t) => [t.getAttribute("aria-disabled"), t.getAttribute("tabindex")])).toEqual([
      ["true", null],
      ["true", null],
    ]);
    fireEvent.keyDown(low, { key: "ArrowRight" });
    expect(low).toHaveAttribute("aria-valuenow", "20");
  });

  it("marks both thumbs invalid with an error, each described by it", () => {
    render(<RangeSlider label="Price" errorMessage="Keep it under 50." />);
    for (const t of thumbs()) {
      expect(t).toHaveAttribute("aria-invalid", "true");
      expect(t).toHaveAccessibleDescription("Keep it under 50.");
    }
    /* The group isn't described too: the text is heard once, with a thumb. */
    expect(screen.getByRole("group", { name: "Price" })).not.toHaveAttribute("aria-describedby");
  });
});
