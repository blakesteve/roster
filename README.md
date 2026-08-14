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
import { DataTable, type RosterTableFeatures } from "@blakesteve/roster/data-table";
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

Layers are ordered by *first registration*, so importing Roster before Tailwind
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
    var dark = s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
</script>
```

If you pass a custom `storageKey`, change the script to match — a mismatch means
the script and the toggle disagree, which shows up as a flash on every reload.

`Navbar`'s `themeMode` prop is a different thing: it describes what palette the
bar paints *itself* with. Pair them with `themeMode="auto"` and the nav follows
whatever `ThemeToggle` sets.

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
passing it from a server component fails the render with *Functions cannot be
passed directly to Client Components*. A small `"use client"` wrapper binds it
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

| Component | Description |
|---|---|
| `Avatar` | User avatar with image, initials fallback, and optional popover |
| `Badge` | Status label with semantic color schemes and fill variants |
| `Button` | Primary interactive element: solid, soft, outline, ghost, link variants |
| `Card` | Bordered surface container |
| `Checkbox` | Accessible checkbox with label support |
| `Disclosure` | Show/hide toggle using HeadlessUI |
| `Eyebrow` | Small tracked-out uppercase label above a heading or beside a rule; polymorphic via `as` |
| `InlineCode` | Inline `<code>` for identifiers in running prose |
| `Input` | Text input with label, error state, and icon slots |
| `LabeledDivider` | Horizontal rule carrying a label, with an optional trailing count |
| `Link` | Styled anchor with variant support |
| `PasswordInput` | Password field with a show/hide reveal toggle |
| `Pill` | Inline phrase chrome: social proof, live state, applied filters |
| `AvatarStrip` | Stacked avatar row with overflow chip, dismiss button, trailing slot, and label area |
| `CollapsibleSection` | Clamps any content (prose, chips, image grids) to a fixed height with a fade and expand/collapse toggle |
| `LiquidTabs` | Controlled tab strip with a liquid sliding pill indicator: pill and filled variants |
| `Select` | Dropdown selector |
| `SegmentBar` | Proportional horizontal bar divided into colored segments with optional legend |
| `Stat` | A single figure with its label and, optionally, where the figure came from |
| `Spinner` | Loading indicator |
| `Switch` | Toggle switch |
| `Textarea` | Multi-line text input |
| `ThemeToggle` | Flips class-based dark mode on the document root and remembers the choice; labels and icons are configurable |
| `Tooltip` | Radix-powered tooltip: hover/focus on desktop, tap-to-toggle on mobile |

### Molecules

| Component | Description |
|---|---|
| `Accordion` | Collapsible content sections (single or multi-expand) |
| `Alert` | Inline notice strip with optional title and dismiss |
| `Breadcrumbs` | Navigation trail; pass `linkComponent` to keep navigation client-side |
| `CallToAction` | Prominent hero-style CTA block |
| `DescriptionList` | Label and value pairs as a real `<dl>`: inline, stacked, or split |
| `EmptyState` | Zero-data placeholder with icon and action slot |
| `ErrorState` | Error display with retry action |
| `MatchupCard` | Head-to-head comparison card |
| `Pullquote` | A line lifted out of prose, as `<figure>` + `<blockquote>` + `<figcaption>` |

### Organisms

| Component | Description |
|---|---|
| `ActionBar` | Sticky bottom action strip |
| `Countdown` | Live countdown timer |
| `DataTable` | Full-featured table with sorting and pagination via TanStack Table v9. Imported from `@blakesteve/roster/data-table` (see [DataTable columns](#datatable-columns)) |
| `Dialog` | Modal dialog |
| `Footer` | Site footer |
| `Navbar` | Responsive navigation bar with mobile slide-out |
| `Table` | Static data table |

### DataTable columns

TanStack Table v9 types column definitions against the feature set that built
the table. `DataTable` registers sorting and pagination and exports that set as
`RosterTableFeatures`, so your columns name it:

```tsx
import { DataTable, type RosterTableFeatures } from "@blakesteve/roster/data-table";
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

| Hook | Description |
|---|---|
| `useCountdown` | Countdown timer logic without the UI |
| `useKeySequence` | Fires a callback when a sequence of keys is typed in order. Ships `KONAMI_CODE` |

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
```

## Building

```bash
npm run build
```

Output in `dist/`:

| File | Description |
|---|---|
| `roster.es.js` | ES module bundle |
| `roster.umd.js` | UMD bundle |
| `data-table.es.js` | DataTable entry, keeping the TanStack import out of the main bundle |
| `roster.css` | Compiled component styles, in the `roster` cascade layer |
| `tokens.css` | Design token CSS variables |
| `preflight.css` | Optional global reset (see Setup) |
| `index.d.ts` | TypeScript definitions |

## Contributing

Pull requests are welcome. Please:

1. Open an issue or discussion first for significant changes
2. Follow the existing code style (CVA variants, forwardRef, Storybook stories, unit tests)
3. Fill out the pull request template checklist before requesting review

## License

MIT © [Blake Ball](https://github.com/blakesteve)