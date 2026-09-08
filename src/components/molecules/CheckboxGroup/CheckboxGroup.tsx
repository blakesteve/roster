import React from "react";
import { Description, Field, Fieldset, Label, Legend } from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { Checkbox } from "../../atoms/Checkbox/Checkbox";
import { Eyebrow } from "../../atoms/Eyebrow/Eyebrow";
import {
  checkboxGroupOptionsVariants,
  checkboxGroupPanelVariants,
} from "./checkbox-group-variants";

export type CheckboxGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Supporting text under the option's label. */
  description?: string;
};

export type CheckboxGroupCategory = {
  /** Heading for this run of options. Rendered as an `Eyebrow`. */
  category: string;
  options: CheckboxGroupOption[];
};

type CheckboxGroupOptions = CheckboxGroupOption[] | CheckboxGroupCategory[];

export interface CheckboxGroupProps
  extends
    Omit<React.HTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue">,
    Omit<VariantProps<typeof checkboxGroupPanelVariants>, "error">,
    Pick<VariantProps<typeof checkboxGroupOptionsVariants>, "columns"> {
  /**
   * A flat list, or a list of `{ category, options }` groups. Mixing the two
   * is not supported: the first entry decides how the whole array is read.
   */
  options: CheckboxGroupOptions;
  /** The selected values. Unknown values are preserved, not dropped. */
  value: string[];
  onChange: (value: string[]) => void;
  /** The group's name. Becomes the fieldset's accessible name. */
  label?: string;
  /** Supporting text under the options. */
  helperText?: string;
  /**
   * The message for an invalid selection. Implies the error state, so a caller
   * cannot color the text red and forget to say why.
   *
   * What it repaints depends on `variant`, and the difference is worth
   * knowing: `panel` gets an error border, `plain` has no boundary to repaint
   * and so the message *is* the whole error state. Narrower than `Input`'s or
   * `Select`'s, which both ring the control itself — a checkbox is not the
   * thing that is invalid here, the selection is.
   */
  errorMessage?: string;
  /**
   * Caps the options' height and scrolls past it. A number is pixels.
   *
   * Applied inline rather than as a class because the useful values here are
   * arbitrary — `240` is mega-squad's, yours will differ — and an arbitrary
   * Tailwind value built from a prop is a class that does not exist at build
   * time, which is exactly what `check-classes-emit` fails the build over.
   */
  maxHeight?: number | string;
  /** Disables every option, and dims the label and helper text with them. */
  disabled?: boolean;
  colorScheme?: React.ComponentProps<typeof Checkbox>["colorScheme"];
  /** Classes for the options' container. `className` lands on the fieldset. */
  panelClassName?: string;
}

/**
 * Discriminates on `options` rather than on `category`, which is the key that
 * names the shape and the wrong one to test.
 *
 * TypeScript's excess-property check only guards object literals, so an array
 * that arrives from an API or through a wider local type reaches this with no
 * compile-time help at all. Testing for `category` meant an option that merely
 * carried one — a perfectly ordinary field on a domain object — took the
 * grouped branch and threw on `group.options.map`. Testing for the array that
 * branch actually reads cannot produce that crash.
 */
const isGrouped = (options: CheckboxGroupOptions): options is CheckboxGroupCategory[] =>
  options.length > 0 &&
  Array.isArray((options[0] as Partial<CheckboxGroupCategory>).options);

const LABEL_SIZES = {
  sm: "rst:text-xs",
  md: "rst:text-sm",
  lg: "rst:text-base",
} as const;

