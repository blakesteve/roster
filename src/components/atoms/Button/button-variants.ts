import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "border border-transparent", 
        outline: "border bg-transparent",   
        ghost: "border border-transparent bg-transparent", 
        link: "bg-transparent underline-offset-4 hover:underline",
      },
      colorScheme: {
        primary: "",
        orange: "",
        teal: "",
        purple: "",
        amber: "",
        success: "",
        error: "",
        neutral: "",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      // --- SOLID VARIANTS (Bold Backgrounds) ---
      // We use 600 for background to ensure white text is readable
      { variant: "solid", colorScheme: "primary", className: "bg-primary-600 text-white hover:bg-primary-700" },
      { variant: "solid", colorScheme: "orange",  className: "bg-orange-500 text-white hover:bg-orange-600" },
      { variant: "solid", colorScheme: "teal",    className: "bg-teal-500 text-white hover:bg-teal-600" },
      { variant: "solid", colorScheme: "purple",  className: "bg-purple-500 text-white hover:bg-purple-600" },
      { variant: "solid", colorScheme: "amber",   className: "bg-amber-400 text-black hover:bg-amber-500" }, // Amber-400 is brighter/better for black text
      { variant: "solid", colorScheme: "success", className: "bg-success-600 text-white hover:bg-success-700" },
      { variant: "solid", colorScheme: "error",   className: "bg-error-600 text-white hover:bg-error-700" },
      { variant: "solid", colorScheme: "neutral", className: "bg-gray-600 text-white hover:bg-gray-700" },

      // --- OUTLINE VARIANTS (Borders + Colored Text) ---
      { variant: "outline", colorScheme: "primary", className: "border-primary-500 text-primary-500 hover:bg-primary-50" },
      { variant: "outline", colorScheme: "orange",  className: "border-orange-500 text-orange-500 hover:bg-orange-50" },
      { variant: "outline", colorScheme: "teal",    className: "border-teal-500 text-teal-500 hover:bg-teal-50" },
      { variant: "outline", colorScheme: "purple",  className: "border-purple-500 text-purple-500 hover:bg-purple-50" },
      { variant: "outline", colorScheme: "amber",   className: "border-amber-500 text-amber-600 hover:bg-amber-50" }, // Amber text needs to be slightly darker (600) to read on white
      { variant: "outline", colorScheme: "success", className: "border-success-500 text-success-600 hover:bg-success-50" }, // Green text also benefits from being slightly darker
      { variant: "outline", colorScheme: "error",   className: "border-error-500 text-error-600 hover:bg-error-50" },
      { variant: "outline", colorScheme: "neutral", className: "border-gray-300 text-gray-700 hover:bg-gray-100" },

      // --- GHOST VARIANTS (Soft Text + Soft Hover) ---
      { variant: "ghost", colorScheme: "primary", className: "text-primary-500 hover:bg-primary-50 hover:text-primary-600" },
      { variant: "ghost", colorScheme: "orange",  className: "text-orange-500 hover:bg-orange-50 hover:text-orange-600" },
      { variant: "ghost", colorScheme: "teal",    className: "text-teal-500 hover:bg-teal-50 hover:text-teal-600" },
      { variant: "ghost", colorScheme: "purple",  className: "text-purple-500 hover:bg-purple-50 hover:text-purple-600" },
      { variant: "ghost", colorScheme: "amber",   className: "text-amber-600 hover:bg-amber-50 hover:text-amber-700" },
      { variant: "ghost", colorScheme: "success", className: "text-success-600 hover:bg-success-50 hover:text-success-700" },
      { variant: "ghost", colorScheme: "error",   className: "text-error-600 hover:bg-error-50 hover:text-error-700" },
      { variant: "ghost", colorScheme: "neutral", className: "text-gray-600 hover:bg-gray-100 hover:text-gray-900" },

      // --- LINK VARIANTS (Text Only + Underline) ---
      { variant: "link", colorScheme: "primary", className: "text-primary-500 hover:text-primary-700" },
      { variant: "link", colorScheme: "orange",  className: "text-orange-500 hover:text-orange-700" },
      { variant: "link", colorScheme: "teal",    className: "text-teal-500 hover:text-teal-700" },
      { variant: "link", colorScheme: "purple",  className: "text-purple-500 hover:text-purple-700" },
      { variant: "link", colorScheme: "amber",   className: "text-amber-600 hover:text-amber-800" },
      { variant: "link", colorScheme: "success", className: "text-success-600 hover:text-success-800" },
      { variant: "link", colorScheme: "error",   className: "text-error-600 hover:text-error-800" },
      { variant: "link", colorScheme: "neutral", className: "text-gray-500 hover:text-gray-900" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "default",
    },
  }
);