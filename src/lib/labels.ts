/**
 * A component's own words with an app's replacements laid over them. An entry
 * passed as `undefined` (a translation catalog missing a key, say) keeps the
 * default: a plain spread would let it through, leaving a control unnamed, or
 * throwing where a function label is called.
 */
export function withLabels<L extends object>(defaults: L, overrides?: Partial<L>): L {
  const merged = { ...defaults };
  if (overrides) {
    for (const key of Object.keys(overrides) as (keyof L)[]) {
      const value = overrides[key];
      if (value !== undefined) merged[key] = value as L[keyof L];
    }
  }
  return merged;
}
