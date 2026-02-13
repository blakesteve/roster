import { cva } from "class-variance-authority";

export const disclosureTriggerVariants = cva(
  "group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/75 cursor-pointer",
  {
    variants: {
      variant: {
        soft:   "bg-gray-100 text-gray-900 hover:bg-gray-200",
        filled: "bg-gray-300 text-gray-900 hover:bg-gray-400/80", // MegaSquad Dark
        outline:"bg-white border border-gray-200 text-gray-900 hover:bg-gray-50",
        ghost:  "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900",
      },
      rounded: {
        true: "rounded-md",
        false: "",
      },
    },
    defaultVariants: {
      variant: "soft",
      rounded: true,
    },
  }
);

export const disclosureContentVariants = cva(
  "px-4 pb-4 pt-1 text-sm",
  {
    variants: {
      variant: {
        soft:   "bg-gray-100 text-gray-700",
        filled: "bg-gray-300 text-gray-800",
        outline:"bg-white border-x border-b border-gray-200 text-gray-600",
        ghost:  "bg-transparent text-gray-600",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);