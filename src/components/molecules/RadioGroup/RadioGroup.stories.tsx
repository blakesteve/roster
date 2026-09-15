import { useState } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { RadioGroup } from "./RadioGroup";

const VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
];

const meta = {
  title: "Molecules/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A labeled, validated set of radios that reports one `string`.",
          "",
          "The sibling of `CheckboxGroup`, and deliberately the same component with one difference: `value` is a `string` and `onChange` receives a `string`, because a radio group has one answer. That is the whole reason it exists beside one. Everything else — the label, the per-option `description`, the helper text, the error message and how it is announced — is the same shape, so a form using both does not read as two libraries.",
          "",
          "What it does not carry across is as deliberate. There is no grouped form and no `maxHeight`: `CheckboxGroup` has both because it is the long-list control, and a radio group with enough options to need scrolling wants a `Select`. Shipping the affordance would invite the wrong control.",
          "",
          "Every radio is a 44x44 target, built in rather than left to the consumer, and every option's box is sized to contain its own target so two can never overlap. That is the row rather than the gap, which is why the options can sit close together. Measured in a browser; asserted in the unit tests by the classes that produce it, since jsdom computes no layout.",
          "",
          "`orientation` lays the options out down the page or across it, and every part of the group takes a `className` of its own, named for the element it reaches.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="rst:flex rst:w-full rst:rounded-xl rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:shadow-sm">
    <div className="light rst:flex-1 rst:bg-gray-50 rst:p-8 rst:relative">
      <p className="rst:absolute rst:top-3 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest">
        Light Mode
      </p>
      <div className="rst:pt-6">
        <Story />
      </div>
    </div>
    <div className="dark rst:flex-1 rst:bg-gray-950 rst:p-8 rst:relative rst:border-l rst:border-gray-200 rst:dark:border-gray-800">
      <p className="rst:absolute rst:top-3 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest">
        Dark Mode
      </p>
      <div className="rst:pt-6">
        <Story />
      </div>
    </div>
  </div>
);

/**
 * `value` and `onChange` are applied AFTER the spread on purpose. A story that
 * spreads its `args` passes the meta's own frozen `value` and no-op `onChange`
 * along with everything else, and a wrapper that spread last would take them —
 * leaving a group whose controls work and whose radios do not.
 */
