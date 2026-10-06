import { cva } from "class-variance-authority";

/* The 44px target is a `before:` pseudo-element on the track, the way
   Checkbox's is, and for the same reasons: the track IS the visible control,
   so padding would grow it, and a pseudo-element takes no layout.

   Sized and centered, never inset. The track has `border-2`, and an absolutely
   positioned pseudo-element resolves `inset` against its originator's padding
   box, so an inset measured off the outer size lands 4px short. `size-11`
   states the 44 the rule is about, at every size.

   What it asks of the layout. The target overhangs the track, and it is
   positioned, so it wins any overlap with a non-positioned neighbor, before
   or after it; between two switches the later one wins. In a stacked list of
   one-line rows, keep 10px between rows at `xs` and `md`, 12px at `sm` and 8px
   at `lg` for each track to stay its own, and 24px at `xs` and `sm`, 20px at
   `md` and 16px at `lg` for every target to stay 44px. (`xs` needs more than
   twice its figure because its 16px track sits in a 20px row.) An ancestor with `overflow: hidden` clips the overhang, because
   clipping applies to hit testing, not only to painting. And `className`
   lands on the wrapper, not the track, so `pointer-events-none` there turns
   the target off by inheritance. */
export const switchTrackVariants = /* @__PURE__ */ cva(
  "rst:before:absolute rst:before:top-1/2 rst:before:left-1/2 rst:before:size-11 rst:before:-translate-x-1/2 rst:before:-translate-y-1/2 rst:before:content-[''] rst:font-ui rst:group rst:relative rst:inline-flex rst:shrink-0 rst:cursor-pointer rst:rounded-full rst:border-2 rst:border-transparent rst:transition-colors rst:duration-200 rst:ease-in-out rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-offset-2 rst:ring-offset-background rst:disabled:cursor-not-allowed rst:disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-primary-500 rst:focus-visible:ring-ring",
        success: "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-green-500 rst:focus-visible:ring-ring",
        danger:  "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-error-500 rst:focus-visible:ring-ring",
        neutral: "rst:bg-gray-200 rst:dark:bg-gray-700 rst:data-[checked]:bg-gray-600 rst:dark:data-[checked]:bg-gray-500 rst:focus-visible:ring-ring",
      },
      size: {
        xs: "rst:h-4 rst:w-7",
        sm: "rst:h-5 rst:w-9",
        md: "rst:h-6 rst:w-11",
        lg: "rst:h-7 rst:w-14",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const switchThumbVariants = /* @__PURE__ */ cva(
  "rst:pointer-events-none rst:inline-block rst:rounded-full rst:bg-white rst:elevation-control rst:ring-0 rst:transition rst:duration-200 rst:ease-in-out rst:transform",
  {
    variants: {
      size: {
        xs: "rst:h-3 rst:w-3 rst:translate-x-0 rst:group-data-[checked]:translate-x-3",
        sm: "rst:h-4 rst:w-4 rst:translate-x-0 rst:group-data-[checked]:translate-x-4",
        md: "rst:h-5 rst:w-5 rst:translate-x-0 rst:group-data-[checked]:translate-x-5",
        lg: "rst:h-6 rst:w-6 rst:translate-x-0 rst:group-data-[checked]:translate-x-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);