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
    <Field className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label className="block text-sm font-medium text-inherit text-left">
          {label}
        </Label>
      )}

      <Listbox
        value={value ?? undefined}
        onChange={onChange}
        disabled={disabled}
      >
        <div className="relative">
          <ListboxButton
            className={cn(selectTriggerVariants({ variant, error }))}
          >
            <span
              className={cn(
                "block truncate",
                !selectedOption && "text-gray-500 dark:text-gray-400",
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FontAwesomeIcon
                icon={faChevronDown}
                className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              anchor="bottom start"
              className={cn(
                "w-(--button-width) z-50 rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-gray-700 focus:outline-none sm:text-sm",
                "[--anchor-gap:4px]",
              )}
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "group relative cursor-default select-none py-2.5 pl-4 pr-9 transition-colors",
                    "text-gray-900 dark:text-gray-100",
                    "data-focus:bg-primary-100 data-focus:text-primary-900",
                    "dark:data-focus:bg-primary-900/30 dark:data-focus:text-primary-100",
                    "data-selected:bg-gray-50 dark:data-selected:bg-gray-700/50",
                    "data-disabled:opacity-50 data-disabled:cursor-not-allowed",
                  )}
                >
                  <span className="block truncate font-normal group-data-selected:font-semibold">
                    {option.label}
                  </span>

                  <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-primary-600 dark:text-primary-400 group-data-selected:flex">
                    <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
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
