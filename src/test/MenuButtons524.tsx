import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

/**
 * Navbar's menu button and the menu's close button as 5.24 drew them, for the
 * checks of their rings: the same Headless UI PopoverButtons with 5.24's
 * classes, the panel taking focus when it opens as Navbar's does. Read through
 * `navbar-rings.ts`. Test-only: `src/test` is outside the package.
 */
export function MenuButtons524() {
  return (
    <Popover>
      <button type="button" data-rings524-before="">
        Before
      </button>
      <PopoverButton
        data-rings524-menu=""
        className="rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2 rst:cursor-pointer rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background"
      >
        Open 5.24
      </PopoverButton>
      <PopoverPanel focus>
        <PopoverButton
          data-rings524-close=""
          className="rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2 rst:cursor-pointer rst:text-gray-400 rst:hover:bg-gray-100 rst:dark:hover:bg-gray-700 rst:hover:text-gray-500 rst:dark:hover:text-white rst:focus:outline-hidden"
        >
          Close 5.24
        </PopoverButton>
      </PopoverPanel>
    </Popover>
  );
}
