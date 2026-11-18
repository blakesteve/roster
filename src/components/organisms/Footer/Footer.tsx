import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { withLabels } from "../../../lib/labels";
import { footerVariants } from "./footer-variants";

export interface FooterLink {
  label: string;
  href: string;
}

/** Every word Footer shows or says of its own. Pass any of them in `labels` to replace it. */
export interface FooterLabels {
  /** The link row's name. */
  nav: string;
  /** The copyright line. */
  copyright: (year: number, companyName: string) => string;
}

const LABELS: FooterLabels = {
  nav: "Footer navigation",
  copyright: (year, companyName) => `© ${year} ${companyName}, All rights reserved.`,
};

export interface FooterProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof footerVariants> {
  /**
   * The company name to display in the copyright notice.
   * @default "Ball Collaborative"
   */
  companyName?: string;
  /**
   * Optional navigation links rendered as a row above the copyright line.
   * Useful for pages like Privacy Policy, Contact, Terms, etc.
   */
  links?: FooterLink[];
  /**
   * Router-aware link element (e.g. Next.js `Link`). When provided, each
   * footer link is rendered with this element instead of a plain `<a>` tag.
   */
  routerElement?: React.ElementType;
  /** The component's own words, replaced; any left out stay English. */
  labels?: Partial<FooterLabels>;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    { className, variant, companyName = "Ball Collaborative", links, routerElement, labels, ...props },
    ref,
  ) => {
    const currentYear = new Date().getFullYear();
    const l = withLabels(LABELS, labels);
    const LinkEl = routerElement ?? "a";

    return (
      <footer
        ref={ref}
        className={cn(footerVariants({ variant }), className)}
        {...props}
      >
        <div className="rst:container rst:mx-auto rst:px-4 rst:flex rst:flex-col rst:items-center rst:gap-2">
          {links && links.length > 0 && (
            <nav aria-label={l.nav} className="rst:flex rst:flex-wrap rst:justify-center rst:gap-x-5 rst:gap-y-1">
              {links.map((link) => (
                <LinkEl
                  key={link.href}
                  href={link.href}
                  to={link.href}
                  /* The variant's text at full strength, as the copyright
                     line beside it: at 70% they painted 3.04:1. The
                     copyright's weight keeps the two apart. Hover underlines,
                     and focus draws Roster's ring, as `Link` does. */
                  className="rst:text-sm rst:text-inherit rst:rounded-sm rst:underline-offset-4 rst:hover:underline rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
                >
                  {link.label}
                </LinkEl>
              ))}
            </nav>
          )}
          <p className="rst:text-center rst:text-sm rst:font-medium rst:text-inherit">
            {l.copyright(currentYear, companyName)}
          </p>
        </div>
      </footer>
    );
  },
);

Footer.displayName = "Footer";

export { Footer };
