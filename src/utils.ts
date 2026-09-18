/**
 * Utilities, shipped from their own entry.
 *
 * This entry has no `"use client"` directive and no React, so `cn` is callable
 * from either side of the boundary.
 *
 * It used to be the only way to get that. The package entry carried the
 * directive, which made everything exported from the root a client reference:
 * importing `cn` from there and calling it inside a React Server Component
 * typechecked, then threw at render. The directive now sits on the modules
 * that need it, so the root resolves through a bare barrel to this same
 * module and works too.
 *
 * The entry stays because it is the narrower import, and because it can not be
 * affected by a later change to what the barrel does.
 */
export { cn } from "./lib/utils";
