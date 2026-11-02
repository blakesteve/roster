import { cva } from "class-variance-authority";

/**
 * One tile: the whole tile is the radio, with no dot.
 *
 * `outlined` is Roster's own look, and a quiet one: a hairline in
 * `--roster-tile-border` at rest, and the chosen tile's edge in
 * `--roster-tile-border-checked`, drawn two pixels wide (the border and an
 * inset ring) over the faintest tint, `--roster-tile-bg-checked`. The edge
 * changes weight as well as hue, so the choice doesn't rest on color alone.
 *
 * `plain` draws nothing: no edge, no fill, no padding, in any state. It's for
 * a consumer drawing its own chosen look from the tile's `data-checked`, a
 * printed border or a stamp, without first undoing Roster's.
 *
 * Both keep the focus ring, Roster's, on `focus-visible`. A box-shadow ring
 * offset from the tile's border box, so it sits outside anything a consumer
 * draws on the tile or inside it. And both dim a disabled tile.
 *
 * Forced colors drops box-shadows and repaints every edge and fill alike, so
 * there the chosen tile's name is underlined (in both looks, set where the
 * name is drawn), and the `outlined` edge goes to two pixels: the same cues
 * `Pagination` gives its current page.
 */
export const radioTileVariants = /* @__PURE__ */ cva(
  "rst:group rst:font-ui rst:relative rst:flex rst:h-full rst:w-full rst:min-w-0 rst:flex-col rst:gap-2 rst:rounded-lg rst:text-left rst:cursor-pointer rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background rst:data-disabled:cursor-not-allowed rst:data-disabled:opacity-50",
  {
    variants: {
      variant: {
        outlined:
          "rst:border rst:border-(--roster-tile-border) rst:bg-(--roster-tile-bg) rst:p-2 rst:data-checked:border-(--roster-tile-border-checked) rst:data-checked:inset-ring rst:data-checked:inset-ring-(--roster-tile-border-checked) rst:data-checked:bg-(--roster-tile-bg-checked) rst:forced-colors:data-checked:border-2",
        plain: "",
      },
    },
    defaultVariants: { variant: "outlined" },
  },
);

/**
 * What holds an option's `picture`.
 *
 * `outlined` rounds and clips it, and gives an `<img>` placed directly inside
 * a square, cover-fitted box the tile's width, so photos of any shape make
 * even rows. Anything else, a drawing or a swatch, keeps its own shape. `plain`
 * neither clips nor shapes: a consumer's frame, and a stamp hung over its
 * corner, show whole.
 */
export const radioTilePictureVariants = /* @__PURE__ */ cva("rst:block rst:w-full rst:min-w-0", {
  variants: {
    variant: {
      outlined:
        "rst:overflow-hidden rst:rounded-md rst:[&>img]:block rst:[&>img]:aspect-square rst:[&>img]:w-full rst:[&>img]:object-cover",
      plain: "",
    },
  },
  defaultVariants: { variant: "outlined" },
});

/**
 * The tiles' grid.
 *
 * `columns` reads a count per breakpoint from custom properties the component
 * sets, so any count works without a class per number. `width` fills each row
 * with as many tiles as fit at a minimum width, which follows the space the
 * group is given rather than the viewport, and never lets a tile overflow a
 * container narrower than that minimum.
 */
export const radioTileGroupOptionsVariants = /* @__PURE__ */ cva("rst:grid rst:gap-3", {
  variants: {
    fit: {
      columns:
        "rst:grid-cols-[repeat(var(--rst-tiles-cols),minmax(0,1fr))] rst:sm:grid-cols-[repeat(var(--rst-tiles-cols-sm),minmax(0,1fr))] rst:md:grid-cols-[repeat(var(--rst-tiles-cols-md),minmax(0,1fr))] rst:lg:grid-cols-[repeat(var(--rst-tiles-cols-lg),minmax(0,1fr))]",
      width: "rst:grid-cols-[repeat(auto-fill,minmax(min(var(--rst-tiles-min),100%),1fr))]",
    },
  },
  defaultVariants: { fit: "columns" },
});
