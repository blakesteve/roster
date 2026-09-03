import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Select } from "./Select";
import { selectTriggerVariants, selectOptionVariants } from "./select-variants";
import { inputVariants } from "../Input/input-variants";
import { cn } from "../../../lib/utils";
import "@testing-library/jest-dom";

// Polyfill ResizeObserver for Headless UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const options = [
  { value: "1", label: "Option One" },
  { value: "2", label: "Option Two" },
  { value: "3", label: "Disabled Option", disabled: true },
];

describe("Select Component", () => {
  it("renders placeholder when no value is selected", () => {
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Select me"
      />,
    );
    expect(screen.getByText("Select me")).toBeInTheDocument();
  });

  it("renders selected label", () => {
    render(<Select options={options} value="1" onChange={() => {}} />);
    // When "1" is selected, the button should display "Option One"
    expect(screen.getByText("Option One")).toBeInTheDocument();
  });

  it("renders a label above the select when provided", () => {
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        label="My Custom Label"
      />,
    );
    expect(screen.getByText("My Custom Label")).toBeInTheDocument();
  });

  it("opens menu and calls onChange when option clicked", async () => {
    const handleChange = vi.fn();
    render(
      <Select
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Open me"
      />,
    );

    const trigger = screen.getByRole("button", { name: /open me/i });
    fireEvent.click(trigger);

    // Headless UI v2 still utilizes standard ARIA roles
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const optionTwo = within(listbox).getByText("Option Two");
    fireEvent.click(optionTwo);

    expect(handleChange).toHaveBeenCalledWith("2");
  });

  it("does not offer a pointer cursor when disabled", () => {
    /* `cursor-pointer` is unconditional in the base, and the two classes live
       in different tailwind-merge groups so both survive. The disabled rule
       wins on specificity (`.rst\:disabled\:cursor-not-allowed:disabled` is a
       class plus a pseudo-class), which is the same way Input handles it. */
    render(
      <Select options={options} value={null} onChange={() => {}} disabled />,
    );
    expect(screen.getByRole("button")).toHaveClass(
      "rst:disabled:cursor-not-allowed",
    );
  });

  it("mutes itself when disabled", () => {
    /* Matches Input's disabled treatment. Without it the only signal that a
       Select is disabled was that it stopped opening. */
    render(
      <Select options={options} value={null} onChange={() => {}} disabled />,
    );
    expect(screen.getByRole("button")).toHaveClass("rst:disabled:opacity-50");
  });

  it("does not open when disabled", () => {
    const handleChange = vi.fn();
    render(
      <Select
        disabled
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Disabled"
      />,
    );

    const trigger = screen.getByRole("button", { name: /disabled/i });
    fireEvent.click(trigger);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("applies variant and error classes correctly to the trigger", () => {
    const { rerender } = render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Variant Test"
        variant="slate"
      />,
    );

    const trigger = screen.getByRole("button", { name: /variant test/i });
    expect(trigger).toHaveClass("rst:bg-gray-700", "rst:dark:bg-gray-900");

    rerender(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Variant Test"
        error={true}
      />,
    );
    expect(trigger).toHaveClass("rst:ring-error-500", "rst:text-error-600");
  });
});

