import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  TransitionChild,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { lockPage } from "../../../internal/page-inert";

const dialogVariants = /* @__PURE__ */ cva(
  "rst:relative rst:w-full rst:transform rst:overflow-hidden rst:rounded-2xl rst:p-6 rst:text-left rst:align-middle rst:elevation-overlay rst:transition-all rst:border",
  {
    variants: {
      size: {
        xs: "rst:max-w-xs",
        sm: "rst:max-w-sm",
        md: "rst:max-w-md",
        lg: "rst:max-w-lg",
        xl: "rst:max-w-xl",
        "2xl": "rst:max-w-2xl",
        "3xl": "rst:max-w-3xl",
        full: "rst:max-w-[95vw] rst:m-4",
      },
      variant: {
        /* `white` is the neutral surface, so it is the one that reads
           `--roster-popover-*`. The tokens default to exactly the values this
           variant already used, in both schemes, so nothing moves for a
           consumer who sets none of them. The other three name a specific
           surface and stay opinionated — a token that meant something
           different inside each name would not be a token. */
        white:
          "rst:bg-[var(--roster-popover-bg)] rst:border-[var(--roster-popover-border)] rst:text-[var(--roster-popover-text)]",
        /* These two carry their own ring, because they are the two that invert.
           `--roster-ring` and `--roster-ring-offset` are declared once at
           `:root` and once under `.dark`, so they follow the PAGE — and on a
           light page that hands a dark panel the light-mode ring, primary-500
           on gray-700: 1.61:1, which is not a focus indicator. A consumer found
           it by saying the focus "was just not noticeable".

           So the variant states what it knows: it is dark regardless of the
           page. primary-400 gives 3.80 on the light-mode slate and 6.47 on the
           dark one, 4.04 and 6.75 on `primary`. The offset is set to each
           surface's own color so the gap between border and ring reads as a
           gap rather than as a stray white or black line — the offset was the
           most visible part of the indicator before, at 10.27:1 against slate
           while the ring itself sat at 1.61.

           The `--roster-control-*` trio rides along for the same reason, and
           fixing only the ring would have been worse than fixing neither: an
           `outline` field on these panels draws `--roster-control-text`, which
           is `:root`'s gray-900 on a light page — 1.70:1 on slate, 1.60:1 on
           primary. That has been true of `Input` since 4.8.0 and was about to
           become true of `Textarea`, which previously drew its own white box
           and so escaped it. A correct focus ring around illegible text is not
           an improvement. Inverted values give 9.42 / 16.03 for the text and
           4.07 / 6.93 for the border.

           `white` and `glass` are not here on purpose: both follow the page's
           scheme, so the page-level tokens are already right for them.

           `primary`'s text is its fill's ink token, as on every other solid
           fill, so a light primary gets dark text. Dark stays white: that
           fill is primary-950, which has no ink token. */
        slate:
          "rst:bg-gray-700 rst:border-gray-600 rst:text-gray-100 rst:dark:bg-gray-900 rst:dark:border-gray-800 rst:[--roster-ring:var(--roster-primary-400,#5ea3de)] rst:[--roster-ring-offset:var(--roster-gray-700,#44403c)] rst:dark:[--roster-ring-offset:var(--roster-gray-900,#1c1917)] rst:[--roster-control-text:var(--roster-gray-100,#f5f5f4)] rst:[--roster-control-border:var(--roster-gray-400,#a8a29e)] rst:[--roster-control-border-focus:var(--roster-primary-400,#5ea3de)]",
        primary:
          "rst:bg-primary-700 rst:border-primary-600 rst:text-primary-700-ink rst:dark:text-white rst:dark:bg-primary-950 rst:dark:border-primary-900 rst:[--roster-ring:var(--roster-primary-400,#5ea3de)] rst:[--roster-ring-offset:var(--roster-primary-700,#084063)] rst:dark:[--roster-ring-offset:var(--roster-primary-950,#021724)] rst:[--roster-control-text:var(--roster-gray-100,#f5f5f4)] rst:[--roster-control-border:var(--roster-gray-400,#a8a29e)] rst:[--roster-control-border-focus:var(--roster-primary-400,#5ea3de)]",
        glass:
          "rst:bg-white/80 rst:border-white/20 rst:backdrop-blur-xl rst:text-gray-900 rst:dark:bg-slate-900/80 rst:dark:border-slate-700/50 rst:dark:text-white",
      },
      status: {
        default: "",
        destructive: "rst:border-t-4 rst:border-t-error-500",
        success: "rst:border-t-4 rst:border-t-success-500",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "white",
      status: "default",
    },
  },
);

const titleVariants = /* @__PURE__ */ cva("rst:text-xl rst:font-bold rst:leading-6 rst:text-inherit");

const descriptionVariants = /* @__PURE__ */ cva("rst:mt-1 rst:text-sm rst:text-inherit rst:opacity-75");

/* `size-11` plus `-m-3` is the touch-target fix, and the two halves are not
   separable. The button has no fill of its own and wrapped nothing but the
   glyph, so it was a 20x16 target in the corner of a modal — the least
   accurate place a thumb lands, on the control that leaves the modal.
   `size-11` takes it to 44x44 at no visual cost, and the negative margin hands
   back a 20x20 layout box so the header row is laid out as it was.

   An explicit size rather than padding, because padding would measure the
   glyph and the glyph does not measure what its classes say. Font Awesome
   injects `.svg-inline--fa { height: 1em; width: var(--fa-width, 1.25em) }` as
   an unlayered rule at runtime, and unlayered beats layered, so Roster's
   `h-5 w-5` on the icon is inert: it renders 20x16, not 20x20. A padded button
   inherits that asymmetry and lands at 44x40. A sized one can not.

   The overhang stays inside the panel's own `p-6` on three sides and inside
   the header's `ml-4` on the fourth, so it reaches no content and nothing
   clips it. The header row is unaffected in both axes: the 20px box is the
   width the glyph already occupied, and the title's own line box is taller
   than 20px at every size, so the row's height was never this button's to set.
   The one visible change is the focus ring, which now traces the target a
   keyboard user is operating rather than the glyph inside it.

   `cursor-pointer` is not decoration here. Nothing in the stack sets a cursor
   on a `button`: Tailwind's preflight has no `cursor` rule for one, Roster's
   own opt-in preflight has none either, and Roster's stylesheet ships no
   global reset at all. So the cursor was the UA's `default`, or whatever the
   host app's reset happened to say — inconsistent between consumers rather
   than uniformly wrong, which is the harder version to notice. */
const closeVariants = /* @__PURE__ */ cva(
  "rst:inline-flex rst:size-11 rst:shrink-0 rst:items-center rst:justify-center rst:-m-3 rst:cursor-pointer rst:rounded-md rst:bg-transparent rst:text-inherit rst:opacity-50 rst:hover:opacity-100 rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background rst:transition-opacity",
);

export interface DialogProps extends VariantProps<typeof dialogVariants> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /**
   * Called once the dialog has finished closing, after its leave transition.
   * The place to move focus somewhere other than where it was before the
   * dialog opened, for instance when that element no longer exists. Not
   * called for a close cut short by reopening, nor when the dialog unmounts
   * while open.
   */
  onAfterClose?: () => void;
}

