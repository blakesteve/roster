import React, { useState } from "react";
import { Transition } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import {
  disclosureTriggerVariants,
  disclosureContentVariants,
} from "./disclosure-variants";

export interface DisclosureProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "onToggle">,
    VariantProps<typeof disclosureTriggerVariants> {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  icon?: React.ReactNode;
}
const Disclosure = ({
  title,
  children,
  variant,
  className,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  icon,
  ...props
}: DisclosureProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClick = () => {
    const nextState = !isOpen;

    if (controlledOpen === undefined) {
      setInternalOpen(nextState);
    }

    onToggle?.(nextState);
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={isOpen}
        className={cn(
          disclosureTriggerVariants({ variant }),
          // Dynamic rounding: flatten bottom if open
          isOpen ? "rounded-t-md rounded-b-none" : "rounded-md",
        )}
      >
        <span className="flex-1 text-left">{title}</span>
        <span
          className={cn(
            "ml-2 flex items-center transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          )}
        >
          {icon || (
            <FontAwesomeIcon
              icon={faChevronDown}
              className="h-3.5 w-3.5 opacity-60"
            />
          )}
        </span>
      </button>

      {/* CONTENT PANEL (With Transition) */}
      <Transition
        show={isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <div
          className={cn(disclosureContentVariants({ variant }), "rounded-b-md")}
        >
          {children}
        </div>
      </Transition>
    </div>
  );
};

export { Disclosure };
