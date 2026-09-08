import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import {
  MultiSelect,
  type MultiSelectProps,
  type MultiSelectValue,
} from "./MultiSelect";
import "@testing-library/jest-dom";

const SPORTS = [
  { value: "nfl", label: "NFL" },
  { value: "nba", label: "NBA" },
  { value: "nhl", label: "NHL" },
];

const Stateful = ({
  initial = [],
  ...props
}: Partial<MultiSelectProps> & { initial?: MultiSelectValue[] }) => {
  const [value, setValue] = useState<MultiSelectValue[]>(initial);
  /* `value`/`onChange` after the spread, so a caller cannot freeze the state. */
  return (
    <MultiSelect options={SPORTS} {...props} value={value} onChange={setValue} />
  );
};

const trigger = () =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-haspopup") === "listbox")!;

/* Derived from the dismiss controls rather than from the text, because the
   trigger also carries a screen-reader summary of the same labels and an
   unscoped `getByText` matches both. Every chip has one, and its name is
   per-chip on purpose — a row of buttons all called "Remove" is a row a screen
   reader user cannot tell apart. */
const chipLabels = () =>
  screen
    .queryAllByRole("button", { name: /^Remove / })
    .map((b) => b.getAttribute("aria-label")!.replace(/^Remove /, ""));

/* What a screen reader gets from the trigger: one punctuated list. */
const srSummary = () =>
  trigger().querySelector("[class*='sr-only']")?.textContent ?? null;

