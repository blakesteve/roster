import { forwardRef, useEffect, useRef, type ComponentProps } from "react";
import { Checkbox as HeadlessCheckbox } from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { checkboxVariants } from "./checkbox-variants";

export interface CheckboxProps
  extends
    Omit<ComponentProps<typeof HeadlessCheckbox>, "className" | "children">,
    Omit<VariantProps<typeof checkboxVariants>, "checked"> {
  className?: string;
  /** Set to true to display a dash instead of a checkmark */
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLElement, CheckboxProps>(
  (
    {
      className,
      colorScheme = "primary",
      variant = "solid",
      size = "md",
      indeterminate = false,
      ...props
    },
    forwardedRef,
  ) => {
    const iconSizeClasses = {
      sm: "w-2.5 h-2.5",
      md: "w-3 h-3",
      lg: "w-4 h-4",
    };

    const internalRef = useRef<HTMLElement>(null);

    const setRefs = (node: HTMLElement | null) => {
      internalRef.current = node as HTMLElement;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    useEffect(() => {
      if (indeterminate && internalRef.current) {
        internalRef.current.setAttribute("aria-checked", "mixed");
      }
    }, [indeterminate, props.checked]);

    return (
      <HeadlessCheckbox
        ref={setRefs}
        {...props}
        className={({
          checked,
          disabled,
        }: {
          checked: boolean;
          disabled: boolean;
        }) =>
          cn(
            checkboxVariants({
              colorScheme,
              variant,
              size,
              checked: checked || indeterminate,
            }),
            disabled || props.disabled ? "rst:opacity-50" : "rst:cursor-pointer",
            className,
          )
        }
      >
        {({ checked }: { checked: boolean }) => (
          <FontAwesomeIcon
            icon={indeterminate ? faMinus : faCheck}
            className={cn(
              "rst:pointer-events-none rst:transition-opacity rst:duration-200",
              checked || indeterminate ? "rst:opacity-100" : "rst:opacity-0",
              iconSizeClasses[size as keyof typeof iconSizeClasses],
            )}
          />
        )}
      </HeadlessCheckbox>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
