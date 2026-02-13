import React, { useEffect, useRef } from "react";
import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import {
  disclosureTriggerVariants,
  disclosureContentVariants,
} from "./disclosure-variants";

const DisclosureStateListener = ({
  isOpen,
  onChange,
}: {
  isOpen: boolean;
  onChange?: (isOpen: boolean) => void;
}) => {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current?.(isOpen);
  }, [isOpen]);

  return null;
};

export interface DisclosureProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof disclosureTriggerVariants> {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onStateChange?: (isOpen: boolean) => void;
  icon?: React.ReactNode;
}

const Disclosure = ({
  title,
  children,
  variant,
  className,
  defaultOpen = false,
  onStateChange,
  icon,
  ...props
}: DisclosureProps) => {
  return (
    <HeadlessDisclosure
      as="div"
      className={cn("w-full", className)}
      defaultOpen={defaultOpen}
      {...props}
    >
      {({ open }) => (
        <>
          <DisclosureStateListener isOpen={open} onChange={onStateChange} />

          <DisclosureButton
            className={cn(
              disclosureTriggerVariants({ variant }),
              // Logic: Flatten bottom corners if open so it merges with panel
              open ? "rounded-t-md rounded-b-none" : "rounded-md",
            )}
          >
            <span className="flex-1">{title}</span>
            <span
              className={cn(
                "ml-2 flex items-center transition-transform duration-200",
                open ? "rotate-180" : "",
              )}
            >
              {icon || (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="h-3.5 w-3.5 opacity-60"
                />
              )}
            </span>
          </DisclosureButton>

          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <DisclosurePanel
              className={cn(
                disclosureContentVariants({ variant }),
                "rounded-b-md",
              )}
            >
              {children}
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </HeadlessDisclosure>
  );
};

export { Disclosure };
