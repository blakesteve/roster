import { cva } from "class-variance-authority";

export const tableWrapperVariants = cva(
  "rst:relative rst:w-full rst:overflow-auto rst:rounded-md rst:transition-colors rst:duration-200",
  {
    variants: {
      variant: {
        default:
          "rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:bg-white rst:dark:bg-gray-950",
        ghost: "rst:bg-transparent",
        subtle:
          "rst:border rst:border-gray-100 rst:dark:border-gray-800 rst:bg-gray-50 rst:dark:bg-gray-900",
        primary:
          "rst:border rst:border-primary-200 rst:dark:border-primary-900/50 rst:bg-white rst:dark:bg-gray-950 rst:shadow-sm",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export const tableVariants = cva("rst:w-full rst:caption-bottom", {
  variants: {
    size: {
      sm: "rst:text-xs",
      md: "rst:text-sm",
      lg: "rst:text-base",
    },
  },
  defaultVariants: { size: "md" },
});

export const tableHeaderVariants = cva("rst:[&_tr]:border-b rst:transition-colors", {
  variants: {
    variant: {
      default:
        "rst:bg-gray-50 rst:dark:bg-gray-900 rst:border-gray-200 rst:dark:border-gray-800",
      ghost: "rst:bg-transparent rst:border-gray-200 rst:dark:border-gray-800",
      subtle:
        "rst:bg-gray-100/50 rst:dark:bg-gray-800/50 rst:border-gray-200 rst:dark:border-gray-800",
      primary:
        "rst:bg-primary-50 rst:dark:bg-primary-900/20 rst:border-primary-200 rst:dark:border-primary-900/50",
    },
  },
  defaultVariants: { variant: "default" },
});

export const tableRowVariants = cva(
  "rst:border-b rst:transition-colors rst:data-[state=selected]:bg-gray-100 rst:dark:data-[state=selected]:bg-gray-800",
  {
    variants: {
      variant: {
        default:
          "rst:border-gray-200 rst:dark:border-gray-800 rst:bg-white rst:dark:bg-gray-950",
        ghost:
          "rst:border-gray-100 rst:dark:border-gray-800 rst:bg-transparent",
        subtle:
          "rst:border-gray-200 rst:dark:border-gray-800 rst:bg-transparent",
        primary:
          "rst:border-primary-100 rst:dark:border-primary-900/50 rst:bg-white rst:dark:bg-gray-950",
      },
      hoverable: {
        true: "rst:cursor-pointer",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        hoverable: true,
        className: "rst:hover:bg-gray-50/50 rst:dark:hover:bg-gray-800/50",
      },
      {
        variant: "ghost",
        hoverable: true,
        className: "rst:hover:bg-gray-50 rst:dark:hover:bg-gray-900",
      },
      {
        variant: "subtle",
        hoverable: true,
        className: "rst:hover:bg-gray-100 rst:dark:hover:bg-gray-800",
      },
      {
        variant: "primary",
        hoverable: true,
        className: "rst:hover:bg-primary-50/50 rst:dark:hover:bg-primary-900/20",
      },
    ],
    defaultVariants: { variant: "default", hoverable: false },
  },
);

export const tableHeadVariants = cva(
  "rst:text-left rst:align-middle rst:font-semibold rst:tracking-wide rst:[&:has([role=checkbox])]:pr-0 rst:transition-colors",
  {
    variants: {
      variant: {
        default: "rst:text-gray-600 rst:dark:text-gray-400",
        ghost: "rst:text-gray-500 rst:dark:text-gray-400",
        subtle: "rst:text-gray-600 rst:dark:text-gray-400",
        primary: "rst:text-primary-800 rst:dark:text-primary-300",
      },
      size: {
        sm: "rst:h-10 rst:px-3",
        md: "rst:h-12 rst:px-4",
        lg: "rst:h-14 rst:px-6",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export const tableCellVariants = cva(
  "rst:align-middle rst:[&:has([role=checkbox])]:pr-0 rst:transition-colors",
  {
    variants: {
      variant: {
        default: "rst:text-gray-700 rst:dark:text-gray-300",
        ghost: "rst:text-gray-700 rst:dark:text-gray-300",
        subtle: "rst:text-gray-700 rst:dark:text-gray-300",
        primary: "rst:text-gray-800 rst:dark:text-gray-200",
      },
      size: {
        sm: "rst:p-3",
        md: "rst:p-4",
        lg: "rst:p-6 rst:py-5",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);