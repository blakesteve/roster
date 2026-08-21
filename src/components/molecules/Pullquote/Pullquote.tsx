import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { pullquoteVariants } from "./pullquote-variants";

export interface PullquoteProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, "cite">,
    VariantProps<typeof pullquoteVariants> {
  children: React.ReactNode;
  /**
   * Attribution, rendered beneath the quote. Works as a source ("Why it took a
   * while to spot") as well as a speaker.
   */
  cite?: React.ReactNode;
  /** URL for the quote's source, passed to the underlying blockquote. */
  citeUrl?: string;
}

/**
 * A line lifted out of running prose and given room.
 *
 * Uses `<figure>` + `<blockquote>` + `<figcaption>` rather than a styled div:
 * that is the pairing the HTML spec has for quote-with-attribution, and it
 * keeps the citation associated with the quote for assistive tech.
 */
const Pullquote = React.forwardRef<HTMLElement, PullquoteProps>(
  ({ children, cite, citeUrl, variant, colorScheme, className, ...props }, ref) => (
    <figure
      ref={ref}
      className={cn(pullquoteVariants({ variant, colorScheme }), className)}
      {...props}
    >
      <blockquote
        cite={citeUrl}
        className="rst:m-0 rst:max-w-[48ch] rst:text-[1.03125rem] rst:leading-[1.5] rst:text-gray-900 rst:dark:text-gray-100"
      >
        {children}
      </blockquote>
      {cite && (
        <figcaption className="rst:mt-[7px] rst:font-mono rst:text-[0.625rem] rst:uppercase rst:leading-none rst:tracking-[0.14em] rst:text-gray-500 rst:dark:text-gray-400">
          {cite}
        </figcaption>
      )}
    </figure>
  ),
);

Pullquote.displayName = "Pullquote";

export { Pullquote };
