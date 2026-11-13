import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CASES, SPECS, describedAs } from "../test/field-id-cases";
import { FieldIdCases } from "../test/FieldIdCases";
import { realInputOrSkip } from "../test/real-input";

/**
 * The field id cases (src/test/field-id-cases.ts) as Chromium's accessibility tree
 * hands them to a screen reader (.storybook/ax-tree.ts): each control's role,
 * its name from its label, and its description, the helper text and then the
 * caller's own. `field-id.checks.stories.tsx` checks the same in WebKit too,
 * and the label click. The expected values are literals, written from the
 * requirement, not read from the component.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Field id/Accessibility tree",
  /* `ax-tree` runs these in their own project (vite.config.ts). */
  tags: ["!dev", "!autodocs", "ax-tree"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function check(field: string): Story {
  const spec = SPECS[field];
  return {
    render: () => <FieldIdCases field={field} />,
    play: async () => {
      const input = realInputOrSkip();
      if (!input) return;
      const selectors: string[] = [];
      for (const c of CASES) {
        const control = document.querySelector(`[data-case="${c}"] ${spec.control}`);
        await expect(control, `${c}: the control`).not.toBeNull();
        /* A fresh value, so the command's search of the page can only match this. */
        const probe = `${field}-${c}-${Math.random().toString(36).slice(2)}`;
        control!.setAttribute("data-ax-probe", probe);
        selectors.push(`[data-ax-probe="${probe}"]`);
      }
      const states = await input.commands.axStates(selectors);
      for (const selector of selectors) document.querySelector(selector)?.removeAttribute("data-ax-probe");
      const read = CASES.map((c, i) => `${c}: "${states[i].name}" described "${states[i].description}"`);
      const wanted = CASES.map((c) => `${c}: "${spec.name}" described "${describedAs(c, spec.callerFirst)}"`);
      console.info(`FIELD ID TREE ${field}: ${JSON.stringify(read)}`);
      await expect(read).toEqual(wanted);
    },
  };
}

export const InputField = check("input");
export const PasswordInputField = check("password");
export const TextareaField = check("textarea");
export const SelectField = check("select");
export const ComboboxField = check("combobox");
export const MultiSelectField = check("multiselect");
export const CheckboxField = check("checkbox");
export const CheckboxGroupField = check("checkboxgroup");
export const RadioGroupField = check("radiogroup");
export const RadioTileGroupField = check("radiotiles");
export const SliderField = check("slider");
export const RangeSliderField = check("range");
