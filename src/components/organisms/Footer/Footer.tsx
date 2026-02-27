import React from "react";
import { cn } from "../../../lib/utils";

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  /** * The company name to display in the copyright notice.
   * @default "Ball Collaborative"
   */
  companyName?: string;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, companyName = "Ball Collaborative", ...props }, ref) => {
    const currentYear = new Date().getFullYear();

    return (
      <footer
        ref={ref}
        className={cn("w-full py-4 mt-auto", className)}
        {...props}
      >
        <p
          className={cn(
            "text-center text-xs text-gray-100",
            className && "text-inherit",
          )}
        >
          © {currentYear} {companyName}, All rights reserved.
        </p>
      </footer>
    );
  },
);

Footer.displayName = "Footer";

export { Footer };
