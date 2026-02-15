import { cva } from "class-variance-authority";

export const ctaVariants = cva(
  "relative flex flex-col gap-4 overflow-hidden rounded-lg border p-6 shadow-sm transition-all md:flex-row md:items-center md:justify-between",
  {
    variants: {
      variant: {
        primary: 
          "border-primary-200 bg-primary-50 text-primary-900", // Light brand theme
        neutral: 
          "border-gray-200 bg-white text-gray-900", // Standard card look
        warning: 
          "border-amber-200 bg-amber-50 text-amber-900", // Alerts
        error: 
          "border-red-200 bg-red-50 text-red-900", // Critical info
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);