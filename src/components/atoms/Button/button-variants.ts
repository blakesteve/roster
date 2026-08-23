import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base styles
  "rst:font-ui rst:inline-flex rst:items-center rst:justify-center rst:cursor-pointer rst:whitespace-nowrap rst:rounded-md rst:text-sm rst:font-medium rst:ring-offset-background rst:transition-colors rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:disabled:pointer-events-none rst:disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "rst:border rst:border-transparent rst:shadow-sm",
        soft: "rst:border-transparent rst:shadow-none",
        outline: "rst:border rst:bg-transparent rst:shadow-sm",
        ghost: "rst:border rst:border-transparent rst:bg-transparent",
        link: "rst:bg-transparent rst:underline-offset-4 rst:hover:underline",
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
        xs: "rst:h-7 rst:rounded rst:px-2 rst:text-xs",
        sm: "rst:h-9 rst:rounded-md rst:px-3",
        default: "rst:h-10 rst:px-4 rst:py-2",
        lg: "rst:h-11 rst:rounded-md rst:px-8",
        icon: "rst:h-10 rst:w-10",
      },
    },
    compoundVariants: [
      // --- SOLID VARIANTS (Bold Backgrounds) ---
      { variant: "solid", colorScheme: "primary", className: "rst:bg-primary-600 rst:text-white rst:hover:bg-primary-700 rst:dark:bg-primary-600 rst:dark:hover:bg-primary-500" },
      { variant: "solid", colorScheme: "orange",  className: "rst:bg-orange-600 rst:text-white rst:hover:bg-orange-700 rst:dark:bg-orange-600 rst:dark:hover:bg-orange-500" },
      { variant: "solid", colorScheme: "teal",    className: "rst:bg-teal-600 rst:text-white rst:hover:bg-teal-700 rst:dark:bg-teal-600 rst:dark:hover:bg-teal-500" },
      { variant: "solid", colorScheme: "purple",  className: "rst:bg-purple-600 rst:text-white rst:hover:bg-purple-700 rst:dark:bg-purple-600 rst:dark:hover:bg-purple-500" },
      { variant: "solid", colorScheme: "amber",   className: "rst:bg-amber-400 rst:text-black rst:hover:bg-amber-500 rst:dark:bg-amber-500 rst:dark:hover:bg-amber-400 rst:dark:text-gray-900" },
      { variant: "solid", colorScheme: "success", className: "rst:bg-success-600 rst:text-white rst:hover:bg-success-700 rst:dark:bg-success-600 rst:dark:hover:bg-success-500" },
      { variant: "solid", colorScheme: "error",   className: "rst:bg-error-600 rst:text-white rst:hover:bg-error-700 rst:dark:bg-error-600 rst:dark:hover:bg-error-500" },
      { variant: "solid", colorScheme: "neutral", className: "rst:bg-gray-600 rst:text-white rst:hover:bg-gray-700 rst:dark:bg-gray-600 rst:dark:hover:bg-gray-500" },

      // --- SOFT VARIANTS (Crisp Light Mode, Translucent Dark Mode) ---
      { variant: "soft", colorScheme: "primary", className: "rst:bg-primary-50 rst:text-primary-700 rst:hover:bg-primary-100 rst:dark:bg-primary-900/40 rst:dark:text-primary-300 rst:dark:hover:bg-primary-900/60" },
      { variant: "soft", colorScheme: "orange",  className: "rst:bg-orange-50 rst:text-orange-700 rst:hover:bg-orange-100 rst:dark:bg-orange-900/30 rst:dark:text-orange-300 rst:dark:hover:bg-orange-900/50" },
      { variant: "soft", colorScheme: "teal",    className: "rst:bg-teal-100 rst:text-teal-800 rst:hover:bg-teal-200 rst:dark:bg-teal-900/30 rst:dark:text-teal-300 rst:dark:hover:bg-teal-900/50" },
      { variant: "soft", colorScheme: "purple",  className: "rst:bg-purple-50 rst:text-purple-700 rst:hover:bg-purple-100 rst:dark:bg-purple-900/30 rst:dark:text-purple-300 rst:dark:hover:bg-purple-900/50" },
      { variant: "soft", colorScheme: "amber",   className: "rst:bg-amber-50 rst:text-amber-800 rst:hover:bg-amber-100 rst:dark:bg-amber-900/30 rst:dark:text-amber-300 rst:dark:hover:bg-amber-900/50" },
      { variant: "soft", colorScheme: "success", className: "rst:bg-success-50 rst:text-success-700 rst:hover:bg-success-100 rst:dark:bg-success-900/30 rst:dark:text-success-300 rst:dark:hover:bg-success-900/50" },
      { variant: "soft", colorScheme: "error",   className: "rst:bg-error-50 rst:text-error-700 rst:hover:bg-error-100 rst:dark:bg-error-900/30 rst:dark:text-error-300 rst:dark:hover:bg-error-900/50" },
      { variant: "soft", colorScheme: "neutral", className: "rst:bg-gray-100 rst:text-gray-700 rst:hover:bg-gray-200 rst:dark:bg-gray-800/50 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800" },

      // --- OUTLINE VARIANTS (Borders + Colored Adaptive Text + Transparent Hover) ---
      { variant: "outline", colorScheme: "primary", className: "rst:border-primary-600 rst:text-primary-600 rst:hover:bg-primary-50 rst:dark:border-primary-500 rst:dark:text-primary-400 rst:dark:hover:bg-primary-500/10" },
      { variant: "outline", colorScheme: "orange",  className: "rst:border-orange-600 rst:text-orange-600 rst:hover:bg-orange-50 rst:dark:border-orange-500 rst:dark:text-orange-400 rst:dark:hover:bg-orange-500/10" },
      { variant: "outline", colorScheme: "teal",    className: "rst:border-teal-600 rst:text-teal-600 rst:hover:bg-teal-50 rst:dark:border-teal-500 rst:dark:text-teal-400 rst:dark:hover:bg-teal-500/10" },
      { variant: "outline", colorScheme: "purple",  className: "rst:border-purple-600 rst:text-purple-600 rst:hover:bg-purple-50 rst:dark:border-purple-500 rst:dark:text-purple-400 rst:dark:hover:bg-purple-500/10" },
      { variant: "outline", colorScheme: "amber",   className: "rst:border-amber-600 rst:text-amber-600 rst:hover:bg-amber-50 rst:dark:border-amber-500 rst:dark:text-amber-400 rst:dark:hover:bg-amber-500/10" },
      { variant: "outline", colorScheme: "success", className: "rst:border-success-600 rst:text-success-600 rst:hover:bg-success-50 rst:dark:border-success-500 rst:dark:text-success-400 rst:dark:hover:bg-success-500/10" },
      { variant: "outline", colorScheme: "error",   className: "rst:border-error-600 rst:text-error-600 rst:hover:bg-error-50 rst:dark:border-error-500 rst:dark:text-error-400 rst:dark:hover:bg-error-500/10" },
      { variant: "outline", colorScheme: "neutral", className: "rst:border-gray-300 rst:text-gray-700 rst:hover:bg-gray-50 rst:dark:border-gray-600 rst:dark:text-gray-300 rst:dark:hover:bg-gray-800/50" },

      // --- GHOST VARIANTS (Adaptive Text + Translucent Hover) ---
      // Translucent rather than a solid tint step. A ghost button sits directly
      // on the host's own background, and a solid `bg-*-50` silently disappears
      // wherever that background happens to equal the step it names — which is
      // exactly what happened to blakeb.dev, whose paper is the same value it
      // maps `--roster-gray-100` to. An alpha wash darkens or lightens whatever
      // is actually behind it, so it reads on any surface.
      { variant: "ghost", colorScheme: "primary", className: "rst:text-primary-600 rst:hover:bg-primary-500/10 rst:dark:text-primary-400 rst:dark:hover:bg-primary-400/15" },
      { variant: "ghost", colorScheme: "orange",  className: "rst:text-orange-600 rst:hover:bg-orange-500/10 rst:dark:text-orange-400 rst:dark:hover:bg-orange-400/15" },
      { variant: "ghost", colorScheme: "teal",    className: "rst:text-teal-600 rst:hover:bg-teal-500/10 rst:dark:text-teal-400 rst:dark:hover:bg-teal-400/15" },
      { variant: "ghost", colorScheme: "purple",  className: "rst:text-purple-600 rst:hover:bg-purple-500/10 rst:dark:text-purple-400 rst:dark:hover:bg-purple-400/15" },
      { variant: "ghost", colorScheme: "amber",   className: "rst:text-amber-600 rst:hover:bg-amber-500/10 rst:dark:text-amber-400 rst:dark:hover:bg-amber-400/15" },
      { variant: "ghost", colorScheme: "success", className: "rst:text-success-600 rst:hover:bg-success-500/10 rst:dark:text-success-400 rst:dark:hover:bg-success-400/15" },
      { variant: "ghost", colorScheme: "error",   className: "rst:text-error-600 rst:hover:bg-error-500/10 rst:dark:text-error-400 rst:dark:hover:bg-error-400/15" },
      { variant: "ghost", colorScheme: "neutral", className: "rst:text-gray-600 rst:hover:bg-gray-500/10 rst:dark:text-gray-400 rst:dark:hover:bg-gray-400/15" },

      // --- LINK VARIANTS (Adaptive Text Only + Underline) ---
      { variant: "link", colorScheme: "primary", className: "rst:text-primary-600 rst:hover:text-primary-700 rst:dark:text-primary-400 rst:dark:hover:text-primary-300" },
      { variant: "link", colorScheme: "orange",  className: "rst:text-orange-600 rst:hover:text-orange-700 rst:dark:text-orange-400 rst:dark:hover:text-orange-300" },
      { variant: "link", colorScheme: "teal",    className: "rst:text-teal-600 rst:hover:text-teal-700 rst:dark:text-teal-400 rst:dark:hover:text-teal-300" },
      { variant: "link", colorScheme: "purple",  className: "rst:text-purple-600 rst:hover:text-purple-700 rst:dark:text-purple-400 rst:dark:hover:text-purple-300" },
      { variant: "link", colorScheme: "amber",   className: "rst:text-amber-600 rst:hover:text-amber-700 rst:dark:text-amber-400 rst:dark:hover:text-amber-300" },
      { variant: "link", colorScheme: "success", className: "rst:text-success-600 rst:hover:text-success-700 rst:dark:text-success-400 rst:dark:hover:text-success-300" },
      { variant: "link", colorScheme: "error",   className: "rst:text-error-600 rst:hover:text-error-700 rst:dark:text-error-400 rst:dark:hover:text-error-300" },
      { variant: "link", colorScheme: "neutral", className: "rst:text-gray-600 rst:hover:text-gray-900 rst:dark:text-gray-400 rst:dark:hover:text-gray-100" },
    ],
    defaultVariants: {
      colorScheme: "primary",
      variant: "solid",
      size: "default",
    },
  }
);
