/* Declared here rather than through Node's types: the library runs in the
   browser, and this is the one name it reads. */
declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether this is a development build of the consuming app, for warnings
 * that cost something to check and say nothing a user needs.
 *
 * Written as `process.env.NODE_ENV` in full, because that's the expression a
 * consumer's bundler replaces (Vite, webpack, Next). Roster's own build leaves
 * it alone, so the consumer's build decides. A page with no bundler and no
 * `process` counts as development.
 */
export function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return true;
  }
}
