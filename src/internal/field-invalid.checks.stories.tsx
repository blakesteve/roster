import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Input } from "../components/atoms/Input/Input";
import { PasswordInput } from "../components/atoms/PasswordInput/PasswordInput";
import { Textarea } from "../components/atoms/Textarea/Textarea";
import { Select } from "../components/atoms/Select/Select";
import { Combobox } from "../components/atoms/Combobox/Combobox";
import { MultiSelect } from "../components/atoms/MultiSelect/MultiSelect";
import { RadioGroup } from "../components/molecules/RadioGroup/RadioGroup";
import { CheckboxGroup } from "../components/molecules/CheckboxGroup/CheckboxGroup";
import { realInputOrSkip } from "../test/real-input";

/**
 * The rule in ./field-invalid.ts, checked on every Roster field in Chromium:
 * a field with an error, or one the consumer marks invalid, is announced as
 * invalid; a field without is not.
 *
 * Each field renders every case in CASES: no error, an `errorMessage`, the
 * `error` flag (where the field has one), an error with the consumer's
 * `aria-invalid="false"`, the consumer's `aria-invalid` as "true", true,
 * "grammar", "false", false and "", and Headless UI's own `invalid`. For each, the play reads the attribute on the control a
 * screen reader focuses, and the `invalid` state Chromium's accessibility tree
 * hands a screen reader (.storybook/ax-tree.ts). The expected values are
 * literals, written from the requirement, not read from the component.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page, run
 * by the test runner.
 */
const meta = {
  title: "Internal/Field invalid/Checks",
  /* `ax-tree` runs these in their own project (vite.config.ts). */
  tags: ["!dev", "!autodocs", "ax-tree"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];
const noop = () => {};

type Case =
  | "none"
  | "error"
  | "errorFlag"
  | "errorOverFalse"
  | "ariaTrue"
  | "ariaBooleanTrue"
  | "ariaToken"
  | "ariaFalse"
  | "ariaBooleanFalse"
  | "ariaEmpty"
  | "invalid";
const CASES: Record<Case, object> = {
  none: {},
  error: { errorMessage: "That isn't right." },
  /* Only the fields with an `error` flag render this case; see FLAGGED. */
  errorFlag: { error: true },
  errorOverFalse: { errorMessage: "That isn't right.", "aria-invalid": "false" },
  ariaTrue: { "aria-invalid": "true" },
  ariaBooleanTrue: { "aria-invalid": true },
  ariaToken: { "aria-invalid": "grammar" },
  ariaFalse: { "aria-invalid": "false" },
  ariaBooleanFalse: { "aria-invalid": false },
  ariaEmpty: { "aria-invalid": "" },
  invalid: { invalid: true },
};
/* The requirement, as literals: what each case must render. */
const EXPECTED: Record<Case, { attribute: string | null; announced: boolean }> = {
  none: { attribute: null, announced: false },
  error: { attribute: "true", announced: true },
  errorFlag: { attribute: "true", announced: true },
  errorOverFalse: { attribute: "true", announced: true },
  ariaTrue: { attribute: "true", announced: true },
  ariaBooleanTrue: { attribute: "true", announced: true },
  ariaToken: { attribute: "true", announced: true },
  ariaFalse: { attribute: null, announced: false },
  ariaBooleanFalse: { attribute: null, announced: false },
  ariaEmpty: { attribute: null, announced: false },
  invalid: { attribute: "true", announced: true },
};
const ALL = Object.keys(CASES) as Case[];
/* The groups have no `error` flag: an `errorMessage` is their only error. */
const UNFLAGGED = ALL.filter((c) => c !== "errorFlag");

function Cases({ render, cases }: { render: (props: object) => ReactNode; cases: Case[] }) {
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 360 }}>
      {cases.map((c) => (
        <div key={c} data-case={c}>
          {render(CASES[c])}
        </div>
      ))}
    </div>
  );
}

