import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";

/* Inline, not utilities: Tailwind scans all of `src`, so a class used only
   here would ship in `roster.css` to every consumer. */
const REGION: CSSProperties = {
  padding: "12px 16px",
  border: "1px dashed currentColor",
  margin: "8px",
  borderRadius: "8px",
};

/**
 * For stories: renders `<header>`, `<main>` and `<footer>` straight into
 * `<body>`, as siblings, the way a server-rendered app's layout does, with
 * `children` in `<main>`.
 *
 * Headless UI marks only the child of `<body>` a dialog is rendered from, so a
 * story inside Storybook's own root can not show whether a header and footer
 * beside it were left reachable. The header starts with `aria-hidden="false"`
 * so a story can check it gets that back, not a blank.
 */
export function PageRegions({ children }: { children: ReactNode }) {
  return createPortal(
    <>
      <header data-testid="page-header" aria-hidden="false" style={REGION}>
        Header <a href="#top">Home</a>
      </header>
      <main data-testid="page-main" style={REGION}>
        {children}
      </main>
      <footer data-testid="page-footer" style={REGION}>
        Footer <a href="#top">Contact</a>
      </footer>
    </>,
    document.body,
  );
}
