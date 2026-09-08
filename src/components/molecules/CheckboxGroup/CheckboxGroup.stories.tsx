import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { CheckboxGroup } from "./CheckboxGroup";

const NOTIFICATIONS = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
];

const SPORTS = [
  {
    category: "Football",
    options: [
      { value: "nfl", label: "NFL" },
      { value: "ncaaf", label: "NCAA Football" },
      { value: "cfl", label: "CFL" },
      { value: "flag", label: "Flag Football" },
    ],
  },
  {
    category: "Basketball",
    options: [
      { value: "nba", label: "NBA" },
      { value: "wnba", label: "WNBA" },
      { value: "ncaam", label: "NCAA Men's" },
      { value: "ncaaw", label: "NCAA Women's" },
    ],
  },
  {
    category: "Baseball",
    options: [
      { value: "mlb", label: "MLB" },
      { value: "milb", label: "Minor League" },
      { value: "softball", label: "Softball" },
    ],
  },
  {
    category: "Hockey",
    options: [
      { value: "nhl", label: "NHL" },
      { value: "ncaah", label: "NCAA Hockey" },
      { value: "ahl", label: "AHL" },
    ],
  },
];

const meta = {
  title: "Molecules/CheckboxGroup",
  component: CheckboxGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A labeled, validated set of checkboxes that reports one `string[]`.",
          "",
          "This exists because the multi-selection UI in the portfolio is not a dropdown. mega-squad's squad form picks sports from a grouped, scrollable checklist — every option visible, headings you can scan — and hand-rolled the whole thing: raw `<label>` wrappers, a hardcoded panel, category headings that were styling and nothing else. Collapsing that into a menu would have been a downgrade, so the component follows the shape that already worked.",
          "",
          "What it adds over the hand-rolled version is the part that is easy to skip: each option is a Headless UI `Field`, so the label is wired to its own checkbox and clicking it toggles; each category is a nested fieldset, so its heading is the group's accessible name rather than decoration a screen reader walks past; and `errorMessage` reaches the fieldset as `aria-describedby`, merged with any the caller passes rather than replacing it.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "panel"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    columns: { control: "inline-radio", options: [1, 2, 3] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `value` and `onChange` are applied AFTER the spread on purpose. A story that
 * spreads its `args` passes the meta's own frozen `value: []` and no-op
 * `onChange` along with everything else, and a wrapper that spread last would
 * take them — leaving a group whose controls work and whose checkboxes do not.
 */
function Stateful(props: Partial<React.ComponentProps<typeof CheckboxGroup>>) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <CheckboxGroup
      options={NOTIFICATIONS}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export const Playground: Story = {
  args: { options: NOTIFICATIONS, value: [], onChange: () => {} },
  /* `args` are spread, so the controls in the panel drive the story rather
     than rendering a set of knobs that do nothing. `Stateful` keeps its own
     `value`/`onChange` regardless — see its comment. */
  render: (args) => (
    <Stateful
      label="Notify me by"
      helperText="Pick as many as you like."
      className="rst:max-w-sm"
      {...args}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Click the *label*, not the box. That is the assertion: Headless UI's
       Label clicks the associated role="checkbox" element, which is the only
       reason the text is a hit target at all — and the reason the pointer
       cursor sits on the label rather than on the row. */
    await userEvent.click(canvas.getByText("Push"));
    /* `aria-checked`, not `toBeChecked()`: Headless UI's checkbox is a span
       with a role, and jest-dom's matcher only understands native inputs. */
    await expect(canvas.getByRole("checkbox", { name: "Push" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};

/**
 * The shape mega-squad's squad form actually needs.
 */
export const Grouped: Story = {
  args: { options: NOTIFICATIONS, value: [], onChange: () => {} },
  render: () => (
    <Stateful
      options={SPORTS}
      label="Select supported sports"
      helperText="Select all the sports your squad might play. You can always add more later."
      variant="panel"
      columns={2}
      maxHeight={240}
      className="rst:max-w-lg"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Four nested groups plus the fieldset that holds them. The point of the
       nesting is that "Football" names a group instead of being a styled div,
       so this asserts on the accessible name rather than on the text node. */
    const football = canvas.getByRole("group", { name: "Football" });
    await expect(within(football).getAllByRole("checkbox")).toHaveLength(4);
  },
  parameters: {
    docs: {
      description: {
        story:
          "`variant=\"panel\"` draws the enclosing box, `maxHeight` scrolls past it, `columns` widens at `sm` and never below it — two columns of truncated labels on a phone is the layout the responsive step avoids.\n\nThe panel deliberately does not read `--roster-popover-*`. That family is for surfaces that float over the page; this one is in the flow, so it takes `Card`'s `soft` fill. Its border is two steps heavier than that card's on purpose: a card's hairline separates content from the page, this one has to read as the wall a scroll region ends at.\n\nThe capped panel takes a tab stop of its own. Chrome and Firefox focus scrollers by themselves now; Safari does not, and a `disabled` group has no focusable option to tab to at all.",
      },
    },
  },
};

export const WithDescriptions: Story = {
  args: { options: NOTIFICATIONS, value: [], onChange: () => {} },
  render: () => (
    <Stateful
      className="rst:max-w-sm"
      label="Notify me by"
      options={[
        { value: "email", label: "Email", description: "A digest every morning." },
        { value: "push", label: "Push", description: "Immediately, on every device." },
        { value: "sms", label: "SMS", description: "Only for account security." },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Per-option supporting text goes through `Field`, which wires
       aria-describedby to that one checkbox. The group-level `helperText`
       cannot do this — it describes the fieldset. */
    await expect(
      canvas.getByRole("checkbox", { name: "Email" }),
    ).toHaveAccessibleDescription("A digest every morning.");
  },
  parameters: {
    docs: {
      description: {
        story:
          "`description` on an option describes that checkbox. It is a different mechanism from the group's `helperText`, and the difference matters: a group description is announced when a screen reader enters the group, a `Field` description when the checkbox itself takes focus.",
      },
    },
  },
};

export const WithErrorAndHelp: Story = {
  args: { options: NOTIFICATIONS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-sm">
      <Stateful label="Notify me by" helperText="Pick as many as you like." />
      <Stateful label="Notify me by" errorMessage="Choose at least one channel." />
      <Stateful
        label="Notify me by"
        variant="panel"
        errorMessage="Choose at least one channel."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas
      .getAllByRole("group")
      .filter((el) => el.getAttribute("aria-invalid") === "true");
    await expect(invalid).toHaveLength(2);
    for (const group of invalid) {
      await expect(group).toHaveAccessibleDescription(
        "Choose at least one channel.",
      );
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same wording, weight and spacing as `Input`, `Select` and `Combobox`. `errorMessage` implies the error state, so a caller cannot color the text red and forget to say why. What that state repaints depends on `variant`: `panel` gets an error border, and `plain` has no boundary to repaint, so the message is the whole of it.\n\nThe description is wired by hand rather than through Headless UI's `Description`. `Fieldset` collects descendant labels but never calls `useDescriptions` and provides no description context, so a `Description` dropped in here does not degrade quietly — it throws.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { options: NOTIFICATIONS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-sm">
      <Stateful
        label="One option unavailable"
        options={[
          { value: "email", label: "Email" },
          { value: "push", label: "Push" },
          { value: "sms", label: "SMS", disabled: true },
        ]}
      />
      <Stateful
        label="Whole group unavailable"
        helperText="Verify your email address to change this."
        disabled
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Scoped: both groups have an SMS option. */
    const group = within(canvas.getByRole("group", { name: "One option unavailable" }));
    await expect(group.getByRole("checkbox", { name: "SMS" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "`disabled` on the group dims its label and helper text along with the options, and reaches every option through the nested per-category fieldsets.\n\nOne subtlety worth the sentence: an option written the ordinary way, `disabled: !canPick`, passes an explicit `false`, and Headless UI's `Field` takes the inherited value only when the prop is `undefined`. So the group's state is OR'd with the option's rather than deferring to it — otherwise that option kept a real tab stop inside a disabled group.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { options: NOTIFICATIONS, value: [], onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-sm">
      <Stateful size="sm" label="Small" />
      <Stateful size="md" label="Medium" />
      <Stateful size="lg" label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`size` scales the checkbox, the label text and the spacing together, and matches `Checkbox`'s own `sm` / `md` / `lg`.",
      },
    },
  },
};
