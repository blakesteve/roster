import * as React from "react";
import { Fragment } from "react";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Description,
  Field,
  Label,
  Transition,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { inputVariants } from "../Input/input-variants";
import type { SelectOption } from "../Select/Select";
import { PopupOption } from "../../../internal/PopupOption";
import {
  POPUP_ANCHOR,
  popupInDarkPalette,
  POPUP_PANEL,
  POPUP_WIDTH_OF_INPUT,
  useDarkScope,
} from "../../../internal/popup";

export interface ComboboxProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof inputVariants> {
  options: SelectOption[];
  value: string | number | null;
  /**
   * Receives `null` when the field is cleared.
   *
   * Headless UI reports a cleared input as `null`, and swallowing that made
   * the selection unclearable: emptying the input fired nothing and Escape
   * silently restored the old label.
   */
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  /** Classes for the text input itself. `className` lands on the wrapper. */
  inputClassName?: string;
  /** Classes for the popup panel. */
  optionsClassName?: string;
  /** Shown in the panel when the query matches nothing. */
  emptyMessage?: string;
  /**
   * Replaces the match rule.
   *
   * The default is a case-insensitive substring on `label`, which is what
   * every hand-rolled version in the portfolio did. Pass this for fuzzy
   * matching, matching on `value`, or filtering server-side by ignoring the
   * query here entirely.
   */
  filter?: (options: SelectOption[], query: string) => SelectOption[];
}

const defaultFilter = (options: SelectOption[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
};

/**
 * A `Select` you can type into.
 *
 * Built on Headless UI's `Combobox` rather than on a Roster primitive, for the
 * same reason `Select` is built on its `Listbox`: that IS the primitive, and
 * it already handles the parts worth not rewriting — active-option tracking,
 * the keyboard model, and the input's `aria-activedescendant` wiring.
 *
 * What Roster adds is the presentation, and it is deliberately the SAME
 * presentation `Select` uses: the panel, its surface tokens, the `.dark` carry
 * across the portal, and the option rows all come from shared internals. A
 * combobox that opened a different-looking menu than a select on the same form
 * would be the bug this component is meant to prevent.
 */
const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  variant,
  size,
  error,
  label,
  helperText,
  errorMessage,
  className,
  inputClassName,
  optionsClassName,
  emptyMessage = "No matches",
  filter = defaultFilter,
  ...props
}: ComboboxProps) => {
  const [query, setQuery] = React.useState("");
  const { ref: fieldRef, inDarkScope } = useDarkScope<HTMLDivElement>();
  const hasError = !!errorMessage || error;
  const filtered = filter(options, query);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Field
      disabled={disabled}
      className={cn("rst:flex rst:flex-col rst:gap-1.5", className)}
      {...props}
    >
      {label && (
        <Label className="rst:block rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)] rst:text-left">
          {label}
        </Label>
      )}

      <HeadlessCombobox<string | number | null>
        value={value ?? null}
        onChange={onChange}
        disabled={disabled}
      >
        <div ref={fieldRef} className="rst:relative">
          <ComboboxInput
            aria-invalid={hasError || undefined}
            /* `pr-9` AFTER `inputClassName`, unlike every other escape hatch
               in the library. It is structural rather than decorative: it is
               the room the chevron occupies, and a consumer passing
               `inputClassName="rst:px-2"` was silently deleting it and typing
               underneath the icon. */
            className={cn(
              inputVariants({ variant, size, error: hasError }),
              inputClassName,
              "rst:pr-9",
            )}
            placeholder={placeholder}
            displayValue={() => selected?.label ?? ""}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton
            className={cn(
              "rst:absolute rst:inset-y-0 rst:right-0 rst:flex rst:cursor-pointer rst:items-center",
              size === "sm" ? "rst:pr-2.5" : "rst:pr-3",
            )}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className="rst:h-3.5 rst:w-3.5 rst:text-gray-400 rst:dark:text-gray-500"
              aria-hidden="true"
            />
          </ComboboxButton>

          {/* The query is cleared AFTER the panel has finished leaving, not on
              close. Clearing it on close repopulates the list while the panel
              is still on screen, so you watch it flash back to the full set as
              it fades — the filter appearing to undo itself. Waiting for
              `afterLeave` means the reset happens with nothing visible, and a
              reopen still starts from the full list rather than from whatever
              was typed last time. */}
          <Transition
            as={Fragment}
            leave="rst:transition rst:ease-in rst:duration-100"
            leaveFrom="rst:opacity-100"
            leaveTo="rst:opacity-0"
            afterLeave={() => setQuery("")}
          >
            <ComboboxOptions
              anchor={POPUP_ANCHOR}
              className={cn(
                popupInDarkPalette(inDarkScope, variant) && "dark",
                POPUP_PANEL,
                /* `--input-width`, not `--button-width`: the button here is
                   the chevron, so matching it renders a 20px sliver. */
                POPUP_WIDTH_OF_INPUT,
                optionsClassName,
              )}
            >
              {/* The empty state is a DISABLED option, not a bare `<p>`.
                    `role="listbox"` may only contain options, and Headless UI's
                    tree walker that neutralises stray children runs once when
                    the panel opens — the empty state only ever appears after
                    that, so it was never walked. A screen-reader user who typed
                    a non-matching query heard an empty listbox rather than "No
                    matches". Disabled keeps it out of the keyboard cycle while
                    leaving it announced. */}
              {filtered.length === 0 ? (
                <ComboboxOption
                  value=""
                  disabled
                  className={cn(
                    "rst:px-4 rst:py-2.5 rst:text-sm rst:opacity-70",
                    size === "sm" && "rst:px-3 rst:py-2",
                  )}
                >
                  {emptyMessage}
                </ComboboxOption>
              ) : (
                filtered.map((option) => (
                  <PopupOption
                    key={option.value}
                    as={ComboboxOption}
                    value={option.value}
                    disabled={option.disabled}
                    size={size}
                  >
                    {option.label}
                  </PopupOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </HeadlessCombobox>

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

export { Combobox };
