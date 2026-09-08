import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Combobox } from "./Combobox";
import { Select } from "../Select/Select";

const SPORTS = [
  { value: "nfl", label: "NFL" },
  { value: "nfl-playoffs", label: "NFL Playoffs" },
  { value: "ncaaf", label: "NCAA Football" },
  { value: "nba", label: "NBA" },
  { value: "nba-playoffs", label: "NBA Playoffs" },
  { value: "ncaam", label: "NCAA Men's" },
  { value: "march-madness", label: "March Madness (Men)" },
  { value: "wnba", label: "WNBA" },
  { value: "mlb", label: "MLB" },
  { value: "nhl", label: "NHL" },
];

const meta = {
  title: "Atoms/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A `Select` you can type into.",
          "",
          "Built on Headless UI's `Combobox` for the same reason `Select` is built on its `Listbox`: that *is* the primitive, and it already owns active-option tracking, the keyboard model and the input's `aria-activedescendant` wiring.",
          "",
          "What Roster adds is deliberately the **same** presentation `Select` uses — the panel, its surface tokens, the `.dark` carry across the portal and the option rows all come from `src/internal/`. A combobox that opened a different-looking menu than a select on the same form is the bug this prevents.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["outline", "soft", "white", "ghost", "slate"],
    },
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stateful(props: Partial<React.ComponentProps<typeof Combobox>>) {
  const [value, setValue] = useState<string | number | null>(null);
  return (
    <Combobox
      options={SPORTS}
      value={value}
      onChange={setValue}
      className="rst:max-w-xs"
      {...props}
    />
  );
}

export const Playground: Story = {
  args: { options: SPORTS, value: null, onChange: () => {} },
  /* `args` are spread, so the controls in the panel actually drive the story.
     Without this the argTypes above render a set of knobs that do nothing. */
  render: (args) => <Stateful {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "nc");

    /* The panel portals to <body>, so it is outside `canvasElement`. */
    const list = await within(document.body).findByRole("listbox");
    await expect(within(list).getAllByRole("option")).toHaveLength(2);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Type to filter. The default rule is a case-insensitive substring on `label`, which is what every hand-rolled version in the portfolio did.",
      },
    },
  },
};

/**
 * Side by side with the component it is a variation of.
 */
export const NextToSelect: Story = {
  args: { options: SPORTS, value: null, onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-wrap rst:items-end rst:gap-4">
      <Stateful label="Combobox" placeholder="Type to filter" />
      <Select
        label="Select"
        options={SPORTS}
        value={null}
        onChange={() => {}}
        className="rst:max-w-xs"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Open both. The panel, its surface, the option rows and the check mark are the same object — they come from `src/internal/popup.ts` rather than from two copies of the same class list.\n\nThat sharing is the whole reason this branch extracted anything. The `.dark` carry in particular is subtle enough that it has already been got wrong once in a consuming app, and copying it into a third component is how it drifts.",
      },
    },
  },
};

export const Empty: Story = {
  args: { options: SPORTS, value: null, onChange: () => {} },
  render: () => (
    <Stateful label="Sport" emptyMessage="No sport by that name" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "curling");

    const list = await within(document.body).findByRole("listbox");
    await expect(within(list).getByText("No sport by that name")).toBeInTheDocument();
    /* A disabled option: `role="listbox"` may only contain options, so a bare
       paragraph announced as nothing at all. Disabled keeps it out of the
       keyboard cycle while leaving it announced. */
    await expect(within(list).getByRole("option")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "`emptyMessage` fills the panel when nothing matches. It renders as a **disabled** option rather than a paragraph: `role=\"listbox\"` may only contain options, and Headless UI's pass that neutralises stray children runs once when the panel opens — an empty state only ever appears after that, so a paragraph was never walked and the listbox announced as empty. Disabled keeps it out of the keyboard cycle while leaving it announced.",
      },
    },
  },
};

export const WithErrorAndHelp: Story = {
  args: { options: SPORTS, value: null, onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-6 rst:max-w-xs">
      <Stateful label="Sport" helperText="Start typing to narrow the list." />
      <Stateful label="Sport" errorMessage="Pick a sport before continuing." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas
      .getAllByRole("combobox")
      .find((el) => el.getAttribute("aria-invalid") === "true");
    await expect(invalid).toBeTruthy();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same wording, weight and spacing as `Input` and `Select`. `errorMessage` implies the error state and sets `aria-invalid` on the input, so the field is reported invalid rather than only looking it.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { options: SPORTS, value: null, onChange: () => {} },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-4 rst:max-w-xs">
      <Stateful size="sm" label="Small" />
      <Stateful label="Default" />
      <Stateful size="lg" label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The same scale as `Button`, `Input` and `Select` — `sm` / `default` / `lg` are `h-9` / `h-10` / `h-11` — so a combobox and a submit button line up in a row.",
      },
    },
  },
};
