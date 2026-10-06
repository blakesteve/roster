/**
 * When a Roster field is invalid, and where it says so. Every field component
 * follows this one rule; a new field should too.
 *
 * A field is invalid when any of these hold:
 *
 * - it shows an error: an `errorMessage`, or the `error` flag;
 * - the consumer passes `aria-invalid` with any value but `false`, `"false"`
 *   or `""` (ARIA reads an empty value as false). `"grammar"` and
 *   `"spelling"` count, and come out as `"true"`: a field is invalid or it
 *   isn't;
 * - the consumer passes Headless UI's own `invalid`.
 *
 * An error wins: a field with one is invalid even when the consumer passes
 * `aria-invalid="false"`.
 *
 * An invalid field renders `aria-invalid="true"` on the control a screen
 * reader focuses, so it is announced as invalid along with its error text,
 * not only drawn in red. A valid one renders no `aria-invalid` at all. The
 * only exception is a role that can't carry the state: a radio can't, so a
 * radio group says it on the group.
 *
 * Read the consumer's props here, not by spreading them: the props of most
 * fields land on a wrapper with no role, where `aria-invalid` does nothing,
 * and Headless UI's text controls overwrite a passed `aria-invalid` with
 * their own.
 */

export interface InvalidProps {
  "aria-invalid"?: unknown;
  invalid?: unknown;
}

export function isFieldInvalid(hasError: boolean | null | undefined, props: InvalidProps): boolean {
  if (hasError) return true;
  if (props.invalid) return true;
  const aria = props["aria-invalid"];
  return aria !== undefined && aria !== null && aria !== false && aria !== "false" && aria !== "";
}

/**
 * Splits the two invalid props off the rest, so the rest can be spread on a
 * wrapper without them landing where they mean nothing.
 */
export function withoutInvalidProps<T extends object>(props: T): Omit<T, "aria-invalid" | "invalid"> {
  const rest = { ...props } as Record<string, unknown>;
  delete rest["aria-invalid"];
  delete rest.invalid;
  return rest as Omit<T, "aria-invalid" | "invalid">;
}
