import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { RadioTileGroup, type RadioTileGroupProps, type RadioTileOption } from "./RadioTileGroup";
import "@testing-library/jest-dom";

/* Each picture is an image whose alt text is the option's name, the case
   where a careless tile reads its name twice. */
const photo = (name: string) => <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt={name} />;
const COVERS: RadioTileOption[] = [
  { value: "harbor", label: "Harbor at dawn", description: "Boats under a pink sky", picture: photo("Harbor at dawn") },
  { value: "ridge", label: "Pine ridge", picture: photo("Pine ridge") },
  { value: "flats", label: "Salt flats", picture: photo("Salt flats") },
  { value: "market", label: "Night market", picture: photo("Night market") },
];

const Stateful = ({ initial = "", ...props }: Partial<RadioTileGroupProps> & { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return <RadioTileGroup label="Cover photo" options={COVERS} {...props} value={value} onChange={setValue} />;
};

const radio = (name: string) => screen.getByRole("radio", { name });
const checked = () =>
  screen
    .getAllByRole("radio")
    .filter((r) => r.getAttribute("aria-checked") === "true")
    .map((r) => r.textContent);
const options = () => screen.getByRole("radiogroup").querySelector<HTMLElement>("[style]")!;

describe("RadioTileGroup", () => {
  describe("names", () => {
    it("is a radio group named by its label, with each tile named by its option's label once", () => {
      render(<Stateful />);
      expect(screen.getByRole("radiogroup", { name: "Cover photo" })).toBeInTheDocument();
      const names = screen.getAllByRole("radio").map((r) => [radioName(r), r]);
      for (const [name, r] of names) expect(r).toHaveAccessibleName(name as string);
      expect(names.map(([name]) => name)).toEqual(["Harbor at dawn", "Pine ridge", "Salt flats", "Night market"]);
    });

    it("hides the picture from assistive technology, so its alt text isn't read beside the name", () => {
      render(<Stateful />);
      expect(screen.queryAllByRole("img")).toEqual([]);
      expect(radio("Harbor at dawn").querySelector("img")!.closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
    });

    it("describes a tile by its description", () => {
      render(<Stateful />);
      expect(radio("Harbor at dawn")).toHaveAccessibleDescription("Boats under a pink sky");
      expect(radio("Pine ridge")).toHaveAccessibleDescription("");
    });
  });

  describe("choosing", () => {
    it("reports a click's value, and marks that tile aria-checked and data-checked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RadioTileGroup label="Cover photo" options={COVERS} value="" onChange={onChange} />);
      await user.click(radio("Salt flats"));
      expect(onChange).toHaveBeenCalledWith("flats");
    });

    it("moves aria-checked and data-checked with the choice", async () => {
      const user = userEvent.setup();
      render(<Stateful />);
      await user.click(radio("Pine ridge"));
      const marks = screen.getAllByRole("radio").map((r) => `${r.getAttribute("aria-checked")} ${r.hasAttribute("data-checked")}`);
      expect(marks).toEqual(["false false", "true true", "false false", "false false"]);
    });

    it("has one tab stop: the first tile while nothing is chosen, then the chosen one", async () => {
      const user = userEvent.setup();
      render(<Stateful />);
      const stops = () => screen.getAllByRole("radio").filter((r) => r.tabIndex === 0).map((r) => r.textContent);
      expect(stops()).toEqual(["Harbor at dawnBoats under a pink sky"]);
      await user.click(radio("Night market"));
      expect(stops()).toEqual(["Night market"]);
    });
  });

  describe("keys", () => {
    it("moves and chooses in the tiles' order: Down is the next tile, not the one below it", async () => {
      const user = userEvent.setup();
      render(<Stateful />);
      await user.tab();
      const steps: string[] = [];
      for (const key of ["{ArrowDown}", "{ArrowRight}", "{ArrowUp}", "{ArrowLeft}", "{ArrowLeft}"]) {
        await user.keyboard(key);
        steps.push(`${key} ${checked()[0]} ${document.activeElement === screen.getAllByRole("radio").find((r) => r.getAttribute("aria-checked") === "true")}`);
      }
      expect(steps).toEqual([
        "{ArrowDown} Pine ridge true",
        "{ArrowRight} Salt flats true",
        "{ArrowUp} Pine ridge true",
        "{ArrowLeft} Harbor at dawnBoats under a pink sky true",
        "{ArrowLeft} Night market true",
      ]);
    });

    it("goes to the first and last tile that can be chosen with Home and End", async () => {
      const user = userEvent.setup();
      const withDisabled = COVERS.map((o) => (o.value === "market" || o.value === "harbor" ? { ...o, disabled: true } : o));
      render(<Stateful options={withDisabled} initial="ridge" />);
      await user.tab();
      await user.keyboard("{End}");
      const afterEnd = [checked()[0], document.activeElement === radio("Salt flats")];
      await user.keyboard("{Home}");
      const afterHome = [checked()[0], document.activeElement === radio("Pine ridge")];
      expect([afterEnd, afterHome]).toEqual([
        ["Salt flats", true],
        ["Pine ridge", true],
      ]);
    });

    it("still calls the consumer's own onKeyDown", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(<Stateful onKeyDown={onKeyDown} />);
      await user.tab();
      await user.keyboard("{End}");
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("disabled", () => {
    it("takes no choice from a click, the arrows, Home or End when the whole group is disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RadioTileGroup label="Cover photo" options={COVERS} value="ridge" onChange={onChange} disabled />);
      await user.click(radio("Salt flats"));
      radio("Pine ridge").focus();
      await user.keyboard("{ArrowRight}{Home}{End}");
      expect([onChange.mock.calls.length, screen.getAllByRole("radio").every((r) => r.getAttribute("aria-disabled") === "true")]).toEqual([0, true]);
    });

    it("marks a disabled tile data-disabled", () => {
      render(<Stateful options={COVERS.map((o, i) => (i === 1 ? { ...o, disabled: true } : o))} />);
      expect(screen.getAllByRole("radio").map((r) => r.hasAttribute("data-disabled"))).toEqual([false, true, false, false]);
    });
  });

  describe("validation", () => {
    it("says it needs an answer with required, and nothing without it", () => {
      const { rerender } = render(<RadioTileGroup label="Cover photo" options={COVERS} value="" onChange={() => {}} required />);
      const required = screen.getByRole("radiogroup").getAttribute("aria-required");
      rerender(<RadioTileGroup label="Cover photo" options={COVERS} value="" onChange={() => {}} />);
      expect([required, screen.getByRole("radiogroup").getAttribute("aria-required")]).toEqual(["true", null]);
    });

    it("says why the answer is wrong: invalid, described by the message", () => {
      render(<Stateful errorMessage="Choose a cover photo." />);
      const group = screen.getByRole("radiogroup");
      expect(group).toHaveAttribute("aria-invalid", "true");
      expect(group).toHaveAccessibleDescription("Choose a cover photo.");
    });

    it("describes the group by its helper text, and isn't invalid for having one", () => {
      render(<Stateful helperText="Shown at the top of your page." />);
      const group = screen.getByRole("radiogroup");
      expect([group.getAttribute("aria-invalid"), group.getAttribute("aria-required")]).toEqual([null, null]);
      expect(group).toHaveAccessibleDescription("Shown at the top of your page.");
    });

    it("takes the caller's aria-invalid by the rule every Roster field follows", () => {
      render(<Stateful aria-invalid="true" />);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("layout", () => {
    const counts = () =>
      ["--rst-tiles-cols", "--rst-tiles-cols-sm", "--rst-tiles-cols-md", "--rst-tiles-cols-lg", "--rst-tiles-min"].map((p) =>
        options().style.getPropertyValue(p),
      );

    it("sets two to a row, then three from sm, by default", () => {
      render(<Stateful />);
      expect(counts()).toEqual(["2", "3", "3", "3", ""]);
    });

    it("takes one count for every width", () => {
      render(<Stateful columns={4} />);
      expect(counts()).toEqual(["4", "4", "4", "4", ""]);
    });

    it("carries a breakpoint left out up from the one below it, from one at base", () => {
      render(<Stateful columns={{ md: 4 }} />);
      expect(counts()).toEqual(["1", "1", "4", "4", ""]);
    });

    it("fills rows by a minimum width instead of counts when given one", () => {
      render(<Stateful minTileWidth="9rem" />);
      expect(counts()).toEqual(["", "", "", "", "9rem"]);
    });
  });

  describe("styling hooks", () => {
    it("puts tileClassName on every tile, the element with role radio", () => {
      render(<Stateful tileClassName="my-tile" />);
      expect(screen.getAllByRole("radio").every((r) => r.classList.contains("my-tile"))).toBe(true);
    });

    it("draws Roster's chosen look only for outlined, the default", () => {
      const { rerender } = render(<Stateful />);
      const outlined = radio("Pine ridge").className.includes("rst:data-checked:border-(--roster-tile-border-checked)");
      rerender(<Stateful variant="plain" />);
      const plain = radio("Pine ridge").className.includes("rst:data-checked:border-(--roster-tile-border-checked)");
      expect([outlined, plain]).toEqual([true, false]);
    });

    it("marks keyboard focus data-focus-visible, and a click's focus not", async () => {
      const user = userEvent.setup();
      render(<Stateful />);
      await user.tab();
      const byKey = radio("Harbor at dawn").hasAttribute("data-focus-visible");
      await user.click(radio("Salt flats"));
      expect([byKey, radio("Salt flats").hasAttribute("data-focus-visible")]).toEqual([true, false]);
    });
  });
});

/* The accessible name as a screen reader resolves it: through
   `aria-labelledby`, here the option's name inside the tile. */
function radioName(r: HTMLElement) {
  return (r.getAttribute("aria-labelledby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
}
