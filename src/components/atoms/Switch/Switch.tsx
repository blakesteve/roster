import {
  Switch as HeadlessSwitch,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { switchTrackVariants, switchThumbVariants } from "./switch-variants";

export interface SwitchProps extends VariantProps<typeof switchTrackVariants> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  /**
   * Whether clicking the label toggles the switch, as clicking any other
   * control's label does. On by default.
   *
   * Turn it off when an ancestor already has a click handler of its own that
   * toggles. With both, one click on the label reaches that handler twice
   * (the label's click, then the one forwarded to the switch, both bubbling)
   * and `onChange` once.
   */
  labelClickable?: boolean;
  className?: string;
  ariaLabel?: string;
}

const Switch = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  labelClickable = true,
  size,
  variant,
  className,
  ariaLabel,
}: SwitchProps) => {
  const computedAriaLabel = !label ? ariaLabel || "Toggle setting" : undefined;
  const hasText = Boolean(label || description);

  return (
    <Field
      as="div"
      className={cn(
        "rst:flex rst:items-center rst:justify-between",
        /* When the text's longest word can't sit beside the track, the track
           drops under it, at the start, rather than the word breaking. */
        hasText ? "rst:flex-wrap rst:gap-x-4 rst:gap-y-2" : "rst:gap-4",
        className,
      )}
    >
      {hasText && (
        /* As wide as its words up to their one line, and no narrower than
           their longest word while the track is beside it: the label's box,
           and so what a click on it reaches, is what it was wherever it fits.
           A word too long for the whole row breaks. */
        <span className="rst:flex rst:min-w-0 rst:max-w-max rst:flex-col rst:wrap-break-word rst:[flex:1_1_min-content]">
          {label && (
            <Label
              /* Passive drops the label's `for` and its click handler, which
                 left the track as the only target on a row the reader sees as
                 one object. Headless UI's handler toggles once and refuses a
                 disabled switch. */
              passive={!labelClickable}
              className={cn(
                "rst:text-sm rst:font-medium rst:text-gray-900 rst:dark:text-gray-100",
                labelClickable && !disabled && "rst:cursor-pointer",
                disabled && "rst:opacity-50",
              )}
            >
              {label}
            </Label>
          )}
          {description && (
            <Description
              className={cn(
                "rst:text-xs rst:text-gray-500 rst:dark:text-gray-400",
                disabled && "rst:opacity-50",
              )}
            >
              {description}
            </Description>
          )}
        </span>
      )}

      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={computedAriaLabel}
        className={cn(switchTrackVariants({ variant, size }))}
      >
        <span
          aria-hidden="true"
          className={cn(switchThumbVariants({ size }))}
        />
      </HeadlessSwitch>
    </Field>
  );
};

export { Switch };
