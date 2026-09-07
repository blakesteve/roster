import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
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

  it("gives soft the border token as a ring", () => {
    /* The trigger draws a ring rather than a border, so the token lands there.
       Same reason as Input's and Textarea's: a filled field cannot supply its
       own boundary on a surface it does not know. */
    render(<Select options={options} value={null} onChange={() => {}} variant="soft" />);
    const trigger = screen.getByRole("button");

    expect(trigger.className).toContain("var(--roster-control-border)");
    expect(trigger).not.toHaveClass("rst:ring-transparent");
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

  describe("the menu", () => {
    it("leaves the height to Headless UI rather than restating it", async () => {
      /* This is the correction, and it is worth writing down. The filed bug
         said the panel had no max-height and no overflow, so a long list ran
         off the screen. It never did: Headless UI's `size` middleware writes
         BOTH inline on this element whenever `anchor` is set —
         `overflow: "auto"` and `maxHeight: min(var(--anchor-max-height,100vh),
         Npx)`. A utility class here loses to that inline rule anyway, so
         adding one bought nothing and implied a fix that was not happening.

         Asserted as an absence, which is the only shape this can take: the day
         someone re-adds a height utility here, this fails and sends them to
         the comment explaining why it cannot work. */
      render(
        <Select
          options={Array.from({ length: 60 }, (_, i) => ({
            value: `v${i}`,
            label: `Option ${i}`,
          }))}
          value={null}
          onChange={() => {}}
        />,
      );
      fireEvent.click(screen.getByRole("button"));
      const listbox = await screen.findByRole("listbox");

      const classes = listbox.className.split(/\s+/);
      expect(classes.some((c) => /^rst:max-h-/.test(c))).toBe(false);
      expect(classes.some((c) => /^rst:overflow-/.test(c))).toBe(false);
    });

    it("lets a consumer cap the menu through the variable Headless UI reads", async () => {
      /* The supported way to get a shorter menu. `--anchor-max-height` is read
         by that inline `min()` and never set by Headless UI — it is an author
         hook like `--anchor-gap` — so a consumer sets the VARIABLE, not a
         height, and the inline rule does the rest. A `max-h-*` through
         `optionsClassName` would be silently outranked. */
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          optionsClassName="rst:[--anchor-max-height:20rem]"
        />,
      );
      fireEvent.click(screen.getByRole("button"));

      expect(await screen.findByRole("listbox")).toHaveClass(
        "rst:[--anchor-max-height:20rem]",
      );
    });

    it("draws its surface from the popover tokens, not from hardcoded colors", async () => {
      /* The half that 4.8.0 did not fix: a consumer could repaint the trigger
         with `--roster-control-*` and it opened a hardcoded white sheet. */
      render(<Select options={options} value={null} onChange={() => {}} />);
      fireEvent.click(screen.getByRole("button"));
      const listbox = await screen.findByRole("listbox");

      expect(listbox).toHaveClass(
        "rst:bg-[var(--roster-popover-bg)]",
        "rst:text-[var(--roster-popover-text)]",
        "rst:ring-[var(--roster-popover-border)]",
      );
      expect(listbox).not.toHaveClass("rst:bg-white");
      expect(listbox).not.toHaveClass("rst:dark:bg-gray-800");
      expect(listbox).not.toHaveClass("rst:ring-black/5");
    });

    it("takes optionsClassName, the escape hatch the panel never had", async () => {
      /* Deliberately not a height: Headless UI's inline `max-height` outranks
         any utility, so a `max-h-*` here would land in the class list and do
         nothing — a test that passed while the feature failed. Padding is
         something the prop can actually deliver. */
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          optionsClassName="rst:p-2"
        />,
      );
      fireEvent.click(screen.getByRole("button"));

      expect(await screen.findByRole("listbox")).toHaveClass("rst:p-2");
    });

    it("lets the surface token reach the option labels", async () => {
      /* The option labels are the ONLY text in this panel. They used to carry
         `text-gray-900 dark:text-gray-100`, and a color declaration on the
         option beats the panel's inherited token — so `--roster-popover-text`
         was dead for the one thing anyone reads, and darkening the surface
         produced near-black on near-black. */
      render(<Select options={options} value={null} onChange={() => {}} />);
      fireEvent.click(screen.getByRole("button"));
      const listbox = await screen.findByRole("listbox");

      for (const opt of within(listbox).getAllByRole("option")) {
        expect(opt).toHaveClass("rst:text-inherit");
        expect(opt).not.toHaveClass("rst:text-gray-900");
        expect(opt).not.toHaveClass("rst:dark:text-gray-100");
      }
    });

    it("reports invalidity on the trigger, not only in the message", async () => {
      /* Headless UI's Listbox emits `data-invalid` and no `aria-invalid`, and
         this component's `...props` land on the inert wrapper div — so there
         was no route to it from either side, and a screen reader heard the
         error text on focus while the field never announced as invalid. */
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          errorMessage="Choose a sky"
        />,
      );
      expect(screen.getByRole("button")).toHaveAttribute("aria-invalid", "true");

      cleanup();
      render(<Select options={options} value={null} onChange={() => {}} />);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("describing the trigger", () => {
    it("renders helper text and points the trigger at it", () => {
      /* `aria-describedby` passed to the component lands on the wrapper div,
         which has no role and is inert. Headless UI wires the trigger from the
         Field's Description context instead, which is the path assistive tech
         follows — and Select never rendered one. */
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          helperText="Pick the one you want"
        />,
      );

      const trigger = screen.getByRole("button");
      const description = screen.getByText("Pick the one you want");
      expect(trigger).toHaveAttribute("aria-describedby", description.id);
    });

    it("says what is wrong instead of only turning red", () => {
      /* `error` on its own drew a red ring and no text anywhere, for anyone. */
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          errorMessage="Choose a sky"
        />,
      );

      const trigger = screen.getByRole("button");
      const message = screen.getByText("Choose a sky");
      expect(trigger).toHaveAttribute("aria-describedby", message.id);
      expect(message).toHaveClass("rst:text-error-600");
    });

    it("treats errorMessage as implying error, so the ring cannot go missing", () => {
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          variant="outline"
          errorMessage="Choose a sky"
        />,
      );

      /* Same assertion shape as passing `error` explicitly: whatever the
         error state paints, `errorMessage` must paint it too. */
      const withMessage = screen.getByRole("button").className;
      cleanup();
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          variant="outline"
          error
        />,
      );
      expect(screen.getByRole("button").className).toBe(withMessage);
    });

    it("prefers the error message over the helper text", () => {
      render(
        <Select
          options={options}
          value={null}
          onChange={() => {}}
          helperText="Pick the one you want"
          errorMessage="Choose a sky"
        />,
      );

      expect(screen.getByText("Choose a sky")).toBeInTheDocument();
      expect(screen.queryByText("Pick the one you want")).not.toBeInTheDocument();
    });
  });

  it("dims its label and description when disabled", () => {
    /* `disabled` used to reach the Listbox only, so the Field's
       DisabledProvider stayed false and the Label never picked up its
       `peer-disabled` styling. Now that a Description renders under the
       trigger, the same would have applied to that — a control whose label and
       helper text look enabled reads as broken rather than unavailable. */
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        label="Fruit"
        helperText="Pick one"
        disabled
      />,
    );

    expect(screen.getByText("Fruit").closest("[data-disabled]")).toBeTruthy();
    expect(screen.getByText("Pick one").closest("[data-disabled]")).toBeTruthy();
  });
});
