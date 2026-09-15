import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { RadioGroup, type RadioGroupProps } from "./RadioGroup";
import "@testing-library/jest-dom";

const VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
];

const Stateful = ({
  initial = "",
  ...props
}: Partial<RadioGroupProps> & { initial?: string }) => {
  const [value, setValue] = useState(initial);
  /* `value`/`onChange` after the spread: a caller that passes either would
     otherwise freeze the state and the group would stop responding. */
  return (
    <RadioGroup options={VISIBILITY} {...props} value={value} onChange={setValue} />
  );
};

/* The radio's own `textContent` is the dot and nothing else — the label is a
   sibling inside the `Field`, not a child — so the name has to be resolved
   through `aria-labelledby` the way a screen reader resolves it. */
const checkedNames = () =>
  screen
    .getAllByRole("radio")
    .filter((r) => r.getAttribute("aria-checked") === "true")
    .map(
      (r) =>
        document.getElementById(r.getAttribute("aria-labelledby") ?? "")
          ?.textContent ?? null,
    );

describe("RadioGroup", () => {
  describe("selection", () => {
    it("reports a string rather than an array", async () => {
      /* The entire difference from CheckboxGroup, so it is the first thing
         asserted. A group that handed back `["unlisted"]` would satisfy every
         other test in this file. */
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RadioGroup options={VISIBILITY} value="" onChange={onChange} />);

      await user.click(screen.getByRole("radio", { name: "Unlisted" }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("unlisted");
    });

    it("holds one answer, replacing the last rather than adding to it", async () => {
      const user = userEvent.setup();
      render(<Stateful />);

      await user.click(screen.getByRole("radio", { name: "Unlisted" }));
      expect(checkedNames()).toEqual(["Unlisted"]);

      await user.click(screen.getByRole("radio", { name: "Private" }));
      expect(checkedNames()).toEqual(["Private"]);
    });

    it("selects nothing, and stays reachable, when the value matches no option", () => {
      /* `""` is the ordinary way to spell "not answered yet", and a stale
         value from a form that has since dropped an option behaves the same
         way. Both have to leave exactly one tab stop: none and the group is
         unreachable by keyboard, three and Tab walks through the group instead
         of the arrow keys doing it. */
      render(<RadioGroup options={VISIBILITY} value="carrier-pigeon" onChange={() => {}} />);
      const radios = screen.getAllByRole("radio");

      expect(radios.filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(0);
      expect(radios.filter((r) => r.getAttribute("tabindex") === "0")).toHaveLength(1);
      expect(radios[0]).toHaveAttribute("tabindex", "0");
    });

    it("moves the tab stop to the selected option", () => {
      render(<RadioGroup options={VISIBILITY} value="private" onChange={() => {}} />);
      const radios = screen.getAllByRole("radio");

      expect(radios.filter((r) => r.getAttribute("tabindex") === "0")).toHaveLength(1);
      expect(screen.getByRole("radio", { name: "Private" })).toHaveAttribute(
        "tabindex",
        "0",
      );
    });

    it("selects when the label text is clicked, not only the circle", async () => {
      const user = userEvent.setup();
      render(<Stateful />);

      await user.click(screen.getByText("Unlisted"));
      expect(screen.getByRole("radio", { name: "Unlisted" })).toBeChecked();
    });
  });

  describe("keyboard", () => {
    it("moves and selects with the arrow keys", async () => {
      const user = userEvent.setup();
      render(<Stateful initial="public" />);

      /* `tab()` rather than `focus()`, because reaching the group is part of
         what is being tested: one Tab lands on the selected option, and every
         move after that is the arrow keys' job. */
      await user.tab();
      expect(screen.getByRole("radio", { name: "Public" })).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(checkedNames()).toEqual(["Unlisted"]);

      await user.keyboard("{ArrowUp}");
      expect(checkedNames()).toEqual(["Public"]);
    });

    it("wraps at both ends", async () => {
      /* Wrapping is the part a hand-rolled radio group forgets, and it is most
         of why this is built on Headless UI's RadioGroup rather than on a
         Fieldset full of radios. */
      const user = userEvent.setup();
      render(<Stateful initial="private" />);

      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(checkedNames()).toEqual(["Public"]);

      await user.keyboard("{ArrowUp}");
      expect(checkedNames()).toEqual(["Private"]);
    });

    it("selects the focused option with Space", async () => {
      /* The positive case. Keyboard activation was only ever exercised on a
         disabled radio, where the assertion is that nothing happens — which
         passes just as well if nothing ever happens. */
      const user = userEvent.setup();
      render(<Stateful />);

      await user.tab();
      await user.keyboard(" ");

      expect(screen.getByRole("radio", { name: "Public" })).toBeChecked();
    });

    it("skips a disabled option rather than landing on it", async () => {
      const user = userEvent.setup();
      render(
        <Stateful
          initial="public"
          options={[
            { value: "public", label: "Public" },
            { value: "unlisted", label: "Unlisted", disabled: true },
            { value: "private", label: "Private" },
          ]}
        />,
      );

      await user.tab();
      await user.keyboard("{ArrowDown}");

      expect(checkedNames()).toEqual(["Private"]);
    });
  });

  describe("disabled", () => {
    it("refuses a disabled option without disabling its neighbors", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <RadioGroup
          value=""
          onChange={onChange}
          options={[
            { value: "public", label: "Public" },
            { value: "private", label: "Private", disabled: true },
          ]}
        />,
      );

      await user.click(screen.getByRole("radio", { name: "Private" }));
      expect(onChange).not.toHaveBeenCalled();

      await user.click(screen.getByRole("radio", { name: "Public" }));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("refuses a disabled option through its label too", async () => {
      /* The label is a hit target of its own, so it needs its own guard.
         Headless UI's Label declines to click a target carrying
         `aria-disabled`, which is worth pinning rather than trusting. */
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <RadioGroup
          value=""
          onChange={onChange}
          options={[{ value: "private", label: "Private", disabled: true }]}
        />,
      );

      await user.click(screen.getByText("Private"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("disables every option when the group is disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RadioGroup options={VISIBILITY} value="" onChange={onChange} disabled />);

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toHaveAttribute("aria-disabled", "true");
        await user.click(radio);
      }
      expect(onChange).not.toHaveBeenCalled();
    });

    it("keeps an option disabled when the group is disabled and the option says false", async () => {
      /* `disabled: !canPick` is the ordinary way to write this, and it passes
         an explicit `false`. Headless UI takes the inherited value only when
         the prop is `undefined`, so without `disabled || option.disabled` this
         option lost its `aria-disabled`, kept a real tab stop and could be
         selected from the keyboard inside a disabled group. */
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <RadioGroup
          value=""
          onChange={onChange}
          disabled
          options={[
            { value: "public", label: "Public", disabled: false },
            { value: "private", label: "Private" },
          ]}
        />,
      );

      const publicRadio = screen.getByRole("radio", { name: "Public" });
      expect(publicRadio).toHaveAttribute("aria-disabled", "true");

      /* The label, not only the radio, and this is the half that actually
         depends on `disabled || option.disabled`. A `Radio` ORs the group's
         own disabled state, so the control stays disabled whatever the `Field`
         says; the label and description read the `Field` alone. Asserting only
         the radio passed with the OR removed, which is how this line got
         written in the first place. */
      expect(screen.getByText("Public")).toHaveAttribute("data-disabled");

      /* Wrapped: focusing a Headless UI radio updates its own focus state, and
         a disabled one is reached here by calling `focus()` rather than by
         tabbing to it, which is the whole point — it should have no tab stop
         to reach. */
      await act(async () => publicRadio.focus());
      await user.keyboard(" ");
      await user.click(screen.getByText("Public"));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("labelling and validation", () => {
    it("names the group from `label`", () => {
      render(<Stateful label="Who can see this squad" />);
      expect(
        screen.getByRole("radiogroup", { name: "Who can see this squad" }),
      ).toBeInTheDocument();
    });

    it("describes the group with helper text", () => {
      render(<Stateful label="Visibility" helperText="You can change this later." />);
      expect(screen.getByRole("radiogroup", { name: "Visibility" }))
        .toHaveAccessibleDescription("You can change this later.");
    });

    it("reports the group invalid and describes it with the error message", () => {
      /* Both halves. An error message rendered but wired to nothing is the
         exact bug the first version of this component shipped: `aria-
         describedby` is a prop Headless UI controls on the group, so setting
         it by hand did not merely lose a caller's value, it lost this
         component's — Headless's own `undefined` is spread last and deletes
         the attribute. The message rendered, looked right, and described
         nothing. */
      render(<Stateful label="Visibility" errorMessage="Choose who can see this." />);

      const group = screen.getByRole("radiogroup", { name: "Visibility" });
      expect(group).toHaveAttribute("aria-invalid", "true");
      expect(group).toHaveAccessibleDescription("Choose who can see this.");
    });

    it("prefers the error message over the helper text", () => {
      render(
        <Stateful
          label="Visibility"
          helperText="You can change this later."
          errorMessage="Choose who can see this."
        />,
      );

      expect(screen.queryByText("You can change this later.")).not.toBeInTheDocument();
    });

    it("keeps its own error wiring when the caller passes `aria-invalid`", () => {
      /* `aria-invalid` is not a prop Headless controls, so this component
         spreads `...props` before its own and wins — a caller adding one
         should not be able to report a group with an error message valid. */
      render(
        <Stateful
          label="Visibility"
          errorMessage="Choose who can see this."
          aria-invalid={false}
        />,
      );

      expect(screen.getByRole("radiogroup", { name: "Visibility" })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("lets the error state outrank a caller's own aria-invalid token", () => {
      /* `aria-invalid` takes tokens, not just booleans, and `"grammar"` is a
         real one. It is also the only input that tells `hasError || ariaInvalid`
         apart from `ariaInvalid || hasError`: with a boolean `false` both
         orders resolve to `true` and the assertion above passes either way.
         An error message means the selection is invalid, so it wins. */
      render(
        <Stateful
          label="Visibility"
          errorMessage="Choose who can see this."
          aria-invalid="grammar"
        />,
      );

      expect(screen.getByRole("radiogroup", { name: "Visibility" })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("passes a caller's aria-invalid through when there is no error", () => {
      render(<Stateful label="Visibility" aria-invalid="spelling" />);

      expect(screen.getByRole("radiogroup", { name: "Visibility" })).toHaveAttribute(
        "aria-invalid",
        "spelling",
      );
    });

    it("describes a single radio with its own `description`", () => {
      render(
        <Stateful
          options={[
            { value: "public", label: "Public", description: "Anyone can join." },
          ]}
        />,
      );

      expect(
        screen.getByRole("radio", { name: "Public" }),
      ).toHaveAccessibleDescription("Anyone can join.");
    });

    it("renders nothing selectable for an empty option list", () => {
      render(<RadioGroup options={[]} value="" onChange={() => {}} label="Empty" />);
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(screen.getByRole("radiogroup", { name: "Empty" })).toBeInTheDocument();
    });
  });

  describe("touch targets", () => {
    /* jsdom computes no layout, so none of this measures 44px — it asserts the
       classes that produce it, the way Input.test.tsx does for its own spacing
       and says so in the same words. The measurement was done in the browser:
       every radio's target is a full 44x44 at every size, and the row pitch is
       44px at every size, so no target is clipped by its neighbor's.

       This is the component the release exists to get right, so the guards are
       here rather than left to the Checkbox ones by analogy. */
    it("gives every radio a 44x44 target", () => {
      /* One test rather than one per size, because the classes that build the
         target are in the cva's BASE and identical at every size. Running it
         three times looked like three cases and was one assertion billed as
         three: hard-coding `size="sm"` in a parameterized version left all
         three green, and deleting `before:size-11` failed all three with the
         same message. What genuinely varies with size is the circle, and the
         test below covers that.

         The classes are asserted individually because they fail
         independently and silently: `before:size-11` without `relative`
         anchors the pseudo-element to whatever ancestor happens to be
         positioned, and `before:absolute` without `content` renders nothing at
         all. Neither changes anything a snapshot would catch. */
      render(<RadioGroup options={VISIBILITY} value="" onChange={() => {}} />);

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toHaveClass(
          "rst:relative",
          "rst:before:absolute",
          "rst:before:size-11",
          "rst:before:top-1/2",
          "rst:before:left-1/2",
          "rst:before:-translate-x-1/2",
          "rst:before:-translate-y-1/2",
          "rst:before:content-['']",
        );
      }
    });

    it.each([
      ["sm", "rst:h-4", "rst:w-4"],
      ["md", "rst:h-5", "rst:w-5"],
      ["lg", "rst:h-6", "rst:w-6"],
    ] as const)("keeps the circle at its own dimensions at size %s", (size, h, w) => {
      /* The same regression `Checkbox` guards against, for the same reason:
         the target is a pseudo-element precisely so these numbers can not
         move. Padding would have reached 44 just as well and grown the circle
         the user sees. */
      render(<RadioGroup options={VISIBILITY} value="" onChange={() => {}} size={size} />);
      const radio = screen.getAllByRole("radio")[0];

      expect(radio).toHaveClass(h, w);
      expect(radio.className).not.toMatch(/rst:p[xytrbl]?-/);
    });

    it.each([
      ["sm", "rst:py-3.5"],
      ["md", "rst:py-3"],
      ["lg", "rst:py-2.5"],
    ] as const)(
      "contains each option's target inside its own box at size %s",
      (size, padding) => {
        /* The invariant everything else rests on, and the padding is the whole
           of it. The circle's height equals the label's line-height at every
           size, so a `self-start` radio sits on the first line, and the padding
           is whatever closes the gap to 44: `(44 - line-height) / 2`. That puts
           the radio's center at exactly 22px from the row's top at all three
           sizes, so the target spans the row and nothing else.

           Both earlier versions of this had a branch for described rows and
           both were wrong in a case the branch did not cover. Measured in a
           browser after this one: center 22px from the top, target contained,
           for a one-line label, a wrapping label and a described option
           alike. */
        render(
          <RadioGroup
            value=""
            onChange={() => {}}
            size={size}
            options={[
              { value: "public", label: "Public" },
              { value: "private", label: "Private", description: "Invite only." },
            ]}
          />,
        );

        for (const radio of screen.getAllByRole("radio")) {
          expect(radio.parentElement).toHaveClass("rst:min-h-11", padding);
          /* The same box for both, which is the point: no branch to get wrong. */
          expect(radio.parentElement).toHaveClass("rst:items-start");
          expect(radio).toHaveClass("rst:self-start");
        }
      },
    );

    it("puts the radio on the label's first line, not in the middle of it", () => {
      /* A label is user-supplied text, so it wraps, and a radio centered
         against the block floats between the lines: right for one line,
         visibly wrong for two. `self-start` with no nudge is what fixes it,
         and it works only because the type scale and the size scale agree at
         every step. Asserting the absence of a nudge, because adding one back
         is exactly how this regresses. */
      render(
        <RadioGroup
          value=""
          onChange={() => {}}
          options={[{ value: "a", label: "A label long enough to wrap onto two lines" }]}
        />,
      );

      const radio = screen.getAllByRole("radio")[0];
      expect(radio).toHaveClass("rst:self-start");
      expect(radio.className).not.toMatch(/rst:mt-/);
      expect(radio.className).not.toMatch(/rst:self-center/);
    });

    it("separates one option from the next with row padding, not the gap", () => {
      /* A gap can not do this job. An option with a `description` is a label
         with a second line flush under it; if the distance to the NEXT
         option's label is the same, the description sits equally close to the
         label it belongs to and the one it does not, and the grouping stops
         reading. The padding is on both rows, so the space between two options
         is always both paddings plus the gap, and always larger than the space
         inside one. */
      render(
        <RadioGroup
          value=""
          onChange={() => {}}
          options={[
            { value: "public", label: "Public", description: "Anyone can join." },
            { value: "private", label: "Private", description: "Invite only." },
          ]}
        />,
      );

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio.parentElement).toHaveClass("rst:py-3");
      }
    });

    it("spends the rest of the option's width on the label", () => {
      /* Headless UI's Label clicks the associated `role="radio"` element, which
         is the only reason the text is a hit target at all, so its width is
         hit area: a four-character option was a 30px target with everything
         right of the word doing nothing.

         Width only, and the name says so. The label's height is the text's,
         because the padding that buys the 44px target is on the option box;
         the option's full height is covered by the radio's own target down the
         left rather than by the label. */
      render(<Stateful options={[{ value: "public", label: "Public" }]} />);
      const label = screen.getByText("Public");

      expect(label).toHaveClass("rst:cursor-pointer", "rst:select-none");
      expect(label).toHaveClass("rst:data-disabled:cursor-not-allowed");
      expect(label.parentElement).toHaveClass("rst:flex-1");
    });
  });

  describe("the checked indication", () => {
    /* The dot is the entire visible difference between a selected radio and an
       unselected one, and it had no test at all: `aria-checked` was asserted
       everywhere and the thing a sighted user actually looks at was asserted
       nowhere. A dot stuck at `opacity-0` would have passed the whole suite. */
    const dotOf = (name: string) =>
      screen.getByRole("radio", { name }).querySelector("span");

    it("shows the dot on the selected option and hides it on the others", () => {
      render(
        <RadioGroup
          value="public"
          onChange={() => {}}
          options={[
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
        />,
      );

      expect(dotOf("Public")).toHaveClass("rst:opacity-100");
      expect(dotOf("Private")).toHaveClass("rst:opacity-0");
    });

    it.each([
      ["sm", "rst:size-1.5"],
      ["md", "rst:size-2"],
      ["lg", "rst:size-2.5"],
    ] as const)("scales the dot with the size at %s", (size, dot) => {
      render(
        <RadioGroup
          value="public"
          onChange={() => {}}
          size={size}
          options={[{ value: "public", label: "Public" }]}
        />,
      );

      expect(dotOf("Public")).toHaveClass(dot);
    });

    it("draws the dot from the ink token paired with the fill", () => {
      /* `bg-current` on the dot and `text-{scheme}-600-ink` on the control, so
         the mark reads the ink token that is guaranteed to have contrast on
         whatever fill it is sitting on rather than a color picked by hand.
         Checking both halves: either alone is a dot that might vanish. */
      render(
        <RadioGroup
          value="public"
          onChange={() => {}}
          colorScheme="teal"
          options={[{ value: "public", label: "Public" }]}
        />,
      );

      expect(screen.getByRole("radio", { name: "Public" })).toHaveClass(
        "rst:bg-teal-600",
        "rst:text-teal-600-ink",
      );
      expect(dotOf("Public")).toHaveClass("rst:bg-current");
    });

    it.each([
      ["primary", "rst:bg-primary-600"],
      ["orange", "rst:bg-orange-600"],
      ["teal", "rst:bg-teal-600"],
      ["purple", "rst:bg-purple-600"],
      ["amber", "rst:bg-amber-400"],
      ["success", "rst:bg-success-600"],
      ["error", "rst:bg-error-600"],
      ["neutral", "rst:bg-gray-600"],
    ] as const)("fills a checked %s radio", (colorScheme, fill) => {
      /* All eight, because a compound variant that never resolves emits no
         class and looks correct in the source. `check-classes-emit` catches a
         class that names a token Tailwind never built; nothing but this
         catches a compound row that is simply unreachable. */
      render(
        <RadioGroup
          value="public"
          onChange={() => {}}
          colorScheme={colorScheme}
          options={[{ value: "public", label: "Public" }]}
        />,
      );

      expect(screen.getByRole("radio", { name: "Public" })).toHaveClass(fill);
    });

    it("leaves an unchecked radio on the shared control border token", () => {
      render(
        <RadioGroup
          value=""
          onChange={() => {}}
          options={[{ value: "public", label: "Public" }]}
        />,
      );

      expect(
        screen.getByRole("radio", { name: "Public" }).className,
      ).toContain("rst:border-[var(--roster-control-border)]");
    });
  });

  describe("orientation", () => {
    it("stacks by default and says so to assistive tech", () => {
      render(<Stateful label="Visibility" />);
      const group = screen.getByRole("radiogroup", { name: "Visibility" });

      expect(group).toHaveAttribute("aria-orientation", "vertical");
      expect(
        screen.getAllByRole("radio")[0].parentElement!.parentElement,
      ).toHaveClass("rst:flex-col");
    });

    it("lays the options out in a wrapping row when horizontal", () => {
      /* `flex-wrap` rather than overflow: a row of options that runs off the
         side of a phone is worse than the column it replaced. */
      render(<Stateful label="Visibility" orientation="horizontal" />);
      const group = screen.getByRole("radiogroup", { name: "Visibility" });

      expect(group).toHaveAttribute("aria-orientation", "horizontal");
      expect(
        screen.getAllByRole("radio")[0].parentElement!.parentElement,
      ).toHaveClass("rst:flex-row", "rst:flex-wrap");
    });

    it("guarantees the target across as well as down when horizontal", () => {
      /* Laid out in a row, the binding constraint changes: two radios less
         than 44px apart overlap however tall their boxes are. `min-w-11` holds
         it even for a one-character label. */
      render(
        <Stateful
          orientation="horizontal"
          options={[
            { value: "y", label: "Y" },
            { value: "n", label: "N" },
          ]}
        />,
      );

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio.parentElement).toHaveClass("rst:min-w-11", "rst:min-h-11");
      }
    });

    it("does not stretch the label across, which would part the options", () => {
      render(<Stateful orientation="horizontal" />);
      expect(
        screen.getByText("Public").parentElement!.className,
      ).not.toMatch(/rst:flex-1/);
    });
  });

  describe("size reaches the text, not only the circle", () => {
    it.each([
      ["sm", "rst:text-xs"],
      ["md", "rst:text-sm"],
      ["lg", "rst:text-base"],
    ] as const)("sets the option label to %s's type step", (size, step) => {
      render(<Stateful size={size} />);
      expect(screen.getByText("Public")).toHaveClass(step);
    });
  });

  describe("styling hooks", () => {
    /* Each one is named for the element it reaches, per the README's rule, and
       each is asserted to land on that element and not on a neighbor. A hook
       that silently goes nowhere is the kind of thing a consumer reports as
       "the library ignores my className". */
    it("routes each className to its own element", () => {
      const { container } = render(
        <RadioGroup
          label="Visibility"
          helperText="Pick one."
          value=""
          onChange={() => {}}
          options={[
            { value: "public", label: "Public", description: "Anyone can join." },
          ]}
          className="group-hook"
          optionsClassName="options-hook"
          optionClassName="option-hook"
          radioClassName="radio-hook"
          labelClassName="label-hook"
          optionLabelClassName="option-label-hook"
          descriptionClassName="description-hook"
          messageClassName="message-hook"
        />,
      );

      const radio = screen.getByRole("radio", { name: "Public" });

      expect(container.firstElementChild).toHaveClass("group-hook");
      expect(radio.parentElement!.parentElement).toHaveClass("options-hook");
      expect(radio.parentElement).toHaveClass("option-hook");
      expect(radio).toHaveClass("radio-hook");
      expect(screen.getByText("Visibility")).toHaveClass("label-hook");
      expect(screen.getByText("Public")).toHaveClass("option-label-hook");
      expect(screen.getByText("Anyone can join.")).toHaveClass("description-hook");
      expect(screen.getByText("Pick one.")).toHaveClass("message-hook");
    });

    it("lets a consumer override a class the component set", () => {
      /* `cn` is tailwind-merge, so an escape hatch wins by deleting the class
         it conflicts with rather than by coming later in the attribute. Worth
         pinning: without the merge config recognising the `rst:` prefix this
         would keep both and the winner would fall to stylesheet order. */
      render(
        <RadioGroup
          value=""
          onChange={() => {}}
          options={[{ value: "public", label: "Public" }]}
          optionClassName="rst:min-h-0"
        />,
      );

      const row = screen.getByRole("radio", { name: "Public" }).parentElement!;
      expect(row).toHaveClass("rst:min-h-0");
      expect(row.className).not.toMatch(/rst:min-h-11/);
    });
  });

  describe("the disabled group dims what it disables", () => {
    it("dims the group label and the helper text with the options", () => {
      /* Promised in the prop's own JSDoc and in the Disabled story's prose,
         and previously asserted nowhere. It can not use `data-disabled` the
         way the option labels do: Headless UI's `RadioGroup` reads a disabled
         context but never provides one, so the attribute never lands on either
         of these two elements. */
      render(<Stateful label="Visibility" helperText="Pick one." disabled />);

      expect(screen.getByText("Visibility")).toHaveClass("rst:opacity-50");
      expect(screen.getByText("Pick one.")).toHaveClass("rst:opacity-50");
    });
  });

  describe("the API it deliberately does not have", () => {
    it("takes no `maxHeight`, so nothing scrolls", () => {
      /* `CheckboxGroup` caps its height because it is the long-list control. A
         radio group with enough options to need scrolling wants a `Select`,
         and shipping the affordance would invite the wrong control. Asserted
         rather than left as a comment, because the easiest way for it to
         arrive is someone mirroring CheckboxGroup one more file. */
      const { container } = render(
        <RadioGroup options={VISIBILITY} value="" onChange={() => {}} />,
      );

      expect(container.querySelector("[style*='max-height']")).toBeNull();
      expect(container.querySelector("[tabindex='0'][class*='overflow']")).toBeNull();
    });

    it("reads a list of options as flat even when one carries a `category`", () => {
      /* There is no grouped form. A domain object arriving with its own
         `category` field is an ordinary shape, and it has to be ignored rather
         than change how the list is read — which is the crash CheckboxGroup
         took when it discriminated on that key. */
      render(
        <RadioGroup
          value=""
          onChange={() => {}}
          options={
            [
              { value: "nfl", label: "NFL", category: "Football" },
              { value: "nhl", label: "NHL", category: "Hockey" },
            ] as unknown as RadioGroupProps["options"]
          }
        />,
      );

      expect(screen.getAllByRole("radio")).toHaveLength(2);
      expect(screen.getByRole("radio", { name: "NFL" })).toBeInTheDocument();
    });
  });

  it("puts each radio beside its own label rather than in one run", () => {
    render(<Stateful label="Visibility" />);
    const group = screen.getByRole("radiogroup", { name: "Visibility" });

    for (const name of ["Public", "Unlisted", "Private"]) {
      expect(within(group).getByRole("radio", { name })).toBeInTheDocument();
    }
  });
});
