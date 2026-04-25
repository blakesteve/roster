import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { footerVariants } from "./footer-variants";

export interface FooterLink {
  label: string;
  href: string;
}

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
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    { className, variant, companyName = "Ball Collaborative", links, routerElement, ...props },
    ref,
  ) => {
    const currentYear = new Date().getFullYear();
    const LinkEl = routerElement ?? "a";

    return (
      <footer
        ref={ref}
        className={cn(footerVariants({ variant }), className)}
        {...props}
      >
        <div className="container mx-auto px-4 flex flex-col items-center gap-2">
          {links && links.length > 0 && (
            <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {links.map((link) => (
                <LinkEl
                  key={link.href}
                  href={link.href}
                  to={link.href}
                  className="text-sm text-inherit opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </LinkEl>
              ))}
            </nav>
          )}
          <p className="text-center text-sm font-medium text-inherit">
            © {currentYear} {companyName}, All rights reserved.
          </p>
        </div>
      </footer>
    );
  },
);

Footer.displayName = "Footer";

export { Footer };
