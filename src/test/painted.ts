/* Colors as Chromium paints them, for checks that measure contrast in the
   browser. Shared by every check that composites layers rather than reading
   one computed color. */

/** Paints `layers` bottom to top on one pixel and reads it back, so any CSS
    color the browser can compute, with any alpha, composites as the page does. */
export function paint(layers: string[]): number[] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
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

export function luminance([r, g, b]: number[]) {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: number[], b: number[]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
