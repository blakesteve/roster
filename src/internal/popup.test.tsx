import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Select } from "../components/atoms/Select/Select";
import { Combobox } from "../components/atoms/Combobox/Combobox";
import "@testing-library/jest-dom";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

afterEach(cleanup);

/**
 * The `.dark` carry, which is the reason this module exists and was the one
 * thing in it with no test. Deleting the carry from both components left the
 * whole suite green — and that exact regression has already shipped once, as a
 * consumer's menu rendering in Roster's grays under a themed trigger.
 */
describe("carrying a scoped .dark across the portal", () => {
  it("puts the class on Select's panel when the trigger is in a dark subtree", async () => {
    render(
      <div className="dark">
        <Select options={options} value={null} onChange={() => {}} />
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));

    expect((await screen.findByRole("listbox")).className).toContain("dark");
  });

  it("does the same for Combobox", async () => {
    render(
      <div className="dark">
        <Combobox options={options} value={null} onChange={() => {}} />
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));

    expect((await screen.findByRole("listbox")).className).toContain("dark");
  });

  it("adds nothing when there is no dark scope to carry", async () => {
    /* The other half. A panel that always carried `dark` would be worse than
       one that never did. */
    render(<Select options={options} value={null} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button"));

    const classes = (await screen.findByRole("listbox")).className.split(/\s+/);
    expect(classes).not.toContain("dark");
  });
});
