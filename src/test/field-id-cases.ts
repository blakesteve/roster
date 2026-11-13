/**
 * The cases the field id checks render (src/internal/field-id.checks.stories.tsx in
 * Chromium and WebKit, src/internal/field-id.ax.checks.stories.tsx in
 * Chromium's accessibility tree), and what each must read as: every Roster field that
 * takes a label, given an `id`, an `aria-describedby`, both or neither. The
 * fields themselves are rendered by ./FieldIdCases.tsx.
 *
 * `Switch`, `FileUpload` and `ProgressField` take neither prop, so they have
 * no case here.
 */

export type Case = "none" | "id" | "describedBy" | "describedByAlone" | "both";
export const CASES: Case[] = ["none", "id", "describedBy", "describedByAlone", "both"];
export const HELPER = "Helper text.";
export const NOTE = "Outside note.";

const passesId = (c: Case) => c === "id" || c === "both";
export const passesNote = (c: Case) => c === "describedBy" || c === "describedByAlone" || c === "both";
export const noteOf = (field: string, c: Case) => `field-id-${field}-${c}-note`;

/** What a field is given in each case. */
export function caseProps(field: string, c: Case) {
  return {
    ...(c === "describedByAlone" ? {} : { helperText: HELPER }),
    ...(passesId(c) ? { id: `field-id-${field}-${c}` } : {}),
    ...(passesNote(c) ? { "aria-describedby": noteOf(field, c) } : {}),
  };
}

/**
 * The requirement for a case's description: the helper text, then the
 * caller's note. `callerFirst` is `CheckboxGroup`, which has always put the
 * caller's first.
 */
export function describedAs(c: Case, callerFirst = false) {
  if (c === "describedByAlone") return NOTE;
  if (!passesNote(c)) return HELPER;
  return callerFirst ? `${NOTE} ${HELPER}` : `${HELPER} ${NOTE}`;
}

export type Spec = {
  /** The control's role, which Testing Library finds it by; `null` for a password field, which has none. */
  role: string | null;
  /** Its accessible name, as Chromium's accessibility tree gives it. */
  name: string;
  /** The name Testing Library computes, where it differs from Chromium's. */
  computedName?: string;
  /** The control inside a case. */
  control: string;
  /** The label a click must take to the control; absent where the label isn't a click target. */
  label?: string;
  callerFirst?: boolean;
};

export const SPECS: Record<string, Spec> = {
  input: { role: "textbox", name: "Email", control: "input", label: "label" },
  password: { role: null, name: "Password", control: 'input[type="password"]', label: "label" },
  textarea: { role: "textbox", name: "Message", control: "textarea", label: "label" },
  /* The trigger names itself after the label, with its own text. Testing
     Library's computation leaves its own text out. */
  select: { role: "button", name: "Team Select an option", computedName: "Team", control: "button[aria-haspopup]", label: "label" },
  combobox: { role: "combobox", name: "Team", control: '[role="combobox"]', label: "label" },
  multiselect: { role: "button", name: "Teams Select options", computedName: "Teams", control: "button[aria-haspopup]", label: "label" },
  checkbox: { role: "checkbox", name: "Agree", control: '[role="checkbox"]', label: "label" },
  checkboxgroup: { role: "group", name: "Notify me", control: "fieldset", callerFirst: true },
  radiogroup: { role: "radiogroup", name: "Visibility", control: '[role="radiogroup"]' },
  radiotiles: { role: "radiogroup", name: "Layout", control: '[role="radiogroup"]' },
  slider: { role: "slider", name: "Volume", control: '[role="slider"]' },
  range: { role: "slider", name: "Price Minimum", control: '[role="slider"]' },
};
