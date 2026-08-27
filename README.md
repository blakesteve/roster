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

`Navbar`'s `themeMode` prop is a different thing: it describes what palette the
bar paints _itself_ with. Pair them with `themeMode="auto"` and the nav follows
whatever `ThemeToggle` sets.

### The UI font

Controls, labels and table cells render in `--roster-font-ui`. Set nothing and
they use a system sans stack, which is the point: without it they would inherit
whatever your app puts on `body`, and an app that reads in a serif would get
serif buttons and serif badges.

To match your own UI face, define the variable once:

```css
:root {
  --roster-font-ui: "Archivo", ui-sans-serif, system-ui, sans-serif;
}
```

Two sets of components opt out. `Card` and `Link` inherit on purpose, because
they wrap your content and that text is not Roster's to restyle. `Eyebrow`,
`InlineCode`, `Stat`, `Pullquote`, `DescriptionList`, `MatchupCard` and
`Countdown` ask for a monospace face as a design decision.

### Solid fill contrast

`solid` is the one variant where a component picks both the background and the
text on it, so it can fail contrast on its own with no help from your app. Every
solid fill in `Badge`, `Pill` and `Button` is measured against WCAG AA (4.5:1)
by `src/contrast.test.ts`, at rest **and** on hover, in both themes.

`Checkbox` is measured too, at 3:1 rather than 4.5:1 — its tick is a graphical
object under WCAG 1.4.11, not text. It used to be excluded from the suite
entirely, which measured it against nothing.

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

### Focus

Every focusable control draws the same ring: `--roster-ring` for the ring
itself, `--roster-ring-offset` for the 2px band that separates it from the
control's own fill. Both flip with the theme — `primary-500` on white in light,
`primary-400` on `gray-950` in dark — which puts the indicator at 6.37:1 and
7.31:1 against the surface either side of it, where WCAG 1.4.11 asks for 3:1.

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
| `Disclosure`         | Show/hide toggle using HeadlessUI                                                                            |
| `Eyebrow`            | Small tracked-out uppercase label above a heading or beside a rule; polymorphic via `as`                     |
| `InlineCode`         | Inline `<code>` for identifiers in running prose                                                             |
| `Input`              | Text input with label, error state, and icon slots                                                           |
| `LabeledDivider`     | Horizontal rule carrying a label, with an optional trailing count                                            |
| `Link`               | Styled anchor with variant support                                                                           |
| `PasswordInput`      | Password field with a show/hide reveal toggle                                                                |
| `Pill`               | Inline phrase chrome: social proof, live state, applied filters                                              |
| `AvatarStrip`        | Stacked avatar row with overflow chip, dismiss button, trailing slot, and label area                         |
| `CollapsibleSection` | Clamps any content (prose, chips, image grids) to a fixed height with a fade and expand/collapse toggle      |
| `LiquidTabs`         | Controlled tab strip with a liquid sliding pill indicator: pill and filled variants                          |
| `Select`             | Dropdown selector                                                                                            |
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
| `CallToAction`    | Prominent hero-style CTA block                                              |
| `DescriptionList` | Label and value pairs as a real `<dl>`: inline, stacked, or split           |
| `EmptyState`      | Zero-data placeholder with icon and action slot                             |
| `ErrorState`      | Error display with retry action                                             |
| `MatchupCard`     | Head-to-head comparison card                                                |
| `Pullquote`       | A line lifted out of prose, as `<figure>` + `<blockquote>` + `<figcaption>` |

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
