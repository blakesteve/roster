import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { CheckboxGroup, type CheckboxGroupProps } from "./CheckboxGroup";
import "@testing-library/jest-dom";

const FLAT = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
];

const GROUPED = [
  {
    category: "Football",
    options: [
      { value: "nfl", label: "NFL" },
      { value: "ncaaf", label: "NCAA Football" },
    ],
  },
  {
    category: "Hockey",
    options: [{ value: "nhl", label: "NHL" }],
  },
];

const Stateful = ({
  initial = [],
  ...props
}: Partial<CheckboxGroupProps> & { initial?: string[] }) => {
  const [value, setValue] = useState<string[]>(initial);
  /* `value`/`onChange` after the spread: a caller that passes either would
     otherwise freeze the state and the group would stop toggling. */
  return (
    <CheckboxGroup options={FLAT} {...props} value={value} onChange={setValue} />
  );
};

describe("CheckboxGroup", () => {
  it("adds a value on check and removes it on uncheck", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxGroup options={FLAT} value={["email"]} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(onChange).toHaveBeenLastCalledWith(["email", "push"]);

    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("preserves selected values that have no matching option", async () => {
    /* The reason `onChange` appends and filters rather than rebuilding the
       array from `options`: a rebuild sorts into declaration order and
       silently drops anything whose option has not loaded yet. */
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup options={FLAT} value={["carrier-pigeon"]} onChange={onChange} />,
    );

    await user.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(onChange).toHaveBeenLastCalledWith(["carrier-pigeon", "sms"]);
  });

  it("toggles when the label text is clicked, not only the box", async () => {
    const user = userEvent.setup();
    render(<Stateful />);

    await user.click(screen.getByText("Push"));
    expect(screen.getByRole("checkbox", { name: "Push" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("names the group from `label`", () => {
    render(<Stateful label="Notify me by" />);
    expect(
      screen.getByRole("group", { name: "Notify me by" }),
    ).toBeInTheDocument();
  });

  it("makes each category its own named group", () => {
    render(<Stateful options={GROUPED} label="Sports" />);

    const football = screen.getByRole("group", { name: "Football" });
    expect(within(football).getAllByRole("checkbox")).toHaveLength(2);
    expect(
      within(screen.getByRole("group", { name: "Hockey" })).getAllByRole(
        "checkbox",
      ),
    ).toHaveLength(1);
  });

  it("describes the group with helper text", () => {
    render(<Stateful label="Notify me by" helperText="Pick as many as you like." />);
    expect(screen.getByRole("group", { name: "Notify me by" }))
      .toHaveAccessibleDescription("Pick as many as you like.");
  });

  it("reports the group invalid and describes it with the error message", () => {
    render(
      <Stateful label="Notify me by" errorMessage="Choose at least one channel." />,
    );

    const group = screen.getByRole("group", { name: "Notify me by" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Choose at least one channel.");
  });

  it("prefers the error message over the helper text", () => {
    render(
      <Stateful
        label="Notify me by"
        helperText="Pick as many as you like."
        errorMessage="Choose at least one channel."
      />,
    );

    expect(screen.queryByText("Pick as many as you like.")).not.toBeInTheDocument();
  });

  it("describes a single checkbox with its own `description`", () => {
    render(
      <Stateful
        options={[{ value: "email", label: "Email", description: "Every morning." }]}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Email" }),
    ).toHaveAccessibleDescription("Every morning.");
  });

  it("disables one option without disabling its neighbors", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup
        value={[]}
        onChange={onChange}
        options={[
          { value: "email", label: "Email" },
          { value: "sms", label: "SMS", disabled: true },
        ]}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disables every option in every category when the group is disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup options={GROUPED} value={[]} onChange={onChange} disabled />,
    );

    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).toHaveAttribute("aria-disabled", "true");
      await user.click(box);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps an option disabled when the group is disabled and the option says false", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup
        value={[]}
        onChange={onChange}
        disabled
        options={[
          { value: "email", label: "Email", disabled: false },
          { value: "sms", label: "SMS" },
        ]}
      />,
    );

    /* `disabled: !canPick` is the ordinary way to write this, and it passes an
       explicit `false`. Headless UI's Field takes the inherited value only
       when the prop is `undefined`, so without `disabled || option.disabled`
       this option lost its `aria-disabled`, kept a real tab stop and toggled
       from the keyboard inside a disabled group. */
    const email = screen.getByRole("checkbox", { name: "Email" });
    expect(email).toHaveAttribute("aria-disabled", "true");

    email.focus();
    await user.keyboard(" ");
    await user.click(screen.getByText("Email"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("caps the options' height when `maxHeight` is set", () => {
    const { container } = render(<Stateful maxHeight={240} />);
    const panel = container.querySelector<HTMLElement>("[style*='max-height']");
    expect(panel).not.toBeNull();
    expect(panel!.style.maxHeight).toBe("240px");
  });

  it("reads a flat list even when an option carries a `category` field", () => {
    /* The discriminant is `options`, not `category`. A domain object with its
       own `category` used to take the grouped branch and throw on
       `group.options.map`, unmounting the subtree. */
    render(
      <CheckboxGroup
        value={[]}
        onChange={() => {}}
        options={
          [
            { value: "nfl", label: "NFL", category: "Football" },
            { value: "nhl", label: "NHL", category: "Hockey" },
          ] as unknown as CheckboxGroupProps["options"]
        }
      />,
    );

    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "NFL" })).toBeInTheDocument();
  });

  it("keeps its own error wiring when the caller passes `aria-describedby`", () => {
    render(
      <Stateful
        label="Notify me by"
        errorMessage="Choose at least one channel."
        aria-describedby="unrelated-tip"
      />,
    );

    /* Merged rather than replaced. A caller adding a reference should not
       silently delete the error association: the group would render red text
       and describe something else. */
    const group = screen.getByRole("group", { name: "Notify me by" });
    const ids = group.getAttribute("aria-describedby")!.split(" ");
    expect(ids).toContain("unrelated-tip");
    expect(ids.length).toBe(2);
    expect(group).toHaveAttribute("aria-invalid", "true");
  });

  it("gives a capped list its own tab stop", () => {
    /* Headless UI removes `tabindex` from a disabled checkbox rather than
       setting it to -1, so a capped list of disabled options had no focusable
       descendant and could not be scrolled from the keyboard. */
    const { container } = render(<Stateful maxHeight={120} disabled />);
    const panel = container.querySelector<HTMLElement>("[style*='max-height']");
    expect(panel).toHaveAttribute("tabindex", "0");
  });

  it("renders nothing selectable for an empty option list", () => {
    render(<CheckboxGroup options={[]} value={[]} onChange={() => {}} label="Empty" />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("group", { name: "Empty" })).toBeInTheDocument();
  });
});
