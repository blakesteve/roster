import React from "react";
import {
  Description,
  Field,
  Label,
  Radio,
  RadioGroup as HeadlessRadioGroup,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import {
  radioDotVariants,
  radioGroupOptionsVariants,
  radioOptionVariants,
  radioVariants,
} from "./radio-group-variants";

export type RadioGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Supporting text under the option's label. */
  description?: string;
};

export interface RadioGroupProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    Pick<VariantProps<typeof radioGroupOptionsVariants>, "size">,
    Pick<VariantProps<typeof radioVariants>, "colorScheme"> {
  /**
   * A flat list. There is no grouped form, and no `maxHeight`: both exist on
   * `CheckboxGroup` because it is the long-list control, and a radio group
   * with enough options to need scrolling wants a `Select` instead. Shipping
   * the affordance would invite the wrong control.
   */
  options: RadioGroupOption[];
  /**
   * The selected value, as a string rather than an array. This is the whole
   * difference from `CheckboxGroup`: a radio group has one answer, which is
   * the reason it exists beside one.
   *
   * A value matching no option selects nothing and leaves the first option as
   * the group's tab stop, which is the correct empty state — `""` is the
   * ordinary way to spell "not answered yet".
   */
  value: string;
  onChange: (value: string) => void;
  /** The group's name. Becomes the group's accessible name. */
  label?: string;
  /** Supporting text under the options. */
  helperText?: string;
  /**
   * The message for an invalid selection. Implies the error state, so a caller
   * can not color the text red and forget to say why.
   *
   * The message is the whole of the error state, as it is in `CheckboxGroup`'s
   * `plain` variant: there is no panel here to repaint, and a radio is not the
   * thing that is invalid — the answer is.
   *
   * One difference from `CheckboxGroup` worth knowing before you rely on it:
   * a caller's own `aria-describedby` is REPLACED here rather than merged.
   * `CheckboxGroup` owns a `<fieldset>` and so owns the attribute;
   * `aria-describedby` is one of the props Headless UI controls on a
   * `RadioGroup`, and a controlled prop is spread last. Passing one is
   * therefore a no-op rather than an addition. `aria-invalid` is not one of
   * Headless UI's, so a caller's survives its spread — and is then outranked
   * by this component's own error state, which is a different thing from the
   * token-list merge `CheckboxGroup` does for `aria-describedby`.
   */
  errorMessage?: string;
  /** Disables every option, and dims the label and helper text with them. */
  disabled?: boolean;
  /**
   * Which way the options run. `vertical` stacks them, `horizontal` lays them
   * out in a wrapping row for a short, scannable set.
   *
   * Named for the ARIA property it sets rather than for the flex direction it
   * produces, because it does set it: `aria-orientation` tells a screen reader
   * which arrow keys it is being offered, and `radiogroup` supports it.
   * Headless UI's own key handling takes all four arrows in both orientations,
   * which is the behavior worth having and is why this only ever widens what
   * works rather than narrowing it.
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Classes for the element holding the options. `className` lands on the
   * group itself.
   *
   * Use `orientation` rather than this to lay the options out across. The
   * horizontal guarantees ride on that prop: laying them out in a row from
   * here keeps the vertical gap, which is 0 to 4px because each option's box
   * contains its own target down the page but not across it, and two radios
   * closer than 44px overlap. A `grid-cols-2` passed here puts 10px of one
   * option's label inside its neighbor's target, and leaves
   * `aria-orientation` saying `vertical`.
   *
   * Note for anyone moving between components: `Select` and `Combobox` use
   * this name for their floating popup panel, and `CheckboxGroup` calls the
   * same in-flow container `panelClassName`. The name here follows the rule
   * the README states, which is that an escape hatch is named for the element
   * it reaches; `panel` names a `CheckboxGroup` variant this component does
   * not have.
   */
  optionsClassName?: string;
  /**
   * Classes for one option's box. Applied to every option.
   *
   * This is the hook for turning the list into cards or rows with a border.
   * Paint freely: a background, a border, a radius and horizontal padding all
   * leave the targets alone.
   *
   * The VERTICAL padding is load-bearing, and `cn` is tailwind-merge, so a
   * `py-*` or a height passed here deletes the component's own and takes the
   * radio's target with it. The option's padding is what puts that target
   * inside the option's box; at `sm`, `py-0` lets it overhang the box by 14px
   * and `py-2` by 5. Style the box, and leave its height and vertical padding
   * to the component.
   *
   * Headless UI puts `data-checked` and `data-disabled` on the control rather
   * than on this box, so style the selected and disabled states from here with
   * a `has-` variant reaching down to it.
   */
  optionClassName?: string;
  /** Classes for the radio control itself. */
  radioClassName?: string;
  /** Classes for the group's own label. */
  labelClassName?: string;
  /** Classes for each option's label. */
  optionLabelClassName?: string;
  /** Classes for each option's `description`. */
  descriptionClassName?: string;
  /** Classes for the helper text or error message under the options. */
  messageClassName?: string;
}

