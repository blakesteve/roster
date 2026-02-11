import { cva } from "class-variance-authority";

export const cardVariants = cva(
  // Base: relative and overflow-hidden are crucial for the branded stripes to clip
  "relative w-full overflow-hidden rounded-xl text-gray-900 transition-all",
  {
    variants: {
      variant: {
        default: "bg-white border border-gray-200 shadow-sm",
        filled:  "bg-gray-300 border-transparent shadow-none", // MegaSquad Darker
        ghost:   "bg-gray-50 border-none shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);