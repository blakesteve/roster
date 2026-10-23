import { createRef, useEffect, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { Carousel, type CarouselHandle } from "./Carousel";

/* Selection mode's structure and wiring in jsdom, which has no layout: the
   Page keys, scrolling into view and real keys are measured in Chromium and
   WebKit (Carousel.selection.checks.stories.tsx). */

const NAMES = ["Night Swim", "Paper Suns", "Glasshouse", "Gold Leaf", "Glow"];
const keyOf = (name: string) => name.toLowerCase().replace(" ", "-");

function Row(props: Partial<React.ComponentProps<typeof Carousel>> & { names?: string[] }) {
  const { names = NAMES, ...rest } = props;
  return (
    <Carousel aria-label="Records" selectable {...rest}>
      {names.map((n) => (
        <span key={keyOf(n)}>{n}</span>
      ))}
    </Carousel>
  );
}

const options = () => screen.getAllByRole("option");
const stops = () => options().filter((o) => o.tabIndex === 0).map((o) => o.textContent);
const chosen = () => options().filter((o) => o.getAttribute("aria-selected") === "true").map((o) => o.textContent);

afterEach(() => vi.restoreAllMocks());

describe("Carousel's selection mode", () => {
  it("is a horizontal listbox of options, each placed in the set", () => {
    render(
      <>
        <p id="how">Enter selects. Enter again plays it.</p>
        <Row aria-describedby="how" />
      </>,
    );
    const box = screen.getByRole("listbox", { name: "Records" });
    expect([box.tagName, box.getAttribute("aria-orientation"), box.getAttribute("aria-describedby"), box.hasAttribute("tabindex")]).toEqual(["UL", "horizontal", "how", false]);
    expect(options().map((o) => [o.textContent, o.getAttribute("aria-selected"), o.getAttribute("aria-setsize"), o.getAttribute("aria-posinset")])).toEqual([
      ["Night Swim", "false", "5", "1"],
      ["Paper Suns", "false", "5", "2"],
      ["Glasshouse", "false", "5", "3"],
      ["Gold Leaf", "false", "5", "4"],
      ["Glow", "false", "5", "5"],
    ]);
    /* The twin: without `selectable` it's the plain list it always was. */
    render(<Carousel aria-label="Plain">{NAMES.map((n) => <span key={n}>{n}</span>)}</Carousel>);
    expect(screen.getByRole("list", { name: "Plain" }).getAttribute("aria-orientation")).toBeNull();
  });

  it("names an option by its content, or by getOptionLabel", () => {
    render(<Row getOptionLabel={(key, i) => `${i + 1}: ${key}`} />);
    expect(screen.getByRole("option", { name: "3: glasshouse" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Glasshouse" })).toBeNull();
  });

  it("is one tab stop: the selected option, or the first when nothing is", () => {
    const { unmount } = render(<Row />);
    expect(stops()).toEqual(["Night Swim"]);
    unmount();
    render(<Row defaultSelectedKey="gold-leaf" />);
    expect([stops(), chosen()]).toEqual([["Gold Leaf"], ["Gold Leaf"]]);
  });

  it("selects on Enter, Space or a click, activates on the selected one, and selection never follows focus", async () => {
    const onSelectionChange = vi.fn();
    const onActivate = vi.fn();
    render(<Row onSelectionChange={onSelectionChange} onActivate={onActivate} />);
    const [first, second, third] = options();
    act(() => first.focus());
    fireEvent.keyDown(first, { key: "ArrowRight" });
    /* Focus and the tab stop moved; nothing was selected. */
    expect([document.activeElement === second, stops(), chosen(), onSelectionChange.mock.calls.length]).toEqual([true, ["Paper Suns"], [], 0]);
    fireEvent.keyDown(second, { key: "Enter" });
    fireEvent.keyDown(second, { key: "Enter" });
    fireEvent.keyDown(second, { key: " " });
    expect([chosen(), onSelectionChange.mock.calls, onActivate.mock.calls]).toEqual([["Paper Suns"], [["paper-suns"]], [["paper-suns"]]]);
    fireEvent.keyDown(second, { key: "ArrowRight" });
    fireEvent.keyDown(third, { key: " " });
    await userEvent.click(third);
    await userEvent.click(first);
    expect([chosen(), onSelectionChange.mock.calls, onActivate.mock.calls]).toEqual([
      ["Night Swim"],
      [["paper-suns"], ["glasshouse"], ["night-swim"]],
      [["paper-suns"], ["glasshouse"]],
    ]);
  });

  it("moves by one with the arrows, without wrapping, and to the ends with Home and End", () => {
    render(<Row />);
    const all = options();
    act(() => all[0].focus());
    const press = (key: string) => fireEvent.keyDown(document.activeElement!, { key });
    const seen: (string | null)[] = [];
    for (const key of ["ArrowLeft", "End", "ArrowRight", "ArrowLeft", "Home"]) {
      press(key);
      seen.push(document.activeElement!.textContent);
    }
    expect(seen).toEqual(["Night Swim", "Glow", "Glow", "Gold Leaf", "Night Swim"]);
  });

  it("ends type-ahead on any other key, so Space after an arrow selects", () => {
    const onSelectionChange = vi.fn();
    render(<Row onSelectionChange={onSelectionChange} />);
    act(() => options()[0].focus());
    fireEvent.keyDown(options()[0], { key: "g" });
    const found = document.activeElement!.textContent;
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    fireEvent.keyDown(document.activeElement!, { key: " " });
    /* Within the pause, but after an arrow: a selection, not a search for "g ". */
    expect([found, onSelectionChange.mock.calls]).toEqual(["Glasshouse", [["gold-leaf"]]]);
  });

  it("clears on Escape only when clearable", () => {
    const onSelectionChange = vi.fn();
    const { unmount } = render(<Row defaultSelectedKey="glow" onSelectionChange={onSelectionChange} />);
    fireEvent.keyDown(options()[4], { key: "Escape" });
    expect([chosen(), onSelectionChange.mock.calls.length]).toEqual([["Glow"], 0]);
    unmount();
    render(<Row defaultSelectedKey="glow" clearable onSelectionChange={onSelectionChange} />);
    fireEvent.keyDown(options()[4], { key: "Escape" });
    expect([chosen(), onSelectionChange.mock.calls]).toEqual([[], [[null]]]);
  });

  it("controlled, shows the consumer's selection and only reports a new one", () => {
    const onSelectionChange = vi.fn();
    render(<Row selectedKey="glasshouse" onSelectionChange={onSelectionChange} />);
    fireEvent.click(options()[0]);
    /* The twin of the uncontrolled case: the selection waits for the prop. */
    expect([chosen(), onSelectionChange.mock.calls]).toEqual([["Glasshouse"], [["night-swim"]]]);
  });

  it("keeps set size and position right through filtering, and the active option where it can", () => {
    function Filtered() {
      const [names, setNames] = useState(NAMES);
      return (
        <>
          <Row names={names} />
          <button type="button" onClick={() => setNames((n) => n.filter((x) => x.startsWith("G")))}>
            Only G
          </button>
          <button type="button" onClick={() => setNames((n) => n.filter((x) => x !== "Gold Leaf"))}>
            Drop Gold Leaf
          </button>
          <button type="button" onClick={() => setNames((n) => n.filter((x) => x !== "Glow"))}>
            Drop Glow
          </button>
        </>
      );
    }
    render(<Filtered />);
    act(() => options()[0].focus());
    fireEvent.keyDown(options()[0], { key: "End" });
    fireEvent.keyDown(options()[4], { key: "ArrowLeft" });
    act(() => screen.getByRole("button", { name: "Only G" }).focus());
    fireEvent.click(screen.getByRole("button", { name: "Only G" }));
    /* Gold Leaf was active and is still there: it stays, now 2 of 3. */
    const after = () => options().map((o) => `${o.textContent} ${o.getAttribute("aria-posinset")}/${o.getAttribute("aria-setsize")}${o.tabIndex === 0 ? " *" : ""}`);
    expect(after()).toEqual(["Glasshouse 1/3", "Gold Leaf 2/3 *", "Glow 3/3"]);
    fireEvent.click(screen.getByRole("button", { name: "Drop Gold Leaf" }));
    /* Gone: the stop moves to the next one after it. */
    expect(after()).toEqual(["Glasshouse 1/2", "Glow 2/2 *"]);
    fireEvent.click(screen.getByRole("button", { name: "Drop Glow" }));
    /* Gone, with nothing after it: the one before. */
    expect(after()).toEqual(["Glasshouse 1/1 *"]);
  });

  it("follows a selection made elsewhere while focus is outside, and leaves it to the keys inside", () => {
    const picker: { pick: (key: string) => void } = { pick: () => {} };
    function Outside() {
      const [key, setKey] = useState<string | null>(null);
      useEffect(() => {
        picker.pick = setKey;
      }, []);
      return <Row selectedKey={key} onSelectionChange={setKey} />;
    }
    render(<Outside />);
    act(() => picker.pick("glow"));
    const outside = stops();
    act(() => options()[4].focus());
    fireEvent.keyDown(options()[4], { key: "Home" });
    /* Chosen elsewhere, with focus still in the row: the stop stays with focus. */
    act(() => picker.pick("paper-suns"));
    expect([outside, chosen(), stops(), document.activeElement?.textContent]).toEqual([["Glow"], ["Paper Suns"], ["Night Swim"], "Night Swim"]);
  });

  it("hands the tab stop back to the selected option when focus leaves", () => {
    render(
      <>
        <Row defaultSelectedKey="paper-suns" />
        <button type="button">After</button>
      </>,
    );
    act(() => options()[1].focus());
    fireEvent.keyDown(options()[1], { key: "End" });
    const inside = stops();
    act(() => screen.getByRole("button", { name: "After" }).focus());
    expect([inside, stops()]).toEqual([["Glow"], ["Paper Suns"]]);
  });

  it("focus() moves focus onto the tab stop", () => {
    const ref = createRef<CarouselHandle>();
    render(<Row ref={ref} defaultSelectedKey="gold-leaf" />);
    act(() => ref.current!.focus());
    expect(document.activeElement?.textContent).toBe("Gold Leaf");
  });

  it("warns in development when an option holds something that takes focus, or has no key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { unmount } = render(<Row />);
    /* The twin: plain, keyed options say nothing. */
    expect(warn).not.toHaveBeenCalled();
    unmount();
    render(
      <Carousel aria-label="Mixed" selectable>
        <span key="a">A</span>
        <span key="b">
          B <a href="#b">more</a>
        </span>
        {"C"}
      </Carousel>,
    );
    expect(warn.mock.calls.map(([m]) => String(m).split(":")[1].trim().slice(0, 30))).toEqual(["selection mode needs a key on ", "an option holds something that"]);
  });
});
