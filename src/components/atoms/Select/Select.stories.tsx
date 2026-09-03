import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Select, type SelectOption, type SelectProps } from "./Select";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";

const meta = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A robust **Select** component (powered by Headless UI v2 Listbox). It provides native-like accessibility with custom styling capabilities. It is a controlled component requiring `value` and `onChange` props.\n\n**Sizing** matches `Button` and `Input` exactly — `sm` / `default` / `lg` are `h-9` / `h-10` / `h-11`. The trigger previously had no height class at all: it was `py-2.5` plus a line box, with `sm:leading-6` in the base, which made it the only control in the library that changed height at a breakpoint (40px on mobile, 44px from `sm` up). See *Paired With Input And Button*.\n\n**Theming**: the `outline` variant reads the same `--roster-control-bg`, `-border` and `-text` custom properties as `Input`, so the two controls repaint together. See *Themed With Tokens*.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12">
        <div className="light rst:bg-gray-50 rst:p-6 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:mb-6 rst:uppercase rst:tracking-widest">
            Light Mode Preview
          </p>
          <div className="rst:pb-32 rst:max-w-sm">
            <Story />
          </div>
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode Preview
          </p>
          <div className="rst:pb-32 rst:max-w-sm">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["white", "soft", "slate", "outline", "ghost"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "Matches Button and Input: h-9 / h-10 / h-11.",
    },
    triggerClassName: {
      control: false,
      description:
        "Classes for the trigger button itself. `className` goes to the outer Field wrapper.",
    },
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const fruitOptions: SelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian (Disabled)", disabled: true },
  { value: "elderberry", label: "Elderberry" },
];

// --- Wrapper for Controlled State in Storybook ---
const SelectWithState = (args: SelectProps) => {
  const [val, setVal] = useState<string | number | null>(args.value ?? null);
  return <Select {...args} value={val} onChange={setVal} />;
};

const trigger = (root: ParentNode) =>
  root.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]')!;

export const DefaultOutline: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Choose a fruit...",
    variant: "outline",
    label: "Favorite Fruit",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

/**
 * Not in the docs page: this is the guard on the token chain.
 */