const CheckboxGroup = ({
  options,
  value,
  onChange,
  label,
  helperText,
  errorMessage,
  maxHeight,
  disabled = false,
  variant,
  size = "md",
  columns,
  colorScheme,
  className,
  panelClassName,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: CheckboxGroupProps) => {
  const hasError = !!errorMessage;
  const scrollable = maxHeight !== undefined;

  /* Headless UI's `Fieldset` collects descendant `<Label>`s into its own
     `aria-labelledby` but has no equivalent for `<Description>` — it never
     calls `useDescriptions` and provides no description context. A Headless
     `Description` placed here does not degrade quietly, it THROWS: "You used a
     <Description /> component, but it is not inside a relevant parent." So the
     helper text is a plain <p> with an id this component owns.

     Scope note, stated rather than implied: a group-level description is
     announced when a screen reader enters the group, not when each checkbox
     inside it takes focus. The same is true of the group's `aria-invalid` —
     and `aria-invalid` is not in ARIA 1.2's supported set for `role="group"`
     at all, so how far it carries is genuinely uncertain. Per-option
     supporting text is what `description` on an option is for; that one goes
     through `Field`, which wires it to the checkbox itself. */
  const descriptionId = React.useId();
  const ownDescription = helperText || errorMessage ? descriptionId : undefined;
  /* Merged, not replaced. Both attributes are inside this component's own prop
     type, so a caller can pass either — and a caller who adds a describedby
     should get their reference in addition to the error message, never
     instead of it. */
  const describedBy =
    [ariaDescribedBy, ownDescription].filter(Boolean).join(" ") || undefined;

  const toggle = (optionValue: string, checked: boolean) => {
    /* Append and filter rather than rebuilding from `options`. Rebuilding
       would sort the result into declaration order, which reads tidier and
       silently drops any selected value whose option has not loaded yet. */
    onChange(
      checked
        ? [...value, optionValue]
        : value.filter((v) => v !== optionValue),
    );
  };

  const renderOption = (option: CheckboxGroupOption) => (
    <Field
      key={option.value}
      /* `disabled || option.disabled`, not `option.disabled`. Headless UI's
         Field takes the inherited value only when the prop is `undefined`, so
         an option written as `disabled: !canPick` passes an explicit `false`
         that overrides the whole group's disabled state. That produced an
         option inside a disabled group with no `aria-disabled` and a real tab
         stop, operable by keyboard. */
      disabled={disabled || option.disabled}
      className="rst:flex rst:items-start rst:gap-2"
    >
      <Checkbox
        size={size ?? "md"}
        colorScheme={colorScheme}
        checked={value.includes(option.value)}
        onChange={(checked: boolean) => toggle(option.value, checked)}
        /* Nudged down to sit on the label's first line rather than centered
           against a block that may be two lines tall once `description` is
           set. `shrink-0` because the label is the flexible half. */
        className="rst:mt-0.5 rst:shrink-0"
      />
      <div className="rst:flex rst:min-w-0 rst:flex-col">
        {/* The label is the click target — Headless UI's `Label` clicks the
            associated `role="checkbox"` element — so the pointer cursor
            belongs here rather than on the row, whose outer reaches do
            nothing. The padding is hit area, not inset.

            `--roster-control-text` rather than an inherited color: Roster sets
            no body color, so `text-inherit` fell to the UA's black on dark
            pages. */}
        <Label
          className={cn(
            "rst:cursor-pointer rst:select-none rst:px-1 rst:py-0.5",
            "rst:text-[var(--roster-control-text)]",
            "rst:data-disabled:cursor-not-allowed rst:data-disabled:opacity-50",
            LABEL_SIZES[size ?? "md"],
          )}
        >
          {option.label}
        </Label>
        {option.description && (
          <Description className="rst:px-1 rst:text-xs rst:text-gray-500 rst:dark:text-gray-400 rst:data-disabled:opacity-50">
            {option.description}
          </Description>
        )}
      </div>
    </Field>
  );

  const renderOptions = (list: CheckboxGroupOption[]) => (
    <div className={cn(checkboxGroupOptionsVariants({ columns, size }))}>
      {list.map(renderOption)}
    </div>
  );

  return (
    <Fieldset
      disabled={disabled}
      className={cn(
        "rst:font-ui rst:flex rst:flex-col rst:gap-1.5 rst:min-w-0",
        className,
      )}
      /* `...props` is spread BEFORE the two `aria-*` below, not after. Both are
         in this component's prop type, so a caller who set either would
         otherwise replace the error wiring with no type error and no warning —
         a group that renders red text and reports itself valid.

         Headless UI takes nothing of ours here: on the default `fieldset` tag
         its own props are `ref`, `aria-labelledby` and `disabled`, and those
         win over anything passed in. (`role` and `aria-disabled` are reserved
         only on its non-fieldset path, where it has to synthesize the
         semantics a real fieldset gives for free.) */
      {...props}
      aria-invalid={hasError || ariaInvalid || undefined}
      aria-describedby={describedBy}
    >
      {/* Headless UI's `Legend` renders a <div> that registers as the
          fieldset's label rather than a real <legend> element. That is the
          better trade: a <legend> cannot be laid out reliably across browsers,
          and `aria-labelledby` outranks it for the accessible name anyway. */}
      {label && (
        <Legend className="rst:block rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)] rst:text-left rst:data-disabled:opacity-50">
          {label}
        </Legend>
      )}

      <div
        className={cn(
          checkboxGroupPanelVariants({ variant, size, error: hasError }),
          scrollable &&
            "rst:overflow-y-auto rst:custom-scrollbar rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background",
          panelClassName,
        )}
        style={scrollable ? { maxHeight } : undefined}
        /* A scroll region needs its own tab stop. Chrome and Firefox now focus
           scrollers on their own, but Safari does not, and the case that fails
           everywhere is a `disabled` group: Headless UI drops `tabindex`
           entirely on a disabled checkbox rather than setting `-1`, so a
           capped list of disabled options had no focusable descendant at all
           and a keyboard user could not scroll it to read what was there. */
        tabIndex={scrollable ? 0 : undefined}
      >
        {isGrouped(options)
          ? options.map((group) => (
              /* Nested fieldset per category, so the heading is the group's
                 accessible name rather than decoration a screen reader walks
                 straight past. Nesting is valid HTML, the inner
                 DisabledProvider inherits from the outer one, and the names do
                 not concatenate: Headless UI's `useLabels` is called without
                 `inherit`, so each fieldset collects only its own legend.

                 `as={Eyebrow}` overrides Legend's own `as="div"` — it is
                 spread after — so these render as <span>. The registration is
                 what matters and it is unchanged. */
              <Fieldset key={group.category} className="rst:flex rst:flex-col rst:gap-2">
                <Legend
                  as={Eyebrow}
                  weight="semibold"
                  tone="default"
                  className="rst:border-b rst:border-gray-200 rst:pb-1 rst:dark:border-gray-800"
                >
                  {group.category}
                </Legend>
                {renderOptions(group.options)}
              </Fieldset>
            ))
          : renderOptions(options)}
      </div>

      {/* Same wording, weight and spacing as Input's and Select's. A form with
          all three should not have three dialects of "this is wrong". */}
      {(helperText || errorMessage) && (
        <p
          id={descriptionId}
          className={cn(
            "rst:text-xs rst:text-left",
            hasError
              ? "rst:text-error-600 rst:dark:text-error-400 rst:font-medium"
              : "rst:text-gray-500 rst:dark:text-gray-400",
            disabled && "rst:opacity-50",
          )}
        >
          {errorMessage || helperText}
        </p>
      )}
    </Fieldset>
  );
};

export { CheckboxGroup };