describe("MultiSelect", () => {
  it("shows the placeholder until something is selected", () => {
    render(<Stateful placeholder="Pick sports" />);
    /* Twice on purpose: once inside the button where it becomes the accessible
       name, once beside it as the visible text. */
    expect(screen.getAllByText("Pick sports")).toHaveLength(2);
    expect(srSummary()).toBe("Pick sports");
  });

  it("adds a value and keeps the panel open for the next pick", async () => {
    const user = userEvent.setup();
    render(<Stateful label="Sports" />);

    await user.click(trigger());
    const list = screen.getByRole("listbox");
    await user.click(within(list).getByRole("option", { name: "NFL" }));

    /* aria-expanded, not DOM presence: Headless UI keeps the panel mounted.
       Staying open across picks is the whole difference from `Select` — a
       multi-select that closed on the first choice would cost a reopen for
       every value after it. */
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    await user.click(within(list).getByRole("option", { name: "NHL" }));
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(chipLabels()).toEqual(["NFL", "NHL"]);
    /* Punctuated, because the chips are inline-flex spans and accessible-name
       computation joins them with no whitespace at all: "NFL" then "NHL" was
       announced as "NFLNHL". */
    expect(srSummary()).toBe("NFL, NHL");
  });

  it("removes a value when its selected option is clicked again", async () => {
    const user = userEvent.setup();
    render(<Stateful initial={["nfl", "nba"]} />);

    await user.click(trigger());
    await user.click(
      within(screen.getByRole("listbox")).getByRole("option", { name: "NFL" }),
    );

    expect(chipLabels()).toEqual(["NBA"]);
  });

  it("marks the listbox multi-selectable", async () => {
    const user = userEvent.setup();
    render(<Stateful />);
    await user.click(trigger());
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });

  it("renders a selected value with no matching option as its own id", () => {
    /* Mapped over `value`, not over `options`. Mapping the other way would
       drop it from a field that still reports it — the selection would be
       invisible and submitted. */
    render(<Stateful initial={["nfl", "curling"]} />);
    /* And last, because it has no option to be ordered by. */
    expect(chipLabels()).toEqual(["NFL", "curling"]);
  });

  it("collapses the tail into an overflow chip", () => {
    render(<Stateful initial={["nfl", "nba", "nhl"]} maxChips={1} />);

    expect(chipLabels()).toEqual(["NFL"]);
    /* The overflow chip is decorative: it has no dismiss control and is hidden
       from assistive tech, because the summary below already names what it
       stands for. */
    expect(within(trigger().parentElement!).getByText("+2")).toBeInTheDocument();
    /* The summary names every selection, not just the visible ones: `+2` is a
       layout decision and there is no reason to withhold two labels from
       someone who cannot see that the row was getting long. */
    expect(srSummary()).toBe("NFL, NBA, NHL");
  });

  it("counts instead of naming when asked", () => {
    render(<Stateful initial={["nfl", "nba"]} display="count" />);

    expect(srSummary()).toBe("2 selected");
    expect(chipLabels()).toEqual([]);
  });

  it("clears the whole selection and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Stateful initial={["nfl", "nba"]} clearable placeholder="Pick sports" />);

    const clear = screen.getByRole("button", { name: "Clear selection" });
    clear.focus();
    await user.click(clear);

    expect(srSummary()).toBe("Pick sports");
    /* Clearing unmounts the control that was just activated. Without an
       explicit handoff, focus falls to <body> and a keyboard user's next Tab
       restarts at the top of the document. */
    expect(clear).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger());
  });

  it("puts the clear control out of reach while the panel is open", async () => {
    const user = userEvent.setup();
    render(<Stateful initial={["nfl", "nba"]} clearable />);

    const clear = () =>
      document.querySelector<HTMLElement>('button[aria-label="Clear selection"]')!;
    /* Falsy rather than `false`: jsdom leaves the property undefined until
       something sets it. */
    expect(clear().inert).toBeFalsy();

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    /* Headless UI marks everything outside an open panel `inert` and
       `aria-hidden`, and the clear control is outside it. So while the menu is
       open the first click out here closes the panel and does not clear —
       which is the right behavior for a popup, but it is behavior this
       component inherits rather than chooses, and it is invisible in the
       markup. */
    expect(clear().inert).toBe(true);
    expect(clear().closest("[aria-hidden]")).not.toBeNull();

    await user.keyboard("{Escape}");
    expect(clear().inert).toBeFalsy();
  });

  it("disables the clear control rather than hiding it when disabled", () => {
    /* Hiding it while `pr-16` stays reserved left dead space and wrapped the
       chips a line early for a control that was not there. */
    render(<Stateful initial={["nfl"]} clearable disabled />);
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeDisabled();
  });

  it("orders chips by the options, not by the order they were picked", async () => {
    const user = userEvent.setup();
    render(<Stateful />);

    await user.click(trigger());
    const list = screen.getByRole("listbox");
    await user.click(within(list).getByRole("option", { name: "NHL" }));
    await user.click(within(list).getByRole("option", { name: "NFL" }));

    /* Selection order would read NHL, NFL. Option order reads NFL, NHL — and
       stays put when a value is toggled off and on again, which matters most
       under `maxChips`, where selection order also changes WHICH chips are
       visible. */
    expect(chipLabels()).toEqual(["NFL", "NHL"]);
  });

  it("renders a value that appears twice without colliding keys", () => {
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args[0]);
    });

    /* `value` admits both `1` and `"1"`, which React coerces to the same key,
       and picking both of those options is one ordinary click apart. */
    render(
      <MultiSelect
        options={[
          { value: 1, label: "One" },
          { value: "1", label: "One as text" },
        ]}
        value={[1, "1"]}
        onChange={() => {}}
      />,
    );

    expect(errors.filter((e) => String(e).includes("same key"))).toHaveLength(0);
    spy.mockRestore();
  });

  it("hides the clear control when there is nothing to clear", () => {
    render(<Stateful clearable />);
    expect(
      screen.queryByRole("button", { name: "Clear selection" }),
    ).not.toBeInTheDocument();
  });

  it("dismisses one chip without touching the others", async () => {
    const user = userEvent.setup();
    render(<Stateful initial={["nfl", "nba", "nhl"]} />);

    await user.click(screen.getByRole("button", { name: "Remove NBA" }));

    expect(chipLabels()).toEqual(["NFL", "NHL"]);
    /* The panel was never opened. That is the point of the dismiss control:
       removing one value should not cost a trip through the menu. */
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("names each dismiss control after its own chip", () => {
    render(<Stateful initial={["nfl", "nba"]} />);

    expect(screen.getByRole("button", { name: "Remove NFL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove NBA" })).toBeInTheDocument();
  });

  it("takes a custom removeLabel", () => {
    render(
      <Stateful initial={["nfl"]} removeLabel={(label) => `Drop ${label}`} />,
    );
    expect(screen.getByRole("button", { name: "Drop NFL" })).toBeInTheDocument();
  });

  it("disables the dismiss controls when disabled", () => {
    render(<Stateful initial={["nfl"]} disabled />);
    expect(screen.getByRole("button", { name: "Remove NFL" })).toBeDisabled();
  });

  it("keeps the chips outside the trigger button", () => {
    render(<Stateful label="Sports" initial={["nfl", "nba"]} />);

    /* The whole design rests on this: a dismiss control is a `<button>`, so
       the chips have to be SIBLINGS of the trigger rather than children of it.
       Move them back inside and the markup is a button inside a button, which
       React's DOM-API construction leaves nested rather than repairing.

       The button keeps its own punctuated summary, which is what carries the
       selection to a screen reader — the chips are `inline-flex` spans and
       name computation would run them together as "NFLNBA". */
    for (const remove of screen.getAllByRole("button", { name: /^Remove / })) {
      expect(trigger().contains(remove)).toBe(false);
    }
    expect(srSummary()).toBe("NFL, NBA");
  });

  it("opens a dark panel for the slate variant", async () => {
    const user = userEvent.setup();
    render(<Stateful variant="slate" />);

    await user.click(trigger());

    /* `slate` paints a dark trigger in LIGHT mode, and its panel used to
       render white — a dark control opening a white sheet, which is the
       mismatch `--roster-popover-*` exists to prevent. The token family only
       covered the variant that reads tokens; the ones that name a surface were
       left behind. Shared with Select and Combobox via `popupInDarkPalette`. */
    expect(screen.getByRole("listbox").className).toContain("dark");
  });

  it("leaves the panel on the light palette for every other variant", async () => {
    const user = userEvent.setup();
    render(<Stateful variant="white" />);

    await user.click(trigger());
    expect(screen.getByRole("listbox").className).not.toContain("dark");
  });

  it("reports the trigger invalid and describes it with the error message", () => {
    render(<Stateful label="Sports" errorMessage="Pick at least one sport." />);

    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAccessibleDescription("Pick at least one sport.");
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect options={SPORTS} value={[]} onChange={onChange} disabled />,
    );

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
  });
});
