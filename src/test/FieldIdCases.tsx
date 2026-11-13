import type { ReactNode } from "react";
import { Description, Field, Label } from "@headlessui/react";
import { Input } from "../components/atoms/Input/Input";
import { PasswordInput } from "../components/atoms/PasswordInput/PasswordInput";
import { Textarea } from "../components/atoms/Textarea/Textarea";
import { Select } from "../components/atoms/Select/Select";
import { Combobox } from "../components/atoms/Combobox/Combobox";
import { MultiSelect } from "../components/atoms/MultiSelect/MultiSelect";
import { Checkbox } from "../components/atoms/Checkbox/Checkbox";
import { CheckboxGroup } from "../components/molecules/CheckboxGroup/CheckboxGroup";
import { RadioGroup } from "../components/molecules/RadioGroup/RadioGroup";
import { RadioTileGroup } from "../components/molecules/RadioTileGroup/RadioTileGroup";
import { Slider } from "../components/molecules/Slider/Slider";
import { RangeSlider } from "../components/molecules/RangeSlider/RangeSlider";
import { CASES, caseProps, noteOf, NOTE, passesNote } from "./field-id-cases";

const noop = () => {};
const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

/* Each field, as ./field-id-cases.ts's SPECS describes it. */
const RENDERS: Record<string, (props: Record<string, unknown>) => ReactNode> = {
  input: (p) => <Input label="Email" {...p} />,
  password: (p) => <PasswordInput label="Password" {...p} />,
  textarea: (p) => <Textarea label="Message" {...p} />,
  select: (p) => <Select label="Team" options={options} value={null} onChange={noop} {...p} />,
  combobox: (p) => <Combobox label="Team" options={options} value={null} onChange={noop} {...p} />,
  multiselect: (p) => <MultiSelect label="Teams" options={options} value={[]} onChange={noop} {...p} />,
  /* `Checkbox` has no label of its own: it goes in Headless UI's `Field`
     beside a `Label`, as its docs say. Given an id, the `Label` is given it
     too, as `htmlFor`, as its docs say. */
  checkbox: ({ helperText, ...p }) => (
    <Field style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox checked={false} onChange={noop} {...p} />
      <Label htmlFor={typeof p.id === "string" ? p.id : undefined}>Agree</Label>
      {typeof helperText === "string" && <Description>{helperText}</Description>}
    </Field>
  ),
  checkboxgroup: (p) => <CheckboxGroup label="Notify me" options={options} value={[]} onChange={noop} {...p} />,
  radiogroup: (p) => <RadioGroup label="Visibility" options={options} value="" onChange={noop} {...p} />,
  radiotiles: (p) => <RadioTileGroup label="Layout" options={options} value="" onChange={noop} {...p} />,
  slider: (p) => <Slider label="Volume" {...p} />,
  range: (p) => <RangeSlider label="Price" {...p} />,
};

/** Every case of one field, each in a holder the checks find by `data-case`. */
export function FieldIdCases({ field }: { field: string }) {
  const render = RENDERS[field];
  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 380 }}>
      {CASES.map((c) => (
        <div key={c} data-case={c}>
          {render(caseProps(field, c))}
          {passesNote(c) && <p id={noteOf(field, c)}>{NOTE}</p>}
        </div>
      ))}
    </div>
  );
}
