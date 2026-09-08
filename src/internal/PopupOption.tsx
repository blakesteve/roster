import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../lib/utils";
import { selectOptionVariants } from "../components/atoms/Select/select-variants";

/**
 * One row in an anchored popup: the label, truncated, and the check mark that
 * marks it selected.
 *
 * Extracted because it was copy-pasted between `Select` and `Combobox` and the
 * rendered markup was byte-identical — which is the definition of the thing
 * this module exists to hold. The README claimed the option rows were already
 * shared before they were; this is that claim becoming true.
 *
 * It takes the Headless UI option component rather than importing one, because
 * `ListboxOption` and `ComboboxOption` are different components with the same
 * shape, and the alternative is this module knowing which caller it has.
 */
export function PopupOption({
  as: Option,
  value,
  disabled,
  size,
  children,
}: {
  as: React.ElementType;
  value: string | number;
  disabled?: boolean;
  size?: "sm" | "default" | "lg" | null;
  children: React.ReactNode;
}) {
  return (
    <Option
      value={value}
      disabled={disabled}
      className={cn(selectOptionVariants({ size }))}
    >
      <span className="rst:block rst:truncate rst:font-normal rst:group-data-selected:font-semibold">
        {children}
      </span>
      <span
        className={cn(
          "rst:absolute rst:inset-y-0 rst:right-0 rst:hidden rst:items-center rst:text-primary-600 rst:dark:text-primary-400 rst:group-data-selected:flex",
          size === "sm" ? "rst:pr-3" : "rst:pr-4",
        )}
      >
        <FontAwesomeIcon icon={faCheck} className="rst:h-3.5 rst:w-3.5" />
      </span>
    </Option>
  );
}
