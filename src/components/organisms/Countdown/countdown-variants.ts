import { cva } from "class-variance-authority";

export const countdownTitleVariants = cva(
  "rst:font-semibold rst:uppercase rst:tracking-wider rst:mb-4 rst:transition-colors",
  {
    variants: {
      size: {
        xs: "rst:text-sm",
        sm: "rst:text-base",
        md: "rst:text-lg",
        lg: "rst:text-xl",
        xl: "rst:text-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const countdownNumberVariants = cva(
  "rst:font-mono rst:bg-clip-text rst:transition-all",
  {
    variants: {
      variant: {
        gradient:
          "rst:text-transparent rst:animate-pulse rst:bg-gradient-to-br rst:from-primary-700 rst:via-accent-600 rst:to-primary-700 rst:dark:from-primary-400 rst:dark:via-accent-300 rst:dark:to-primary-400 rst:drop-shadow-sm rst:dark:drop-shadow-md",
        primary: "rst:text-primary-600 rst:dark:text-primary-400",
        neutral: "rst:text-gray-900 rst:dark:text-gray-100",
      },
      size: {
        xs: "rst:text-2xl",
        sm: "rst:text-3xl",
        md: "rst:text-4xl",
        lg: "rst:text-5xl",
        xl: "rst:text-6xl",
      },
    },
    defaultVariants: {
      variant: "gradient",
      size: "md",
    },
  }
);

export const countdownLabelVariants = cva(
  "rst:uppercase rst:tracking-widest rst:mt-1 rst:transition-colors rst:text-gray-500 rst:dark:text-gray-400",
  {
    variants: {
      size: {
        xs: "rst:text-[10px]",
        sm: "rst:text-xs",
        md: "rst:text-xs",
        lg: "rst:text-sm",
        xl: "rst:text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);