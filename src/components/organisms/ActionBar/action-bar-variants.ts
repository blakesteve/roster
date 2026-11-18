import { cva } from "class-variance-authority";

export const actionBarVariants = /* @__PURE__ */ cva(
  "rst:font-ui rst:w-full rst:z-40 rst:elevation-anchored rst:backdrop-blur-md rst:transition-all",
  {
    variants: {
      variant: {
        /* The bar is sticky, so what's behind its fill is whatever scrolls
           under it. At 50% the title read 4.43:1 over a dark photo by day and
           3.42 over a light one at night; at 90% it holds over anything and
           keeps a trace of the blur. */
        default:
          "rst:bg-white/90 rst:border-gray-200 rst:text-gray-900 rst:dark:bg-gray-950/90 rst:dark:border-gray-800 rst:dark:text-gray-100",
        soft:
          "rst:bg-gray-50/90 rst:border-gray-200 rst:text-gray-900 rst:dark:bg-gray-900/90 rst:dark:border-gray-800 rst:dark:text-gray-100",
        /* Dialog's `primary` surface: solid, so its ink token is chosen
           against the fill it sits on (white on primary-700 at 50% was
           2.77:1), and it reads as one band with a primary Navbar above it.
           Dark in both themes, so it carries Dialog's ring and control
           tokens: the page's ring, primary-500, is 1.71:1 on primary-700. */
        primary:
          "rst:bg-primary-700 rst:border-primary-800 rst:text-primary-700-ink rst:dark:bg-primary-950 rst:dark:border-primary-900 rst:dark:text-white rst:[--roster-ring:var(--roster-primary-400,#5ea3de)] rst:[--roster-ring-offset:var(--roster-primary-700,#084063)] rst:dark:[--roster-ring-offset:var(--roster-primary-950,#021724)] rst:[--roster-control-text:var(--roster-gray-100,#f5f5f4)] rst:[--roster-control-border:var(--roster-gray-400,#a8a29e)] rst:[--roster-control-border-focus:var(--roster-primary-400,#5ea3de)]",
        transparent:
          "rst:bg-transparent rst:border-transparent rst:text-gray-900 rst:dark:text-gray-100 rst:shadow-none",
      },
      position: {
        top: "rst:sticky rst:top-0 rst:border-b",
        bottom: "rst:sticky rst:bottom-0 rst:border-t", 
        static: "rst:relative rst:border-y",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "top",
    },
  }
);