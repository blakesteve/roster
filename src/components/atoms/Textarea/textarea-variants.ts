import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "flex w-full min-h-[80px] rounded-md border py-2.5 px-4 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
  {
    variants: {
      variant: {
        outline: "border-gray-300 bg-white focus-visible:border-primary-500",
        soft:    "border-transparent bg-gray-100 text-gray-900 focus-visible:bg-white focus-visible:border-primary-500",
        ghost:   "border-transparent bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:bg-gray-100",
        filled:  "border-transparent bg-gray-300 text-gray-900 focus-visible:bg-white focus-visible:border-primary-500",
      },
      error: {
        true: "border-error-500 focus-visible:ring-error-500 text-error-600 placeholder:text-error-300",
        false: "",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      }
    },
    defaultVariants: {
      variant: "outline",
      error: false,
      resize: "vertical",
    },
  }
);
