# @blakesteve/roster ✦

A production-grade atomic component library built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.

Roster ships a curated set of accessible, theme-aware components organized around the Atomic Design methodology (atoms, molecules, and organisms), each with Storybook documentation and full test coverage.

## Features

- **Atomic Design**: components organized as atoms, molecules, and organisms
- **TypeScript first**: fully typed props with exported variant types for maximum DX
- **Adaptive dark mode**: class-based toggling (`.dark`) independent of OS preferences
- **`"use client"` pre-bundled**: all outputs include the directive for seamless Next.js App Router integration
- **Accessible**: interactive components powered by [`@headlessui/react`](https://headlessui.com) and [`@radix-ui`](https://radix-ui.com)
- **Tree-shakeable**: import only what you need

## Installation

```bash
npm install @blakesteve/roster
```

Roster ships pre-compiled CSS, so you do not need Tailwind installed in your host app to use it.

### Peer dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

`DataTable` additionally needs TanStack Table v9, declared as an **optional**
peer. It ships from its own entry point so that peer stays genuinely optional:
importing anything from `@blakesteve/roster` never pulls TanStack in, because a
bundler resolves imports before it tree-shakes. Install it only if you use
`DataTable`; every other component works without it.

```bash
npm install @tanstack/react-table
```

```tsx
import {
  DataTable,
  type RosterTableFeatures,
} from "@blakesteve/roster/data-table";
```

It is a peer rather than a bundled dependency because v9 types column
definitions against the feature set that built the table. Two copies of the
package would mean two incompatible sets of those types, so roster and your
app have to resolve the same one.

## Setup

Import Roster's CSS once at the root of your application (`layout.tsx`, `main.tsx`, or `App.tsx`):

```tsx
// Compiled component styles (always required)
import "@blakesteve/roster/style.css";

// Default design tokens (color palette, spacing, radius)
// Omit this if you are supplying your own --roster-* CSS variables
import "@blakesteve/roster/tokens.css";
```

### Cascade layers

Roster ships its styles inside a `roster` cascade layer and declares the full
layer order in its own stylesheet, so importing it is normally enough:

```css
/* globals.css */
@import "@blakesteve/roster/tokens.css";
@import "@blakesteve/roster/style.css";
@import "tailwindcss";
```

The order Roster declares is:

```css
@layer roster-preflight, theme, base, components, roster, utilities;
```

`roster` has to sit in that exact slot. **Above `base`**, because Tailwind's
preflight resets `*{margin:0;padding:0;border:0 solid}` — put Roster below it
and that reset outranks Roster's own spacing and border utilities, silently
stripping padding off buttons and turning `border-transparent` into a visible
1px line. **Below `utilities`**, so your app's classes and variants such as
`dark:hidden` still win.

Layers are ordered by _first registration_, so importing Roster before Tailwind
is the reliable arrangement. If you would rather not depend on import order at
all, declare the same line yourself at the top of your global stylesheet and it
holds regardless.

### The global reset is opt-in

Roster ships **no** preflight. A component library has no business resetting
its host's document, so importing Roster will not change your headings, lists,
or box sizing.

Roster's components do assume that normalization exists, though. If your app
runs Tailwind, you already have it and there is nothing to do. If it does not,
opt in, before the component styles:

```tsx
import "@blakesteve/roster/preflight.css";
import "@blakesteve/roster/style.css";
```

Skip it and components render against browser defaults: serif type, bulleted
lists, and `content-box` sizing.

### Dark mode

Every component reads a `.dark` class on an ancestor, so dark mode is whatever
puts that class on your document root. `ThemeToggle` is the component that does
it, and it persists the choice to `localStorage`:

```tsx
import { ThemeToggle } from "@blakesteve/roster";

<ThemeToggle />;
```

A toggle alone cannot prevent a flash of the wrong theme on first paint, because
the class has to be on `<html>` before React runs. Add a blocking script to your
document head:

```html
<script>
  try {
    var s = localStorage.getItem("roster-theme");
    var dark = s
      ? s === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
</script>
```

If you pass a custom `storageKey`, change the script to match — a mismatch means
the script and the toggle disagree, which shows up as a flash on every reload.

**Components that render into a portal**, such as `Select`'s menu, are attached
to `<body>` rather than to the element you wrote them next to. When `.dark` is
on `<html>` — what `ThemeToggle` does, and what the script above sets up — that
makes no difference, because the portal is still a descendant. If you scope
`.dark` to a subtree instead, `Select` detects the nearest `.dark` ancestor of
the field and carries it across the portal, so the menu follows the same scope
the trigger is in.

That mechanism carries the `.dark` CLASS across the portal. It does not carry
custom properties: `--roster-popover-*` and any other variable you scope to a
container reach the trigger and stop at the portal boundary, because the panel
is not a descendant of your container. Set those at `:root`. See
[Floating surface colors](#floating-surface-colors).

`Navbar`'s `themeMode` prop is a different thing: it describes what palette the
bar paints _itself_ with. Pair them with `themeMode="auto"` and the nav follows
whatever `ThemeToggle` sets.

### The three font roles

Roster exposes three type roles, each settable with one custom property:

| role | variable | used by |
| ---- | -------- | ------- |
| UI | `--roster-font-ui` | controls, labels, table cells |
| Mono | `--roster-font-mono` | `Eyebrow`, `InlineCode`, `Stat`, `Pullquote`, `DescriptionList`, `MatchupCard`, `Countdown` |
| Display | `--roster-font-display` | nothing yet — yours to apply with `rst:font-display` |

```css
:root {
  --roster-font-ui: "Public Sans", ui-sans-serif, system-ui, sans-serif;
  --roster-font-mono: "JetBrains Mono", ui-monospace, monospace;
  --roster-font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}
```

Set none of them and nothing changes: UI and display fall back to a system sans
stack, mono to Tailwind's own default. That matters more than it sounds for the
UI role — without it, controls would inherit whatever your app puts on `body`,
and an app that reads in a serif would get serif buttons and serif badges.

Motion moved the same way. The two knobs a consumer is meant to set are now
`--roster-enter-duration` and `--roster-enter-easing`; they were
`--rst-enter-duration` and `--rst-enter-easing`. The rest of the `--rst-enter-*`
family is untouched on purpose — `opacity`, `scale` and the translates are
written *by* the `fade-in-*` and `zoom-in-*` utilities, so they are
implementation, not API.

**Mono moved namespace, and that is a small breaking change.** It used to
resolve through `--rst-font-mono`, a Tailwind-internal variable. That did work
if you found it — it was undocumented, and it was Roster's to rename at any
time. Nothing reads it any more, so an app that set `--rst-font-mono` must move
to `--roster-font-mono`. Setting neither is unaffected: the fallback is
Tailwind's own default stack, byte for byte.

**Display is deliberately unused by the library.** No component asks for it, so
setting it changes nothing on its own — it exists so an app can put headings,
figures and names in a face distinct from its body text, and reach them with
`rst:font-display`. Roster force-emits that one utility, because Tailwind
generates only what it finds in the source it scans, and your build has never
heard of `--roster-font-display`.

Its fallback is a copy of the UI stack rather than a reference to it, because
theme values are inlined and `var(--font-ui)` would not resolve. Setting
`--roster-font-ui` alone therefore does not change `rst:font-display`; set both
if you want them to agree.

`Card` and `Link` opt out of all of this and inherit, because they wrap your
content and that text is not Roster's to restyle.

### Solid fill contrast

`solid` is the one variant where a component picks both the background and the
text on it, so it can fail contrast on its own with no help from your app. Every
solid fill in `Badge`, `Pill`, `Chip`, `Toast` and `Button` is measured against WCAG AA
(4.5:1)
by `src/contrast.test.ts`, at rest **and** on hover, in both themes.

`Checkbox` is measured too, at 3:1 rather than 4.5:1 — its tick is a graphical
object under WCAG 1.4.11, not text. It used to be excluded from the suite
entirely, which measured it against nothing.

`CallToAction` is **not** in that suite, and its light surface changed: the
fills moved a ramp step and the borders moved four, because the old surface
measured 1.03:1 against a light page with a 1.30:1 border — a banner you could
not see. **Installing this version changes how your existing CTAs look**, the
same way the 1.4.11 pass changed every field in 4.8.2. Its `info` variant also
moves from Tailwind's stock `blue-*` to Roster's `info-*`, so it now answers to
`--roster-info-*` like every other scheme.

Worth knowing what that border step is and is not. It is a **prominence**
decision, not a 1.4.11 one: a tinted banner is not a control, so the criterion
no longer reaches it once the surface has a fill. A call to action is the one
component whose job is to be looked at first, so it is deliberately the most
defined bordered block in the library. The filled surfaces it sits beside are
much fainter — `Card` soft at 1.04:1, `ErrorState` at 1.39:1, `Toast` and
`Pill` between 1.34:1 and 1.82:1. `Alert` is the closest, and only because its
4px left stripe is already a `-500`, at 6.10:1 for primary.

`CallToAction` and `Countdown` also lay themselves out with **CSS container
queries** rather than `md:` and `sm:`. The switch is now the CARD's width, not
the window's — a 228px card on a 1200px page used to lay out as a row and
squeeze its own text until it overflowed. Three things follow:

- **The breakpoint number changed** from a 768px viewport to a 512px card. A
  CTA in a narrow page column will stack where it did not before.
- **`container-type: inline-size` collapses inside a content-sized ancestor.**
  Give any `width: fit-content`, `inline-block` or table-cell ancestor a
  definite width, or the card measures zero.
- **Container queries are required**: Chrome 105+, Safari 16+, Firefox 110+.
  Without them a `CallToAction` renders in its narrow form at every width.

#### Ink follows the fill

The foreground is a token per fill, not per family:

```css
/* Only after you have retinted `primary` to something light. Against Roster's
   own primary these would be 2.08:1 and 2.84:1 — the tokens do not check your
   arithmetic, they just stop you having to fight a hardcoded `text-white`. */
:root {
  --roster-primary-600-ink: #10142e;   /* the fill Button and Checkbox rest on */
  --roster-primary-500-ink: #10142e;   /* Badge and Pill's rest fill, and where
                                          Button hovers in dark mode */
}
```

Keyed by fill because the right ink flips partway up three of the nine ramps:
`orange`, `purple` and `success` all want dark ink at 500 and white at 600. A
per-family token would be wrong for those three — and it is why `Pill` and
`Button` legitimately disagreed about `success` before this existed. Pill fills
at 500 and Button at 600, so they reached opposite and equally correct answers.

Every fill carries the foreground it always had, so nothing changes until you set
one. Hover and dark mode each resolve against *their own* fill, so a scheme whose
hover moves to a lighter shade picks up that shade's ink automatically.

This matters when you retheme. Roster's own choice of white or `gray-950` was
made against Roster's colors, and `--roster-*` exists precisely so you can
replace those. Two apps remapped `primary` and got a sub-AA fill nobody noticed
until it was measured by hand: BB Blue put white at 3.66:1 on a dark-mode hover,
and a gold `primary` failed at every state, worst at 2.10:1.

They reached for opposite remedies, which is the clearest argument for the
token. One moved the *fill* so white stayed readable; the other overrode
`text-white` from its own stylesheet to darken the *ink*. Only one of those was
expressible in Roster, and neither survives an upgrade. Setting the ink token is
the supported way now.

##### Upgrading

**If you override a solid variant's foreground from your own stylesheet, that
rule stops matching.** Solid Button, Badge, Pill and Checkbox no longer carry
`rst:text-white` or `rst:text-gray-950`, so a selector naming either matches
nothing. It fails silently, and it fails *partially*: those classes are still on
`Card`, `Navbar`, `Dialog`, `ActionBar`, `Avatar`, `LiquidTabs` and
`Breadcrumbs`, so a themed foreground keeps working there while reverting on
every solid control. Replace the rule with the token:

```css
/* before */
.rst\:bg-primary-600.rst\:text-white { color: #10142e; }

/* after — and it covers hover and dark mode, which the rule above did not */
:root { --roster-primary-600-ink: #10142e; }
```

**If you pass a foreground through `className`, add the hover modifier.** Solid
variants now carry `hover:text-*`, and `tailwind-merge` resolves conflicts per
modifier, so a bare `rst:text-black` no longer holds through hover. Write
`rst:text-black rst:hover:text-black`, or set the ink tokens instead.

The `Foundations/Solid fill contrast` story measures rendered elements rather
than tokens, so pointing it at your palette reports _your_ ratios.

Note also that a solid fill's contrast against the surface _behind_ it is a
separate requirement (WCAG 1.4.11, 3:1) and is not covered here. Solid amber on
a white page is 1.67:1, so it has effectively no visible edge.

Form controls **are** covered for that requirement, separately: see
`--roster-control-border` under [Control surface colors](#control-surface-colors).

### Focus

Every focusable control draws the same ring: `--roster-ring` for the ring
itself, `--roster-ring-offset` for the 2px band that separates it from the
control's own fill. Both flip with the theme — `primary-500` on white in light,
`primary-400` on `gray-950` in dark — which puts the indicator at 6.37:1 and
7.31:1 against the surface either side of it, where WCAG 1.4.11 asks for 3:1.

Both tokens follow the **page**, which is right until a component deliberately
inverts against it. `Dialog`'s `slate` and `primary` are dark whatever the page
is doing, so on a light page they were handing their contents the light-mode
ring: `primary-500` on `gray-700` is **1.61:1**, and the white offset behind it
was 10.27:1, making the gap the most visible part of the indicator. Those two
variants now set both tokens on their own subtree, so a field inside them gets
3.80:1 and 4.04:1 instead. `white` and `glass` are left alone because they
follow the page like everything else.

If you build your own inverted surface, do the same on it:

```css
.my-dark-panel {
  --roster-ring: var(--roster-primary-400);
  --roster-ring-offset: /* that panel's own background */;
}
```

Retint it for your own accent:

```css
:root {
  --roster-ring: #7c3aed;
}
.dark {
  --roster-ring: #a78bfa;
}
```

Set it in **both** scopes. Roster's own `.dark` rule has the same specificity
and comes later in the stylesheet, so a `:root`-only override is silently
discarded in dark mode.

The band matters more than it looks. Without it the ring sits directly on the
fill, and a `primary-500` ring on a `primary-600` button is 1.37:1 — which is
why the ring and its offset are a pair rather than two independent knobs.

### Motion

Two hand-rolled utilities, both of which stop for `prefers-reduced-motion`.

`animate-in` is the entrance, composed from modifiers the way
`tailwindcss-animate` does it — one keyframe reading four custom properties, and
each modifier setting one, so `fade-in-0 zoom-in-95 slide-in-from-top-2` combine
into a single animation rather than three fighting over `transform`. `Tooltip`
uses it, keyed off Radix's `data-side` so the panel always rises from the side it
is anchored on.

The suffixes are that plugin's, kept so anyone arriving from it keeps their
vocabulary. Each one is the value the modifier animates from: `-0` is an opacity,
`95` is a scale percentage, and `-2` is a step on Tailwind's spacing scale, so
`slide-in-from-top-2` starts `0.5rem` above its resting position. Only the steps
Roster's own components need are implemented; adding `-4` or `zoom-in-90` is one
line each.

`animate-in` on its own does nothing, by design: with no modifier the keyframe's
start values are the element's resting state. It is the engine, and a modifier is
what gives it somewhere to start. It fills `backwards`, so `animation-delay` can
stagger a group without every item flashing at rest first.

The default duration is 150ms, matching the plugin. At that speed a `-2` slide
covers 8px, which is right for a tooltip and reads as a twitch on anything
larger — `Foundations/Motion` in Storybook has controls for duration, easing,
direction and stagger to find what suits a bigger surface.

It is hand-rolled rather than a dependency: seven utilities does not justify a
package in a library that ships compiled CSS, and it keeps the stylesheet
self-contained — the same reasoning as not bundling a preflight.

`animate-shimmer` is a highlight travelling across a base, used by `Countdown`'s
`gradient` variant. Retint it with two variables:

```css
:root {
  --roster-shimmer-base: #084063;
  --roster-shimmer-highlight: #9bcce9;
}
.dark {
  /* … */
}
```

The base is what carries the text whenever the highlight is elsewhere, so it has
to be readable on its own — it is also all you get under reduced motion, where
the sweep stops and the highlight parks off-frame. The highlight is deliberately
exempt from that bar: it is a specular pass on screen for a fraction of a second
per glyph, and holding it to 3:1 would flatten the effect.

### Scrollbars

`custom-scrollbar` gives any scrollable surface a slim themed scrollbar.
`Textarea` carries it already.

```css
:root {
  --roster-scrollbar-thumb: #0f6498;
}
.dark {
  --roster-scrollbar-thumb: #5ea3de;
}
```

Set it in both scopes — Roster's own `.dark` rule has equal specificity and comes
later, so a `:root`-only override is discarded in dark mode.

The default sits close to what the browser already draws, on purpose: a
component library should not repaint your scrollbars merely for being installed.
Color is the part that works everywhere. The 8px width and inset-pill thumb live
in a `::-webkit-scrollbar` block that only legacy engines reach. Every current
browser honors `scrollbar-width` / `scrollbar-color`, and drops the WebKit
pseudo-elements for any element that sets either of them, so on anything modern
`thin` is the whole shape control available.

### Control surface colors

`Input`, `PasswordInput`, `Textarea` and `Select` read these variables, so a
consumer can repaint a form control without restating the class list. Both
`outline` and `soft` read the border: `soft` used to be borderless and lean on
its fill alone, which fails the moment the fill matches the surface — a `soft`
field inside a `white` Dialog in dark mode was exactly 1.00:1 and invisible
until focus.

```css
:root {
  --roster-control-border: #65635f; /* gray-500 */
  --roster-control-bg: transparent;
  --roster-control-text: #1c1917;
  --roster-control-border-focus: #0f6498;
}
.dark {
  --roster-control-border: #a8a29e; /* gray-400 */
  --roster-control-bg: transparent;
  --roster-control-text: #f5f5f4;
  --roster-control-border-focus: #5ea3de; /* primary-400 */
}
```

`--roster-control-border` is the one token here whose two scopes hold different
values, and that is deliberate. WCAG 1.4.11 asks 3:1 to identify a control, and
a border has to move opposite its surface to get there: gray-500 reaches 5.99
on white but only 2.53 on a gray-800 Dialog, while gray-400 reaches 6.01 there
and 2.52 on white. No single step of the ramp clears 3:1 both ways. The old
gray-300 / gray-700 pair was 1.49 and 1.48 — a hairline rather than a boundary.

Set them in both scopes, for the same reason the scrollbar thumb needs both:
Roster's own `.dark` rule has equal specificity and comes later.

Three of the four still default to what the components used to hardcode.
`--roster-control-border` does not — the 1.4.11 pass moved it two ramp steps —
so installing this version **does** change how your fields look, deliberately. Placeholder color, the error state, and the
focus ring are deliberately not on tokens — the ring is already
`--roster-ring`, and error styling should stay recognizably an error.

Not every control uses every token: `Select` takes the first three, because
focus on its trigger is the shared `--roster-ring` rather than a border color,
and it draws the border as a ring rather than a border.
One family rather than one per component is deliberate — these controls sit in
the same row of the same form and are drawn to look identical, so being able to
repaint one and not the other would be a bug, not a choice.

`outline` reads all four. `soft` reads the border only, because a boundary is
the one thing a filled field cannot supply for itself on an arbitrary surface;
`white`, `slate` and `ghost` stay opinionated. `Checkbox` reads the border too,
for its unchecked box. Historically `outline` was the only reader, and
it carries no hover fill. The other variants each name a concrete surface
(`white`, `soft`, `slate`, `ghost`) and stay opinionated: a token that meant
something different in each would not be a token.

One caveat worth knowing before you lean on these: like `--roster-card-*`,
`--roster-nav-*` and `--roster-footer-*`, they are declared outside
`@layer roster` and resolved at `:root`. A host that declares its override
inside `@layer base` is outranked, and an override scoped to a subtree rather
than the document root will not reach them.

### Floating surface colors

`Select`'s menu, `Dialog`'s `white` variant and `Tooltip`'s `themed` variant
read these, so one palette covers every panel that floats over the page.

```css
:root {
  --roster-popover-bg: #fff;
  --roster-popover-border: #e7e5e4;
  --roster-popover-text: #1c1917;
}
.dark {
  --roster-popover-bg: #292524;
  --roster-popover-border: #44403c;
  --roster-popover-text: #f5f5f4;
}
```

Separate from `--roster-control-*` on purpose, and the default is the reason:
`--roster-control-bg` is `transparent`, which is right for a field drawn on a
page and actively broken for a panel drawn over one. A control and the menu it
opens are also legitimately different surfaces in plenty of palettes.

**Set these at `:root`, not on a container.** The menu and the tooltip bubble
are portaled to `<body>`, so they are not descendants of whatever you rendered
the component inside: properties set on a wrapper reach the trigger and stop
there. Any ancestor of `<body>` works — `:root` is simply the one that always
is, which is also why the `.dark` block below reaches a menu whose `.dark`
scope `Select` copies across the portal. The result is a themed trigger opening an unthemed panel, which is the
exact problem this family exists to fix. Set them in both scopes too, for the
same reason the control family needs both.

Where each component takes them, and why not everywhere:

- **`Select`'s menu** has no variants, so it reads all three outright — panel
  fill, hairline, and the option labels, which are `text-inherit` so the text
  token actually reaches the only text in the panel.
- **`Dialog`** takes them in `white` only. `slate`, `primary` and `glass` each
  name a specific surface, and a token that meant something different inside
  each name would not be a token. The defaults are `white`'s previous values
  exactly, in both schemes, so nothing moves.
- **`Tooltip`** has a `themed` variant that reads them. Its `dark` and `light`
  variants are untouched: `dark` is the default, an inverted bubble that
  deliberately reads the same on a light or a dark page, and pointing that at a
  token whose light default is white would not theme it, it would delete it.

One appearance change ships with this: `Select`'s menu ring moves from
`black/5` to `--roster-gray-200` in light mode, which is the hairline the rest
of the library already draws.

### Reaching the control

`className` on a field component lands on the outer `Field` wrapper. That is
right for layout — width, flex, margins — and useless for anything else: it
cannot reach the element that draws the border, the height or the font.

Every field therefore has a second prop, **named for the element it reaches**:

| Component      | Wrapper     | The control itself   | Other inner parts   |
| -------------- | ----------- | -------------------- | ------------------- |
| `Input`        | `className` | `inputClassName`     | —                   |
| `PasswordInput`| `className` | `inputClassName`     | —                   |
| `Select`       | `className` | `triggerClassName`   | `optionsClassName`  |
| `Textarea`     | `className` | `textareaClassName`  | —                   |

`Select` is the first component with two styleable inner parts, which is the
case the naming scheme was chosen for: `optionsClassName` reaches the popup
panel. One caveat that is a property of Headless UI rather than of this prop —
the panel's `max-height` and `overflow` are written inline by its `size`
middleware, so a height passed here lands in the class list and is outranked.
To cap the menu, set the variable that inline rule reads:
`optionsClassName="rst:[--anchor-max-height:20rem]"`.

The names differ on purpose. A single `controlClassName` would name a concept
rather than an element, and it breaks the first time a component has two
styleable inner parts — a combobox has an input *and* a toggle. `triggerClassName`
also tells you something true: the thing you are styling is a `<button>`, so
`placeholder:` and `disabled:` behave differently on it than they would on an
`<input>`.

These merge last and win, not because they come later in the attribute (CSS
ignores that) but because `cn` is tailwind-merge and deletes the class they
conflict with.

### Control heights

`Button`, `Input` and `Select` share one size scale, so they line up when set
side by side in a row:

| `size`    | Height | `Button` padding | `Input` padding | `Select` padding |
| --------- | ------ | ---------------- | --------------- | ---------------- |
| `sm`      | 36px   | `px-3`           | `px-3`          | `pl-3 pr-9`      |
| `default` | 40px   | `px-4`           | `px-4`          | `pl-4 pr-10`     |
| `lg`      | 44px   | `px-8`           | `px-4`          | `pl-4 pr-10`     |

Padding diverges at `lg` on purpose. A button's label is centered and wants the
room, while a field's text is left-aligned and a wide inset only pushes the
caret toward the middle. `Select`'s right padding is clearance for the chevron,
which is a fixed 14px at every size, so it has nothing to grow for.

Unit tests assert the three components resolve to the same height at every
shared size, so they cannot drift apart. `Button` also has `xs` and `icon`,
which neither field has an equivalent for. `Textarea` is not on this scale — it
is multi-line, so the answer there is a min-height rather than a height.

### Toasts

Mount `Toaster` once near the root, then call `toast` from anywhere:

```tsx
import { Toaster, toast } from "@blakesteve/roster";

<Toaster position="bottom-right" />;

toast.success("Saved");
toast.error("That name is taken");
toast.info("Week 4 matchups are up");
toast.warning("Picks close in ten minutes");
```

It wraps [`react-hot-toast`](https://react-hot-toast.com), which is a **peer
dependency** — install it alongside Roster. It has to be external rather than
bundled: its queue lives in module scope, so a bundled copy would give you two
stores, and toasts fired from your own `import { toast } from "react-hot-toast"`
would silently never appear.

An app already using it keeps its call sites and only changes the import. What changes is
the styling: the toast body is a real `Toast` component reading `--roster-*`
rather than the inline hex each app was pinning.

Two of those four helpers are Roster's own. `react-hot-toast` ships `success`,
`error`, `loading` and `blank` — there is no `info` and no `warning`, so an app
that wants one improvises, and at least one improvised by calling `toast.error`
for `info`.

**Errors are announced assertively, everything else politely.** That is also
Roster's decision rather than the library's: `react-hot-toast` marks every
toast `status` / `polite`, and a polite live region is read when the reader
next pauses — which for a message that disappears in four seconds can mean
never.

`variant` on `Toaster` sets the fill for the whole queue:

- **`soft`** (default) — the tinted fill `Alert` uses. Quiet enough that a stack
  does not shout, which is the common case.
- **`solid`** — the `-500` fill and ink token, step for step with `Pill` and
  `Chip`. The one to reach for when toasts land over photography, video, or any
  surface the app does not own: `bg-success-50` is a whisper on a white page
  and illegible over an image.
- **`glass`** — a neutral translucent surface at 60% with a backdrop blur,
  matching `Dialog`'s variant of the same name. The tone lives on the **border
  only**; the surface and the text are neutral for every scheme.

Glass is neutral for a reason, and the border-only tone is the cost. Anything
whose contrast depends on the backdrop is a guess: a colored fill measured
2.60:1, and colored text on a neutral fill measured 2.81:1 — worse. Only the
neutral ink is safe in both directions, at 17.49 over white, 6.14 over black
and 9.22 over a brand color — 60% is as far as that allows, with 4.69 the worst
case in dark. If the tone needs to be unmistakable, use `solid`.

`src/contrast.test.ts` measures the `solid` fills and deliberately does not
measure `glass` — a number there would be a number for one background.

### Anchored popups share their internals

`Select`, `Combobox` and `MultiSelect` open the same panel, and deliberately
so: a combobox that opened a different-looking menu than a select on the same
form is the bug worth preventing. The panel classes, the option rows and the dark-mode carry
live in `src/internal/`, which is **not exported** — its contract is
with those components, not with you. The escape hatch you reach for is
`optionsClassName` on the component itself.

Two things in there are worth knowing about even from outside, because both
look like oversights until you know why:

- **The panel sets no `max-height` and no `overflow`.** Headless UI's `size`
  middleware writes both inline whenever `anchor` is set, so a utility would
  lose to it anyway. To cap a menu shorter than the viewport allows, set the
  variable that inline rule reads:
  `optionsClassName="rst:[--anchor-max-height:20rem]"`.
- **The panel is portaled to `<body>`**, so a `.dark` scoped to part of your
  page does not reach it. All three components copy the nearest `.dark` onto
  the panel to fix that. Custom properties are not carried the same way — set
  `--roster-popover-*` at `:root`.
- **`variant="slate"` opens on the dark palette**, in light mode too. That
  variant paints a dark trigger, and its panel was rendering white: a dark
  control opening a white sheet, which is the mismatch `--roster-popover-*`
  exists to prevent. The token family only ever covered the variant that reads
  tokens, and the ones that name a surface were left behind. It reuses the dark
  palette rather than introducing a slate one, because every option state there
  already exists and has already been measured.

### Two ways to select more than one thing

`MultiSelect` and `CheckboxGroup` both hold a set. They are not a fallback for
each other:

- **`MultiSelect`** when the field is one row of a form and the options do not
  need to be read at a glance. It costs a click to see the list, which is what
  makes it the right control for a dialog. Note that the default trigger still
  grows as chips wrap — `maxChips` or `display="count"` is what actually pins
  it to one row.
- **`CheckboxGroup`** when scanning every option matters more than saving the
  space, or when the options arrive in labeled categories. Nothing is hidden
  and nothing needs a click to be read.

Density is the axis, not correctness. The same eight sports are a good
`MultiSelect` in a cramped creation dialog and a good `CheckboxGroup` on a
settings page.

Swapping one for the other is not free, though, and it is worth saying which
parts move. `label`, `helperText` and `errorMessage` are the same three names
in both. The value types are not: `CheckboxGroup` is `string[]`, `MultiSelect`
is `(string | number)[]`, so state typed for one does not assign to the other.
Neither do the options — `CheckboxGroupOption` carries a `description` that
`SelectOption` has no field for, and `CheckboxGroup` additionally accepts
`{ category, options }` groups that `MultiSelect` cannot take at all. Headless
UI's `Listbox` has no grouping primitive, so option groups in the dropdown
would be Roster's to build.

#### MultiSelect

The same Headless UI `Listbox` as `Select`, with `multiple` set, opening the
same panel from `src/internal/popup.ts`. The panel stays open across picks;
clicking a selected option again removes it.

```tsx
<MultiSelect
  label="Sports"
  options={SPORTS}
  value={sports}
  onChange={setSports}
  maxChips={3}
  clearable
/>
```

Selections render as chips in the trigger, and each chip is individually
dismissible without opening the menu.

Getting that required a specific structure, and it is the interesting part of
the component. A dismiss control is a `<button>` and `ListboxButton` is a
button, so the chips cannot be its children — that pair is invalid HTML, and
browsers do not rescue it either: React builds the DOM through the DOM API
rather than the parser, which leaves it nested, so it would ship as a focusable
control whose every click also opens the listbox. So the trigger is a **shell**
with the `ListboxButton` stretched `inset-0` across it, and the chips are the
button's siblings drawn on top.

That keeps the button the full-width element, which matters more than it
sounds: Headless UI anchors the panel to the button and sizes it from
`--button-width`, and a trigger that stops being full width is how `Combobox`
once shipped a 20px unreadable menu. Measured after the change, the panel still
matches the field exactly.

Everything decorative in the shell is `pointer-events-none`, so a click on a
chip's label falls through and opens the menu like the rest of the field. Only
the dismiss controls take their events back. Each is named after its own chip —
a row of buttons all called "Remove" is a row a screen reader user cannot tell
apart — and `removeLabel` takes a function if "Remove NFL" is not the phrasing
you want. The chips are hidden from the trigger's accessible name, which
carries a punctuated summary instead: they are `inline-flex` spans, and name
computation joins them with no whitespace, so "NCAA Football" followed by "NBA"
announced as "FootballNBA".

The chips default to `outline` rather than a soft fill. The default trigger
paints `--roster-control-bg`, which is `transparent`, so a chip sits on
whatever the page is: a `soft neutral` chip is `gray-100`, which on this
library's own `gray-50` page is a 1.04:1 rectangle. It rendered, it measured
correct, and it could not be seen.

`outline`'s identity is a border rather than a fill, but that alone was not
enough either. Chip holds its border to 3:1 against a *page*, and this
component can be told to paint its own surface — `variant="slate"` paints
`gray-700`, byte-identical to the neutral chip's own `gray-700` label, which
rendered chip-shaped holes at 1.00:1. So the chips take `text-inherit` and
`border-current`, in both schemes, and cannot disagree with the surface they
were placed on. The dismiss and clear controls inherit the same way, because
the shell is what carries the trigger's color and they all sit inside it.
Measured across all five variants in both schemes: chip label 9.42 to 18.11,
chip border 4.33 to 8.99, glyphs 5.59 to 8.99.

Each dismiss control's hit area is grown to 31x28 with an invisible `::after`.
The glyph's own box is 15x12, and WCAG 2.5.8 asks 24x24 — the spacing exception
does not rescue it, because the trigger is another target sitting directly
underneath. That fix landed in `Chip` rather than here, so every dismissible
chip gets it.

`maxChips` collapses the tail into a `+N` chip and `display="count"` replaces
the chips with `N selected`, so a field with eight selections does not become
four rows tall. A selected value with no matching option renders as its own id
rather than vanishing from a field that still reports it.

#### CheckboxGroup

Three things it adds over the version mega-squad's squad form hand-rolled:

- **Each option is a Headless UI `Field`**, so its label is wired to its own
  checkbox and clicking the text toggles it. The pointer cursor sits on the
  label rather than on the row, because the label *is* the hit area: at two
  columns, a short option like `NFL` fills about a quarter of its grid cell,
  and a row-wide affordance would advertise the other three quarters as
  clickable.
- **Each category is a nested fieldset**, so `Football` is the accessible name
  of the group under it rather than a styled `div` a screen reader walks past.
  The heading is still a `<span>`, not a heading element, so it does not appear
  in a screen reader's heading list — the name is reachable by entering the
  group, which is what the nesting buys.
- **`errorMessage` reaches the fieldset** as `aria-describedby`, wired by hand
  rather than through Headless UI's `Description`. `Fieldset` collects
  descendant labels but never calls `useDescriptions` and provides no
  description context, so a `Description` dropped inside one throws rather than
  degrading quietly. Per-option `description` text does go through `Field`,
  which wires it properly — the distinction is real: a group description is
  announced on entering the group, an option's on focusing that checkbox.

  Both `aria-describedby` and `aria-invalid` are set **after** `...props` is
  spread, and the describedby is merged with any the caller passes. Set before,
  a caller's own `aria-describedby` would replace the error association with no
  type error and no warning: a group rendering red text and reporting itself
  valid.

`variant="panel"` draws the enclosing box for the long-list case. It
deliberately does not read `--roster-popover-*`: that family is for surfaces
that float over the page, and this one is in the flow, so it takes `Card`'s
`soft` fill. Its border is two ramp steps heavier than that card's, and that
part is not shared: a card's hairline separates content from the page, while
this one has to read as the wall a scroll region ends at.

`maxHeight` is applied inline rather than as a class, because the useful values
are arbitrary and a Tailwind class built from a prop is a class that does not
exist at build time. A capped panel takes a tab stop of its own — Chrome and
Firefox focus scrollers by themselves now, Safari does not, and a `disabled`
group has no focusable option to tab to at all, so the region would be
unscrollable from the keyboard.

`errorMessage` repaints less here than it does on `Input` or `Select`, on
purpose. `panel` gets an error border; `plain` has no boundary to repaint, so
the message is the whole error state. A checkbox is not the thing that is
invalid — the selection is — so nothing rings the individual controls.

```tsx
<CheckboxGroup
  label="Select supported sports"
  helperText="You can always add more later."
  variant="panel"
  columns={2}
  maxHeight={240}
  options={[
    { category: "Football", options: [{ value: "nfl", label: "NFL" }] },
    { category: "Hockey", options: [{ value: "nhl", label: "NHL" }] },
  ]}
  value={sports}
  onChange={setSports}
/>
```

`onChange` appends and filters rather than rebuilding the array from `options`.
A rebuild sorts the result into declaration order, which reads tidier and
silently drops any selected value whose option has not loaded yet.

### Multi-selection is a checklist, not a menu

`CheckboxGroup` exists instead of a multi-select `Select`, and the reason is
that neither multi-selection UI in the portfolio was ever a dropdown.
mega-squad's squad form picks sports from a grouped, scrollable checklist with
category headings; bb-memorial's share form picks tags from a flat row of
toggles. Collapsing either into a menu would have hidden the options behind a
click to save vertical space neither screen was short of, so the component
follows the shape that already worked. A multi-select dropdown is still the
right answer for a list too long to show — when something in the portfolio has
one, that is when to build it.

Three things it adds over the hand-rolled version it replaces:

- **Each option is a Headless UI `Field`**, so its label is wired to its own
  checkbox and clicking the text toggles it. The pointer cursor sits on the
  label rather than on the row, because the label *is* the hit area: at two
  columns, a short option like `NFL` fills about a quarter of its grid cell,
  and a row-wide affordance would advertise the other three quarters as
  clickable.
- **Each category is a nested fieldset**, so `Football` is the accessible name
  of the group under it rather than a styled `div` a screen reader walks past.
  The heading is still a `<span>`, not a heading element, so it does not appear
  in a screen reader's heading list — the name is reachable by entering the
  group, which is what the nesting buys.
- **`errorMessage` reaches the fieldset** as `aria-describedby`, wired by hand
  rather than through Headless UI's `Description`. `Fieldset` collects
  descendant labels but never calls `useDescriptions` and provides no
  description context, so a `Description` dropped inside one throws rather than
  degrading quietly. Per-option `description` text does go through `Field`,
  which wires it properly — the distinction is real: a group description is
  announced on entering the group, an option's on focusing that checkbox.

  Both `aria-describedby` and `aria-invalid` are set **after** `...props` is
  spread, and the describedby is merged with any the caller passes. Set before,
  a caller's own `aria-describedby` would replace the error association with no
  type error and no warning: a group rendering red text and reporting itself
  valid.

`variant="panel"` draws the enclosing box for the long-list case. It
deliberately does not read `--roster-popover-*`: that family is for surfaces
that float over the page, and this one is in the flow, so it takes `Card`'s
`soft` fill. Its border is two ramp steps heavier than that card's, and that
part is not shared: a card's hairline separates content from the page, while
this one has to read as the wall a scroll region ends at.

`maxHeight` is applied inline rather than as a class, because the useful values
are arbitrary and a Tailwind class built from a prop is a class that does not
exist at build time. A capped panel takes a tab stop of its own — Chrome and
Firefox focus scrollers by themselves now, Safari does not, and a `disabled`
group has no focusable option to tab to at all, so the region would be
unscrollable from the keyboard.

`errorMessage` repaints less here than it does on `Input` or `Select`, on
purpose. `panel` gets an error border; `plain` has no boundary to repaint, so
the message is the whole error state. A checkbox is not the thing that is
invalid — the selection is — so nothing rings the individual controls.

```tsx
<CheckboxGroup
  label="Select supported sports"
  helperText="You can always add more later."
  variant="panel"
  columns={2}
  maxHeight={240}
  options={[
    { category: "Football", options: [{ value: "nfl", label: "NFL" }] },
    { category: "Hockey", options: [{ value: "nhl", label: "NHL" }] },
  ]}
  value={sports}
  onChange={setSports}
/>
```

`onChange` appends and filters rather than rebuilding the array from `options`.
A rebuild sorts the result into declaration order, which reads tidier and
silently drops any selected value whose option has not loaded yet.

### Components that render links

`Breadcrumbs` renders a plain `<a>` by default, which is right for a static
page and wrong inside a router — every hop becomes a full page load. Pass your
router's link component instead:

```tsx
import NextLink from "next/link";

<Breadcrumbs linkComponent={NextLink} items={items} />;
```

In an app with React Server Components, do that from a client component.
`linkComponent` is a function, and functions do not cross the RSC boundary —
passing it from a server component fails the render with _Functions cannot be
passed directly to Client Components_. A small `"use client"` wrapper binds it
once, and the pages that use the wrapper stay server-rendered.

`Eyebrow` takes the other approach: `as` accepts any element and the props
follow it, so `<Eyebrow as="a" href="/work">` works, as does `as={NextLink}`.

## Quick start

```tsx
import { Button, Spinner } from "@blakesteve/roster";

function App() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button colorScheme="primary" onClick={() => alert("Saved!")}>
        Save changes
      </Button>

      <Button colorScheme="error" variant="outline">
        Delete account
      </Button>

      <Button isLoading>Processing…</Button>

      <Spinner size="lg" />
    </div>
  );
}
```

## Component catalog

### Atoms

| Component            | Description                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Avatar`             | User avatar with image, initials fallback, and optional popover                                              |
| `Badge`              | Status label with semantic color schemes and fill variants                                                   |
| `Button`             | Primary interactive element: solid, soft, outline, ghost, link variants                                      |
| `Card`               | Bordered surface container                                                                                   |
| `Checkbox`           | Accessible checkbox with label support                                                                       |
| `Combobox`           | A `Select` you can type into: filters as you type, same panel and size scale                                 |
| `Chip`               | The interactive one of Badge / Pill / Chip: removable, selectable, or both                                   |
| `Disclosure`         | Show/hide toggle using HeadlessUI                                                                            |
| `Eyebrow`            | Small tracked-out uppercase label above a heading or beside a rule; polymorphic via `as`                     |
| `InlineCode`         | Inline `<code>` for identifiers in running prose                                                             |
| `Input`              | Text input with label, error state, icon slots, and a size scale matching `Button`                           |
| `LabeledDivider`     | Horizontal rule carrying a label, with an optional trailing count                                            |
| `Link`               | Styled anchor with variant support                                                                           |
| `MultiSelect`        | A `Select` that holds more than one value: dismissible chips, same panel                                     |
| `PasswordInput`      | Password field with a show/hide reveal toggle                                                                |
| `Pill`               | Inline phrase chrome: social proof, live state, applied filters                                              |
| `AvatarStrip`        | Stacked avatar row with overflow chip, dismiss button, trailing slot, and label area                         |
| `CollapsibleSection` | Clamps any content (prose, chips, image grids) to a fixed height with a fade and expand/collapse toggle      |
| `LiquidTabs`         | Controlled tab strip with a liquid sliding pill indicator: pill and filled variants                          |
| `Select`             | Dropdown selector, on the same size scale as `Button` and `Input`                                            |
| `SegmentBar`         | Proportional horizontal bar divided into colored segments with optional legend                               |
| `Stat`               | A single figure with its label and, optionally, where the figure came from                                   |
| `Spinner`            | Loading indicator                                                                                            |
| `Switch`             | Toggle switch                                                                                                |
| `Textarea`           | Multi-line text input                                                                                        |
| `ThemeToggle`        | Flips class-based dark mode on the document root and remembers the choice; labels and icons are configurable |
| `Tooltip`            | Radix-powered tooltip: hover/focus on desktop, tap-to-toggle on mobile                                       |

### Molecules

| Component         | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `Accordion`       | Collapsible content sections (single or multi-expand)                       |
| `Alert`           | Inline notice strip with optional title and dismiss                         |
| `Breadcrumbs`     | Navigation trail; pass `linkComponent` to keep navigation client-side       |
| `CheckboxGroup`   | Checkbox set reporting one `string[]`; groups, columns, scroll, error       |
| `CallToAction`    | Prominent hero-style CTA block                                              |
| `DescriptionList` | Label and value pairs as a real `<dl>`: inline, stacked, or split           |
| `EmptyState`      | Zero-data placeholder with icon and action slot                             |
| `ErrorState`      | Error display with retry action                                             |
| `MatchupCard`     | Head-to-head comparison card                                                |
| `Pullquote`       | A line lifted out of prose, as `<figure>` + `<blockquote>` + `<figcaption>` |
| `Toast`           | Transient floating notice; `Toaster` + the imperative `toast` handle        |

### Organisms

| Component   | Description                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ActionBar` | Sticky bottom action strip                                                                                                                                         |
| `Countdown` | Live countdown timer                                                                                                                                               |
| `DataTable` | Full-featured table with sorting and pagination via TanStack Table v9. Imported from `@blakesteve/roster/data-table` (see [DataTable columns](#datatable-columns)) |
| `Dialog`    | Modal dialog                                                                                                                                                       |
| `Footer`    | Site footer                                                                                                                                                        |
| `Navbar`    | Responsive navigation bar with mobile slide-out                                                                                                                    |
| `Table`     | Static data table                                                                                                                                                  |

### DataTable columns

TanStack Table v9 types column definitions against the feature set that built
the table. `DataTable` registers sorting and pagination and exports that set as
`RosterTableFeatures`, so your columns name it:

```tsx
import {
  DataTable,
  type RosterTableFeatures,
} from "@blakesteve/roster/data-table";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

type Player = { name: string; points: number };

const columns: ColumnDef<RosterTableFeatures, Player>[] = [
  { accessorKey: "name", header: "Player" },
  { accessorKey: "points", header: "Points" },
];

// Or, to keep each column's value type:
const helper = createColumnHelper<RosterTableFeatures, Player>();
```

Upgrading from roster 2.x: `ColumnDef<Player, unknown>` becomes
`ColumnDef<RosterTableFeatures, Player>`, and `DataTableProps` takes one type
argument instead of two. A columns array is heterogeneous, so v9 types each
entry's value as `unknown` and recovers the real type per column through
`createColumnHelper`.

### Server components

The main entry carries a `"use client"` directive, because nearly everything in
it is interactive. That is correct for components and wrong for a plain
function, so `cn` ships from its own entry with no directive:

```tsx
import { cn } from "@blakesteve/roster/utils";
```

Importing `cn` from the package root still works on the client. In a React
Server Component it typechecks and then throws at render — use `/utils` there.

### Hooks

| Hook             | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| `useCountdown`   | Countdown timer logic without the UI                                            |
| `useKeySequence` | Fires a callback when a sequence of keys is typed in order. Ships `KONAMI_CODE` |

## Authoring components: the `rst:` prefix

Every class Roster emits carries an `rst:` prefix — `rst:flex`, `rst:bg-white`,
`rst:dark:bg-gray-950`, `rst:group-data-[checked]:translate-x-5`. **Consumers do
not write the prefix and never see it.** It exists to stop a host app from
overriding Roster by accident.

Roster's stylesheet deliberately sits in a layer _below_ the host's `utilities`
so a consumer's `className` can override a component. Without a prefix that also
means the host wins any class-name _collision_ — including on Roster's own
internal elements, which the consumer never touches:

- an app that used `bg-white` anywhere defeated the Textarea's
  `dark:bg-gray-950`, rendering a white field on a dark page
- an app that used `translate-x-0` defeated the Switch's
  `group-data-[checked]:translate-x-5`, so the thumb never moved

Neither app referenced those elements. Both bugs are invisible in this repo,
because Storybook is the only consumer here and it cannot collide with itself.

When adding or editing a component, write classes with the prefix. The codemod
that performed the original migration can also fix a file you forget:

```bash
node scripts/prefix-classes.mjs src/components/atoms/Thing/Thing.tsx    # dry run
APPLY=1 node scripts/prefix-classes.mjs src/components/atoms/Thing/Thing.tsx
```

Two things are deliberately never prefixed. `dark` is the _consuming document's_
theme class, which Roster's own `@custom-variant dark` matches by name — Button
applies it directly for `surface="dark"`. And any class a consumer passes in,
such as `AvatarStrip`'s `ringClass`, stays exactly as they wrote it.

`npm run build` fails if any unprefixed class reaches `dist/roster.css`.

## Development

Storybook is the component playground. Each component has dedicated stories covering all variants, props, and light/dark mode.

```bash
npm install
npm run storybook
# → http://localhost:6006
```

## Testing

```bash
# Unit tests (Vitest + jsdom)
npm run test:run

# Unit tests in watch mode
npm run test

# Storybook interaction tests (Vitest + Playwright)
npx vitest run --project storybook

# Every emitted class carries the rst: prefix (runs as part of the build)
npm run check:prefix
npm run check:classes-emit
```

Three guards are worth knowing about, because the bugs they catch cannot be
reproduced from inside this repo.

`check:prefix` reads `dist/roster.css` and fails on any unprefixed class
selector. The collision it prevents only appears in an app with its own Tailwind
build, so asserting on a rendered component here would never see it — the check
has to be on the artifact.

`check:classes-emit` reads the same artifact and fails when a component
references a utility Tailwind never generated. Tailwind v4 builds utilities from
theme tokens, so a class naming a token that does not exist is not an error —
it simply produces no CSS, and the class sits in the component looking correct
while doing nothing. That is how the focus ring was inert: `Button` asked for
`ring-ring` and `ring-offset-background`, neither `--color-ring` nor
`--color-background` existed, and the ring fell back to `currentColor` — a
white ring on a white page. Nothing caught it, because typecheck cannot read a
class name and the unit tests assert a class is _present_ rather than that it
does anything.

It compares whole class names, variants included, so a misspelled variant fails
as readily as a misspelled utility. It reads component source only — `*.test.*`
and `*.stories.*` are skipped, because docs blurbs carry CSS code fences that
would false-positive, so a dead class in a story is not covered. Its
`KNOWN_DEAD` map is empty — the ten classes it was written to catch have all
been fixed. The map stays for the case
where a dead class cannot be fixed in the same sitting: add it there with a
reason and the build goes green on the state it inherited while still failing on
anything new. It also fails when a listed class starts emitting, so a fix cannot
leave a stale entry behind. Run it with `--verbose` to print the list.

`src/lib/utils.test.ts` pins `cn`. `tailwind-merge` has to be configured with the
prefix or it stops recognising Roster's classes as utilities and silently
degrades to concatenation: conflicting classes both survive and the winner falls
back to stylesheet order. The class string still _contains_ what you asked for,
so a snapshot passes while the browser is wrong.

## Building

```bash
npm run build
```

Output in `dist/`:

| File               | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `roster.es.js`     | ES module bundle                                                    |
| `roster.umd.js`    | UMD bundle                                                          |
| `data-table.es.js` | DataTable entry, keeping the TanStack import out of the main bundle |
| `roster.css`       | Compiled component styles, in the `roster` cascade layer            |
| `tokens.css`       | Design token CSS variables                                          |
| `preflight.css`    | Optional global reset (see Setup)                                   |
| `index.d.ts`       | TypeScript definitions                                              |
| `meta.json`        | Test count and version, written when the tarball is built           |

### What `meta.json` is for

Consumers read this package to describe it. blakeb.dev's case study takes the
version from `package.json` and counts components by parsing the exports out of
`dist/*.d.ts`, so both stay correct on their own.

The test count has no such source. `files` is `["dist"]`, so the suite never
leaves this repo, and the number on that page was a hand-typed literal that
drifted two minor versions behind while sitting next to a live one.

`scripts/write-meta.mjs` writes it from a real `vitest run`, wired to `prepack`
rather than `build` — the suite is slow enough that charging every local build
for it would be a tax on the wrong people, and the only moment the number has to
be right is when the tarball is built. A static count of `it(` would not work
anyway, because `it.each` expands at runtime.

`prepack` and not `prepublishOnly`, which was the first attempt. The latter
fires only on `npm publish`, so its output cannot be inspected without
publishing — and 4.6.1 went out with the script committed, the hook wired, and
`meta.json` nowhere in the tarball. Under `prepack`, `npm pack` produces the
real artifact and the question is answerable in a second:

```bash
npm pack --pack-destination /tmp
tar -tzf /tmp/blakesteve-roster-*.tgz | grep meta.json
```

It refuses to write a zero. A runner that collected nothing reports zero passing
rather than failing, and "live · 0 tests" would look authoritative while being
the worst possible answer. `src/write-meta.test.ts` pins that guard and the
field selection, including the one that bit first: `numTotalTestSuites` reads
like a file count but counts `describe` blocks — 166 against 92 real files.

## Contributing

Pull requests are welcome. Please:

1. Open an issue or discussion first for significant changes
2. Follow the existing code style (CVA variants, forwardRef, Storybook stories, unit tests)
3. Fill out the pull request template checklist before requesting review

## License

MIT © [Blake Ball](https://github.com/blakesteve)
