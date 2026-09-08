import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Combobox } from "./Combobox";
import { Select } from "../Select/Select";
import "@testing-library/jest-dom";

const options = [
  { value: "nfl", label: "NFL" },
  { value: "nba", label: "NBA" },
  { value: "ncaam", label: "NCAA Men's" },
];

const open = () => fireEvent.click(screen.getByRole("button"));
const type = (text: string) =>
  fireEvent.change(screen.getByRole("combobox"), { target: { value: text } });

describe("Combobox", () => {
  it("filters by a case-insensitive substring of the label", async () => {
    render(<Combobox options={options} value={null} onChange={() => {}} />);
    open();
    type("nc");

    const list = await screen.findByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(1);
    expect(within(list).getByText("NCAA Men's")).toBeInTheDocument();
  });

  it("selects the active option by keyboard and reports its value", async () => {
    /* By keyboard rather than by click, and not only because Headless UI wants
       a full pointer sequence that `fireEvent.click` does not produce: arrowing
       to a row and pressing Enter is the interaction Headless UI actually owns
       here, so it is the one worth pinning. */
    const onChange = vi.fn();
    render(<Combobox options={options} value={null} onChange={onChange} />);
    const input = screen.getByRole("combobox");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("nba");
  });

  it("shows a message rather than an empty panel when nothing matches", async () => {
    render(
      <Combobox options={options} value={null} onChange={() => {}} emptyMessage="No sports" />,
    );
    open();
    type("zzz");

    const list = await screen.findByRole("listbox");
    expect(within(list).getByText("No sports")).toBeInTheDocument();
  });

  it("announces the empty message without making it choosable", async () => {
    /* It has to be an option: `role="listbox"` may only contain options, and
       Headless UI's tree walker that neutralises stray children runs once when
       the panel opens — an empty state only ever appears after that, so a bare
       `<p>` was never walked and the listbox announced as empty. Disabled
       keeps it out of the keyboard cycle while leaving it announced. */
    const onChange = vi.fn();
    render(<Combobox options={options} value={null} onChange={onChange} />);
    const input = screen.getByRole("combobox");
    open();
    type("zzz");

    const list = await screen.findByRole("listbox");
    const empty = within(list).getByRole("option");
    expect(empty).toHaveAttribute("aria-disabled", "true");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the chevron's room even when inputClassName sets padding", () => {
    /* Structural, not decorative: `inputClassName="rst:px-2"` was deleting
       `pr-9` through tailwind-merge and the typed text ran under the icon. */
    render(
      <Combobox
        options={options}
        value={null}
        onChange={() => {}}
        inputClassName="rst:px-2"
      />,
    );
    expect(screen.getByRole("combobox").className).toContain("rst:pr-9");
  });

  it("reports a cleared field instead of swallowing it", () => {
    /* Headless UI reports a clear as `null`. Filtering that out made the
       selection unclearable — emptying the input fired nothing. */
    const onChange = vi.fn();
    render(<Combobox options={options} value="nfl" onChange={onChange} />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange.mock.calls.some(([v]) => v === null)).toBe(true);
  });

  it("takes a custom filter, including one that ignores the query", async () => {
    /* The escape hatch for fuzzy matching, or for filtering server-side. */
    render(
      <Combobox
        options={options}
        value={null}
        onChange={() => {}}
        filter={(all) => all}
      />,
    );
    open();
    type("zzz");

    const list = await screen.findByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(3);
  });

  it("resets the filter for the next opening, without flashing it back first", async () => {
    /* Clearing the query on close repopulates the list while the panel is
       still on screen, so the filter appears to undo itself as it fades.
       Clearing after the leave transition means the reset happens with nothing
       visible, and a reopen still starts from the full list. */
    render(<Combobox options={options} value={null} onChange={() => {}} />);
    open();
    type("nc");

    let list = await screen.findByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );

    open();
    list = await screen.findByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(3);
  });

  it("does not repopulate the list while the panel is still on screen", async () => {
    /* The half the reset test cannot see: clearing on close refills the list
       while it is still fading, so the filter appears to undo itself. Asserted
       by checking the filtered set survives the frame the panel closes on —
       `afterLeave` runs after that, an on-close handler would run during it. */
    render(<Combobox options={options} value={null} onChange={() => {}} />);
    open();
    type("nc");
    const list = await screen.findByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(within(list).getAllByRole("option")).toHaveLength(1);
  });

  it("shows the selected label in the input rather than its value", () => {
    render(<Combobox options={options} value="ncaam" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("NCAA Men's");
  });

  it("reports invalidity on the input and says what is wrong", () => {
    render(
      <Combobox
        options={options}
        value={null}
        onChange={() => {}}
        errorMessage="Pick a sport"
      />,
    );
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      screen.getByText("Pick a sport").id,
    );
  });

  it("dims its label and description when disabled", () => {
    render(
      <Combobox
        options={options}
        value={null}
        onChange={() => {}}
        label="Sport"
        helperText="Start typing"
        disabled
      />,
    );
    expect(screen.getByText("Sport").closest("[data-disabled]")).toBeTruthy();
    expect(screen.getByText("Start typing").closest("[data-disabled]")).toBeTruthy();
  });

  it("draws its label from the surface token, like every other control", () => {
    render(<Combobox options={options} value={null} onChange={() => {}} label="Sport" />);
    const label = screen.getByText("Sport");
    expect(label).toHaveClass("rst:text-[var(--roster-control-text)]");
    expect(label).not.toHaveClass("rst:text-gray-900");
  });

  it("sizes the panel to the input, not to the chevron beside it", async () => {
    /* Headless UI writes both `--input-width` and `--button-width` inline on
       the panel. For a Listbox the button is the whole trigger; here it is the
       little chevron, so `--button-width` rendered the menu about 20px wide
       and unreadable. */
    render(<Combobox options={options} value={null} onChange={() => {}} />);
    open();

    const list = await screen.findByRole("listbox");
    expect(list.className).toContain("rst:w-(--input-width)");
    expect(list.className).not.toContain("rst:w-(--button-width)");
  });

  it("opens a panel identical to Select's, class for class", async () => {
    /* The whole reason the internals are shared, so it is asserted against a
       real Select rather than against a class this file could hardcode. The
       only expected difference is the width variable: a Listbox's button is
       its whole trigger, a Combobox's is the chevron. */
    render(<Combobox options={options} value={null} onChange={() => {}} />);
    open();
    const comboPanel = (await screen.findByRole("listbox")).className;
    cleanup();

    render(<Select options={options} value={null} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    const selectPanel = (await screen.findByRole("listbox")).className;

    const shared = (c: string) =>
      c.split(/\s+/).filter((x) => !x.includes("-width)")).sort();
    expect(shared(comboPanel)).toEqual(shared(selectPanel));
  });
});
