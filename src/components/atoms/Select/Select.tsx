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
import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { selectTriggerVariants, selectOptionVariants } from "./select-variants";

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

  /* The menu is rendered through a portal attached to <body>, because `anchor`
     implies one and `portal={false}` does not opt out of it. That is fine when
     `.dark` sits on <html>, which is what `ThemeToggle` does and what the
     README recommends — the portal is still a descendant. It breaks when a
     consumer scopes `.dark` to a subtree, which the README also permits: the
     menu leaves the scope and renders white against a dark page. Measured, not
     assumed: the portaled listbox reports `rgb(255, 255, 255)` inside a scoped
     dark container.

     So carry the scope across the portal. `closest` finds the NEAREST `.dark`,
     which is exactly what `@custom-variant dark (&:where(.dark, .dark *))`
     matches, so this reproduces the cascade rather than second-guessing it. The
     class is applied to the panel itself, which the `&:where(.dark, …)` half of
     that variant covers, and `.dark *` then covers the options inside it.
     Harmless when `.dark` is already on the root: the class is idempotent.

     Read once, on mount. A theme TOGGLE does not need this mechanism at all:
     it flips `.dark` on <html>, and the portal is already a descendant of
     <html>, so the variant matches natively whether or not this state is
     current. The only case this covers is a `.dark` scoped to a subtree, and
     that scope is part of the page's structure rather than something that
     flips at runtime. */
  /* The ref sits on the inner positioning div rather than on `Field`, because
     Headless UI types `Field` through `forwardRefWithAs` and its props do not
     admit a `ref` — `tsc --noEmit` against the root tsconfig let it through and
     the build's stricter pass did not. Either element gives the same answer:
     `closest` walks ancestors, and the two are in the same subtree. */
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [inDarkScope, setInDarkScope] = React.useState(false);
  React.useLayoutEffect(() => {
    setInDarkScope(!!fieldRef.current?.closest(".dark"));
  }, []);

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
      {label && (
        <Label className="rst:block rst:text-sm rst:font-medium rst:text-inherit rst:text-left">
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
              anchor="bottom start"
              className={cn(
                inDarkScope && "dark",
                "rst:w-(--button-width) rst:z-50 rst:rounded-md rst:py-1 rst:shadow-lg rst:ring-1 rst:focus:outline-hidden",
                /* The surface, from `--roster-popover-*`. This panel has no
                   variants to preserve, so it reads the family outright: a
                   consumer who repaints the trigger with `--roster-control-*`
                   was otherwise opening a hardcoded white sheet under it. */
                "rst:bg-[var(--roster-popover-bg)] rst:text-[var(--roster-popover-text)] rst:ring-[var(--roster-popover-border)]",
                "rst:[--anchor-gap:4px]",
                /* No max-height or overflow here, deliberately. Headless UI's
                   `size` middleware already writes both INLINE on this element
                   whenever `anchor` is set:

                     Object.assign(floating.style, { overflow: "auto",
                       maxHeight: `min(var(--anchor-max-height, 100vh), Npx)` })

                   so the panel has always been capped at the space between the
                   trigger and the viewport edge, and has always scrolled. A
                   utility class here would lose to that inline rule anyway.

                   `--anchor-max-height` is READ by that expression and never
                   set by Headless UI — it is an author hook, like
                   `--anchor-gap`. A consumer who wants a shorter menu than the
                   viewport allows sets the variable rather than a height:
                   `optionsClassName="rst:[--anchor-max-height:20rem]"`. */
                optionsClassName,
              )}
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(selectOptionVariants({ size }))}
                >
                  <span className="rst:block rst:truncate rst:font-normal rst:group-data-selected:font-semibold">
                    {option.label}
                  </span>

                  <span
                    className={cn(
                      "rst:absolute rst:inset-y-0 rst:right-0 rst:hidden rst:items-center rst:text-primary-600 rst:dark:text-primary-400 rst:group-data-selected:flex",
                      size === "sm" ? "rst:pr-3" : "rst:pr-4",
                    )}
                  >
                    <FontAwesomeIcon icon={faCheck} className="rst:h-3.5 rst:w-3.5" />
                  </span>
                </ListboxOption>
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
