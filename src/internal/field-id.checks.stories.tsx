import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CASES, SPECS, describedAs } from "../test/field-id-cases";
import { FieldIdCases } from "../test/FieldIdCases";
import { realInputOrSkip } from "../test/real-input";

/**
 * Every Roster field that takes a label, given an `id`, an `aria-describedby`,
 * both or neither (src/test/field-id-cases.ts): its label still names its
 * control, a click on the label still reaches it, and its helper text and the
 * caller's own description both describe it, Roster's first (the caller's
 * first in `CheckboxGroup`, as it has always been).
 *
 * Checked in Chromium and WebKit: the name and description Testing Library
 * computes in the page, and a real mouse click on the label, where the label
 * is a click target. `field-id.ax.checks.stories.tsx` reads the same name and
 * description from Chromium's own accessibility tree. The expected values are
 * literals, written from the requirement, not read from the component.
 *
 * `Checkbox` is the one field whose label is the caller's: given an id, its
 * case gives the `Label` the same `htmlFor`, as its docs say, since Headless
 * UI keeps the `Field`'s id to itself. Its case checks that usage, and the
 * description.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Field id/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ids in `aria-describedby`, as text: for a password field, which no role query finds. */
const describedText = (control: Element) =>
  (control.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? `(no #${id})`)
    .join(" ");

function check(field: string): Story {
  const spec = SPECS[field];
  const name = spec.computedName ?? spec.name;
  return {
    render: () => <FieldIdCases field={field} />,
    play: async () => {
      const input = realInputOrSkip();
      const wrong: string[] = [];
      for (const c of CASES) {
        const holder = document.querySelector<HTMLElement>(`[data-case="${c}"]`)!;
        const control = holder.querySelector<HTMLElement>(spec.control);
        if (!control) {
          wrong.push(`${c}: no control`);
          continue;
        }
        const scope = within(holder);
        /* Every name the query computes, so a miss says what it found. */
        const names: string[] = [];
        const named = spec.role
          ? scope.queryAllByRole(spec.role, {
              name: (computed, element) => {
                if (element === control) names.push(computed);
                return computed === name;
              },
            })
          : scope.queryAllByLabelText(name);
        if (!named.includes(control)) wrong.push(`${c}: not named "${name}" but ${JSON.stringify(names)}`);
        const description = describedAs(c, spec.callerFirst);
        const described = spec.role
          ? scope.queryAllByRole(spec.role, { description }).includes(control)
          : describedText(control) === description;
        if (!described) wrong.push(`${c}: not described "${description}", its aria-describedby reads "${describedText(control)}"`);
        if (spec.label && input) {
          const label = holder.querySelector<HTMLElement>(spec.label);
          if (!label) {
            wrong.push(`${c}: no label`);
            continue;
          }
          (document.activeElement as HTMLElement | null)?.blur();
          /* A fresh value, so the command's search of the page can only match this. */
          const probe = `${field}-${c}-${Math.random().toString(36).slice(2)}`;
          label.setAttribute("data-label-probe", probe);
          await input.commands.realClick(`[data-label-probe="${probe}"]`);
          label.removeAttribute("data-label-probe");
          if (document.activeElement !== control) {
            wrong.push(`${c}: a click on the label left focus on ${document.activeElement?.tagName ?? "nothing"}`);
          }
          await input.commands.realPress(["Escape"]);
        }
      }
      console.info(`FIELD ID ${field}: ${wrong.length ? JSON.stringify(wrong) : "all tied"}`);
      await expect(wrong).toEqual([]);
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
