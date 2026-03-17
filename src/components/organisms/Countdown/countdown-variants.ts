import { cva } from "class-variance-authority";

export const countdownTitleVariants = cva(
  "font-semibold uppercase tracking-wider mb-4 transition-colors",
  {
    variants: {
      size: {
        xs: "text-sm",
        sm: "text-base",
        md: "text-lg",
        lg: "text-xl",
        xl: "text-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const countdownNumberVariants = cva(
  "font-mono bg-clip-text transition-all",
  {
    variants: {
      variant: {
        gradient:
          "text-transparent animate-pulse bg-gradient-to-br from-primary-700 via-accent-600 to-primary-700 dark:from-primary-400 dark:via-accent-300 dark:to-primary-400 drop-shadow-sm dark:drop-shadow-md",
        primary: "text-primary-600 dark:text-primary-400",
        neutral: "text-gray-900 dark:text-gray-100",
      },
      size: {
        xs: "text-2xl",
        sm: "text-3xl",
        md: "text-4xl",
        lg: "text-5xl",
        xl: "text-6xl",
      },
    },
    defaultVariants: {
      variant: "gradient",
      size: "md",
    },
  }
);

export const countdownLabelVariants = cva(
  "uppercase tracking-widest mt-1 transition-colors text-gray-500 dark:text-gray-400",
  {
    variants: {
      size: {
        xs: "text-[10px]",
        sm: "text-xs",
        md: "text-xs",
        lg: "text-sm",
        xl: "text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);