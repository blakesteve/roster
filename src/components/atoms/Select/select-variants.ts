import { cva } from "class-variance-authority";

export const selectTriggerVariants = cva(
  // 1. Increased 'pl-3' -> 'pl-4' (More breathing room on the left)
  // 2. Increased 'py-2' -> 'py-2.5' (Taller, better vertical rhythm)
  // 3. Keep 'relative' so the icon can position itself absolutely
  "relative w-full cursor-pointer rounded-md py-2.5 pl-4 pr-10 text-left text-sm font-medium shadow-sm ring-1 ring-inset transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 sm:leading-6",
  {
    variants: {
      variant: {
        outline: "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50",
        soft:    "bg-gray-100 text-gray-900 ring-transparent hover:bg-gray-200",
        ghost:   "bg-transparent text-gray-700 ring-transparent hover:bg-gray-100 hover:text-gray-900",
        filled:  "bg-gray-300 text-gray-900 ring-transparent hover:bg-gray-400",
      },
      error: {
        true: "ring-error-500 text-error-600 focus:ring-error-500",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      error: false,
    },
  }
);