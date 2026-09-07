import { Fragment, type ReactNode } from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const dialogVariants = cva(
  "rst:relative rst:w-full rst:transform rst:overflow-hidden rst:rounded-2xl rst:p-6 rst:text-left rst:align-middle rst:shadow-xl rst:transition-all rst:border",
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
           scheme, so the page-level tokens are already right for them. */
        slate:
          "rst:bg-gray-700 rst:border-gray-600 rst:text-gray-100 rst:dark:bg-gray-900 rst:dark:border-gray-800 rst:[--roster-ring:var(--roster-primary-400,#5ea3de)] rst:[--roster-ring-offset:var(--roster-gray-700,#44403c)] rst:dark:[--roster-ring-offset:var(--roster-gray-900,#1c1917)] rst:[--roster-control-text:var(--roster-gray-100,#f5f5f4)] rst:[--roster-control-border:var(--roster-gray-400,#a8a29e)] rst:[--roster-control-border-focus:var(--roster-primary-400,#5ea3de)]",
        primary:
          "rst:bg-primary-700 rst:border-primary-600 rst:text-white rst:dark:bg-primary-950 rst:dark:border-primary-900 rst:[--roster-ring:var(--roster-primary-400,#5ea3de)] rst:[--roster-ring-offset:var(--roster-primary-700,#084063)] rst:dark:[--roster-ring-offset:var(--roster-primary-950,#021724)] rst:[--roster-control-text:var(--roster-gray-100,#f5f5f4)] rst:[--roster-control-border:var(--roster-gray-400,#a8a29e)] rst:[--roster-control-border-focus:var(--roster-primary-400,#5ea3de)]",
        glass:
          "rst:bg-white/80 rst:border-white/20 rst:backdrop-blur-xl rst:text-gray-900 rst:dark:bg-slate-900/80 rst:dark:border-slate-700/50 rst:dark:text-white rst:shadow-2xl rst:dark:shadow-black/50",
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

const titleVariants = cva("rst:text-xl rst:font-bold rst:leading-6 rst:text-inherit");

const descriptionVariants = cva("rst:mt-1 rst:text-sm rst:text-inherit rst:opacity-75");

const closeVariants = cva(
  "rst:inline-flex rst:rounded-md rst:bg-transparent rst:text-inherit rst:opacity-50 rst:hover:opacity-100 rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background rst:transition-opacity",
);

export interface DialogProps extends VariantProps<typeof dialogVariants> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
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
}: DialogProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="rst:font-ui rst:relative rst:z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="rst:ease-out rst:duration-300"
          enterFrom="rst:opacity-0"
          enterTo="rst:opacity-100"
          leave="rst:ease-in rst:duration-200"
          leaveFrom="rst:opacity-100"
          leaveTo="rst:opacity-0"
        >
          <DialogBackdrop
            className={cn(
              "rst:fixed rst:inset-0 rst:transition-opacity",
              variant === "glass"
                ? "rst:bg-slate-900/40 rst:dark:bg-black/60"
                : "rst:bg-slate-900/60 rst:dark:bg-black/80 rst:backdrop-blur-sm",
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
    </Transition>
  );
};

export { Dialog };