const LABEL_SIZES = {
  sm: "rst:text-xs",
  md: "rst:text-sm",
  lg: "rst:text-base",
} as const;

/**
 * A labeled, validated set of radios that reports one `string`.
 *
 * A molecule rather than an atom, and `CheckboxGroup` is the precedent: a
 * component that repeats a control and wraps it in a label, help and error
 * shell is a molecule. `Checkbox` and `Switch` are atoms because each is a
 * single control with no shell of its own.
 *
 * Built on Headless UI's `RadioGroup` rather than on a `Fieldset` holding
 * radios, because that is the primitive and it already owns the parts worth
 * not rewriting: the roving tabindex, arrow-key navigation that wraps, and the
 * rule that a group with nothing selected still has exactly one tab stop.
 */
const RadioGroup = ({
  options,
  value,
  onChange,
  label,
  helperText,
  errorMessage,
  disabled = false,
  size = "md",
  orientation = "vertical",
  colorScheme,
  className,
  optionsClassName,
  optionClassName,
  radioClassName,
  labelClassName,
  optionLabelClassName,
  descriptionClassName,
  messageClassName,
  "aria-invalid": ariaInvalid,
  ...props
}: RadioGroupProps) => {
  const hasError = !!errorMessage;
  const resolvedSize = size ?? "md";

  return (
    <HeadlessRadioGroup
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "rst:font-ui rst:flex rst:flex-col rst:gap-1.5 rst:min-w-0",
        className,
      )}
      /* What keeps a caller from reporting an invalid group valid is the
         DESTRUCTURE above, not this spread order: `aria-invalid` is pulled out
         of `...props` by name, so it can never reach the element except
         through the expression below. Spreading first is defense for the day
         someone deletes that destructure, and it matches how `CheckboxGroup`
         is written. It is stated this way round because the ordering alone
         reads like the guard and is not — moving the spread below changes
         nothing, which a mutation test is how you find out.

         The expression's own order does matter: an error message means the
         selection is invalid, so it outranks a caller's token. */
      {...props}
      aria-invalid={hasError || ariaInvalid || undefined}
      aria-orientation={orientation}
    >
      {/* A `Label` directly inside the group registers as its accessible name.
          It renders a <div> rather than a <label> here, deliberately: Headless
          gives a `Label` an `htmlFor` only when there is a `Field` providing a
          control id, and a <label for> pointing at a whole radiogroup would be
          wrong anyway.

          `disabled && opacity-50` rather than `data-disabled:opacity-50`, which
          is what `CheckboxGroup`'s legend uses. `Fieldset` provides a disabled
          context for its descendants to read; `RadioGroup` reads one but never
          provides one, so `data-disabled` never lands on this element. The
          per-option labels below are inside a `Field`, which does provide it,
          so those keep the data attribute. */}
      {label && (
        <Label
          className={cn(
            "rst:block rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)] rst:text-left",
            disabled && "rst:opacity-50",
            labelClassName,
          )}
        >
          {label}
        </Label>
      )}

      <div
        className={cn(
          radioGroupOptionsVariants({ size: resolvedSize, orientation }),
          optionsClassName,
        )}
      >
        {options.map((option) => (
          <Field
            key={option.value}
            /* `disabled || option.disabled`, not `option.disabled`. Headless
               UI takes an inherited value only when the prop is `undefined`,
               and an option written the ordinary way as `disabled: !canPick`
               passes an explicit `false`.

               What that costs here is narrower than the same line in
               `CheckboxGroup`, and worth stating precisely rather than copying
               the sentence across. A `Checkbox` reads its disabled state only
               from the surrounding `Field`, so there the explicit `false` left
               an operable checkbox inside a disabled group. A `Radio` reads
               the GROUP's state as well and ORs the two, so the radio itself
               stays disabled either way.

               The `Field` is what the label and the description read. Without
               the OR they render undimmed beside a disabled radio: a row that
               looks available, reads as available, and does nothing. */
            disabled={disabled || option.disabled}
            className={cn(
              radioOptionVariants({ orientation, size: resolvedSize }),
              optionClassName,
            )}
          >
            <Radio
              value={option.value}
              className={({ checked }: { checked: boolean }) =>
                cn(
                  radioVariants({ colorScheme, size: resolvedSize, checked }),
                  /* `self-start`, and no nudge. The circle's height equals the
                     label's line-height at every size, so aligning their top
                     edges puts the radio on the first line whether the label
                     is one line or four. */
                  "rst:self-start",
                  disabled || option.disabled
                    ? "rst:opacity-50 rst:cursor-not-allowed"
                    : "rst:cursor-pointer",
                  radioClassName,
                )
              }
            >
              {({ checked }: { checked: boolean }) => (
                <span
                  className={cn(
                    radioDotVariants({ size: resolvedSize }),
                    checked ? "rst:opacity-100" : "rst:opacity-0",
                  )}
                />
              )}
            </Radio>
            {/* The label is a hit target, so its box is hit area. `flex-1`
                spends the rest of the option's WIDTH on it: a four-character
                option like "Yes" was a 30px target with everything right of
                the word doing nothing.

                Its height is the text's, not the option's, and that is a
                deliberate limit rather than an oversight. The padding that
                buys the 44px target sits on the option box, so making the
                label fill it would mean moving that padding onto the label —
                which needs a different value once there is a description under
                it, and a branch here is what produced the last two alignment
                bugs. What covers the option's full height instead is the
                radio's own 44x44 target, down the left. The corners stay
                inert: full width at the text's height, full height for the
                first 44px across. */}
            <div
              className={cn(
                "rst:flex rst:min-w-0 rst:flex-col",
                /* Down the page the label should take the rest of the row, so
                   the whole row is a hit target. Across, it must not: a
                   stretched label would push the options apart to fill the
                   line and the group would stop reading as a set of choices. */
                orientation === "vertical" && "rst:flex-1",
              )}
            >
              {/* The label is a hit target in its own right: Headless UI's
                  `Label` clicks the associated `role="radio"` element, and
                  refuses to when that element carries `aria-disabled`. So the
                  pointer cursor belongs here rather than on the row, whose
                  outer reaches do nothing. The padding is hit area, not
                  inset.

                  `--roster-control-text` rather than an inherited color:
                  Roster sets no body color, so `text-inherit` fell to the UA's
                  black on dark pages. */}
              <Label
                className={cn(
                  "rst:cursor-pointer rst:select-none",
                  "rst:text-[var(--roster-control-text)]",
                  "rst:data-disabled:cursor-not-allowed rst:data-disabled:opacity-50",
                  LABEL_SIZES[resolvedSize],
                  optionLabelClassName,
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <Description
                  className={cn(
                    "rst:text-xs rst:text-gray-500 rst:dark:text-gray-400 rst:data-disabled:opacity-50",
                    descriptionClassName,
                  )}
                >
                  {option.description}
                </Description>
              )}
            </div>
          </Field>
        ))}
      </div>

      {/* Same wording, weight and spacing as Input's, Select's and
          CheckboxGroup's. A form with all four should not have four dialects
          of "this is wrong".

          A Headless `Description`, where `CheckboxGroup` has to hand-roll a
          <p> and its own id. The difference is in the primitives, not in the
          intent: `Fieldset` collects descendant labels but never calls
          `useDescriptions`, so a `Description` inside one does not degrade
          quietly, it throws. `RadioGroup` does call it and wraps its children
          in the provider, so this registers on the group.

          It is also the ONLY way to describe this group. `aria-describedby` is
          a prop Headless controls, so setting it by hand does not merely lose
          a caller's value — it loses this component's too: Headless's own
          `undefined` is spread last and deletes the attribute outright. That
          version rendered an error message wired to nothing, which is the
          shape of bug that looks finished in a screenshot. */}
      {(helperText || errorMessage) && (
        <Description
          as="p"
          className={cn(
            "rst:text-xs rst:text-left",
            hasError
              ? "rst:text-error-600 rst:dark:text-error-400 rst:font-medium"
              : "rst:text-gray-500 rst:dark:text-gray-400",
            disabled && "rst:opacity-50",
            messageClassName,
          )}
        >
          {errorMessage || helperText}
        </Description>
      )}
    </HeadlessRadioGroup>
  );
};

export { RadioGroup };
