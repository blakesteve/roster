import { describe, expect, it, vi } from "vitest";

/**
 * No variant table loses its own line height. `cn()` runs tailwind-merge, which
 * drops a `leading-*` that comes before a font size, because a size can carry
 * a line height of its own. A table that puts `leading-none` in its base and
 * the size in a variant therefore never applies it: Eyebrow and Stat did,
 * through 5.7.0, and drew their lines at 1.5 instead of 1.
 *
 * Every `cva` table is recorded as the source imports it, every combination of
 * its variants goes through `cn()`, and any `leading-*` the table wrote that
 * `cn()` removed is reported. The twin is a table written the old way, which
 * must be.
 */

type Table = { base: string; variants: Record<string, Record<string, string | string[]>> };
const tables: Table[] = [];
const flat = (value: unknown) => (Array.isArray(value) ? value.join(" ") : String(value ?? ""));

vi.mock("class-variance-authority", async (original) => {
  const real = (await original()) as typeof import("class-variance-authority");
  const record = ((base: unknown, config?: { variants?: Table["variants"] }) => {
    tables.push({ base: flat(base), variants: config?.variants ?? {} });
    return real.cva(base as never, config as never);
  }) as typeof real.cva;
  return { ...real, cva: record };
});

async function droppedLeading(table: Table): Promise<string[]> {
  const { cn } = await import("./lib/utils");
  let combos: string[][] = [[]];
  for (const options of Object.values(table.variants)) {
    combos = combos.flatMap((combo) => Object.values(options).map((value) => [...combo, flat(value)]));
  }
  const dropped = new Set<string>();
  for (const combo of combos) {
    const written = [table.base, ...combo].join(" ").split(/\s+/).filter(Boolean);
    const kept = new Set(cn(written.join(" ")).split(/\s+/));
    for (const cls of written) if (/(^|:)leading-/.test(cls) && !kept.has(cls)) dropped.add(`${cls} in "${table.base}"`);
  }
  return [...dropped];
}

describe("variant tables keep their line heights", () => {
  it("in every table in the library", async () => {
    /* The same files twice: Vite's glob takes only literals. */
    const modules = import.meta.glob(["./components/**/*.{ts,tsx}", "./internal/**/*.{ts,tsx}", "!./**/*.stories.tsx", "!./**/*.test.*"]);
    for (const load of Object.values(modules)) await load();
    /* Reach: every `cva(` call in the source was recorded, so a module that
       failed to load can't hide its table. Eyebrow's and Stat's among them. */
    const raw = import.meta.glob<string>(["./components/**/*.{ts,tsx}", "./internal/**/*.{ts,tsx}", "!./**/*.stories.tsx", "!./**/*.test.*"], {
      query: "?raw",
      import: "default",
      eager: true,
    });
    const calls = Object.values(raw).reduce((n, text) => n + (text.match(/cva\(\s*(?:$|["`[])/gm)?.length ?? 0), 0);
    expect(calls).toBeGreaterThan(0);
    expect(tables.length).toBe(calls);
    expect(tables.some((t) => t.base.includes("rst:font-mono rst:uppercase"))).toBe(true);
    expect(tables.some((t) => t.base.includes("rst:font-bold rst:tracking-[-0.04em] rst:tabular-nums"))).toBe(true);
    const dropped = (await Promise.all(tables.map(droppedLeading))).flat();
    expect(dropped).toEqual([]);
  });

  it("twin: a table with its line height before its size is caught", async () => {
    const { cva } = await import("class-variance-authority");
    cva("rst:uppercase rst:leading-none", { variants: { size: { xs: "rst:text-[0.625rem]" } } });
    expect(await droppedLeading(tables.at(-1)!)).toEqual(['rst:leading-none in "rst:uppercase rst:leading-none"']);
  });
});
