import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { eyebrowVariants } from "./eyebrow-variants";

type EyebrowOwnProps<E extends React.ElementType> = VariantProps<
  typeof eyebrowVariants
> & {
  children: React.ReactNode;
  /**
   * Element to render. Defaults to `span` so it stays inline and carries no
   * heading semantics: an eyebrow labels a section, it is not the heading.
   *
   * Props follow the element. `as="a"` accepts `href`, `target`, and `rel`;
   * `as="label"` accepts `htmlFor`. An eyebrow that renders a link should not
   * have to be wrapped in one to get an href.
   */
  as?: E;
};

export type EyebrowProps<E extends React.ElementType = "span"> =
  EyebrowOwnProps<E> &
    Omit<React.ComponentPropsWithRef<E>, keyof EyebrowOwnProps<E>>;

/**
 * Written as a plain generic function rather than through `forwardRef`: that
 * helper's return type is not generic, so the element type collapses the
 * moment it passes through and `as="a"` stops admitting `href` — the exact bug
 * this signature exists to fix. React 19 passes `ref` as an ordinary prop, so
 * the wrapper buys nothing here anyway; `ref` rides along in `...props` and
 * lands on whatever element `as` selected.
 */
function Eyebrow<E extends React.ElementType = "span">({
  as,
  className,
  size,
  tone,
  weight,
  children,
  ...props
}: EyebrowProps<E>) {
  const Component = (as ?? "span") as React.ElementType;

  return (
    <Component
      className={cn(eyebrowVariants({ size, tone, weight }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}

Eyebrow.displayName = "Eyebrow";

export { Eyebrow };
