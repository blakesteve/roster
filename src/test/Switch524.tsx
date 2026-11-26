import {
  Switch as HeadlessSwitch,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { switchTrackVariants, switchThumbVariants } from "../components/atoms/Switch/switch-variants";

/**
 * Switch as 5.24 drew it, for checks that compare it with the one whose track
 * drops under long text, in the same page, engine and fonts: `Switch.tsx` at
 * 5.24.0, its docs cut. Test-only: `src/test` is outside the package.
 */
export interface Switch524Props extends VariantProps<typeof switchTrackVariants> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  labelClickable?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Switch524 = ({
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
}: Switch524Props) => {
  const computedAriaLabel = !label ? ariaLabel || "Toggle setting" : undefined;

  return (
    <Field
      as="div"
      className={cn("rst:flex rst:items-center rst:justify-between rst:gap-4", className)}
    >
      {(label || description) && (
        <span className="rst:flex rst:flex-col">
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

