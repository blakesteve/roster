import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
/* The package's entry exports these (key-focus.test.ts pins that); imported
   from the module here, so a check doesn't load the whole library. */
import { KEY_FOCUS, useKeyFocus } from "./key-focus";
import { realInputOrSkip } from "../test/real-input";
import { heldOff, settled } from "../test/settle";

/**
 * The keyboard-mode tracker in a consumer's own control, checked with the
 * real mouse and keys in Chromium and WebKit.
 *
 * The control is drawn by hand, the way a consumer's is: a dial whose stops
 * rove focus by script on the arrows, its ring from the consumer's stylesheet
 * on the variant the README gives, `:is(:focus-visible, [data-key-focus])`.
 * Click a stop, press an arrow, and read the ring on the stop the arrow
 * focused.
 *
 * - **With `useKeyFocus` mounted, it rings in both engines.**
 * - **The twin, the same dial without it, rings in Chromium and not in
 *   WebKit:** the case the hook exists for. Nothing else on the page mounts
 *   the tracker, so nothing marks the stop in either engine.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Keyboard focus/A consumer's control",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* The consumer's ring, on the consumer's variant. */
const RING = `[data-dial-stop]:is(:focus-visible, [${KEY_FOCUS}]) { outline: 2px solid #2563eb; outline-offset: 2px; }`;

const STOPS = [
  { name: "North", left: 62, top: 0 },
  { name: "East", left: 124, top: 62 },
  { name: "South", left: 62, top: 124 },
  { name: "West", left: 0, top: 62 },
];

function Dial({ label }: { label: string }) {
  const [at, setAt] = useState(0);
  const stops = useRef<(HTMLDivElement | null)[]>([]);
  const go = (i: number) => {
    const next = (i + STOPS.length) % STOPS.length;
    setAt(next);
    stops.current[next]?.focus();
  };
  return (
    <>
      <style>{RING}</style>
      <div
        role="radiogroup"
        aria-label={label}
        style={{ position: "relative", width: 160, height: 160, borderRadius: "50%", border: "1px solid #a8a29e" }}
        onKeyDown={(e) => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          go(at + step);
        }}
      >
        {STOPS.map((stop, i) => (
          <div
            key={stop.name}
            ref={(el) => {
              stops.current[i] = el;
            }}
            role="radio"
            aria-checked={i === at}
            aria-label={stop.name}
            tabIndex={i === at ? 0 : -1}
            data-dial-stop=""
            onClick={() => go(i)}
            style={{
              position: "absolute",
              left: stop.left,
              top: stop.top,
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: i === at ? "#1c1917" : "#f5f5f4",
              color: i === at ? "#fafaf9" : "#1c1917",
              cursor: "pointer",
            }}
          >
            {stop.name[0]}
          </div>
        ))}
      </div>
    </>
  );
}

function HookedDial() {
  useKeyFocus();
  return <Dial label="With the hook" />;
}

/* A visible outline, 2px or wider: the consumer's ring. */
const ringed = (el: Element) => {
  const style = getComputedStyle(el);
  return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2;
};
const chromium = () => /Chrome/.test(navigator.userAgent);

/* Click North, press the right arrow: script focuses East. */
async function clickThenArrow(real: NonNullable<ReturnType<typeof realInputOrSkip>>) {
  const group = within(document.body).getByRole("radiogroup");
  const [north, east] = within(group).getAllByRole("radio");
  north.setAttribute("data-check", "north");
  await real.commands.realClick('[data-check="north"]');
  await real.commands.realPress(["ArrowRight"]);
  return { north, east };
}

export const AConsumersControlRingsWithTheHook: Story = {
  tags: ["real-input"],
  render: () => <HookedDial />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const { north, east } = await clickThenArrow(real);
    await settled(east);
    await heldOff(north);
    console.info(`KEY FOCUS consumer, hooked | ${chromium() ? "chromium" : "webkit"} | east focused ${document.activeElement === east}, marked ${east.hasAttribute(KEY_FOCUS)}, ringed ${ringed(east)}; north ringed ${ringed(north)}`);
    /* East has focus and its ring, in both engines; North, clicked and left, has none. */
    await expect([document.activeElement === east, ringed(east), ringed(north)]).toEqual([true, true, false]);
  },
};

export const WithoutItWebKitDrawsNoRing: Story = {
  tags: ["real-input"],
  render: () => <Dial label="Without the hook" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const { east } = await clickThenArrow(real);
    await heldOff(east);
    console.info(`KEY FOCUS consumer, bare | ${chromium() ? "chromium" : "webkit"} | east focused ${document.activeElement === east}, marked ${east.hasAttribute(KEY_FOCUS)}, ringed ${ringed(east)}`);
    /* Nothing marks it in either engine; Chromium's own :focus-visible rings it,
       WebKit's doesn't. */
    await expect([document.activeElement === east, east.hasAttribute(KEY_FOCUS), ringed(east)]).toEqual([true, false, chromium()]);
  },
};
