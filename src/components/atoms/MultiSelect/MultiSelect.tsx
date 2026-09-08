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
import { faChevronDown, faXmark } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { selectTriggerVariants } from "../Select/select-variants";
import { type SelectOption } from "../Select/Select";
import { Chip } from "../Chip/Chip";
import { PopupOption } from "../../../internal/PopupOption";
import {
  POPUP_ANCHOR,
  popupInDarkPalette,
  POPUP_PANEL,
  POPUP_WIDTH_OF_BUTTON,
  useDarkScope,
} from "../../../internal/popup";

export type MultiSelectValue = string | number;

export interface MultiSelectProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof selectTriggerVariants> {
  /** Same option shape as `Select`. */
  options: SelectOption[];
  value: MultiSelectValue[];
  onChange: (value: MultiSelectValue[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Classes for the trigger button itself. Mirrors `Select`. */
  triggerClassName?: string;
  /** Classes for the popup panel. Mirrors `Select`. */
  optionsClassName?: string;
  /** Supporting text under the trigger. */
  helperText?: string;
  /**
   * The message for an invalid selection. Implies `error`, so a caller cannot
   * set the red ring and forget to say why. Mirrors `Select`.
   */
  errorMessage?: string;
  /**
   * How the selection reads in the closed trigger.
   *
   * `chips` names every selection, which is the point of the component when
   * the list is short. `count` is the escape hatch for a field that would
   * otherwise grow to five rows on a narrow screen — `maxChips` handles the
   * middle ground.
   */
  display?: "chips" | "count";
  /**
   * Chips to show before the rest collapse into a `+N` chip. `undefined` shows
   * all of them.
   */
  maxChips?: number;
  /** Adds a control that clears the whole selection. */
  clearable?: boolean;
  /** Color scheme for the selection chips. */
  chipColorScheme?: React.ComponentProps<typeof Chip>["colorScheme"];
  /**
   * Fill for the selection chips. `outline` by default, and deliberately.
   *
   * The trigger's own default variant paints `--roster-control-bg`, which is
   * `transparent` — so a chip sits on whatever the page is, not on a surface
   * this component controls. A `soft neutral` chip is `gray-100`, which on the
   * library's own `gray-50` page is a 1.04:1 rectangle: the chips rendered,
   * measured correct, and could not be seen. `outline` is the one fill whose
   * identity is a border rather than a background.
   *
   * Chip's own outline palette is not enough on its own, though, and that is
   * why the chips below take `text-inherit` and `border-current`. Chip holds
   * its border to 3:1 against a PAGE; this component can be told to paint its
   * own surface, and `variant="slate"` paints `gray-700` — byte-identical to
   * the neutral chip's own `gray-700` label. That rendered chip-shaped holes
   * with no readable text at 1.00:1. Inheriting means the chip cannot disagree
   * with the surface it was just placed on.
   */
  chipVariant?: React.ComponentProps<typeof Chip>["variant"];
  /** Accessible name for the clear control. */
  clearLabel?: string;
  /**
   * Builds the accessible name for a chip's dismiss control.
   *
   * A row of buttons all named "Remove" is a row a screen reader user cannot
   * tell apart, so this takes the label rather than being a constant.
   */
  removeLabel?: (label: string) => string;
}

const MultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select options",
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
  display = "chips",
  maxChips,
  clearable = false,
  chipColorScheme = "neutral",
  chipVariant = "outline",
  clearLabel = "Clear selection",
  removeLabel = (label: string) => `Remove ${label}`,
  ...props
}: MultiSelectProps) => {
  const hasError = !!errorMessage || error;
  const hasSelection = value.length > 0;

  /* Mapped over `value` rather than over `options`, so a selected value whose
     option has not loaded yet still appears — as its own id, which is ugly and
     honest, rather than vanishing from a field that still reports it.

     Then ORDERED by the options, which selection order is not. Headless UI
     appends each pick, so toggling one value off and on again sent its chip to
     the end of the row; with `maxChips` that also changed which chips were
     visible and which collapsed into `+N`. Chips that reshuffle on an
     unrelated click are chips nobody can scan. `sort` is stable, so anything
     with no matching option keeps its relative order at the end. */
  const optionIndex = new Map(options.map((o, i) => [o.value, i]));
  const selected = value
    .map((v) => ({
      value: v,
      label: options.find((o) => o.value === v)?.label ?? String(v),
    }))
    .sort(
      (a, b) =>
        (optionIndex.get(a.value) ?? Number.POSITIVE_INFINITY) -
        (optionIndex.get(b.value) ?? Number.POSITIVE_INFINITY),
    );

  const shown = maxChips === undefined ? selected : selected.slice(0, maxChips);
  const overflow = selected.length - shown.length;

  /* Shared with `Select` and `Combobox` — see `src/internal/popup.ts`. */
  const { ref: fieldRef, inDarkScope } = useDarkScope<HTMLDivElement>();

  /* The clear control deletes itself: clearing makes `hasSelection` false,
     which unmounts the button that was just activated. Without somewhere to
     send focus, a keyboard user is dropped on <body> and their next Tab
     restarts at the top of the document. */
  const triggerRef = React.useRef<HTMLButtonElement>(null);

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

      <Listbox value={value} onChange={onChange} disabled={disabled} multiple>
        <div ref={fieldRef} className="rst:relative">
          {/* The trigger is a SHELL with the `ListboxButton` stretched across
              it, rather than the button itself holding the content.

              This is what buys individually dismissible chips. A chip's
              dismiss control is a `<button>`; with the content inside
              `ListboxButton` it would have been a button inside a button, and
              React builds the DOM through the DOM API rather than the parser,
              so the pair persists nested — a focusable control whose every
              click also opens the listbox.

              Stretching the button `inset-0` instead makes the chips its
              SIBLINGS while leaving it the full-width element: Headless UI
              anchors the panel to the button and sizes it from
              `--button-width`, and the button's box is now exactly the shell's
              box, so the panel still matches the field. That was the thing
              worth protecting — a trigger that stopped being full width is how
              Combobox once shipped a 20px unreadable menu.

              Everything decorative in here is `pointer-events-none` so clicks
              fall through to the button underneath; the dismiss controls take
              their events back explicitly. */}
          <div
            className={cn(
              selectTriggerVariants({ variant, size, error: hasError }),
              "rst:h-auto rst:flex-wrap rst:items-center rst:gap-1.5 rst:py-1.5",
              size === "sm"
                ? "rst:min-h-9"
                : size === "lg"
                  ? "rst:min-h-11"
                  : "rst:min-h-10",
              clearable && hasSelection && "rst:pr-16",
              /* The ring is on the shell and fires from `focus-within`, because
                 the element that actually takes focus is the invisible button
                 stretched across it — and, deliberately, from a dismiss
                 control too: those are inside the field and should light it. */
              "rst:focus-within:ring-2 rst:focus-within:ring-ring",
              disabled && "rst:opacity-50 rst:cursor-not-allowed",
              triggerClassName,
            )}
          >
            <ListboxButton
              ref={triggerRef}
              aria-invalid={hasError || undefined}
              className="rst:absolute rst:inset-0 rst:h-full rst:w-full rst:cursor-pointer rst:rounded-md rst:focus:outline-hidden rst:disabled:cursor-not-allowed"
            >
              {/* The button's only content, and the only thing in the accessible
                  name besides the label. The visible chips are `aria-hidden`:
                  they are `inline-flex` spans, so name computation joins them
                  with no whitespace and "NCAA Football" followed by "NBA" was
                  announced as "FootballNBA".

                  It names every selection, not just the ones `maxChips` left
                  visible — `+2` is a layout decision, and there is no reason to
                  withhold two labels from someone who cannot see that the row
                  was getting long. */}
              <span className="rst:sr-only">
                {!hasSelection
                  ? placeholder
                  : display === "count"
                    ? `${value.length} selected`
                    : selected.map((item) => item.label).join(", ")}
              </span>
            </ListboxButton>

            {!hasSelection && (
              <span
                aria-hidden="true"
                className="rst:pointer-events-none rst:relative rst:block rst:truncate rst:text-gray-500 rst:dark:text-gray-400"
              >
                {placeholder}
              </span>
            )}

            {hasSelection && display === "count" && (
              <span
                aria-hidden="true"
                className="rst:pointer-events-none rst:relative rst:block rst:truncate"
              >
                {value.length} selected
              </span>
            )}

            {hasSelection &&
              display === "chips" &&
              shown.map((item, index) => (
                <Chip
                  /* Index-qualified: `value` admits both `1` and `"1"`, which
                     collide as keys once React coerces them, and picking both
                     of those options is an ordinary click away. */
                  key={`${index}-${String(item.value)}`}
                  size="sm"
                  variant={chipVariant}
                  colorScheme={chipColorScheme}
                  disabled={disabled}
                  onRemove={() =>
                    onChange(value.filter((v) => v !== item.value))
                  }
                  removeLabel={removeLabel(item.label)}
                  /* The chip body is inert so a click on the label opens the
                     menu like the rest of the field; only the dismiss button
                     takes events back. See `chipVariant` for why the colors are
                     inherited in both schemes. */
                  className={cn(
                    "rst:relative rst:max-w-[12rem] rst:pointer-events-none",
                    "rst:[&_button]:pointer-events-auto",
                    "rst:text-inherit rst:border-current/70 rst:dark:text-inherit rst:dark:border-current/70",
                  )}
                >
                  <span className="rst:block rst:truncate">{item.label}</span>
                </Chip>
              ))}

            {overflow > 0 && display === "chips" && (
              <Chip
                size="sm"
                variant={chipVariant}
                colorScheme={chipColorScheme}
                aria-hidden="true"
                className="rst:pointer-events-none rst:relative rst:text-inherit rst:border-current/70 rst:dark:text-inherit rst:dark:border-current/70"
              >
                +{overflow}
              </Chip>
            )}

            <span
              className={cn(
                "rst:pointer-events-none rst:absolute rst:inset-y-0 rst:right-0 rst:flex rst:items-center",
                size === "sm" ? "rst:pr-2.5" : "rst:pr-3",
              )}
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className="rst:h-3.5 rst:w-3.5 rst:text-gray-400 rst:dark:text-gray-500"
                aria-hidden="true"
              />
            </span>

            {/* Inside the shell, so `currentColor` is the trigger's own text
                color — the one thing that lets this follow a surface the
                consumer picked. It used to sit outside, where `currentColor`
                resolved against the page and painted a black glyph on
                `slate`. */}
            {clearable && hasSelection && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange([]);
                  /* This button is about to unmount. Without an explicit
                     handoff, focus falls to <body> and a keyboard user's next
                     Tab restarts at the top of the document. */
                  triggerRef.current?.focus();
                }}
                aria-label={clearLabel}
                className={cn(
                  /* `w-6` is not decoration: WCAG 2.5.8 asks 24x24 CSS px and
                     a bare 14px icon measured 20px wide. The spacing exception
                     does not apply, because this sits inside the trigger's own
                     bounds. */
                  "rst:absolute rst:inset-y-0 rst:flex rst:w-6 rst:items-center rst:justify-center",
                  "rst:cursor-pointer rst:disabled:cursor-not-allowed",
                  "rst:text-current rst:opacity-70 rst:hover:opacity-100 rst:disabled:opacity-40",
                  "rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:rounded-sm",
                  size === "sm" ? "rst:right-7" : "rst:right-8",
                )}
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  className="rst:h-3.5 rst:w-3.5"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <Transition
            as={Fragment}
            leave="rst:transition rst:ease-in rst:duration-100"
            leaveFrom="rst:opacity-100"
            leaveTo="rst:opacity-0"
          >
            <ListboxOptions
              anchor={POPUP_ANCHOR}
              className={cn(
                popupInDarkPalette(inDarkScope, variant) && "dark",
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

export { MultiSelect };
