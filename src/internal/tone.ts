/**
 * The five tones a color scheme gives a tinted or plain control, set on it as
 * custom properties so each look is written once rather than once per scheme.
 *
 * - `--rst-tone`: the 500 step, for fills and edges.
 * - `--rst-tone-strong`: an edge hovered or pressed, the 600 step in light and
 *   400 in dark.
 * - `--rst-tone-ink`: the label, the 700 step in light (800 for amber, teal and
 *   orange, which clear 4.5:1 only there), and 300 in dark.
 * - `--rst-tone-plain`: a plain label's rest in dark, the 400 step. In light it
 *   is `--rst-tone-ink`.
 * - `--rst-tone-ink-2`: a step past `--rst-tone-ink`, for a hovered or pressed
 *   label: 800 (900 for those three) in light, and 300 in dark, 100 for neutral.
 *
 * Read from the ramp where the control sits, as every color class is, so a
 * ramp set on one control reaches only that one.
 */
export const TONE = {
  primary: "rst:[--rst-tone:theme(--color-primary-500)] rst:[--rst-tone-strong:theme(--color-primary-600)] rst:dark:[--rst-tone-strong:theme(--color-primary-400)] rst:[--rst-tone-ink:theme(--color-primary-700)] rst:dark:[--rst-tone-ink:theme(--color-primary-300)] rst:dark:[--rst-tone-plain:theme(--color-primary-400)] rst:[--rst-tone-ink-2:theme(--color-primary-800)] rst:dark:[--rst-tone-ink-2:theme(--color-primary-300)]",
  orange: "rst:[--rst-tone:theme(--color-orange-500)] rst:[--rst-tone-strong:theme(--color-orange-600)] rst:dark:[--rst-tone-strong:theme(--color-orange-400)] rst:[--rst-tone-ink:theme(--color-orange-800)] rst:dark:[--rst-tone-ink:theme(--color-orange-300)] rst:dark:[--rst-tone-plain:theme(--color-orange-400)] rst:[--rst-tone-ink-2:theme(--color-orange-900)] rst:dark:[--rst-tone-ink-2:theme(--color-orange-300)]",
  teal: "rst:[--rst-tone:theme(--color-teal-500)] rst:[--rst-tone-strong:theme(--color-teal-600)] rst:dark:[--rst-tone-strong:theme(--color-teal-400)] rst:[--rst-tone-ink:theme(--color-teal-800)] rst:dark:[--rst-tone-ink:theme(--color-teal-300)] rst:dark:[--rst-tone-plain:theme(--color-teal-400)] rst:[--rst-tone-ink-2:theme(--color-teal-900)] rst:dark:[--rst-tone-ink-2:theme(--color-teal-300)]",
  purple: "rst:[--rst-tone:theme(--color-purple-500)] rst:[--rst-tone-strong:theme(--color-purple-600)] rst:dark:[--rst-tone-strong:theme(--color-purple-400)] rst:[--rst-tone-ink:theme(--color-purple-700)] rst:dark:[--rst-tone-ink:theme(--color-purple-300)] rst:dark:[--rst-tone-plain:theme(--color-purple-400)] rst:[--rst-tone-ink-2:theme(--color-purple-800)] rst:dark:[--rst-tone-ink-2:theme(--color-purple-300)]",
  amber: "rst:[--rst-tone:theme(--color-amber-500)] rst:[--rst-tone-strong:theme(--color-amber-600)] rst:dark:[--rst-tone-strong:theme(--color-amber-400)] rst:[--rst-tone-ink:theme(--color-amber-800)] rst:dark:[--rst-tone-ink:theme(--color-amber-300)] rst:dark:[--rst-tone-plain:theme(--color-amber-400)] rst:[--rst-tone-ink-2:theme(--color-amber-900)] rst:dark:[--rst-tone-ink-2:theme(--color-amber-300)]",
  success: "rst:[--rst-tone:theme(--color-success-500)] rst:[--rst-tone-strong:theme(--color-success-600)] rst:dark:[--rst-tone-strong:theme(--color-success-400)] rst:[--rst-tone-ink:theme(--color-success-700)] rst:dark:[--rst-tone-ink:theme(--color-success-300)] rst:dark:[--rst-tone-plain:theme(--color-success-400)] rst:[--rst-tone-ink-2:theme(--color-success-800)] rst:dark:[--rst-tone-ink-2:theme(--color-success-300)]",
  error: "rst:[--rst-tone:theme(--color-error-500)] rst:[--rst-tone-strong:theme(--color-error-600)] rst:dark:[--rst-tone-strong:theme(--color-error-400)] rst:[--rst-tone-ink:theme(--color-error-700)] rst:dark:[--rst-tone-ink:theme(--color-error-300)] rst:dark:[--rst-tone-plain:theme(--color-error-400)] rst:[--rst-tone-ink-2:theme(--color-error-800)] rst:dark:[--rst-tone-ink-2:theme(--color-error-300)]",
  neutral: "rst:[--rst-tone:theme(--color-gray-500)] rst:[--rst-tone-strong:theme(--color-gray-600)] rst:dark:[--rst-tone-strong:theme(--color-gray-400)] rst:[--rst-tone-ink:theme(--color-gray-700)] rst:dark:[--rst-tone-ink:theme(--color-gray-300)] rst:dark:[--rst-tone-plain:theme(--color-gray-400)] rst:[--rst-tone-ink-2:theme(--color-gray-800)] rst:dark:[--rst-tone-ink-2:theme(--color-gray-100)]",
} as const;
