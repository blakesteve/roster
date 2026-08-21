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
  className?: string;
  ariaLabel?: string;
}

const Switch = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size,
  variant,
  className,
  ariaLabel,
}: SwitchProps) => {
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
              passive
              className={cn(
                "rst:text-sm rst:font-medium rst:text-gray-900 rst:dark:text-gray-100",
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
