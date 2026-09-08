import React, { Fragment } from "react";
import {
  Description,
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { selectTriggerVariants } from "./select-variants";
import { PopupOption } from "../../../internal/PopupOption";
import {
  POPUP_ANCHOR,
  POPUP_PANEL,
  POPUP_WIDTH_OF_BUTTON,
  useDarkScope,
} from "../../../internal/popup";

export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

export interface SelectProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  /**
   * Classes for the trigger button itself.
   *
   * `className` lands on the outer `Field` wrapper, which is right for layout
   * and useless for anything else: a consumer could not reach the control to
   * change its height, ring or background. `size` covers the common case; this
   * is the escape hatch for the rest. Mirrors `Input`'s `inputClassName`.
   */
  triggerClassName?: string;
  /**
   * Classes for the popup panel.
   *
   * The escape-hatch rule already covers the wrapper (`className`) and the
   * control (`triggerClassName`); the panel was the one styleable element with
   * no way in. Mirrors `Input`'s `inputClassName`.
   */
  optionsClassName?: string;
  /** Supporting text under the trigger. */
  helperText?: string;
  /**
   * The message for an invalid selection. Implies `error`, so a caller cannot
   * set the red ring and forget to say why — which is what `error` on its own
   * did: a red outline and no text anywhere for anyone.
   */
  errorMessage?: string;
}

const Select = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  variant,
  size,
  error,
  className,
  triggerClassName,
  optionsClassName,
  helperText,
  errorMessage,
  label,
  ...props
}: SelectProps) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const hasError = !!errorMessage || error;

  /* The `.dark` carry and the panel's classes are shared with `Combobox` and
     `Multi-select` — see `src/internal/popup.ts` for why neither is inlined
     here any more. The ref sits on the inner positioning div rather than on
     `Field`, because Headless UI types `Field` through `forwardRefWithAs` and
     its props do not admit a `ref`. Either element gives the same answer:
     `closest` walks ancestors and the two are in the same subtree. */
  const { ref: fieldRef, inDarkScope } = useDarkScope<HTMLDivElement>();

  return (
    /* `...props` is spread here, and was not before. The prop type has always
       extended `HTMLAttributes<HTMLDivElement>`, so `id`, `data-*` and the
       handlers all typechecked and were then silently dropped on the floor.

       Still deliberately NOT claimed: `aria-*`. This is a plain wrapper div
       with no role, so an `aria-describedby` landing here is inert. The
       supported route is `helperText` / `errorMessage` below: Headless UI
       wires the trigger's description from the Field's <Description> context,
       which is the one path assistive tech actually follows. Before those
       existed there was no way to describe this trigger at all. */
    <Field
      /* `disabled` reaches the Field, not only the Listbox. Without it the
         Field's DisabledProvider stays false, so the Label never picks up its
         `peer-disabled` styling — and now that there is a Description under
         the trigger, the same was about to be true of that. A disabled control
         whose label and helper text look enabled is a control that reads as
         broken rather than unavailable. */
      disabled={disabled}
      className={cn("rst:flex rst:flex-col rst:gap-1.5", className)}
      {...props}
    >
      {/* The label reads `--roster-control-text` rather than `text-inherit`,
          which fell to the UA default on a page that sets no body color. See
          Input's label for the full reasoning. */}
      {label && (
        <Label className="rst:block rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)] rst:text-left">
          {label}
        </Label>
      )}

      <Listbox
        value={value ?? undefined}
        onChange={onChange}
        disabled={disabled}
      >
        <div ref={fieldRef} className="rst:relative">
          <ListboxButton
            /* Headless UI's `Listbox` emits `data-invalid` and no
               `aria-invalid`, and this component's `...props` land on the
               wrapper div, which has no role — so there was no route to it from
               either side. Without this a screen reader reads the error text on
               focus but never reports the field as invalid. */
            aria-invalid={hasError || undefined}
            className={cn(
              selectTriggerVariants({ variant, size, error: hasError }),
              triggerClassName,
            )}
          >
            <span
              className={cn(
                "rst:block rst:truncate",
                !selectedOption && "rst:text-gray-500 rst:dark:text-gray-400",
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span
              className={cn(
                "rst:pointer-events-none rst:absolute rst:inset-y-0 rst:right-0 rst:flex rst:items-center",
                /* Clearance tracks the size's own right padding, the way
                   Input's icon inset tracks its horizontal padding. */
                size === "sm" ? "rst:pr-2.5" : "rst:pr-3",
              )}
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className="rst:h-3.5 rst:w-3.5 rst:text-gray-400 rst:dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="rst:transition rst:ease-in rst:duration-100"
            leaveFrom="rst:opacity-100"
            leaveTo="rst:opacity-0"
          >
            <ListboxOptions
              anchor={POPUP_ANCHOR}
              className={cn(
                inDarkScope && "dark",
                POPUP_PANEL,
                POPUP_WIDTH_OF_BUTTON,
                optionsClassName,
              )}
            >
              {options.map((option) => (
                <PopupOption
                  key={option.value}
                  as={ListboxOption}
                  value={option.value}
                  disabled={option.disabled}
                  size={size}
                >
                  {option.label}
                </PopupOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>

      {/* Identical wording, weight and spacing to Input's, because a form with
          both should not have two dialects of "this is wrong".

          No `mt-1.5` here even though Input has one: Input's Field is a plain
          block, so its message needs the margin, while this Field is
          `flex-col gap-1.5` and already supplies the same 6px. Copying the
          class across would have doubled it and put the two components'
          helper text on different baselines — which is the exact thing this
          comment claims not to do. */}
      {(helperText || errorMessage) && (
        <Description
          className={cn(
            "rst:text-xs rst:text-left",
            hasError
              ? "rst:text-error-600 rst:dark:text-error-400 rst:font-medium"
              : "rst:text-gray-500 rst:dark:text-gray-400",
          )}
        >
          {errorMessage || helperText}
        </Description>
      )}
    </Field>
  );
};

export { Select };
