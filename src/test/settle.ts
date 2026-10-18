/* Timing for checks that read a ring, or the absence of one. */

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Waits for an element's running transitions to finish, so a read is of where
 * they end rather than a frame on the way. Bounded, so a looping animation
 * can't hang a check. Enough for a read that expects a ring, polled with
 * `waitFor`; NOT enough for one that expects none (see `heldOff`).
 */
export async function settled(el: Element) {
  for (let i = 0; i < 10; i++) {
    const running = el.getAnimations().filter((a) => a.playState === "running");
    if (!running.length) return;
    await Promise.race([Promise.all(running.map((a) => a.finished.catch(() => undefined))), sleep(1000)]);
  }
}

/* The default ease every Roster ring takes, and the floor of a hold: a ring
   whose element declares no transition can still arrive a beat late. */
const RING_EASE_MS = 150;

const toMs = (list: string) => list.split(",").map((v) => (v.trim().endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000) || 0);

/**
 * For a read that expects NO ring. `settled` returns at once when nothing is
 * running, which is also true on the frame before a transition starts, so a
 * no-ring read taken then passes whatever comes next. This waits past the
 * longest transition the element declares (its duration plus its delay), and
 * at least the 150ms a ring takes to ease in, then two frames more, then lets
 * anything that started run out. A ring on its way by the time this returns
 * has arrived.
 */
export async function heldOff(el: Element) {
  const style = getComputedStyle(el);
  const durations = toMs(style.transitionDuration);
  const delays = toMs(style.transitionDelay);
  const longest = Math.max(RING_EASE_MS, ...durations.map((d, i) => d + (delays[i % delays.length] ?? 0)));
  await sleep(longest);
  await frame();
  await frame();
  await settled(el);
}