const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  size,
  variant,
  status,
  children,
  className,
  onAfterClose,
}: DialogProps) => {
  /* `open` goes to Headless UI's Dialog itself. It used to come from an outer
     `<Transition show={isOpen}>`, and wrapped that way Headless UI 2.2.9 marks
     nothing behind the dialog `inert` or `aria-hidden`: the focus trap held,
     but a screen reader's virtual cursor could walk out onto the page. The
     helper Headless UI uses to find the page is mounted by `Dialog`; under an
     outer Transition it mounted only as the dialog opened, too late for the
     code that makes the page inert.

     `mounted` keeps a dialog that is open on its first render closed for that
     one render, and opens it in a layout effect, before anything is painted.
     To Headless UI that is an ordinary open, so it animates in the way the
     outer Transition's `appear` used to make it. Without it, Headless UI paints
     the dialog at rest first and starts the enter a frame later, a visible
     flicker; and the page-finding helper again resolves too late in React's
     StrictMode. A layout effect, not an ordinary effect or a frame, so the
     dialog is in the document as soon as the render that opened it is done. */
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    /* The one extra render is the point: it is what turns the first render's
       open into a closed-to-open change Headless UI animates. */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-time mount signal, before paint
    setMounted(true);
  }, []);
  const open = isOpen && mounted;

  /* Headless UI marks only the part of the page the dialog is written in;
     `lockPage` marks the rest, so a header or footer beside it is not left
     reachable, and a toast is. The span is where the dialog is written, which
     is how `lockPage` finds the part to leave to Headless UI. Rendered only
     while open, so a closed dialog still leaves nothing in the page. A layout
     effect, so the page is never painted open and live. */
  const anchorRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    return lockPage(anchorRef.current);
  }, [open]);

  return (
    <>
      {open && <span ref={anchorRef} hidden />}
      <HeadlessDialog
        open={open}
        as="div"
        className="rst:font-ui rst:relative rst:z-50"
        onClose={onClose}
      >
        <TransitionChild
          as={Fragment}
          enter="rst:ease-out rst:duration-300"
          enterFrom="rst:opacity-0"
          enterTo="rst:opacity-100"
          leave="rst:ease-in rst:duration-200"
          leaveFrom="rst:opacity-100"
          leaveTo="rst:opacity-0"
        >
          {/* `--roster-backdrop` is the scrim Sheet reads too, so one property
              gives every overlay the same one. The fallbacks are this
              component's own, exactly as they were, which is why they're
              written out here rather than shared with Sheet: the two never
              agreed (src/index.css, the Sheet block). `glass` reads the token
              as well, so a retinted app doesn't get one slate scrim back on
              its glass dialogs; unset, glass keeps its lighter tint and no
              blur, since the panel's own blur is the point of it. */}
          <DialogBackdrop
            className={cn(
              "rst:fixed rst:inset-0 rst:transition-opacity",
              variant === "glass"
                ? "rst:bg-[var(--roster-backdrop,color-mix(in_oklab,oklch(20.8%_0.042_265.755)_40%,transparent))] rst:dark:bg-[var(--roster-backdrop,color-mix(in_oklab,var(--roster-black,#1e1c1a)_60%,transparent))]"
                : "rst:bg-[var(--roster-backdrop,color-mix(in_oklab,oklch(20.8%_0.042_265.755)_60%,transparent))] rst:dark:bg-[var(--roster-backdrop,color-mix(in_oklab,var(--roster-black,#1e1c1a)_80%,transparent))] rst:backdrop-blur-backdrop",
            )}
          />
        </TransitionChild>
        <div className="rst:fixed rst:inset-0 rst:overflow-y-auto">
          <div className="rst:flex rst:min-h-full rst:items-center rst:justify-center rst:p-4 rst:text-center">
            <TransitionChild
              as={Fragment}
              enter="rst:ease-out rst:duration-300"
              enterFrom="rst:opacity-0 rst:scale-95"
              enterTo="rst:opacity-100 rst:scale-100"
              leave="rst:ease-in rst:duration-200"
              leaveFrom="rst:opacity-100 rst:scale-100"
              leaveTo="rst:opacity-0 rst:scale-95"
              afterLeave={onAfterClose}
            >
              <DialogPanel
                className={cn(
                  dialogVariants({ size, variant, status }),
                  className,
                )}
              >
                <div className="rst:flex rst:items-start rst:justify-between">
                  <div>
                    <DialogTitle as="h2" className={cn(titleVariants())}>
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className={cn(descriptionVariants())}>{description}</p>
                    )}
                  </div>

                  <div className="rst:ml-4 rst:flex rst:shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(closeVariants())}
                      aria-label="Close dialog"
                    >
                      <FontAwesomeIcon icon={faXmark} className="rst:h-5 rst:w-5" />
                    </button>
                  </div>
                </div>

                <div className="rst:mt-6">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </>
  );
};

export { Dialog };
