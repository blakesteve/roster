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
  return (
    <Field
      as="div"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <Label
              passive
              className={cn(
                "text-sm font-medium text-gray-900",
                disabled && "opacity-50",
              )}
            >
              {label}
            </Label>
          )}
          {description && (
            <Description
              className={cn("text-xs text-gray-500", disabled && "opacity-50")}
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
        aria-label={ariaLabel}
        className={cn(switchTrackVariants({ variant, size }))}
      >
        <span className="sr-only">
          {label || ariaLabel || "Toggle setting"}
        </span>
        <span
          aria-hidden="true"
          className={cn(switchThumbVariants({ size }))}
        />
      </HeadlessSwitch>
    </Field>
  );
};

export { Switch };