function Stateful({
  initial = "",
  ...props
}: Partial<React.ComponentProps<typeof RadioGroup>> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <RadioGroup
      options={VISIBILITY}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export const Playground: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: (args) => (
    <Stateful
      label="Who can see this squad"
      helperText="You can change this at any time."
      className="rst:max-w-sm"
      {...args}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Click the *label*, not the circle. Headless UI's Label clicks the
       associated role="radio" element, which is the only reason the text is a
       hit target at all — and the reason the pointer cursor sits on the label
       rather than on the row. */
    await userEvent.click(canvas.getByText("Unlisted"));
    /* `aria-checked`, not `toBeChecked()`: Headless UI's radio is a span with
       a role, and jest-dom's matcher only understands native inputs. */
    await expect(canvas.getByRole("radio", { name: "Unlisted" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    /* Selection is single. The point of the component. */
    await userEvent.click(canvas.getByText("Private"));
    await expect(canvas.getByRole("radio", { name: "Unlisted" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

/**
 * Nothing selected is a real state, and the one a form starts in.
 */
export const Unanswered: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => <Stateful label="Who can see this squad" className="rst:max-w-sm" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");

    await expect(
      radios.filter((r) => r.getAttribute("aria-checked") === "true"),
    ).toHaveLength(0);

    /* One tab stop, not none and not three. A group with nothing selected
       still has to be reachable, so the first option holds the stop until
       something is chosen — then the checked one takes it. */
    await expect(
      radios.filter((r) => r.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);
  },
  parameters: {
    docs: {
      description: {
        story:
          "`value=\"\"` is the ordinary way to spell \"not answered yet\", and a value matching no option does the same thing. The group keeps exactly one tab stop either way: the first option holds it until a selection exists, after which the selected option holds it. That is Headless UI's roving tabindex, and it is most of the reason this is built on its `RadioGroup` rather than on a `Fieldset` full of radios.",
      },
    },
  },
};

export const WithDescriptions: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <Stateful
      className="rst:max-w-sm"
      label="Who can see this squad"
      options={[
        { value: "public", label: "Public", description: "Anyone can find and join it." },
        { value: "unlisted", label: "Unlisted", description: "Only people with the link." },
        { value: "private", label: "Private", description: "Invite only, and hidden from search." },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Per-option supporting text goes through `Field`, which wires
       aria-describedby to that one radio. The group-level `helperText` can not
       do this: it describes the group. */
    await expect(
      canvas.getByRole("radio", { name: "Public" }),
    ).toHaveAccessibleDescription("Anyone can find and join it.");
  },
  parameters: {
    docs: {
      description: {
        story:
          "`description` on an option describes that radio. It is a different mechanism from the group's `helperText`, and the difference matters: a group description is announced when a screen reader enters the group, a `Field` description when the radio itself takes focus.",
      },
    },
  },
};

export const WithErrorAndHelp: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-8 rst:max-w-sm">
      <Stateful label="Who can see this squad" helperText="You can change this at any time." />
      <Stateful label="Who can see this squad" errorMessage="Choose who can see this squad." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas
      .getAllByRole("radiogroup")
      .filter((el) => el.getAttribute("aria-invalid") === "true");
    await expect(invalid).toHaveLength(1);
    await expect(invalid[0]).toHaveAccessibleDescription(
      "Choose who can see this squad.",
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same wording, weight and spacing as `Input`, `Select`, `Combobox` and `CheckboxGroup`. `errorMessage` implies the error state, so a caller can not color the text red and forget to say why. The message is the whole of that state: there is no panel here to repaint, and a radio is not the thing that is invalid — the answer is.\n\n`aria-invalid` lands on a `role=\"radiogroup\"`, which supports it, where `CheckboxGroup`'s lands on a `role=\"group\"`, which ARIA 1.2 does not list it for. The wiring is the same; how far it carries is not.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-8 rst:max-w-sm">
      <Stateful
        label="One option unavailable"
        options={[
          { value: "public", label: "Public" },
          { value: "unlisted", label: "Unlisted" },
          { value: "private", label: "Private", disabled: true },
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
    /* Scoped: both groups have a Private option. */
    const group = within(canvas.getByRole("radiogroup", { name: "One option unavailable" }));
    await expect(group.getByRole("radio", { name: "Private" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "`disabled` on the group dims its label and helper text along with the options.\n\nOne subtlety worth the sentence, and it is the same one `CheckboxGroup` carries: an option written the ordinary way, `disabled: !canPick`, passes an explicit `false`, and Headless UI takes the inherited value only when the prop is `undefined`. So the group's state is OR'd with the option's rather than deferring to it — otherwise that option kept a real tab stop inside a disabled group.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-8 rst:max-w-sm">
      <Stateful size="sm" label="Small" />
      <Stateful size="md" label="Medium" />
      <Stateful size="lg" label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`size` scales the circle, the label text and the gap together, and matches `Checkbox`'s and `CheckboxGroup`'s own `sm` / `md` / `lg`.\n\nWhat it can not scale below is the row: a target is a flat 44px whatever the type is doing, so an option is never shorter than that and the three sizes measure 44 / 46 / 48px of pitch. An earlier version reached the same 44px by inflating the GAP instead, which worked and looked wrong — every size took the same vertical room, the gaps ran backwards, widest at `sm`, and the space read as holes between floating controls rather than as rows.",
      },
    },
  },
};

export const Horizontal: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-8">
      <Stateful
        orientation="horizontal"
        label="Who can see this squad"
        helperText="You can change this at any time."
      />
      <Stateful
        orientation="horizontal"
        label="Ship it?"
        options={[
          { value: "y", label: "Yes" },
          { value: "n", label: "No" },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getAllByRole("radiogroup")[0];

    await expect(group).toHaveAttribute("aria-orientation", "horizontal");

    /* Across is still one answer and still one tab stop, so the arrow keys
       behave exactly as they do down the page. */
    await userEvent.click(canvas.getByText("Unlisted"));
    await expect(canvas.getByRole("radio", { name: "Unlisted" })).toBeChecked();
  },
  parameters: {
    docs: {
      description: {
        story:
          "For the short, scannable set: two or three one-word answers that would otherwise spend three rows of a wide form. It wraps rather than overflowing, because a row of options that runs off the side of a phone is worse than the column it replaced.\n\nThe name follows the ARIA property it sets rather than the flex direction it produces, because it does set it: `aria-orientation` tells a screen reader which arrows it is being offered. Headless UI takes all four in either orientation, so this only ever widens what works.\n\nThe target rule is the same but the binding constraint flips. Down the page it is height, and `min-h-11` carries it; across it is width, since two radios less than 44px apart overlap however tall their boxes are, so an option also carries `min-w-11` — enough for a one-character label.",
      },
    },
  },
};

export const Styled: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <Stateful
      className="rst:max-w-sm"
      label="Who can see this squad"
      optionsClassName="rst:gap-2"
      optionClassName="rst:rounded-lg rst:border rst:border-gray-200 rst:px-3 rst:dark:border-gray-800 rst:has-data-checked:border-primary-500 rst:has-data-checked:bg-primary-50 rst:dark:has-data-checked:bg-primary-950"
      options={[
        { value: "public", label: "Public", description: "Anyone can find and join it." },
        { value: "unlisted", label: "Unlisted", description: "Only people with the link." },
        { value: "private", label: "Private", description: "Invite only." },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Every part of the group takes a `className` of its own — `optionsClassName`, `optionClassName`, `radioClassName`, `labelClassName`, `optionLabelClassName`, `descriptionClassName` and `messageClassName` — each named for the element it reaches, and each merged with `tailwind-merge`, so a class you pass wins by deleting the one it conflicts with rather than by hoping for stylesheet order.\n\n`optionClassName` is the interesting one: an option's box already carries its own padding and its 44px minimum, so a border and a radius turn the list into cards without disturbing a single target. Headless UI puts `data-checked` on the control rather than on the box, so style the selected state from the box with `has-data-checked:`.",
      },
    },
  },
};

export const LongLabels: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-8 rst:max-w-xs">
      <Stateful
        label="Wraps, with no description"
        options={[
          {
            value: "everyone",
            label: "Everyone with a link to this squad, including people who are not signed in",
          },
          { value: "members", label: "Members only" },
        ]}
      />
      <Stateful
        label="Wraps, with a description"
        options={[
          {
            value: "everyone",
            label: "Everyone with a link to this squad, including people who are not signed in",
            description:
              "Anyone who can see the link can open the squad and read its full history.",
          },
          { value: "members", label: "Members only", description: "Invite only." },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A label is user-supplied text, so it wraps, and where the radio sits when it does is not a detail: it belongs beside the first line, not floating in the middle of the block.\n\nThe radio is `self-start` rather than centered for exactly this reason, and it needs no nudge to land right. The type scale and the size scale line up at every step — 16px line-height against a 16px circle at `sm`, 20 against 20 at `md`, 24 against 24 at `lg` — so the top of the circle and the top of the first line are the same edge. A row that centered its radio looked correct for one line and wrong for two.\n\nThe label still fills the rest of the row, so a short option in the same group keeps its full-row hit area.",
      },
    },
  },
};

export const OnADarkSurface: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <Stateful
      initial="unlisted"
      label="Who can see this squad"
      helperText="You can change this at any time."
      options={[
        { value: "public", label: "Public", description: "Anyone can find and join it." },
        { value: "unlisted", label: "Unlisted", description: "Only people with the link." },
        { value: "private", label: "Private", description: "Invite only." },
      ]}
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Both schemes, because the parts that change are not all the same mechanism. The label and the option labels read `--roster-control-text`, which follows the page; the unchecked circle reads `--roster-control-border`, the same token the text fields use, so a radio and an `Input` on one form carry the same weight of edge; the descriptions and the helper text carry their own `dark:` pair.\n\nThat token is also what makes this work inside an inverted `Dialog`. The `slate` and `primary` panels set `--roster-control-*` for themselves, so a group placed on one follows the panel rather than the page, with no prop to pass.",
      },
    },
  },
};

export const ColorSchemes: Story = {
  args: { options: VISIBILITY, value: "", onChange: () => {} },
  render: () => (
    <div className="rst:grid rst:grid-cols-2 rst:gap-x-8 rst:gap-y-6 rst:sm:grid-cols-4">
      {(
        [
          "primary",
          "orange",
          "teal",
          "purple",
          "amber",
          "success",
          "error",
          "neutral",
        ] as const
      ).map((scheme) => (
        /* Stateful, and every story on this page is, which this one was not:
           it rendered a frozen `value` with a no-op `onChange`, so the swatches
           were right and nothing in the story could be clicked. A story that
           can not be operated reads as a broken component rather than as a
           deliberately static one. */
        <Stateful key={scheme} initial="public" label={scheme} colorScheme={scheme} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Scoped to one group: all eight have the same three option labels. */
    const teal = within(canvas.getByRole("radiogroup", { name: "teal" }));
    await userEvent.click(teal.getByText("Private"));

    await expect(teal.getByRole("radio", { name: "Private" })).toBeChecked();
    await expect(teal.getByRole("radio", { name: "Public" })).not.toBeChecked();

    /* The groups are independent: selecting in one must not move another. */
    const amber = within(canvas.getByRole("radiogroup", { name: "amber" }));
    await expect(amber.getByRole("radio", { name: "Public" })).toBeChecked();
  },
  parameters: {
    docs: {
      description: {
        story:
          "All eight schemes `Checkbox` carries, resolved the same way. The dot is `bg-current` and the control sets the matching `-ink` token, so the mark reads the ink paired with whatever fill it is sitting on rather than a color chosen by hand. `amber` is the one to look at: its fill is light, so its ink is dark where the other seven are light.",
      },
    },
  },
};