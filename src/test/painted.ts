/* Colors as Chromium paints them, for checks that measure contrast in the
   browser. Shared by every check that composites layers rather than reading
   one computed color. */

/* One pixel, reused. A check reading a thousand fields makes tens of
   thousands of reads, and a fresh canvas for each ran WebKit out of canvas
   memory mid-check (`getImageData` threw InvalidStateError). */
let pixel: CanvasRenderingContext2D | null = null;
function blank(): CanvasRenderingContext2D {
  if (!pixel) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    pixel = canvas.getContext("2d", { willReadFrequently: true })!;
  }
  pixel.clearRect(0, 0, 1, 1);
  /* A color the canvas can't parse leaves `fillStyle` as it was. On a fresh
     canvas that was black; reused, it would be the last read's color. */
  pixel.fillStyle = "#000000";
  return pixel;
}

/** Paints `layers` bottom to top on one pixel and reads it back, so any CSS
    color the browser can compute, with any alpha, composites as the page does. */
export function paint(layers: string[]): number[] {
  const ctx = blank();
  for (const color of layers) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
  }
  return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
}

/** Background colors from `el` up to the first opaque one, bottom first. */
export function backgroundOf(el: Element): string[] {
  const layers: string[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    layers.unshift(color);
    if (paint(["rgb(0, 0, 0)", color]).join() === paint(["rgb(255, 255, 255)", color]).join()) break;
  }
  return layers;
}

type RGBA = [number, number, number, number];

/** A CSS color as the browser resolves it: 0-255 channels and a 0-1 alpha. */
export function rgba(color: string): RGBA {
  const ctx = blank();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/* Source over: `top` painted on `under`. */
function over(top: RGBA, under: RGBA): RGBA {
  const a = top[3] + under[3] * (1 - top[3]);
  if (a === 0) return [0, 0, 0, 0];
  const mix = (i: number) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a;
  return [mix(0), mix(1), mix(2), a];
}

/** How much of `el` reaches the page: its own `opacity` times every ancestor's. */
export function opacityOf(el: Element): number {
  let o = 1;
  for (let node: Element | null = el; node; node = node.parentElement) o *= Number(getComputedStyle(node).opacity);
  return o;
}

/**
 * `el`'s text color as one CSS color: its own alpha times `opacityOf(el)`.
 * For a check that builds its own ground (a sibling under the text, say) and
 * paints this over it. Exact while the faded elements paint no background of
 * their own under the text; `textOn` composites those too.
 */
export function inkOf(el: Element, color = getComputedStyle(el).color): string {
  const [r, g, b, a] = rgba(color);
  return `rgba(${r}, ${g}, ${b}, ${a * opacityOf(el)})`;
}

/**
 * The color of `el`'s text and of the ground just beside it, as painted: every
 * background from the page's white canvas up to `el`, the text on top, and
 * each element's `opacity` applied as the browser applies it, to everything it
 * holds as one layer over what's behind it. `getComputedStyle(el).color`
 * alone misses all of that: a percent at `opacity-60` read 7.63:1 there and
 * paints 2.88:1.
 *
 * `color` stands in for the text's own color, a `::placeholder`'s say.
 * Backgrounds are colors only: an image or a gradient isn't read.
 *
 * `under` is an element painted beneath `el` that isn't one of its ancestors:
 * the input a field's icon is positioned over, say. The walk up from `el`
 * never meets it, so without it the icon reads against the page, not the
 * field. Its branch is painted in where it leaves `el`'s, before `el`'s own.
 */
export function textOn(el: Element, color = getComputedStyle(el).color, under?: Element): { ink: number[]; ground: number[] } {
  const chain = ancestry(el);
  const below = under ? ancestry(under) : [];
  /* The last element both chains share: `under`'s branch starts below it. */
  let fork = -1;
  while (fork + 1 < Math.min(chain.length, below.length) && chain[fork + 1] === below[fork + 1]) fork++;
  if (under && fork >= below.length - 1) throw new Error("textOn: `under` is `el` or one of its ancestors, which the walk meets anyway");
  const layer = (nodes: Element[], i: number, behind: RGBA, top: (behind: RGBA) => RGBA): RGBA => {
    const style = getComputedStyle(nodes[i]);
    const opacity = Number(style.opacity);
    /* An element below full opacity paints into a layer of its own, which
       then goes over what's behind it at that opacity. */
    let here: RGBA = opacity < 1 ? [0, 0, 0, 0] : behind;
    here = over(rgba(style.backgroundColor), here);
    if (under && nodes === chain && i === fork) here = layer(below, i + 1, here, (b) => b);
    here = i < nodes.length - 1 ? layer(nodes, i + 1, here, top) : top(here);
    return opacity < 1 ? over([here[0], here[1], here[2], here[3] * opacity], behind) : here;
  };
  const canvas: RGBA = [255, 255, 255, 1];
  return {
    ink: layer(chain, 0, canvas, (b) => over(rgba(color), b)).slice(0, 3),
    ground: layer(chain, 0, canvas, (b) => b).slice(0, 3),
  };
}

/* `el` and every ancestor, the root first. */
function ancestry(el: Element): Element[] {
  const chain: Element[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) chain.unshift(node);
  return chain;
}

/** `el`'s text against the ground beside it, as `textOn` composites them. */
export function textContrast(el: Element, color?: string, under?: Element): number {
  const { ink, ground } = textOn(el, color, under);
  return contrast(ink, ground);
}

export function luminance([r, g, b]: number[]) {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: number[], b: number[]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
