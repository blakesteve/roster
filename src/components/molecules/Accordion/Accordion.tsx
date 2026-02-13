import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import { Disclosure } from "../../atoms/Disclosure/Disclosure";

export interface AccordionItem {
  id: string | number;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  variant?: "soft" | "filled" | "outline" | "ghost";
  className?: string;
  showDividers?: boolean;
  defaultOpenIds?: (string | number)[];
}

const Accordion = ({
  items,
  allowMultiple = false,
  variant = "soft",
  className,
  showDividers = false,
  defaultOpenIds = [],
}: AccordionProps) => {
  // We track open items by their ID
  const [openItems, setOpenItems] = useState<Set<string | number>>(
    new Set(defaultOpenIds),
  );

  const handleToggle = (id: string | number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      const isCurrentlyOpen = next.has(id);

      if (allowMultiple) {
        if (isCurrentlyOpen) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        if (!isCurrentlyOpen) next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative">
          {showDividers && index > 0 && (
            <div className="mx-4 h-px bg-gray-200/50 mb-1" />
          )}

          <Disclosure
            title={item.title}
            variant={variant}
            isOpen={openItems.has(item.id)}
            onToggle={() => handleToggle(item.id)}
          >
            {item.content}
          </Disclosure>
        </div>
      ))}
    </div>
  );
};

export { Accordion };