describe("Select sizing", () => {
  const trig = () => screen.getByRole("button");

  const heightOf = (classes: string) =>
    cn(classes)
      .split(/\s+/)
      .find((c) => /^rst:h-\d+$/.test(c));

  it.each(["sm", "default", "lg"] as const)(
    "is the same height as Input at size %s",
    (size) => {
      /* Only Select-vs-Input is asserted here. Input-vs-Button is Input's own
         test to own, and equality is transitive, so re-deriving it in this file
         would just mean two places to update when Button's scale moves. */
      const select = heightOf(selectTriggerVariants({ size }));
      const input = heightOf(inputVariants({ size }));

      /* Asserted rather than assumed: if either stops emitting a height
         utility, both lookups return undefined and a plain equality check
         would pass on nothing. */
      expect(select).toBeDefined();
      expect(input).toBeDefined();
      expect(select).toBe(input);
    },
  );

  it.each([
    ["sm", "rst:h-9"],
    ["default", "rst:h-10"],
    ["lg", "rst:h-11"],
  ] as const)("renders size %s as %s", (size, height) => {
    /* Through the component, not the variant function. `defaultVariants` pins
       size to "default", so dropping the prop on the way to
       `selectTriggerVariants` would still produce a correct-looking h-10 and
       every other assertion here would pass. This is the one that fails when
       the prop stops arriving. */
    render(
      <Select options={options} value={null} onChange={() => {}} size={size} />,
    );
    expect(trig()).toHaveClass(height);
  });

  it("defaults to the same height as a default Button", () => {
    render(<Select options={options} value={null} onChange={() => {}} />);
    expect(trig()).toHaveClass("rst:h-10");
  });

  it("has no viewport-dependent geometry in any variant or size", () => {
    /* THE test for the defect this branch exists to fix, and it has to live
       here rather than in a story.

       The original bug was `sm:leading-6` in the base: height came out of
       `py-2.5` plus the line box, so the trigger was 40px on mobile and 44px
       from `sm` up — the only control in the library whose height moved at a
       breakpoint. The obvious place to catch that is the browser, except the
       Storybook project runs at Vitest's default 414px width (nothing sets
       `browser.viewport` in vite.config.ts), which is BELOW the sm breakpoint.
       At 414px the broken version rendered 40px and matched Input exactly, so
       every play function in this suite passes against it. The browser is the
       wrong instrument for this one.

       So: scan every string the component can emit for a responsive or theme
       modifier attached to a geometry utility. This catches `sm:leading-6`,
       and equally `sm:h-12`, `dark:h-12` and `md:py-2` — none of which the
       earlier version of this test saw, because it only looked at
       `selectTriggerVariants({})`, i.e. one variant and one size out of
       fifteen combinations. */
    const geometry = /(^|:)(h|min-h|max-h|py|pt|pb|leading|text)-(xs|sm|base|lg|xl|\\d)/;
    const modified = /^rst:[a-z0-9-]+:/;

    const emitted: string[] = [];
    for (const variant of [
      "white",
      "soft",
      "slate",
      "outline",
      "ghost",
    ] as const) {
      for (const size of ["sm", "default", "lg", null] as const) {
        emitted.push(selectTriggerVariants({ variant, size }));
        emitted.push(selectTriggerVariants({ variant, size, error: true }));
      }
    }
    for (const size of ["sm", "default", "lg", null] as const) {
      emitted.push(selectOptionVariants({ size }));
    }

    const offenders = [
      ...new Set(
        emitted
          .flatMap((c) => c.split(/\s+/))
          .filter((c) => modified.test(c) && geometry.test(c)),
      ),
    ];
    expect(offenders).toEqual([]);

    /* Negative assertions pass on an empty string, so pin the positive too:
       the base must still carry a height at every size. */
    for (const size of ["sm", "default", "lg", null] as const) {
      expect(heightOf(selectTriggerVariants({ size }))).toBeDefined();
    }
  });

  it("has no viewport-dependent geometry in the open menu either", async () => {
    /* The variant scan above covers the trigger and the option rows. It did not
       cover the popup, and that is exactly where the same defect was still
       alive: ListboxOptions carried `text-base sm:text-sm`, so a menu row was
       44px on mobile and 40px from `sm` up — the trigger's old bug, one element
       away, in the part of the component this change just gave a size scale.
       The font size now lives on `selectOptionVariants` with no modifier.

       Scanned off the rendered DOM rather than a source string, because the
       popup's classes are written inline in the component. */
    const geometry = /(^|:)(h|min-h|max-h|py|pt|pb|leading|text)-(xs|sm|base|lg|xl|\d)/;
    const modified = /^rst:[a-z0-9-]+:/;

    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Open me"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /open me/i }));
    const listbox = await screen.findByRole("listbox");

    const classes = [listbox, ...within(listbox).getAllByRole("option")]
      .flatMap((el) => [...el.classList])
      .filter((c) => modified.test(c) && geometry.test(c));
    expect([...new Set(classes)]).toEqual([]);
  });

  it("keeps a usable height and padding when size is null", () => {
    /* `VariantProps` admits null, so `size={fieldSize ?? null}` typechecks and
       skips `defaultVariants` entirely. Without floors in the base that is a
       trigger with no height and its label flush against the ring. */
    render(
      <Select options={options} value={null} onChange={() => {}} size={null} />,
    );
    expect(trig()).toHaveClass("rst:h-10", "rst:pl-4", "rst:pr-10");
  });

  it.each([
    ["sm", "rst:pl-3", "rst:pr-9"],
    ["default", "rst:pl-4", "rst:pr-10"],
    ["lg", "rst:pl-4", "rst:pr-10"],
  ] as const)("insets the label for size %s", (size, pl, pr) => {
    render(
      <Select options={options} value={null} onChange={() => {}} size={size} />,
    );
    expect(trig()).toHaveClass(pl, pr);
  });

  it.each([
    ["sm", "rst:pr-2.5"],
    ["default", "rst:pr-3"],
    ["lg", "rst:pr-3"],
  ] as const)("insets the chevron for size %s", (size, pr) => {
    const { container } = render(
      <Select options={options} value={null} onChange={() => {}} size={size} />,
    );
    const chevron = container.querySelector(".rst\\:pointer-events-none");
    expect(chevron).toBeInTheDocument();
    expect(chevron).toHaveClass(pr);
  });

  it.each([
    ["sm", "rst:pl-3"],
    ["default", "rst:pl-4"],
    ["lg", "rst:pl-4"],
  ] as const)(
    "gives the menu rows the trigger's own left inset at size %s",
    async (size, pl) => {
      /* Through the component and with the menu OPEN, not by comparing the two
         variant functions to each other. Passing `size` to
         `selectTriggerVariants` and not to `selectOptionVariants` is a single
         deleted argument, it produces exactly the sideways jump this is meant
         to prevent, and a variant-to-variant comparison cannot see it. */
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          size={size}
          placeholder="Open me"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /open me/i }));
      const listbox = await screen.findByRole("listbox");
      for (const opt of within(listbox).getAllByRole("option")) {
        expect(opt).toHaveClass(pl);
      }
    },
  );
});

