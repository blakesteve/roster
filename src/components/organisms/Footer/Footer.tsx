import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { footerVariants } from "./footer-variants";

export interface FooterProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof footerVariants> {
  /** * The company name to display in the copyright notice.
   * @default "Ball Collaborative"
   */
  companyName?: string;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    { className, variant, companyName = "Ball Collaborative", ...props },
    ref,
  ) => {
    const currentYear = new Date().getFullYear();

    return (
      <footer
        ref={ref}
        className={cn(footerVariants({ variant }), className)}
        {...props}
      >
        <div className="container mx-auto px-4">
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
