import { cva } from "class-variance-authority";

export const actionBarVariants = cva(
  "w-full z-20 shadow-lg backdrop-blur-sm transition-all",
  {
    variants: {
      position: {
        top: "sticky top-0",
        bottom: "sticky bottom-0 border-t",
        static: "relative",
      },
      themeMode: {
        light: "bg-white/90 border-gray-200 text-gray-900",
        dark: "bg-slate-800/90 border-slate-700 text-white",
      },
    },
    defaultVariants: {
      position: "top",
      themeMode: "light",
    },
  }
);