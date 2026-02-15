import React from "react";
import { type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../../lib/utils";
import { linkVariants } from "./link-variants";

interface LinkBaseProps extends VariantProps<typeof linkVariants> {
  children: React.ReactNode;
  external?: boolean;
  showExternalIcon?: boolean;
  className?: string;
}

type LinkProps<C extends React.ElementType> = LinkBaseProps & {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof LinkBaseProps | "as">;

export const Link = <C extends React.ElementType = "a">({
  as,
  className,
  variant,
  underline,
  size,
  external,
  showExternalIcon,
  children,
  ...props
}: LinkProps<C>) => {
  const Component = as || "a";

  const href = (props as any).href;
  const isExternal =
    external || (typeof href === "string" && href.startsWith("http"));

  // If showExternalIcon is explicitly defined (true/false), use it.
  // Otherwise, default to showing it only if the link is external.
  const shouldShowIcon = showExternalIcon ?? isExternal;

  const commonClasses = cn(
    linkVariants({ variant, underline, size }),
    className,
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={commonClasses}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
        {shouldShowIcon && (
          <FontAwesomeIcon
            icon={faExternalLinkAlt}
            className="ml-0.5 h-3 w-3"
            data-testid="external-icon"
          />
        )}
      </a>
    );
  }

  return (
    <Component className={commonClasses} {...props}>
      {children}
      {/* We allow showing the icon even on internal links if explicitly requested */}
      {shouldShowIcon && (
        <FontAwesomeIcon
          icon={faExternalLinkAlt}
          className="ml-1 h-3 w-3 opacity-70"
          data-testid="external-icon"
        />
      )}
    </Component>
  );
};
