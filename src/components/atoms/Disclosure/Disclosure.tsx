import React, { useId, useState } from "react";
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

  /* `aria-controls` may only name an element that exists, and `Transition`
     unmounts the panel once it has finished closing. So the panel counts as
     mounted from the moment it opens until its leave transition ends, and the
     button points at it for exactly that long. Adjusted during render rather
     than in an effect, so the attribute and the panel arrive together. */
  const panelId = useId();
  const [panelMounted, setPanelMounted] = useState(isOpen);
  if (isOpen && !panelMounted) setPanelMounted(true);

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
        aria-controls={panelMounted ? panelId : undefined}
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
            "rst:ml-2 rst:flex rst:items-center rst:transition-transform rst:duration-200 rst:motion-reduce:transition-none rst:text-inherit",
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

      {/* CONTENT PANEL (With Transition)

          The scale is `motion-safe:` only, so under `prefers-reduced-motion`
          the panel fades and does not grow. `motion-safe:` rather than a
          `motion-reduce:` override, because an override is two rules for one
          property and which wins then rests on how the stylesheet happens to
          order its variants. The chevron above flips without turning, for the
          same reason, by the other route: its `motion-reduce:transition-none`
          overrides a utility with no variant, and Tailwind always emits
          variant rules after those, so that pair has only one winner. */}
      <Transition show={isOpen} afterLeave={() => setPanelMounted(false)}>
        <div
          id={panelId}
          data-testid="disclosure-panel"
          className={cn(
            disclosureContentVariants({ variant }),
            "rst:rounded-b-md",
            "rst:transition rst:duration-100 rst:ease-out rst:data-leave:duration-75",
            "rst:data-closed:opacity-0 rst:motion-safe:data-closed:scale-95",
          )}
        >
          {children}
        </div>
      </Transition>
    </div>
  );
};

export { Disclosure };
