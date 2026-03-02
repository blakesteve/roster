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

// --- Variants ---
const dialogVariants = cva(
  "relative w-full transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all",
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
        default: "border",
        destructive: "border-x border-b border-t-4",
        success: "border-x border-b border-t-4",
        glass: "backdrop-blur-xl border",
      },
      themeMode: {
        light: "",
        dark: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        themeMode: "light",
        className: "bg-white border-gray-200",
      },
      {
        variant: "destructive",
        themeMode: "light",
        className:
          "bg-white border-x-gray-200 border-b-gray-200 border-t-error-500",
      },
      {
        variant: "success",
        themeMode: "light",
        className:
          "bg-white border-x-gray-200 border-b-gray-200 border-t-success-500",
      },
      {
        variant: "default",
        themeMode: "dark",
        className: "bg-slate-800 border-slate-700 shadow-2xl shadow-black/50",
      },
      {
        variant: "destructive",
        themeMode: "dark",
        className:
          "bg-slate-800 border-x-slate-700 border-b-slate-700 border-t-error-500 shadow-2xl shadow-black/50",
      },
      {
        variant: "success",
        themeMode: "dark",
        className:
          "bg-slate-800 border-x-slate-700 border-b-slate-700 border-t-success-500 shadow-2xl shadow-black/50",
      },
      {
        variant: "glass",
        themeMode: "light",
        className: "bg-white/80 border-white/20",
      },
      {
        variant: "glass",
        themeMode: "dark",
        className:
          "bg-slate-900/80 border-slate-700/50 shadow-2xl shadow-black/50",
      },
    ],
    defaultVariants: {
      size: "md",
      variant: "default",
      themeMode: "light",
    },
  },
);

const titleVariants = cva("text-xl font-bold leading-6", {
  variants: {
    themeMode: {
      light: "text-gray-900",
      dark: "text-white",
    },
  },
  defaultVariants: { themeMode: "light" },
});

const descriptionVariants = cva("mt-1 text-sm", {
  variants: {
    themeMode: {
      light: "text-gray-500",
      dark: "text-gray-400",
    },
  },
  defaultVariants: { themeMode: "light" },
});

const closeVariants = cva(
  "inline-flex rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors",
  {
    variants: {
      themeMode: {
        light: "text-gray-400 hover:text-gray-500",
        dark: "text-gray-400 hover:text-gray-300",
      },
    },
    defaultVariants: { themeMode: "light" },
  },
);

// --- Component ---
export interface DialogProps extends Omit<
  VariantProps<typeof dialogVariants>,
  "themeMode"
> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  themeMode?: "light" | "dark";
}

const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  size,
  variant,
  themeMode = "light",
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
                ? "bg-slate-900/40"
                : "bg-slate-900/60 backdrop-blur-sm",
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
                className={cn(
                  dialogVariants({ size, variant, themeMode }),
                  className,
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle
                      as="h2"
                      className={cn(titleVariants({ themeMode }))}
                    >
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className={cn(descriptionVariants({ themeMode }))}>
                        {description}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(closeVariants({ themeMode }))}
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
