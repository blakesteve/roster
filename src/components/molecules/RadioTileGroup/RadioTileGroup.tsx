import React from "react";
import { Description, Field, Label, Radio, RadioGroup as HeadlessRadioGroup } from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { isFieldInvalid, withoutInvalidProps } from "../../../internal/field-invalid";
import { useKeyFocus } from "../../../internal/key-focus";
import {
  radioTileGroupOptionsVariants,
  radioTilePictureVariants,
  radioTileVariants,
} from "./radio-tile-group-variants";

export type RadioTileOption = {
  value: string;
  /** The option's name, under its picture. It's what the radio is called. */
  label: string;
  /** Supporting text under the name, read as the radio's description. */
  description?: string;
  /**
   * What the tile shows above its name: a photo, a drawing, a swatch, any
   * node. Hidden from assistive technology, since `label` already names the
   * option, so the name isn't read twice. Give an image `alt=""`.
   */
  picture?: React.ReactNode;
  disabled?: boolean;
};

/**
 * How many tiles to a row: one count, or a count per breakpoint. A
 * breakpoint left out takes the count of the one below it, and `base` is 1
 * when it's left out.
 */
export type RadioTileColumns = number | { base?: number; sm?: number; md?: number; lg?: number };

export interface RadioTileGroupProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    Pick<VariantProps<typeof radioTileVariants>, "variant"> {
  options: RadioTileOption[];
  /**
   * The selected value. A value matching no option selects nothing, and
   * leaves the first option as the group's tab stop: `""` is the way to say
   * "not answered yet", as in `RadioGroup`.
   */
  value: string;
  onChange: (value: string) => void;
  /** The group's name. Becomes the group's accessible name. */
  label?: string;
  /** Supporting text under the tiles. */
  helperText?: string;
  /**
   * The message for an invalid selection. Implies the error state, and is the
   * group's description while it shows, as in `RadioGroup`, which says how
   * `aria-invalid` and `aria-describedby` are handled.
   */
  errorMessage?: string;
  /** Disables every tile, and dims the label and helper text with them. */
  disabled?: boolean;
  /** Says the group needs an answer, as `aria-required`. */
  required?: boolean;
  /**
   * Tiles per row. Two, then three from the `sm` breakpoint, by default:
   * two photos side by side is the useful size on a phone.
   */
  columns?: RadioTileColumns;
  /**
   * A tile's narrowest width, as a CSS length (`"9rem"`). Set, it replaces
   * `columns`: each row holds as many tiles as fit the group's own width,
   * whatever the viewport.
   */
  minTileWidth?: string;
  /** Classes for the grid holding the tiles. `className` lands on the group. */
  optionsClassName?: string;
  /**
   * Classes for every tile, the element carrying `role="radio"`. It carries
   * `data-checked`, `data-disabled`, `data-hover` and `data-focus-visible` as
   * well, so a chosen look can be drawn from them, with `variant="plain"` for
   * none of Roster's own.
   */
  tileClassName?: string;
  /** Classes for what holds each option's `picture`. */
  pictureClassName?: string;
  /** Classes for the group's own label. */
  labelClassName?: string;
  /** Classes for each option's name. */
  optionLabelClassName?: string;
  /** Classes for each option's `description`. */
  descriptionClassName?: string;
  /** Classes for the helper text or error message under the tiles. */
  messageClassName?: string;
}

/* Headless UI marks keyboard focus `data-focus`. The tile also says it as
   `data-focus-visible`, a name a consumer's styles can rely on whatever
   Headless UI calls it. */
type TileProps = React.HTMLAttributes<HTMLDivElement> & { "data-focus"?: string };
const Tile = React.forwardRef<HTMLDivElement, TileProps>(function Tile(props, ref) {
  return <div ref={ref} {...props} data-focus-visible={props["data-focus"]} />;
});

function columnCounts(columns: RadioTileColumns): React.CSSProperties {
  const c = typeof columns === "number" ? { base: columns } : columns;
  const base = c.base ?? 1;
  const sm = c.sm ?? base;
  const md = c.md ?? sm;
  const lg = c.lg ?? md;
  return {
    "--rst-tiles-cols": base,
    "--rst-tiles-cols-sm": sm,
    "--rst-tiles-cols-md": md,
    "--rst-tiles-cols-lg": lg,
  } as React.CSSProperties;
}

