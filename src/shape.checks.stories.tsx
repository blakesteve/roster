import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { Button } from "./components/atoms/Button/Button";
import { Checkbox } from "./components/atoms/Checkbox/Checkbox";
import { InlineCode } from "./components/atoms/InlineCode/InlineCode";
import { Input } from "./components/atoms/Input/Input";
import { PasswordInput } from "./components/atoms/PasswordInput/PasswordInput";
import { Textarea } from "./components/atoms/Textarea/Textarea";
import { Select } from "./components/atoms/Select/Select";
import { Badge } from "./components/atoms/Badge/Badge";
import { Card } from "./components/atoms/Card/Card";
import { Avatar } from "./components/atoms/Avatar/Avatar";
import { Switch } from "./components/atoms/Switch/Switch";
import { Alert } from "./components/molecules/Alert/Alert";
import { Toast } from "./components/molecules/Toast/Toast";
import { EmptyState } from "./components/molecules/EmptyState/EmptyState";
import { LabeledDivider } from "./components/atoms/LabeledDivider/LabeledDivider";
import { Dialog } from "./components/organisms/Dialog/Dialog";
import { Sheet } from "./components/organisms/Sheet/Sheet";

/**
 * Each shape token, set to a value nothing else produces, followed by every
 * site that should read it (src/index.css, the Shape block). The expected
 * values are literals: what an app that sets the token must see.
 *
 * Every check has a failing twin, the same measurement where the answer
 * must differ: each site read before the token is set, which must give the
 * value it had on 5.2.1 (so the check can tell a site that follows from one
 * that was already there, and an unset app is pinned as unchanged in
 * Chromium), and something that must not follow at all, such as a variant
 * with no lift or a width that is deliberately not 1px.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page, run
 * by the test runner. Story-only styling is inline, so none of it ships in
 * roster.css.
 */
const meta = {
  title: "Internal/Shape tokens/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

/* Readings are taken right after a token changes, so nothing may tween. Only
   mounted while a check story is, so it touches nothing else. */
const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";

function Site({ name, children }: { name: string; children: ReactNode }) {
  return <div data-site={name}>{children}</div>;
}

function Gallery() {
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 420, padding: 16 }}>
      <style>{STILL}</style>
      <Site name="button-xs"><Button size="xs">Go</Button></Site>
      <Site name="button"><Button>Save</Button></Site>
      <Site name="button-outline"><Button variant="outline">Cancel</Button></Site>
      <Site name="button-soft"><Button variant="soft">Later</Button></Site>
      <Site name="checkbox"><Checkbox checked={false} onChange={noop} aria-label="Agree" /></Site>
      <Site name="inline-code"><InlineCode surface="soft">npm run build</InlineCode></Site>
      <Site name="alert"><Alert onDismiss={noop}>Saved.</Alert></Site>
      <Site name="toast"><Toast onDismiss={noop}>Sent.</Toast></Site>
      <Site name="password"><PasswordInput label="Password" /></Site>
      <Site name="input"><Input label="Name" /></Site>
      <Site name="textarea"><Textarea label="Message" /></Site>
      <Site name="select"><Select label="Team" options={options} value={null} onChange={noop} /></Site>
      <Site name="badge"><Badge>New</Badge></Site>
      <Site name="card"><Card>Body</Card></Site>
      <Site name="avatar"><Avatar initials="AB" /></Site>
      <Site name="switch"><Switch checked={false} onChange={noop} ariaLabel="Alerts" /></Site>
      <Site name="empty"><EmptyState title="Nothing here" /></Site>
      <Site name="divider"><LabeledDivider label="Or" /></Site>
      <Site name="divider"><LabeledDivider label="Or" align="end" /></Site>
    </div>
  );
}

function at(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`no element for ${selector}`);
  return found;
}

/** Sets each token on <html> for the length of `run`, optionally in dark. */
async function withTokens(tokens: Record<string, string>, run: () => Promise<void>, dark = false) {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
  if (dark) root.classList.add("dark");
  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await run();
  } finally {
    for (const name of Object.keys(tokens)) root.style.removeProperty(name);
    if (dark && !wasDark) root.classList.remove("dark");
  }
}

