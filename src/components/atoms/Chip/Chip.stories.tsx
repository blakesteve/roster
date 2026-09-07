import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { Chip } from "./Chip";
import { Pill } from "../Pill/Pill";

const meta = {
  title: "Atoms/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A label that **does** something: removable, selectable, or both. It is the interactive member of the Badge / Pill / Chip family, and the only one that renders real controls.",
          "",
          "**Chip, Pill or Badge?** Badge is a compact label *attached to something else* — a count on an avatar, a status on a table row. Pill is *standalone inline chrome* carrying a short phrase. Neither does anything when you click it. Reach for Chip the moment the thing can be dismissed or toggled, and for Pill when it cannot.",
          "",
          "Chip deliberately looks like Pill. A selected filter and a filter that merely reads like one should not be different species; the difference you should notice is that this one responds.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    colorScheme: {
      control: "select",
      options: ["primary", "success", "error", "amber", "info", "neutral"],
    },
    variant: { control: "inline-radio", options: ["soft", "outline", "solid"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "Baseball", colorScheme: "neutral" },
};

/**
 * The case Chip exists for: Multi-select's selected values.
 */
export const Removable: Story = {
  args: { children: "placeholder" },
  render: function Render() {
    const [tags, setTags] = useState(["Baseball", "Fishing", "Outdoors"]);
    return (
      <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-2">
        {tags.map((tag) => (
          <Chip
            key={tag}
            onRemove={() => setTags((t) => t.filter((x) => x !== tag))}
          >
            {tag}
          </Chip>
        ))}
        {tags.length === 0 && (
          <button
            type="button"
            className="rst:text-sm rst:underline"
            onClick={() => setTags(["Baseball", "Fishing", "Outdoors"])}
          >
            Put them back
          </button>
        )}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    /* The dismiss control is named after the thing it removes. Eight chips in
       a row all announcing "Remove" is a list a screen reader user cannot
       navigate, so a string label builds a real name. */
    const canvas = within(canvasElement);
    const remove = canvas.getByRole("button", { name: "Remove Fishing" });
    await userEvent.click(remove);
    await expect(
      canvas.queryByRole("button", { name: "Remove Fishing" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Remove Baseball" }),
    ).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "`onRemove` is what makes a chip removable. Its accessible name is built from the label — `Remove Fishing`, not `Remove` — whenever the child is a string. Pass `removeLabel` explicitly when it is not.\n\nThis is the shape Multi-select consumes, and the reason Chip is a component rather than an `interactive` prop on Badge: Multi-select must not ship a private chip implementation.",
      },
    },
  },
};

/**
 * A filter that can be turned on and off.
 */
export const Selectable: Story = {
  args: { children: "placeholder" },
  render: function Render() {
    const [on, setOn] = useState<string[]>(["Baseball"]);
    const toggle = (tag: string) =>
      setOn((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
    return (
      <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-2">
        {["Baseball", "Fishing", "Outdoors"].map((tag) => (
          <Chip
            key={tag}
            selected={on.includes(tag)}
            onSelectedChange={() => toggle(tag)}
            colorScheme={on.includes(tag) ? "primary" : "neutral"}
            variant={on.includes(tag) ? "solid" : "outline"}
            leadingIcon={<FontAwesomeIcon icon={faFilter} className="rst:h-3 rst:w-3" />}
          >
            {tag}
          </Chip>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fishing = canvas.getByRole("button", { name: /Fishing/ });

    /* `aria-pressed="false"`, not absent. Absent means "not a toggle", which
       would make an unselected filter announce as a plain button. */
    await expect(fishing).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(fishing);
    await expect(fishing).toHaveAttribute("aria-pressed", "true");
  },
  parameters: {
    docs: {
      description: {
        story:
          "`onSelectedChange` makes the body of the chip a toggle button, and `selected` sets `aria-pressed`. Unselected reports `aria-pressed=\"false\"` rather than omitting the attribute — omitting it would announce the chip as a plain button rather than as an unpressed toggle.\n\nColor is the consumer's choice, not the component's. Here selection swaps `outline` for `solid`, so the state survives being seen in grayscale.",
      },
    },
  },
};

/**
 * Both at once, which is where the markup gets opinionated.
 */
export const SelectableAndRemovable: Story = {
  args: { children: "placeholder" },
  render: function Render() {
    const [selected, setSelected] = useState(true);
    const [gone, setGone] = useState(false);
    if (gone) return <Pill colorScheme="neutral">Removed</Pill>;
    return (
      <Chip
        selected={selected}
        onSelectedChange={setSelected}
        onRemove={() => setGone(true)}
        colorScheme={selected ? "primary" : "neutral"}
        variant={selected ? "solid" : "outline"}
      >
        Outdoors
      </Chip>
    );
  },
  play: async ({ canvasElement }) => {
    /* Two siblings, not a nesting. The assertion is structural on purpose: a
       button inside a button is invalid HTML and browsers resolve it by
       dropping one, which silently loses either the toggle or the dismiss. */
    const canvas = within(canvasElement);
    const body = canvas.getByRole("button", { name: "Outdoors" });
    const dismiss = canvas.getByRole("button", { name: "Remove Outdoors" });

    await expect(body.contains(dismiss)).toBe(false);
    await expect(dismiss.contains(body)).toBe(false);
    await userEvent.click(body);
    await expect(body).toHaveAttribute("aria-pressed", "false");
  },
  parameters: {
    docs: {
      description: {
        story:
          "When a chip is both selectable and removable it renders **two sibling buttons** inside a non-interactive wrapper that carries the shape.\n\nThe obvious implementation — make the body clickable and put the dismiss button inside it — is invalid HTML, and browsers resolve a button inside a button by dropping one of them. Which one they drop is not something to rely on. Two siblings is the only structure that gives both actions a name, a focus ring and a tab stop.\n\nTab through this story: it is two stops, and both show a ring.",
      },
    },
  },
};

/**
 * Disabled, in all three of the shapes Chip can take.
 */
export const Disabled: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-4">
      <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-2">
        <Chip disabled onRemove={() => {}}>
          Removable
        </Chip>
        <Chip disabled selected onSelectedChange={() => {}} variant="solid" colorScheme="primary">
          Selected
        </Chip>
        <Chip disabled selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
          Both
        </Chip>
      </div>
      <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-2">
        <Chip onRemove={() => {}}>Removable</Chip>
        <Chip selected onSelectedChange={() => {}} variant="solid" colorScheme="primary">
          Selected
        </Chip>
        <Chip selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
          Both
        </Chip>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");

    /* Four of the eight controls are disabled: the removable chip's dismiss,
       the selected chip's body, and both halves of the third. Asserting the
       count as well as the state catches a future change that renders a
       disabled chip with no controls at all, which would pass a looser check
       while quietly removing the thing being demonstrated. */
    const off = buttons.filter((b) => (b as HTMLButtonElement).disabled);
    await expect(off).toHaveLength(4);

    /* Still announced, still reachable by name — disabled is a state, not a
       disappearance. */
    await expect(
      canvas.getAllByRole("button", { name: "Remove Removable" }),
    ).toHaveLength(2);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Top row disabled, bottom row the same three chips live, so the treatment can be judged against what it is dimming.\n\n`disabled` applies to the whole chip rather than to one control: a chip whose body is frozen but whose dismiss button still fires would be a strange thing to explain. It shows `cursor-not-allowed` rather than removing pointer events: the library has both patterns, and a chip is closer to `Input` and `Textarea` than to `Button`. A chip that silently does nothing on click reads as broken rather than disabled, and `pointer-events-none` would hide the cursor entirely so there would be nothing to see. Pointer events stay live; the native `disabled` attribute is what stops the click.\n\nThe buttons keep their accessible names and stay in the tree. Disabled is a state to announce, not a reason to vanish.",
      },
    },
  },
};

export const Variants: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-4">
      {(["soft", "outline", "solid"] as const).map((variant) => (
        <div key={variant} className="rst:flex rst:flex-wrap rst:items-center rst:gap-2">
          {(["primary", "success", "error", "amber", "info", "neutral"] as const).map(
            (colorScheme) => (
              <Chip
                key={colorScheme}
                variant={variant}
                colorScheme={colorScheme}
                onRemove={() => {}}
              >
                {colorScheme}
              </Chip>
            ),
          )}
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The same six schemes and three variants as `Pill`, using the same fills and the same per-fill ink tokens step for step — a solid Chip beside a solid Pill must not be a different shade of the same color. `src/contrast.test.ts` measures these six solid pairs alongside Badge's, Pill's, Button's and Checkbox's.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:items-center rst:gap-3">
      <Chip size="sm" onRemove={() => {}}>
        Small
      </Chip>
      <Chip size="md" onRemove={() => {}}>
        Medium
      </Chip>
    </div>
  ),
};

/**
 * A chip that does nothing is a Pill wearing the wrong name.
 */
export const WhenNotToUseIt: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-3">
      <div className="rst:flex rst:items-center rst:gap-2">
        <Pill colorScheme="success" dot>
          Live now
        </Pill>
        <Pill colorScheme="neutral">3 friends voted</Pill>
      </div>
      <div className="rst:flex rst:items-center rst:gap-2">
        <Chip onRemove={() => {}}>Baseball</Chip>
        <Chip selected onSelectedChange={() => {}} variant="solid" colorScheme="primary">
          Fishing
        </Chip>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* The top row must contribute no controls at all. A decorative chip that
       is a tab stop is worse than a Pill, not better. */
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "Live now" })).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("button")).toHaveLength(2);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Top row: `Pill`. Bottom row: `Chip`. They are meant to look like relatives.\n\nA `Chip` with no `onRemove` and no `onSelectedChange` renders a plain `<span>` and is not focusable — it will not pretend to be a control. That is correct, but it also means you wrote `Chip` when you meant `Pill`. Decide by behavior: can the viewer dismiss it or toggle it? Chip. Otherwise Pill.",
      },
    },
  },
};
