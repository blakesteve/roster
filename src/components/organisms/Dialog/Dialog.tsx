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
  "relative w-full transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all border",
  {
    variants: {
      size: {
        xs: "max-w-xs",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        full: "max-w-[95vw] m-4",
      },
      variant: {
        white:
          "bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
        slate:
          "bg-gray-700 border-gray-600 text-gray-100 dark:bg-gray-900 dark:border-gray-800",
        primary:
          "bg-primary-700 border-primary-600 text-white dark:bg-primary-950 dark:border-primary-900",
        glass:
          "bg-white/80 border-white/20 backdrop-blur-xl text-gray-900 dark:bg-slate-900/80 dark:border-slate-700/50 dark:text-white shadow-2xl dark:shadow-black/50",
      },
      status: {
        default: "",
        destructive: "border-t-4 border-t-error-500",
        success: "border-t-4 border-t-success-500",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "white",
      status: "default",
    },
  },
);

const titleVariants = cva("text-xl font-bold leading-6 text-inherit");

const descriptionVariants = cva("mt-1 text-sm text-inherit opacity-75");

const closeVariants = cva(
  "inline-flex rounded-md bg-transparent text-inherit opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-opacity",
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
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop
            className={cn(
              "fixed inset-0 transition-opacity",
              variant === "glass"
                ? "bg-slate-900/40 dark:bg-black/60"
                : "bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm",
            )}
          />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                // Pass status to the cva compiler
                className={cn(
                  dialogVariants({ size, variant, status }),
                  className,
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle as="h2" className={cn(titleVariants())}>
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className={cn(descriptionVariants())}>{description}</p>
                    )}
                  </div>

                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(closeVariants())}
                      aria-label="Close dialog"
                    >
                      <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export { Dialog };