const corners = (el: Element) => {
  const cs = getComputedStyle(el);
  return [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
};
const widths = (el: Element) => {
  const cs = getComputedStyle(el);
  return [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth];
};

/* Each radius step gets a value no other step has, so a site reading the
   wrong step fails as surely as one reading none. */
const RADIUS: Record<string, string> = { sm: "7px", md: "9px", lg: "11px", xl: "13px", "2xl": "15px", "3xl": "17px" };
const RADIUS_TOKENS = Object.fromEntries(Object.entries(RADIUS).map(([step, v]) => [`--roster-radius-${step}`, v]));
/* What each step drew on 5.2.1, and draws for an app that sets nothing. */
const RADIUS_UNSET: Record<string, string> = { sm: "4px", md: "6px", lg: "8px", xl: "12px", "2xl": "16px", "3xl": "24px" };

/** The sites that must round at `step`, as `name: selector`. */
async function checkRadius(step: string, sites: Record<string, string>) {
  const unset = RADIUS_UNSET[step];
  for (const [name, selector] of Object.entries(sites)) {
    await expect(corners(at(selector)), `${name}, unset`).toEqual([unset, unset, unset, unset]);
  }
  await withTokens(RADIUS_TOKENS, async () => {
    const want = RADIUS[step];
    for (const [name, selector] of Object.entries(sites)) {
      await expect(corners(at(selector)), `${name} at ${step}`).toEqual([want, want, want, want]);
    }
  });
}

export const RadiusSm: Story = {
  render: () => <Gallery />,
  /* The six that were a bare `rounded` before this release, and so followed
     no token. */
  play: () =>
    checkRadius("sm", {
      "Button xs": "[data-site=button-xs] button",
      "Checkbox md": "[data-site=checkbox] [role=checkbox]",
      "InlineCode soft": "[data-site=inline-code] > *",
      "Alert's dismiss": "[data-site=alert] button[aria-label=Dismiss]",
      "Toast's dismiss": "[data-site=toast] button[aria-label=Dismiss]",
      "PasswordInput's toggle": '[data-site=password] button[aria-label="Show password"]',
    }),
};

export const RadiusMd: Story = {
  render: () => <Gallery />,
  play: () =>
    checkRadius("md", {
      Button: "[data-site=button] button",
      Input: "[data-site=input] input",
      Textarea: "[data-site=textarea] textarea",
      "Select's trigger": "[data-site=select] button[aria-haspopup]",
      Badge: "[data-site=badge] > *",
    }),
};

export const RadiusLg: Story = {
  render: () => <Gallery />,
  play: () =>
    checkRadius("lg", {
      Alert: "[data-site=alert] > *",
      Toast: "[data-site=toast] > *",
      EmptyState: "[data-site=empty] > *",
    }),
};

export const RadiusXl: Story = {
  render: () => <Gallery />,
  play: () => checkRadius("xl", { Card: "[data-site=card] > *" }),
};

export const Radius2xl: Story = {
  render: () => (
    <>
      <Gallery />
      <Dialog isOpen onClose={noop} title="Rename">
        Body
      </Dialog>
    </>
  ),
  play: () => checkRadius("2xl", { "Dialog's panel": '[role=dialog] [class~="rst:rounded-2xl"]' }),
};

/* No component draws a 3xl corner, so this checks the utility itself, on a
   probe. `rst:rounded-3xl` is already in roster.css, so the probe ships
   nothing new. */
export const Radius3xl: Story = {
  render: () => (
    <>
      <Gallery />
      <div data-site="probe-3xl" className="rst:rounded-3xl" style={{ width: 40, height: 40 }} />
    </>
  ),
  play: () => checkRadius("3xl", { "the rounded-3xl utility": "[data-site=probe-3xl]" }),
};

export const BorderWidth: Story = {
  render: () => <Gallery />,
  play: async () => {
    const one = ["1px", "1px", "1px", "1px"];
    const bordered = {
      "Button solid": "[data-site=button] button",
      "Button outline": "[data-site=button-outline] button",
      Input: "[data-site=input] input",
      Textarea: "[data-site=textarea] textarea",
      Checkbox: "[data-site=checkbox] [role=checkbox]",
      Card: "[data-site=card] > *",
      Badge: "[data-site=badge] > *",
      Avatar: "[data-site=avatar] > *",
      Toast: "[data-site=toast] > *",
    };
    /* Both alignments: each draws its rule from its own line. */
    const rules = () => Array.from(document.querySelectorAll("[data-site=divider] [role=presentation]"));
    /* Twin: unset, every one is the 1px it was. */
    for (const [name, selector] of Object.entries(bordered)) {
      await expect(widths(at(selector)), `${name}, unset`).toEqual(one);
    }
    await expect(rules().map((r) => getComputedStyle(r).height), "LabeledDivider's rules, unset").toEqual(["1px", "1px"]);
    await expect(getComputedStyle(at("[data-site=select] button[aria-haspopup]")).boxShadow, "Select's edge, unset").toContain(
      "0px 0px 0px 1px inset",
    );

    await withTokens({ "--roster-border-width": "3px" }, async () => {
      const all = ["3px", "3px", "3px", "3px"];
      await expect(rules().map((r) => getComputedStyle(r).height), "LabeledDivider's rules").toEqual(["3px", "3px"]);
      for (const [name, selector] of Object.entries({
        "Button solid": "[data-site=button] button",
        "Button outline": "[data-site=button-outline] button",
        Input: "[data-site=input] input",
        Textarea: "[data-site=textarea] textarea",
        Checkbox: "[data-site=checkbox] [role=checkbox]",
        Card: "[data-site=card] > *",
        Badge: "[data-site=badge] > *",
        Avatar: "[data-site=avatar] > *",
        Toast: "[data-site=toast] > *",
      })) {
        await expect(widths(at(selector)), name).toEqual(all);
      }

      /* Select's trigger draws its edge as an inset ring, a box-shadow
         spread, and its focus ring is the edge plus a pixel. */
      const trigger = at("[data-site=select] button[aria-haspopup]");
      await expect(getComputedStyle(trigger).boxShadow, "Select's trigger edge").toContain("0px 0px 0px 3px inset");
      trigger.focus();
      await expect(trigger.matches(":focus-visible"), "the trigger shows focus").toBe(true);
      await expect(getComputedStyle(trigger).boxShadow, "Select's focus ring").toContain("0px 0px 0px 4px inset");
      trigger.blur();

      /* The anchored panel Select opens draws its edge the same way. */
      await userEvent.click(trigger);
      const panel = at("[role=listbox]");
      await expect(getComputedStyle(panel).boxShadow, "the open panel's edge").toContain("0px 0px 0px 3px");
      await userEvent.keyboard("{Escape}");

      /* Deliberately other widths stay what they are. */
      await expect(widths(at("[data-site=empty] > *")), "EmptyState's dashed 2px").toEqual(["2px", "2px", "2px", "2px"]);
      await expect(widths(at("[data-site=switch] [role=switch]")), "Switch's 2px inset").toEqual(["2px", "2px", "2px", "2px"]);
    });
  },
};

export const ElevationControl: Story = {
  render: () => <Gallery />,
  play: async () => {
    const hard = "rgb(255, 0, 0) 5px 5px 0px 0px";
    /* Tailwind's shadow-sm, as Chromium computes it: what these controls had
       on 5.2.1. */
    const soft = "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px";
    const controls = {
      "Button solid": "[data-site=button] button",
      "Button outline": "[data-site=button-outline] button",
      "Select's trigger": "[data-site=select] button[aria-haspopup]",
      Avatar: "[data-site=avatar] > *",
      "Switch's thumb": "[data-site=switch] [role=switch] > span",
    };
    for (const [name, selector] of Object.entries(controls)) {
      await expect(getComputedStyle(at(selector)).boxShadow, `${name}, unset`).toContain(soft);
    }
    await withTokens({ "--roster-elevation-control": "5px 5px 0 0 rgb(255 0 0)" }, async () => {
      for (const [name, selector] of Object.entries(controls)) {
        await expect(getComputedStyle(at(selector)).boxShadow, name).toContain(hard);
      }
      /* The trigger keeps its ring beside the new shadow. */
      await expect(getComputedStyle(at("[data-site=select] button[aria-haspopup]")).boxShadow).toContain("inset");
      await expect(getComputedStyle(at("[data-site=button-soft] button")).boxShadow, "twin: soft has no lift").not.toContain(hard);
      /* A card is a surface, not a control. */
      await expect(getComputedStyle(at("[data-site=card] > *")).boxShadow, "twin: Card").not.toContain(hard);
    });
  },
};

const dialogBackdrop = () => at('[class*="--roster-backdrop,"]');
const sheetBackdrop = () => at('[data-testid="sheet-backdrop"]');
const SCRIM = "rgba(1, 2, 3, 0.5)";

function DialogOnly({ variant }: { variant?: "glass" }) {
  return (
    <>
      <style>{STILL}</style>
      <Dialog isOpen onClose={noop} title="Rename" variant={variant} status={variant ? undefined : "destructive"}>
        Body
      </Dialog>
    </>
  );
}

export const BackdropBlur: Story = {
  render: () => <DialogOnly />,
  play: async () => {
    await withTokens({ "--roster-backdrop-blur": "13px" }, async () => {
      await expect(getComputedStyle(dialogBackdrop()).backdropFilter).toBe("blur(13px)");
    });
    /* Twin: unset, the 8px it was. */
    await expect(getComputedStyle(dialogBackdrop()).backdropFilter, "unset").toBe("blur(8px)");
    /* Dialog's destructive status bar is a deliberate 4px: a border width
       token moves its other three sides and leaves it alone. */
    await withTokens({ "--roster-border-width": "3px" }, async () => {
      await expect(widths(at('[role=dialog] [class~="rst:rounded-2xl"]'))).toEqual(["4px", "3px", "3px", "3px"]);
    });
  },
};

export const BackdropBlurGlass: Story = {
  render: () => <DialogOnly variant="glass" />,
  /* Twin: glass's backdrop has no blur, the panel's own blur is the point of
     it, so the token must not add one. */
  play: () =>
    withTokens({ "--roster-backdrop-blur": "13px" }, async () => {
      await expect(getComputedStyle(dialogBackdrop()).backdropFilter).toBe("none");
    }),
};

async function checkScrim(backdrop: () => HTMLElement) {
  for (const dark of [false, true]) {
    await withTokens({ "--roster-backdrop": SCRIM }, async () => {
      await expect(getComputedStyle(backdrop()).backgroundColor, dark ? "dark" : "light").toBe(SCRIM);
    }, dark);
  }
}

export const BackdropDialog: Story = {
  render: () => <DialogOnly />,
  play: async () => {
    await checkScrim(dialogBackdrop);
    /* Twin: Sheet's older name moves Sheet only. Dialog never read it. */
    await withTokens({ "--roster-sheet-backdrop": SCRIM }, async () => {
      await expect(getComputedStyle(dialogBackdrop()).backgroundColor).not.toBe(SCRIM);
    });
  },
};

export const BackdropDialogGlass: Story = {
  render: () => <DialogOnly variant="glass" />,
  play: () => checkScrim(dialogBackdrop),
};

export const BackdropSheet: Story = {
  render: () => (
    <>
      <style>{STILL}</style>
      <Sheet isOpen onClose={noop} title="Filters">
        Body
      </Sheet>
    </>
  ),
  play: async () => {
    await checkScrim(sheetBackdrop);
    /* The older name still works for Sheet. */
    await withTokens({ "--roster-sheet-backdrop": SCRIM }, async () => {
      await expect(getComputedStyle(sheetBackdrop()).backgroundColor).toBe(SCRIM);
    });
    /* And the new name wins over it, so an app moving between them can set
       both for a while. */
    await withTokens({ "--roster-sheet-backdrop": "rgb(9 9 9)", "--roster-backdrop": SCRIM }, async () => {
      await expect(getComputedStyle(sheetBackdrop()).backgroundColor).toBe(SCRIM);
    });
  },
};
