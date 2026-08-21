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
    <div className={cn("rst:w-full rst:flex rst:flex-col", className)} {...props}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={isOpen}
        className={cn(
          disclosureTriggerVariants({ variant }),
          // Dynamic rounding and border fix
          isOpen ? "rst:rounded-t-md rst:rounded-b-none" : "rst:rounded-md",
          // If it's the outline variant and it's open, remove the bottom border so it merges seamlessly with the content box
          isOpen &&
            variant === "outline" &&
            "rst:border-b-transparent rst:dark:border-b-transparent",
        )}
      >
        <span className="rst:flex-1 rst:text-left rst:text-inherit">{title}</span>
        <span
          className={cn(
            "rst:ml-2 rst:flex rst:items-center rst:transition-transform rst:duration-200 rst:text-inherit",
            isOpen ? "rst:rotate-180" : "",
          )}
        >
          {icon || (
            <FontAwesomeIcon
              icon={faChevronDown}
              className="rst:h-3.5 rst:w-3.5 rst:opacity-60"
            />
          )}
        </span>
      </button>

      {/* CONTENT PANEL (With Transition) */}
      <Transition
        show={isOpen}
        enter="rst:transition rst:duration-100 rst:ease-out"
        enterFrom="rst:transform rst:scale-95 rst:opacity-0"
        enterTo="rst:transform rst:scale-100 rst:opacity-100"
        leave="rst:transition rst:duration-75 rst:ease-out"
        leaveFrom="rst:transform rst:scale-100 rst:opacity-100"
        leaveTo="rst:transform rst:scale-95 rst:opacity-0"
      >
        <div
          className={cn(disclosureContentVariants({ variant }), "rst:rounded-b-md")}
        >
          {children}
        </div>
      </Transition>
    </div>
  );
};

export { Disclosure };
