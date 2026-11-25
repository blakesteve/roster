import type { CSSProperties, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../lib/utils";
import { Link } from "../components/atoms/Link/Link";
import { Button } from "../components/atoms/Button/Button";

/**
 * Navbar's bar and menu panel as 5.23 drew them, for checks that compare the
 * reflowing Navbar with them in the same page, engine and fonts: the markup
 * and classes copied from `Navbar.tsx` at 5.23.0, with what the layout can't
 * read (the Popover, the user menu) left out. Test-only: `src/test` is
 * outside the package.
 */
export interface Brand523 {
  logoSrc: string;
  logoStyle: CSSProperties;
  /** A logo given its own width or height, fitted rather than square. */
  logoFree?: boolean;
  logoClassName?: string;
  brandName: string;
  brandElement?: ReactNode;
}
type Item = { label: string; path: string };

const Logo = ({ logoSrc, logoStyle, logoFree, logoClassName }: Brand523) => (
  <img
    src={logoSrc}
    alt=""
    style={logoStyle}
    className={cn("rst:shrink-0", logoFree && "rst:object-contain rst:object-left rst:rtl:object-right", logoClassName ?? "rst:rounded-md")}
  />
);

export function Bar523({ items, ...brand }: Brand523 & { items: Item[] }) {
  return (
    <nav className="rst:font-ui rst:w-full rst:z-30 rst:border-b rst:transition-colors rst:duration-200 rst:z-50 rst:static" data-bar523="">
      <div className="rst:container rst:mx-auto rst:flex rst:items-center rst:justify-between rst:px-4 rst:h-16">
        <Link href="#" variant="neutral" underline="none" className="rst:flex rst:items-center rst:gap-3 rst:transition-opacity rst:text-gray-900 rst:dark:text-gray-900 rst:hover:text-gray-600 rst:dark:hover:text-gray-600">
          <Logo {...brand} />
          {brand.brandElement ?? <span className="rst:text-xl rst:font-bold rst:tracking-tight">{brand.brandName}</span>}
        </Link>
        <div className="rst:hidden rst:md:flex rst:items-center rst:gap-8">
          <div className="rst:flex rst:items-center rst:gap-6">
            {items.map((item) => (
              <Link key={item.path} href="#" variant="neutral" underline="none" className="rst:inline-flex rst:items-center rst:gap-1.5 rst:text-sm rst:transition-colors rst:duration-200">
                {item.label}
              </Link>
            ))}
          </div>
          <Button size="sm" variant="solid" colorScheme="primary">
            Log In
          </Button>
        </div>
        <div className="rst:flex rst:md:hidden" data-hamburger523="">
          <button type="button" className="rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2">
            <div className="rst:relative">
              <FontAwesomeIcon icon={faBars} className="rst:block rst:h-6 rst:w-6" aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Panel523({ items, ...brand }: Brand523 & { items: Item[] }) {
  return (
    <div className="rst:font-ui rst:p-2" data-panel523="">
      <div className="rst:rounded-lg rst:divide-y rst:divide-gray-100 rst:bg-white" data-card523="">
        <div className="rst:px-5 rst:pt-5 rst:pb-6">
          <div className="rst:flex rst:items-center rst:justify-between">
            <div className="rst:flex rst:items-center rst:gap-3">
              <Logo {...brand} />
              {brand.brandElement ?? <span className="rst:font-bold rst:text-gray-900 rst:dark:text-white">{brand.brandName}</span>}
            </div>
            <div className="rst:-mr-2">
              <button type="button" className="rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2" data-close523="">
                <FontAwesomeIcon icon={faXmark} className="rst:h-6 rst:w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="rst:mt-6">
            <div className="rst:grid rst:gap-y-4">
              {items.map((item) => (
                <Link key={item.path} href="#" variant="neutral" underline="none" className="rst:-m-3 rst:flex rst:items-center rst:rounded-md rst:p-3 rst:transition-colors">
                  <span className="rst:ml-3 rst:inline-flex rst:items-center rst:gap-1.5 rst:text-base rst:font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="rst:py-6 rst:px-5 rst:space-y-4">
          <Button variant="solid" colorScheme="primary" className="rst:w-full rst:justify-center">
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
}
