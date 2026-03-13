import { cva } from "class-variance-authority";

export const tableVariants = cva("w-full caption-bottom", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});