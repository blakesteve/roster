/**
 * A page laid out the way a server-rendered app lays one out: `<header>`,
 * `<main>` and `<footer>`, all direct children of `<body>`. Render into
 * `main` with `render(ui, { container: main })`.
 *
 * Headless UI marks only the child a dialog is rendered from, so a test with
 * everything inside one container can not tell whether the header and footer
 * were left reachable.
 */
export function pageRegions() {
  const header = document.createElement("header");
  const main = document.createElement("main");
  const footer = document.createElement("footer");
  header.textContent = "Header";
  footer.textContent = "Footer";
  document.body.append(header, main, footer);
  /* Testing Library's cleanup removes `main`, as it does any container it
     rendered into; the other two are this helper's. */
  const remove = () => {
    header.remove();
    footer.remove();
  };
  return { header, main, footer, remove };
}

/** Whether `el`, or anything it sits in, is inert or `aria-hidden`. jsdom reads the property. */
export function hiddenFromAssistiveTech(el: Element): boolean {
  for (let n: Element | null = el; n; n = n.parentElement) {
    if ((n as HTMLElement & { inert?: boolean }).inert === true) return true;
    if (n.getAttribute("aria-hidden") === "true") return true;
  }
  return false;
}