export const DefaultOutlineTokensResolve: Story = {
  tags: ["!autodocs"],
  args: {
    options: fruitOptions,
    placeholder: "Choose a fruit...",
    variant: "outline",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
  play: async ({ canvasElement }) => {
    /* Same job as Input's story of this name, and the same reason it has to run
       in a browser: `check-classes-emit.mjs` proves a class emits a rule, and
       cannot prove the custom property inside an arbitrary value resolves. A
       typo emits valid CSS and goes invalid at computed-value time.

       The ring is the part worth guarding hardest, because it is a box-shadow
       rather than a color property: nothing else in the test suite would
       notice it going missing. `ring-[…]` is also the one arbitrary value here
       that could legally be read as a length instead of a color, which is why
       the class carries a `color:` hint — though the bare form resolves fine
       on Tailwind 4.1, which was checked by deleting the hint and watching
       this assertion still pass.

       The values are what `outline` rendered BEFORE it read tokens: ring-gray-300
       / dark:ring-gray-700 and text-gray-900 / dark:text-gray-100. The meta
       decorator renders every story twice, light then dark.

       What this story CANNOT prove, because it asserts each token's own
       default: that the trigger reads a token at all rather than hardcoding
       the same value. `ThemedWithTokens` is the story that proves that, by
       overriding them. Both are needed. */
    const [light, dark] = [...canvasElement.querySelectorAll<HTMLElement>(
      'button[aria-haspopup="listbox"]',
    )];
    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();

    /* The ring's geometry only exists in the shadow string, so `toContain` on
       the color alone would survive `ring-inset` being dropped (an outer ring
       is 1px of extra bounds, which breaks alignment against Input's border)
       or `ring-1` becoming `ring-2`. Both are pinned here. */
    const l = getComputedStyle(light);
    expect(l.boxShadow).toContain("rgb(214, 211, 209)"); // gray-300
    expect(l.boxShadow).toContain("inset");
    expect(l.boxShadow).toMatch(/0px 0px 0px 1px/);
    expect(l.color).toBe("rgb(28, 25, 23)"); // gray-900
    expect(l.backgroundColor).toBe("rgba(0, 0, 0, 0)"); // --roster-control-bg

    const d = getComputedStyle(dark);
    expect(d.boxShadow).toContain("rgb(68, 64, 60)"); // gray-700
    expect(d.boxShadow).toContain("inset");
    expect(d.color).toBe("rgb(245, 245, 244)"); // gray-100
    expect(d.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

export const SoftVariant: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Subtle selection...",
    variant: "soft",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const MegaSquadSlate: Story = {
  args: {
    options: [
      { value: "qb", label: "Quarterback (QB)" },
      { value: "rb", label: "Running Back (RB)" },
      { value: "wr", label: "Wide Receiver (WR)" },
    ],
    placeholder: "Filter by Position",
    variant: "slate",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const WithError: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Required Field",
    error: true,
    label: "Invalid Selection",
    value: null,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

export const Disabled: Story = {
  args: {
    options: fruitOptions,
    value: "banana",
    disabled: true,
    onChange: () => {},
  },
  render: (args) => <SelectWithState {...args} />,
};

/**
 * The three sizes, and the heights they resolve to.
 */
export const Sizes: Story = {
  args: {
    options: fruitOptions,
    value: null,
    onChange: () => {},
  },
  render: (args) => (
    <div className="rst:space-y-4">
      <SelectWithState {...args} size="sm" label="Small" placeholder="h-9" />
      <SelectWithState
        {...args}
        size="default"
        label="Default"
        placeholder="h-10"
      />
      <SelectWithState {...args} size="lg" label="Large" placeholder="h-11" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* Heights in pixels rather than class names, because the original defect
       was not a missing class: it was `sm:leading-6` in the base, so the
       rendered height depended on the viewport.

       Being honest about the limit, though: this runner has ONE viewport, and
       nothing sets `browser.viewport` in vite.config.ts, so it is Vitest's
       default 414px — below the `sm` breakpoint. At 414px the broken version
       rendered 40px and matched Input exactly, so this story would have passed
       against it. The test that actually catches that class of bug is the
       variant scan in Select.test.tsx, which is viewport-independent. This
       story pins the pixel values; it does not pin them across breakpoints. */
    const triggers = [
      ...canvasElement.querySelectorAll<HTMLElement>(
        'button[aria-haspopup="listbox"]',
      ),
    ];
    /* Six, not three: the meta decorator renders the story twice, light then
       dark, in that DOM order. Taking the first three would have checked the
       light copy only, and a dark-scoped height rule would have sailed
       through. The exact count is asserted so that adding a fourth size cannot
       silently drop a check. */
    expect(triggers).toHaveLength(6);
    const expected = [36, 40, 44, 36, 40, 44];
    triggers.forEach((t, i) => {
      expect(t.getBoundingClientRect().height).toBeCloseTo(expected[i], 0);
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "`sm` / `default` / `lg` resolve to `h-9` / `h-10` / `h-11`, the same scale as `Button` and `Input`. Unit tests assert all three components agree at every shared size, so they cannot drift apart.",
      },
    },
  },
};

/**
 * The row this change exists for.
 */
export const PairedWithInputAndButton: Story = {
  args: {
    options: fruitOptions,
    value: null,
    onChange: () => {},
  },
  render: (args) => (
    <div className="rst:space-y-6">
      {(["sm", "default", "lg"] as const).map((size) => (
        <div key={size} className="rst:flex rst:items-end rst:gap-2">
          <SelectWithState
            {...args}
            size={size}
            label={`size="${size}"`}
            placeholder="Platform"
            className="rst:flex-1"
          />
          <Input size={size} placeholder="Title" className="rst:flex-1" />
          <Button size={size} colorScheme="primary">
            Save
          </Button>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* game-verdict's GameEditForm puts exactly this row on screen: an Input
       between two Selects in a `sm:grid-cols-3` grid. Before this change the
       Select was 44px there against the Input's 40px, and the mismatch only
       appeared from the `sm` breakpoint up — so it was invisible in any test
       that rendered narrow, and invisible in jsdom entirely. */
    const rows = [...canvasElement.querySelectorAll("div")].filter(
      (d) =>
        d.className.includes("items-end") &&
        d.querySelector('button[aria-haspopup="listbox"]') &&
        d.querySelector("input"),
    );
    /* Exactly six: three sizes across the decorator's light and dark copies.
       `toBeGreaterThan(0)` accepts one, so dropping two sizes from the map
       would have silently deleted two thirds of the coverage. */
    expect(rows).toHaveLength(6);

    for (const row of rows) {
      const t = trigger(row).getBoundingClientRect();
      const input = row.querySelector("input")!.getBoundingClientRect();
      const button = row
        .querySelector<HTMLButtonElement>('button:not([aria-haspopup])')!
        .getBoundingClientRect();

      expect(Math.abs(t.height - input.height)).toBeLessThan(0.5);
      expect(Math.abs(t.height - button.height)).toBeLessThan(0.5);

      /* Bottom edges, not just heights. Select spaces its Field with `gap`
         rather than `space-y`, so it never had Input's phantom-margin bug —
         Headless UI's trailing hidden element is `display: none` and so is not
         a flex item. This asserts that stays true. */
      expect(Math.abs(t.bottom - input.bottom)).toBeLessThan(0.5);
      expect(Math.abs(t.bottom - button.bottom)).toBeLessThan(0.5);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "The case that motivated the size prop. `Select` had no height class: its trigger was `py-2.5` plus a line box, with `sm:leading-6` in the base, so it rendered 40px on mobile and 44px from `sm` up — the only control in the library whose height moved at a breakpoint. Note `className` on the field: it lands on the outer wrapper, which is what makes `flex-1` work here.",
      },
    },
  },
};

/**
 * A Select and an Input wearing a host's palette, together.
 */
export const ThemedWithTokens: Story = {
  args: {
    options: fruitOptions,
    value: null,
    onChange: () => {},
  },
  render: (args) => (
    <div
      className="rst:rounded-xl rst:p-6"
      style={
        {
          background: "#1a1a2e",
          "--roster-control-border": "rgba(212,175,55,0.28)",
          "--roster-control-bg": "rgba(255,255,255,0.02)",
          "--roster-control-text": "#f5f5f4",
          "--roster-control-border-focus": "rgba(212,175,55,0.9)",
        } as React.CSSProperties
      }
    >
      <div className="rst:flex rst:items-end rst:gap-2">
        <SelectWithState
          {...args}
          size="lg"
          placeholder="Pick a fruit"
          className="rst:flex-1"
        />
        <Input size="lg" placeholder="or type one" className="rst:flex-1" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* The half `DefaultOutlineTokensResolve` cannot do. That story asserts each
       token's own default, so it passes just as happily against a trigger that
       hardcodes gray-300 and reads nothing. This one overrides the tokens and
       asserts the override lands, which is the only proof the chain is live.

       It is also the regression guard for a bug this story itself exposed: the
       `outline` variant used to carry `hover:bg-gray-50`. tailwind-merge keeps
       it alongside the token background (different modifier), so a themed
       trigger took the host's color at rest and gray-50 on hover — here, near
       white text on near white, about 1:1. */
    const triggers = [
      ...canvasElement.querySelectorAll<HTMLElement>(
        'button[aria-haspopup="listbox"]',
      ),
    ];
    expect(triggers).toHaveLength(2); // light and dark copies

    for (const t of triggers) {
      const c = getComputedStyle(t);
      expect(c.color).toBe("rgb(245, 245, 244)");
      expect(c.backgroundColor).toBe("rgba(255, 255, 255, 0.02)");
      expect(c.boxShadow).toContain("rgba(212, 175, 55, 0.28)");
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "`Select`'s `outline` variant reads the same `--roster-control-bg`, `-border` and `-text` custom properties as `Input`'s, rather than a `--roster-select-*` family of its own. These two controls sit in the same row of the same form and are drawn to look identical, so a consumer who could repaint one and not the other would have a bug, not a choice.\n\nThere is no `-border-focus` on the trigger: focus here is the shared `--roster-ring`, not a border color.\n\nSet the tokens in **both** `:root` and `.dark` in real usage. Roster's own `.dark` rule has equal specificity and comes later in the stylesheet, so a `:root`-only override is discarded in dark mode.",
      },
    },
  },
};

/**
 * `className` and `triggerClassName` go to different elements.
 */
export const ReachingTheTrigger: Story = {
  args: {
    options: fruitOptions,
    value: null,
    onChange: () => {},
  },
  render: (args) => (
    <SelectWithState
      {...args}
      label="Region"
      placeholder="Monospace, via triggerClassName"
      className="rst:max-w-xs"
      triggerClassName="rst:font-mono rst:tracking-wider"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`className` lands on the outer `Field` wrapper, which is right for layout — width, flex, margins. `triggerClassName` reaches the trigger button itself and wins over the variant, not because it comes last in the attribute (CSS ignores that) but because `cn` is tailwind-merge and removes the class it conflicts with. Mirrors `Input`'s `inputClassName`.",
      },
    },
  },
};

/**
 * Attributes that used to typecheck and then vanish.
 */
export const ForwardsAttributes: Story = {
  tags: ["!autodocs"],
  args: {
    options: fruitOptions,
    value: null,
    onChange: () => {},
    id: "region-field",
    "data-analytics-id": "region",
  } as SelectProps,
  render: (args) => <SelectWithState {...args} />,
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("#region-field");
    expect(field).toBeTruthy();
    expect(field!.getAttribute("data-analytics-id")).toBe("region");
  },
};

/**
 * The layout change the size scale required, and the case that stresses it.
 */
export const LongLabelTruncates: Story = {
  args: {
    options: [
      {
        value: "long",
        label:
          "An implausibly long option label that has no business fitting inside a narrow trigger",
      },
      { value: "short", label: "Short" },
    ],
    value: "long",
    onChange: () => {},
    className: "rst:max-w-56",
  },
  render: (args) => <SelectWithState {...args} />,
  play: async ({ canvasElement }) => {
    /* Giving the trigger a fixed height meant moving it from a block box with
       vertical padding to `flex items-center`, which changes how the label
       behaves: it is now a flex item. It still ellipsizes because `truncate`
       sets `overflow: hidden`, and a flex item with non-visible overflow
       resolves `min-width: auto` to 0 — but that is a spec argument, and every
       other fixture in this file is the word "Apple". This is the assertion. */
    const triggers = [
      ...canvasElement.querySelectorAll<HTMLElement>(
        'button[aria-haspopup="listbox"]',
      ),
    ];
    expect(triggers).toHaveLength(2);

    for (const t of triggers) {
      const label = t.querySelector<HTMLElement>("span.rst\\:truncate")!;
      expect(label).toBeTruthy();

      // The label really is overflowing, so truncation is under test at all.
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

      // And it is contained rather than forcing the trigger wide.
      expect(t.getBoundingClientRect().width).toBeLessThanOrEqual(
        t.parentElement!.getBoundingClientRect().width + 0.5,
      );

      // Still one line: the fixed height would clip a wrapped label.
      expect(t.getBoundingClientRect().height).toBeCloseTo(40, 0);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "The trigger label truncates rather than stretching the control. Worth a story because the size scale changed the trigger from a block box with vertical padding to `flex items-center`, which makes the label a flex item — a layout it had never been in before.",
      },
    },
  },
};

/**
 * The menu leaves the DOM subtree it was written in. This is the guard.
 */
export const MenuFollowsAScopedDarkScope: Story = {
  tags: ["!autodocs"],
  args: { options: fruitOptions, value: null, onChange: () => {} },
  render: (args) => (
    <div className="dark" style={{ padding: 24, background: "#0a0a0a" }}>
      <SelectWithState {...args} placeholder="Open me" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* `anchor` implies a portal and `portal={false}` does not opt out, so the
       menu is attached to <body> and is NOT a descendant of this story's
       `.dark` wrapper. Before the fix it measured rgb(255, 255, 255) here —
       a white sheet dropping out of a dark page.

       Queried off `document`, deliberately: querying `canvasElement` would
       find nothing and a laxer assertion would then pass on an empty result. */
    const before = document.querySelectorAll('[role="listbox"]').length;
    expect(before).toBe(0);

    canvasElement
      .querySelector<HTMLElement>('button[aria-haspopup="listbox"]')!
      .click();
    await new Promise((r) => setTimeout(r, 150));

    const menus = [...document.querySelectorAll<HTMLElement>('[role="listbox"]')];
    expect(menus.length).toBeGreaterThan(0);

    const menu = menus[0];
    expect(menu.closest(".dark")).toBe(menu); // the scope arrived with it
    expect(getComputedStyle(menu).backgroundColor).toBe("rgb(41, 37, 36)"); // gray-800

    const option = menu.querySelector<HTMLElement>('[role="option"]')!;
    expect(getComputedStyle(option).color).toBe("rgb(245, 245, 244)"); // gray-100
  },
};
