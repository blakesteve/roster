/**
 * DataTable lives behind its own entry point: `@blakesteve/roster/data-table`.
 *
 * It is the only component that needs TanStack Table, which Roster declares as
 * an optional peer dependency. A static re-export from the main entry would
 * make that peer mandatory in practice — a consumer's bundler resolves imports
 * before it tree-shakes, so `import { Button } from "@blakesteve/roster"` would
 * fail with "Cannot resolve '@tanstack/react-table'" in an app that has no
 * tables at all. Splitting the entry keeps the cost with the component.
 *
 * Consumers of DataTable install the peer themselves:
 *
 * ```bash
 * npm install @tanstack/react-table
 * ```
 *
 * ```tsx
 * import { DataTable, type RosterTableFeatures } from "@blakesteve/roster/data-table";
 * ```
 */
export * from "./components/organisms/DataTable/DataTable";