/**
 * A radio group whose options are tiles: a picture, a name and an optional
 * description each, with no radio dot. Choosing between photos, avatars,
 * swatches or layouts.
 *
 * A sibling of `RadioGroup` rather than a variant of it. Built on the same
 * Headless UI pieces, so it's the same radio group to a keyboard and a screen
 * reader: one tab stop, the arrows moving and choosing (wrapping, skipping
 * disabled tiles), Space choosing. It adds Home and End, to the first and
 * last tile. `RadioGroup` keeps its own props, which are about dots and rows,
 * and a form with only text radios doesn't carry the tiles' code.
 *
 * The arrows follow the tiles' order, not the grid's rows: Down moves to the
 * next tile, as Right does, the order the tiles are read in. A row is however
 * many tiles fit the width, so moving by row would change with the window,
 * and the radio pattern a screen reader announces says Down is next.
 */
const RadioTileGroup = ({
  options,
  value,
  onChange,
  label,
  helperText,
  errorMessage,
  disabled = false,
  required = false,
  variant = "outlined",
  columns = { base: 2, sm: 3 },
  minTileWidth,
  className,
  optionsClassName,
  tileClassName,
  pictureClassName,
  labelClassName,
  optionLabelClassName,
  descriptionClassName,
  messageClassName,
  onKeyDown,
  "aria-invalid": ariaInvalid,
  ...props
}: RadioTileGroupProps) => {
  useKeyFocus();
  const hasError = !!errorMessage;
  const invalid = isFieldInvalid(hasError, { ...props, "aria-invalid": ariaInvalid });
  const groupProps = withoutInvalidProps(props);
  const resolvedVariant = variant ?? "outlined";

  /* For Home and End, which Headless UI's radio group doesn't take: they
     focus and choose the first and last tile that can be chosen. */
  const tiles = React.useRef(new Map<string, HTMLElement>());
  const choosable = disabled ? [] : options.filter((option) => !option.disabled);
  const onGroupKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
    const target = event.key === "Home" ? choosable[0] : choosable[choosable.length - 1];
    if (!target) return;
    event.preventDefault();
    tiles.current.get(target.value)?.focus();
    if (target.value !== value) onChange(target.value);
  };

  return (
    <HeadlessRadioGroup
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn("rst:font-ui rst:flex rst:flex-col rst:gap-1.5 rst:min-w-0", className)}
      {...groupProps}
      onKeyDown={onGroupKeyDown}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
    >
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
        className={cn(radioTileGroupOptionsVariants({ fit: minTileWidth ? "width" : "columns" }), optionsClassName)}
        style={minTileWidth ? ({ "--rst-tiles-min": minTileWidth } as React.CSSProperties) : columnCounts(columns)}
      >
        {options.map((option) => (
          /* `disabled || option.disabled`, as in `RadioGroup`: Headless UI
             takes the group's state only when the option's is `undefined`. */
          <Field key={option.value} disabled={disabled || option.disabled} className="rst:flex rst:min-w-0">
            <Radio
              as={Tile}
              value={option.value}
              ref={(element: HTMLElement | null) => {
                if (element) tiles.current.set(option.value, element);
                else tiles.current.delete(option.value);
              }}
              className={cn(radioTileVariants({ variant: resolvedVariant }), tileClassName)}
            >
              {option.picture != null && (
                <span aria-hidden="true" className={cn(radioTilePictureVariants({ variant: resolvedVariant }), pictureClassName)}>
                  {option.picture}
                </span>
              )}
              {/* `passive`: the tile itself is what's clicked. A label that
                  clicked its control would click the tile a second time from
                  inside it. */}
              <Label
                as="span"
                passive
                className={cn(
                  "rst:block rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)] rst:[overflow-wrap:anywhere]",
                  "rst:forced-colors:group-data-checked:underline rst:forced-colors:group-data-checked:decoration-2 rst:forced-colors:group-data-checked:underline-offset-4",
                  optionLabelClassName,
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <Description
                  as="span"
                  className={cn("rst:block rst:text-xs rst:text-gray-500 rst:dark:text-gray-400", descriptionClassName)}
                >
                  {option.description}
                </Description>
              )}
            </Radio>
          </Field>
        ))}
      </div>

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

export { RadioTileGroup };