/**
 * For each case, finds the controls a screen reader focuses with `controls`,
 * and checks the attribute and the accessibility tree's state on each. `role`
 * is the role Chromium must give that control, so a negative case can't pass
 * by reading the wrong element or one the tree ignores.
 */
async function checkCases(controls: string, role: string, cases: Case[]) {
  const input = realInputOrSkip();
  const probes: { c: Case; control: Element; selector: string }[] = [];
  for (const c of cases) {
    const holder = document.querySelector(`[data-case="${c}"]`)!;
    const found = Array.from(holder.querySelectorAll(controls));
    await expect(found.length, `${c}: a control matching ${controls}`).toBeGreaterThan(0);
    for (const control of found) {
      await expect(control.getAttribute("aria-invalid"), `${c}: aria-invalid`).toBe(EXPECTED[c].attribute);
      /* A fresh id, so the command's search of the page can only match this. */
      const probe = `${c}-${Math.random().toString(36).slice(2)}`;
      control.setAttribute("data-ax-probe", probe);
      probes.push({ c, control, selector: `[data-ax-probe="${probe}"]` });
    }
  }
  if (!input) return;
  const states = await input.commands.axStates(probes.map((p) => p.selector));
  for (const [i, { c, control }] of probes.entries()) {
    control.removeAttribute("data-ax-probe");
    await expect(states[i].role, `${c}: role`).toBe(role);
    await expect(states[i].ignored, `${c}: in the tree`).toBe(false);
    /* Chromium reports "false" for a role that supports the state and has
       none, and nothing at all for one that doesn't support it. */
    if (EXPECTED[c].announced) await expect(states[i].invalid, `${c}: announced`).toBe("true");
    else await expect([null, "false"], `${c}: not announced`).toContain(states[i].invalid);
  }
}

export const InputField: Story = {
  render: () => <Cases cases={ALL} render={(p) => <Input label="Username" {...p} />} />,
  play: () => checkCases("input", "textbox", ALL),
};

export const PasswordInputField: Story = {
  render: () => <Cases cases={ALL} render={(p) => <PasswordInput label="Password" {...p} />} />,
  play: () => checkCases('input[type="password"]', "textbox", ALL),
};

export const TextareaField: Story = {
  render: () => <Cases cases={ALL} render={(p) => <Textarea label="Message" {...p} />} />,
  play: () => checkCases("textarea", "textbox", ALL),
};

export const SelectField: Story = {
  render: () => <Cases cases={ALL} render={(p) => <Select label="Team" options={options} value={null} onChange={noop} {...p} />} />,
  /* The trigger is the control: a button that opens the listbox. */
  play: () => checkCases("button[aria-haspopup]", "button", ALL),
};

export const ComboboxField: Story = {
  render: () => <Cases cases={ALL} render={(p) => <Combobox label="Team" options={options} value={null} onChange={noop} {...p} />} />,
  play: () => checkCases('[role="combobox"]', "combobox", ALL),
};

export const MultiSelectField: Story = {
  render: () => <Cases cases={ALL} render={(p) => <MultiSelect label="Teams" options={options} value={[]} onChange={noop} {...p} />} />,
  play: () => checkCases("button[aria-haspopup]", "button", ALL),
};

export const RadioGroupField: Story = {
  render: () => (
    <Cases cases={UNFLAGGED} render={(p) => <RadioGroup label="Visibility" options={options} value="" onChange={noop} {...p} />} />
  ),
  /* A radio can't carry the state, so the group does: it is what a screen
     reader reports on the way into the group. */
  play: () => checkCases('[role="radiogroup"]', "radiogroup", UNFLAGGED),
};

export const CheckboxGroupField: Story = {
  render: () => (
    <Cases cases={UNFLAGGED} render={(p) => <CheckboxGroup label="Notify me" options={options} value={[]} onChange={noop} {...p} />} />
  ),
  /* Each checkbox is a control a screen reader focuses, and the group says it
     too. */
  play: async () => {
    await checkCases('[role="checkbox"]', "checkbox", UNFLAGGED);
    await checkCases("fieldset", "group", UNFLAGGED);
  },
};
