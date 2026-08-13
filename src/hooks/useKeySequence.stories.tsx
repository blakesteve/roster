import { useState, useSyncExternalStore } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useKeySequence, KONAMI_CODE } from "./useKeySequence";
import { Input } from "../components/atoms/Input/Input";
import { InlineCode } from "../components/atoms/InlineCode/InlineCode";
import { Pill } from "../components/atoms/Pill/Pill";

const meta = {
  title: "Hooks/useKeySequence",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Fires a callback when a sequence of `KeyboardEvent.key` values is typed in order.",
          "",
          "```tsx",
          'useKeySequence(["g", "i"], () => router.push("/inbox"));',
          "useKeySequence(KONAMI_CODE, () => setPartyMode(true));",
          "```",
          "",
          "Three things it is good for: navigation chords in the Gmail tradition (`g` then `i`), debug shortcuts you do not want discoverable, and easter eggs.",
          "",
          "**Click into a story before typing.** The listener is on `window`, so the Storybook preview iframe has to have focus for any of these to fire.",
          "",
          "### Behavior worth knowing",
          "",
          "**A wrong key resets progress — unless it starts the sequence.** Typing `g g i` still reaches the end, because the second `g` begins a fresh attempt rather than costing one. Without that rule, any sequence with a repeated opening key would be unreachable for anyone who fumbles once.",
          "",
          "**Progress expires.** After `timeout` (1500ms) of silence, partial progress is discarded. A chord completed across two minutes is not a chord, it is a coincidence. Pass `timeout: 0` if you genuinely want it to wait forever.",
          "",
          "**Typing is not a shortcut.** Keystrokes aimed at an `<input>`, `<textarea>`, `<select>`, or a contenteditable are ignored by default. A shortcut that fires while someone is filling in a form is a bug.",
          "",
          "**Case is ignored by default.** People hold shift by accident, and `\"B\"` is almost never a different intent from `\"b\"`.",
          "",
          "### Notes",
          "",
          "`sequence` is a dependency of the listener effect, so an inline array literal rebinds it on every render. That is harmless — progress lives in a ref and survives the rebind — but hoist the array to module scope or wrap it in `useMemo` if the component renders often.",
          "",
          "Call the hook more than once to register more than one sequence; they are independent and track their own progress.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const HINT =
  "font-mono text-[0.625rem] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400";

/* Hoisted so the listener effect is not rebound on every render. */
const GI = ["g", "i"] as const;
const GS = ["g", "s"] as const;
const DEBUG = ["d", "e", "b", "u", "g"] as const;

function NavigationChords() {
  const [route, setRoute] = useState("/");

  useKeySequence(GI, () => setRoute("/inbox"));
  useKeySequence(GS, () => setRoute("/settings"));

  return (
    <div className="flex flex-col gap-3">
      <p className={HINT}>
        Click here, then press <InlineCode>g</InlineCode>{" "}
        <InlineCode>i</InlineCode> or <InlineCode>g</InlineCode>{" "}
        <InlineCode>s</InlineCode>
      </p>
      <div className="flex items-center gap-2">
        <span className={HINT}>Current route</span>
        <Pill colorScheme={route === "/" ? "neutral" : "success"}>{route}</Pill>
      </div>
    </div>
  );
}

export const NavigationChord: Story = {
  render: () => <NavigationChords />,
  parameters: {
    docs: {
      description: {
        story:
          "Two sequences sharing a first key, registered by two separate calls. They track progress independently, so `g` advances both and the second key decides which one fires.",
      },
    },
  },
};

function KonamiDemo() {
  const [unlocked, setUnlocked] = useState(false);

  useKeySequence(KONAMI_CODE, () => setUnlocked(true), { preventDefault: true });

  return (
    <div className="flex flex-col gap-3">
      <p className={HINT}>
        ↑ ↑ ↓ ↓ ← → ← → <InlineCode>b</InlineCode> <InlineCode>a</InlineCode>{" "}
        <InlineCode>Enter</InlineCode>
      </p>
      <div
        className={[
          "flex h-24 items-center justify-center rounded-lg border transition-colors",
          unlocked
            ? "border-success-500 bg-success-50 dark:bg-success-950"
            : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900",
        ].join(" ")}
      >
        {unlocked ? (
          <Pill dot pulse colorScheme="success">
            Unlocked
          </Pill>
        ) : (
          <span className={HINT}>Locked</span>
        )}
      </div>
    </div>
  );
}

export const Konami: Story = {
  render: () => <KonamiDemo />,
  parameters: {
    docs: {
      description: {
        story: [
          "`KONAMI_CODE` ships as a convenience constant, terminated with `Enter` the way the arcade original terminated with Start.",
          "",
          "`preventDefault: true` is set here because the arrow keys would otherwise scroll the page out from under you mid-sequence. Note that it only fires on keys that *advance* the sequence, so arrow keys still scroll normally when nothing is in progress.",
        ].join("\n"),
      },
    },
  },
};

/* Whether the browser's focus is somewhere the guard considers "typing". Read
   from the DOM rather than mirrored into state, so it cannot drift. */
function subscribeFocus(onStoreChange: () => void) {
  document.addEventListener("focusin", onStoreChange);
  document.addEventListener("focusout", onStoreChange);
  return () => {
    document.removeEventListener("focusin", onStoreChange);
    document.removeEventListener("focusout", onStoreChange);
  };
}

function readTyping() {
  const el = document.activeElement;
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
  );
}

