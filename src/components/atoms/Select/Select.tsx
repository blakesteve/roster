import { Fragment } from "react";
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
import { selectTriggerVariants } from "./select-variants";

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
}

const Select = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  variant,
  error,
  className,
  label,
}: SelectProps) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Field className={cn("rst:flex rst:flex-col rst:gap-1.5", className)}>
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
        <div className="rst:relative">
          <ListboxButton
            className={cn(selectTriggerVariants({ variant, error }))}
          >
            <span
              className={cn(
                "rst:block rst:truncate",
                !selectedOption && "rst:text-gray-500 rst:dark:text-gray-400",
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="rst:pointer-events-none rst:absolute rst:inset-y-0 rst:right-0 rst:flex rst:items-center rst:pr-3">
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
                "rst:w-(--button-width) rst:z-50 rst:rounded-md rst:bg-white rst:dark:bg-gray-800 rst:py-1 rst:text-base rst:shadow-lg rst:ring-1 rst:ring-black/5 rst:dark:ring-gray-700 rst:focus:outline-none rst:sm:text-sm",
                "rst:[--anchor-gap:4px]",
              )}
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "rst:group rst:relative rst:cursor-default rst:select-none rst:py-2.5 rst:pl-4 rst:pr-9 rst:transition-colors",
                    "rst:text-gray-900 rst:dark:text-gray-100",
                    "rst:data-focus:bg-primary-100 rst:data-focus:text-primary-900",
                    "rst:dark:data-focus:bg-primary-900/30 rst:dark:data-focus:text-primary-100",
                    "rst:data-selected:bg-gray-50 rst:dark:data-selected:bg-gray-700/50",
                    "rst:data-disabled:opacity-50 rst:data-disabled:cursor-not-allowed",
                  )}
                >
                  <span className="rst:block rst:truncate rst:font-normal rst:group-data-selected:font-semibold">
                    {option.label}
                  </span>

                  <span className="rst:absolute rst:inset-y-0 rst:right-0 rst:hidden rst:items-center rst:pr-4 rst:text-primary-600 rst:dark:text-primary-400 rst:group-data-selected:flex">
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
