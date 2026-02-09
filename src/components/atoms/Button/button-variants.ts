import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap",
  {
    variants: {
      colorScheme: {
        primary: "",
        accent: "",
        destructive: "",
        success: "",
      },
      variant: {
        solid: "",
        outline: "bg-transparent border",
        ghost: "border",
        muted: "",
        link: "underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-6 px-2 rounded-sm",
        md: "h-10 py-2 px-4 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    compoundVariants: [
      // Primary
      {
        variant: "solid",
        colorScheme: "primary",
        className: "bg-primary-500 text-white-500 hover:bg-primary-600",
      },
      {
        variant: "outline",
        colorScheme: "primary",
        className: "border-primary-500 text-primary-500 hover:bg-primary-500/10",
      },
      {
        variant: "ghost",
        colorScheme: "primary",
        className: "border-primary-500 text-primary-500 bg-primary-500/10 hover:bg-primary-500/20",
      },
      {
        variant: "muted",
        colorScheme: "primary",
        className: "bg-primary-700 text-white-500 hover:bg-primary-600",
      },
      {
        variant: "link",
        colorScheme: "primary",
        className: "text-primary-500",
      },

      // Destructive
      {
        variant: "solid",
        colorScheme: "destructive",
        className: "bg-error-500 text-white-500 hover:bg-error-500/90",
      },
      {
        variant: "outline",
        colorScheme: "destructive",
        className: "border-error-500 text-error-500 hover:bg-error-500/10",
      },
      {
        variant: "ghost",
        colorScheme: "destructive",
        className: "border-error-500 text-error-500 bg-error-500/10 hover:bg-error-500/40",
      },
      {
        variant: "muted",
        colorScheme: "destructive",
        className: "bg-error-700 text-white-500 hover:bg-error-600",
      },

      // Success
      {
        variant: "solid",
        colorScheme: "success",
        className: "bg-success-500 text-white-500 hover:bg-success-500/90",
      },
      {
        variant: "outline",
        colorScheme: "success",
        className: "border-success-500 text-success-500 hover:bg-success-500/10",
      },
      {
        variant: "ghost",
        colorScheme: "success",
        className: "border-success-500 text-success-500 bg-success-500/10 hover:bg-success-500/20",
      },

      // Accent
      {
        variant: "solid",
        colorScheme: "accent",
        className: "bg-accent-500 text-white-500 hover:bg-accent-500/90",
      },
      {
        variant: "outline",
        colorScheme: "accent",
        className: "border-accent-500 text-accent-500 hover:bg-accent-500/10",
      },
      {
        variant: "ghost",
        colorScheme: "accent",
        className: "border-accent-500 text-accent-500 bg-accent-500/10 hover:bg-accent-500/20",
      },
      {
        variant: "muted",
        colorScheme: "accent",
        className: "bg-accent-700 text-white-500 hover:bg-accent-600",
      },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "default",
    },
  }
);
