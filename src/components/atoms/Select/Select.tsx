import React, { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
  Portal,
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
}: SelectProps) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Listbox value={value ?? undefined} onChange={onChange} disabled={disabled}>
      <div className={cn("relative", className)}>
        <ListboxButton
          className={cn(selectTriggerVariants({ variant, error }))}
        >
          <span
            className={cn("block truncate", !selectedOption && "text-gray-500")}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <FontAwesomeIcon
              icon={faChevronDown}
              className="h-3.5 w-3.5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </ListboxButton>

        <Portal>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              anchor="bottom start"
              className={cn(
                "w-(--button-width) z-50 rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm",
                "[--anchor-gap:4px]",
              )}
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={({ focus, selected, disabled }) =>
                    cn(
                      "relative cursor-default select-none py-2.5 pl-4 pr-9 transition-colors",
                      focus
                        ? "bg-primary-100 text-primary-900"
                        : "text-gray-900",
                      selected && !focus && "bg-gray-50",
                      disabled && "opacity-50 cursor-not-allowed",
                    )
                  }
                >
                  {({ selected, focus }) => (
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          selected ? "font-semibold" : "font-normal",
                        )}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span
                          className={cn(
                            "absolute inset-y-0 right-0 flex items-center pr-4",
                            focus ? "text-primary-600" : "text-primary-600",
                          )}
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="h-3.5 w-3.5"
                          />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </Portal>
      </div>
    </Listbox>
  );
};

export { Select };
