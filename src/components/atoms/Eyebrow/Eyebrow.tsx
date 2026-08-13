import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { eyebrowVariants } from "./eyebrow-variants";

export interface EyebrowProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof eyebrowVariants> {
  children: React.ReactNode;
  /**
   * Element to render. Defaults to `span` so it stays inline and carries no
   * heading semantics: an eyebrow labels a section, it is not the heading.
   */
  as?: React.ElementType;
}

const Eyebrow = React.forwardRef<HTMLElement, EyebrowProps>(
  ({ as: Component = "span", className, size, tone, weight, children, ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(eyebrowVariants({ size, tone, weight }), className)}
      {...props}
    >
      {children}
    </Component>
  ),
);

Eyebrow.displayName = "Eyebrow";

export { Eyebrow };
