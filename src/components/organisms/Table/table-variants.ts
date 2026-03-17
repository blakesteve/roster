import { cva } from "class-variance-authority";

export const tableWrapperVariants = cva(
  "relative w-full overflow-auto rounded-md transition-colors duration-200",
  {
    variants: {
      variant: {
        default:
          "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950",
        ghost: "bg-transparent",
        subtle:
          "border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900",
        primary:
          "border border-primary-200 dark:border-primary-900/50 bg-white dark:bg-gray-950 shadow-sm",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export const tableVariants = cva("w-full caption-bottom", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: { size: "md" },
});

export const tableHeaderVariants = cva("[&_tr]:border-b transition-colors", {
  variants: {
    variant: {
      default:
        "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800",
      ghost: "bg-transparent border-gray-200 dark:border-gray-800",
      subtle:
        "bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800",
      primary:
        "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-900/50",
    },
  },
  defaultVariants: { variant: "default" },
});

export const tableRowVariants = cva(
  "border-b transition-colors data-[state=selected]:bg-gray-100 dark:data-[state=selected]:bg-gray-800",
  {
    variants: {
      variant: {
        default:
          "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950",
        ghost:
          "border-gray-100 dark:border-gray-800 bg-transparent",
        subtle:
          "border-gray-200 dark:border-gray-800 bg-transparent",
        primary:
          "border-primary-100 dark:border-primary-900/50 bg-white dark:bg-gray-950",
      },
      hoverable: {
        true: "cursor-pointer",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        hoverable: true,
        className: "hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
      },
      {
        variant: "ghost",
        hoverable: true,
        className: "hover:bg-gray-50 dark:hover:bg-gray-900",
      },
      {
        variant: "subtle",
        hoverable: true,
        className: "hover:bg-gray-100 dark:hover:bg-gray-800",
      },
      {
        variant: "primary",
        hoverable: true,
        className: "hover:bg-primary-50/50 dark:hover:bg-primary-900/20",
      },
    ],
    defaultVariants: { variant: "default", hoverable: false },
  },
);

export const tableHeadVariants = cva(
  "text-left align-middle font-semibold tracking-wide [&:has([role=checkbox])]:pr-0 transition-colors",
  {
    variants: {
      variant: {
        default: "text-gray-600 dark:text-gray-400",
        ghost: "text-gray-500 dark:text-gray-400",
        subtle: "text-gray-600 dark:text-gray-400",
        primary: "text-primary-800 dark:text-primary-300",
      },
      size: {
        sm: "h-10 px-3",
        md: "h-12 px-4",
        lg: "h-14 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export const tableCellVariants = cva(
  "align-middle [&:has([role=checkbox])]:pr-0 transition-colors",
  {
    variants: {
      variant: {
        default: "text-gray-700 dark:text-gray-300",
        ghost: "text-gray-700 dark:text-gray-300",
        subtle: "text-gray-700 dark:text-gray-300",
        primary: "text-gray-800 dark:text-gray-200",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6 py-5",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);