describe("Select escape hatches", () => {
  it("sends className to the wrapper and triggerClassName to the trigger", () => {
    /* Both directions, so neither can quietly start going to the other place.
       Asserting only the trigger would survive `className` being dropped on the
       floor entirely, which is what makes `flex-1` work in a paired row. */
    const { container } = render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        className="rst:max-w-xs"
        triggerClassName="rst:font-mono"
      />,
    );
    const wrapper = container.firstElementChild!;
    const trigger = screen.getByRole("button");

    expect(wrapper).toHaveClass("rst:max-w-xs");
    expect(wrapper).not.toHaveClass("rst:font-mono");
    expect(trigger).toHaveClass("rst:font-mono");
    expect(trigger).not.toHaveClass("rst:max-w-xs");
  });

  it("lets triggerClassName beat the variant's own height", () => {
    /* Asserted as the ABSENCE of the class it overrides, not as ordering.
       `cn` is tailwind-merge and DELETES the loser; if it ever degraded to
       plain concatenation, both classes would be present, the last one in the
       stylesheet would win, and an ordering assertion would still pass. */
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        triggerClassName="rst:h-20"
      />,
    );
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveClass("rst:h-20");
    expect(trigger).not.toHaveClass("rst:h-10");
  });

  it("forwards arbitrary attributes to the field wrapper specifically", () => {
    /* These have always typechecked — SelectProps extends
       HTMLAttributes<HTMLDivElement> — and were then dropped, because the
       component never spread `...props`.

       Pinned to `firstElementChild` rather than looked up anywhere in the
       subtree, so the test cannot pass on the attribute landing on the trigger
       instead. Listbox renders as a Fragment, so the wrapper really is the
       first element.

       Only `id` and `data-*` are asserted. `aria-describedby` also arrives, but
       on a wrapper div with no role it is inert, so pinning it here would
       enshrine an accessibility no-op as a feature. */
    const { container } = render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        id="region-field"
        data-analytics-id="region"
      />,
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper).toHaveAttribute("id", "region-field");
    expect(wrapper).toHaveAttribute("data-analytics-id", "region");
  });
});

describe("Select theming", () => {
  it("puts the token classes on the rendered trigger, not just in the variant", () => {
    /* Asserted on the DOM, i.e. AFTER `cn`, and paired with the absence of the
       hardcoded classes it replaced. The earlier version of this test read the
       raw cva string, which is the wrong side of tailwind-merge: appending
       `rst:ring-gray-300` to the variant would delete the token class on its
       way to the DOM while leaving the substring in the source, so the test
       passed against a component whose tokens were entirely dead. */
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        variant="outline"
      />,
    );
    const trigger = screen.getByRole("button");

    expect(trigger).toHaveClass(
      "rst:bg-[var(--roster-control-bg)]",
      "rst:text-[var(--roster-control-text)]",
      "rst:ring-[color:var(--roster-control-border)]",
    );
    expect(trigger).not.toHaveClass("rst:ring-gray-300");
    expect(trigger).not.toHaveClass("rst:dark:ring-gray-700");
    expect(trigger).not.toHaveClass("rst:text-gray-900");
  });

  it("does not repaint the themed surface on hover", () => {
    /* The one variant that reads tokens must not also carry a hardcoded hover
       fill. tailwind-merge keeps `hover:bg-gray-50` alongside
       `bg-[var(--roster-control-bg)]` because the modifiers differ, so a themed
       trigger took the consumer's color at rest and Roster's on hover. The
       other four variants each name a concrete surface and keep theirs. */
    const outline = cn(selectTriggerVariants({ variant: "outline" }));
    expect(outline).not.toMatch(/hover:bg-/);

    const white = cn(selectTriggerVariants({ variant: "white" }));
    expect(white).toMatch(/hover:bg-/);
  });

  it("resolves the error ring over the base focus ring", () => {
    /* Both must use the SAME modifier. The base sets
       `focus-visible:ring-ring`; when the error state used `focus:ring-error-500`
       the two landed in different tailwind-merge groups, both survived, and
       equal specificity handed the win to whichever came later in the
       stylesheet — the primary ring, on an errored field. */
    const errored = cn(selectTriggerVariants({ error: true }));
    expect(errored).toContain("rst:focus-visible:ring-error-500");
    expect(errored).not.toContain("rst:focus-visible:ring-ring");
    expect(errored).not.toMatch(/rst:focus:ring-error/);
  });

  it("reads the input family rather than a select family of its own", () => {
    /* The two controls sit in one row of one form and are drawn to look
       identical, so being able to repaint one and not the other is a bug. If
       someone introduces --roster-select-*, this is the test that argues. */
    const outline = cn(selectTriggerVariants({ variant: "outline" }));
    expect(outline).not.toMatch(/--roster-select-/);
  });
});
