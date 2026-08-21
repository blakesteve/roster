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
        white:
          "rst:bg-white rst:border-gray-200 rst:text-gray-900 rst:dark:bg-gray-800 rst:dark:border-gray-700 rst:dark:text-gray-100",
        slate:
          "rst:bg-gray-700 rst:border-gray-600 rst:text-gray-100 rst:dark:bg-gray-900 rst:dark:border-gray-800",
        primary:
          "rst:bg-primary-700 rst:border-primary-600 rst:text-white rst:dark:bg-primary-950 rst:dark:border-primary-900",
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
  "rst:inline-flex rst:rounded-md rst:bg-transparent rst:text-inherit rst:opacity-50 rst:hover:opacity-100 rst:focus:outline-none rst:focus:ring-2 rst:focus:ring-primary-500 rst:focus:ring-offset-2 rst:transition-opacity",
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
      <HeadlessDialog as="div" className="rst:relative rst:z-50" onClose={onClose}>
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
