/**
 * Utilities, shipped from their own entry.
 *
 * The main bundle carries a `"use client"` directive, because the modules
 * inside it do and the bundler hoists the directive to the top of the chunk.
 * That makes everything exported from `@blakesteve/roster` a client reference,
 * which is correct for components but wrong for a plain function: importing
 * `cn` from the root and calling it inside a React Server Component
 * typechecks, then throws at render.
 *
 * This entry has no directive and no React, so `cn` is callable from either
 * side. It is still re-exported from the root for existing consumers.
 */
export { cn } from "./lib/utils";
