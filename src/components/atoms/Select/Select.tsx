import React, { Fragment } from "react";
import {
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
  label,
  ...props
}: SelectProps) => {
  const selectedOption = options.find((opt) => opt.value === value);

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

       Deliberately NOT claimed: `aria-*`. This is a plain wrapper div with no
       role, so an `aria-describedby` landing here is inert, and Headless UI
       wires the trigger's description from the Field's <Description> context
       rather than from the wrapper's attributes. Select has no `helperText` /
       `errorMessage` yet, so there is currently no supported way to describe
       the trigger at all — filed, not fixed here. */
    <Field
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
            className={cn(
              selectTriggerVariants({ variant, size, error }),
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
                "rst:w-(--button-width) rst:z-50 rst:rounded-md rst:bg-white rst:dark:bg-gray-800 rst:py-1 rst:shadow-lg rst:ring-1 rst:ring-black/5 rst:dark:ring-gray-700 rst:focus:outline-hidden",
                "rst:[--anchor-gap:4px]",
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
    </Field>
  );
};

export { Select };