function readTypingServer() {
  return false;
}

function TypingGuard() {
  const [guarded, setGuarded] = useState(0);
  const [unguarded, setUnguarded] = useState(0);
  const typing = useSyncExternalStore(subscribeFocus, readTyping, readTypingServer);

  // Deliberately the same sequence twice. The only difference between the two
  // rows is the option, so anything you see is the option and nothing else.
  useKeySequence(DEBUG, () => setGuarded((n) => n + 1));
  useKeySequence(DEBUG, () => setUnguarded((n) => n + 1), {
    ignoreWhenTyping: false,
  });

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Input label="A text field" placeholder="Type: debug" />

      <div className="flex items-center gap-2">
        <span className={HINT}>Focus is</span>
        <Pill dot colorScheme={typing ? "amber" : "neutral"}>
          {typing ? "in the text field" : "on the page"}
        </Pill>
      </div>

      <dl className="m-0 grid grid-cols-[1fr_auto] items-baseline gap-y-2 border-t border-gray-200 pt-3 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-300">
        <dt>
          <InlineCode>d e b u g</InlineCode> — guarded, the default
        </dt>
        <dd className="m-0 text-right tabular-nums text-gray-900 dark:text-gray-100">
          {guarded}
        </dd>
        <dt>
          <InlineCode>d e b u g</InlineCode> —{" "}
          <InlineCode>ignoreWhenTyping: false</InlineCode>
        </dt>
        <dd className="m-0 text-right tabular-nums text-gray-900 dark:text-gray-100">
          {unguarded}
        </dd>
      </dl>

      <p className="m-0 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Type <InlineCode>debug</InlineCode> in the field: only the second counter
        moves. Click the page and type it again: both move. Same sequence, same
        keys, one option apart.
      </p>
    </div>
  );
}

export const IgnoresTyping: Story = {
  render: () => <TypingGuard />,
  parameters: {
    docs: {
      description: {
        story: [
          "Both rows listen for the *same* sequence and differ only in `ignoreWhenTyping`, so the gap between the two counters is the guard and nothing else.",
          "",
          "The default is on for a reason: someone writing *\"debugging this now\"* into a comment box should not trip your debug panel. Turn it off only for sequences that cannot collide with real text — arrow keys, or a modifier-led chord.",
          "",
          "The guard covers `<input>`, `<textarea>`, `<select>`, and contenteditable. It is checked against `event.target`, not the focused element, so a key routed somewhere unexpected is judged on where it actually landed.",
        ].join("\n"),
      },
    },
  },
};

function TimeoutDemo() {
  const [fast, setFast] = useState(0);
  const [patient, setPatient] = useState(0);

  useKeySequence(GI, () => setFast((n) => n + 1), { timeout: 400 });
  useKeySequence(GS, () => setPatient((n) => n + 1), { timeout: 0 });

  return (
    <div className="flex max-w-md flex-col gap-3">
      <p className={HINT}>Click here first</p>
      <dl className="m-0 grid grid-cols-[1fr_auto] items-baseline gap-y-2 text-xs text-gray-700 dark:text-gray-300">
        <dt>
          g i — <InlineCode>timeout: 400</InlineCode>
        </dt>
        <dd className="m-0 text-right tabular-nums text-gray-900 dark:text-gray-100">
          {fast}
        </dd>
        <dt>
          g s — <InlineCode>timeout: 0</InlineCode>
        </dt>
        <dd className="m-0 text-right tabular-nums text-gray-900 dark:text-gray-100">
          {patient}
        </dd>
      </dl>
      <p className="m-0 max-w-prose text-xs text-gray-500 dark:text-gray-400">
        Press <InlineCode>g</InlineCode>, wait a second, then press the second
        key. The 400ms sequence has already given up; the untimed one is still
        waiting.
      </p>
    </div>
  );
}

export const Timeout: Story = {
  render: () => <TimeoutDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The default 1500ms suits a two-key chord typed deliberately. Shorten it for sequences that should feel like a single gesture; disable it with `timeout: 0` for a long easter egg where the user is figuring it out as they go.",
      },
    },
  },
};

function EnabledDemo() {
  const [armed, setArmed] = useState(true);
  const [count, setCount] = useState(0);

  useKeySequence(GI, () => setCount((n) => n + 1), { enabled: armed });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={armed}
          onChange={(event) => setArmed(event.target.checked)}
        />
        Listener enabled
      </label>
      <div className="flex items-center gap-2">
        <span className={HINT}>g i fired</span>
        <Pill colorScheme={count > 0 ? "success" : "neutral"}>{count}</Pill>
      </div>
    </div>
  );
}

export const Enabled: Story = {
  render: () => <EnabledDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "`enabled: false` removes the listener without unmounting the component, which is how you suspend shortcuts while a modal is open or a game is paused. Partial progress does not survive being disarmed.",
      },
    },
  },
};
