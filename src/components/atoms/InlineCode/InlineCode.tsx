import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { inlineCodeVariants } from "./inline-code-variants";

export interface InlineCodeProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof inlineCodeVariants> {
  children: React.ReactNode;
}

/** Inline `<code>` for identifiers in running prose. Not for code blocks. */
const InlineCode = React.forwardRef<HTMLElement, InlineCodeProps>(
  ({ className, colorScheme, surface, children, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(inlineCodeVariants({ colorScheme, surface }), className)}
      {...props}
    >
      {children}
    </code>
  ),
);

InlineCode.displayName = "InlineCode";

export { InlineCode };
