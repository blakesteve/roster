/**
 * Small, real image files for stories and checks: drawn on a canvas, so a
 * thumbnail has something to show and no fixture has to be checked in.
 * Browser only.
 */
import type { RealFile } from "./real-input";

/** A landscape-ish picture in `hue`: sky, a horizon, a sun. */
export async function samplePhoto(
  name: string,
  hue: number,
  { type = "image/jpeg", size = 160 }: { type?: "image/jpeg" | "image/png"; size?: number } = {},
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, `hsl(${hue} 70% 78%)`);
  sky.addColorStop(1, `hsl(${(hue + 30) % 360} 60% 52%)`);
  g.fillStyle = sky;
  g.fillRect(0, 0, size, size);
  g.fillStyle = `hsl(${(hue + 50) % 360} 85% 88%)`;
  g.beginPath();
  g.arc(size * 0.7, size * 0.35, size * 0.12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = `hsl(${(hue + 180) % 360} 30% 28%)`;
  g.beginPath();
  g.moveTo(0, size * 0.75);
  g.quadraticCurveTo(size * 0.4, size * 0.55, size, size * 0.72);
  g.lineTo(size, size);
  g.lineTo(0, size);
  g.fill();
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), type, 0.85));
  return new File([blob], name, { type, lastModified: 1_700_000_000_000 + hue });
}

/** A file of `bytes` zero bytes, for a size rule. */
export const sizedFile = (name: string, bytes: number, type = "image/jpeg") =>
  new File([new Uint8Array(bytes)], name, { type, lastModified: 1_700_000_000_000 + bytes });

/** A file as the real-input commands take it. */
export async function asRealFile(file: File): Promise<RealFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return { name: file.name, mimeType: file.type, base64: btoa(binary) };
}

/** Puts `files` in a file input the way a script can: through a DataTransfer, then `change`. */
export function pickFiles(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
