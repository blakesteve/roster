# @blakesteve/roster ✦

A production-grade atomic component library built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.

Roster ships a curated set of accessible, theme-aware components organized around the Atomic Design methodology — atoms, molecules, and organisms — each with Storybook documentation and full test coverage.

## Features

- **Atomic Design** — components organized as atoms, molecules, and organisms
- **TypeScript first** — fully typed props with exported variant types for maximum DX
- **Adaptive dark mode** — class-based toggling (`.dark`) independent of OS preferences
- **`"use client"` pre-bundled** — all outputs include the directive for seamless Next.js App Router integration
- **Accessible** — interactive components powered by [`@headlessui/react`](https://headlessui.com) and [`@radix-ui`](https://radix-ui.com)
- **Tree-shakeable** — import only what you need

## Installation

```bash
npm install @blakesteve/roster
```

Roster ships pre-compiled CSS — you do not need Tailwind installed in your host app to use it.

### Peer dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

## Setup

Import Roster's CSS once at the root of your application (`layout.tsx`, `main.tsx`, or `App.tsx`):

```tsx
// Compiled component styles — always required
import "@blakesteve/roster/style.css";

// Default design tokens (color palette, spacing, radius)
// Omit this if you are supplying your own --roster-* CSS variables
import "@blakesteve/roster/tokens.css";
```

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
| `Button` | Primary interactive element — solid, soft, outline, ghost, link variants |
| `Card` | Bordered surface container |
| `Checkbox` | Accessible checkbox with label support |
| `Disclosure` | Show/hide toggle using HeadlessUI |
| `Input` | Text input with label, error state, and icon slots |
| `Link` | Styled anchor with variant support |
| `AvatarStrip` | Stacked avatar row with overflow chip, dismiss button, trailing slot, and label area |
| `CollapsibleDescription` | Clamped text block with fade and Read more / Show less toggle |
| `LiquidTabs` | Controlled tab strip with a liquid sliding pill indicator — pill and filled variants |
| `Select` | Dropdown selector |
| `SegmentBar` | Proportional horizontal bar divided into colored segments with optional legend |
| `Spinner` | Loading indicator |
| `Switch` | Toggle switch |
| `Textarea` | Multi-line text input |
| `Tooltip` | Radix-powered tooltip — hover/focus on desktop, tap-to-toggle on mobile |

### Molecules

| Component | Description |
|---|---|
| `Accordion` | Collapsible content sections (single or multi-expand) |
| `Breadcrumbs` | Navigation trail |
| `CallToAction` | Prominent hero-style CTA block |
| `EmptyState` | Zero-data placeholder with icon and action slot |
| `ErrorState` | Error display with retry action |
| `MatchupCard` | Head-to-head comparison card |

### Organisms

| Component | Description |
|---|---|
| `ActionBar` | Sticky bottom action strip |
| `Countdown` | Live countdown timer |
| `DataTable` | Full-featured table with sorting and pagination via TanStack Table |
| `Dialog` | Modal dialog |
| `Footer` | Site footer |
| `Navbar` | Responsive navigation bar with mobile slide-out |
| `Table` | Static data table |

### Hooks

| Hook | Description |
|---|---|
| `useCountdown` | Countdown timer logic without the UI |

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
| `roster.css` | Compiled component styles |
| `tokens.css` | Design token CSS variables |
| `index.d.ts` | TypeScript definitions |

## Contributing

Pull requests are welcome. Please:

1. Open an issue or discussion first for significant changes
2. Follow the existing code style (CVA variants, forwardRef, Storybook stories, unit tests)
3. Fill out the pull request template checklist before requesting review

## License

MIT © [Blake Ball](https://github.com/blakesteve)