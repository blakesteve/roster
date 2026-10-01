import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { lockPage } from "./page-inert";

/* jsdom has no `inert` of its own: the property is a plain expando there, and
   nothing reflects it to the attribute. So these read the property, which is
   what `lockPage` writes; the Dialog and Sheet stories read the attribute in a
   real browser. */
type Inertable = HTMLElement & { inert?: boolean };

let header: Inertable;
let main: Inertable;
let footer: Inertable;
let portalRoot: Inertable;
let toaster: Inertable;
let anchor: HTMLElement;
const releases: (() => void)[] = [];

function lock(from: Element | null = anchor) {
  const release = lockPage(from);
  releases.push(release);
  return release;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  document.body.innerHTML = `
    <header></header>
    <main><span id="anchor" hidden></span></main>
    <footer></footer>
    <div id="headlessui-portal-root"></div>
    <div data-roster-toaster></div>
  `;
  [header, main, footer, portalRoot, toaster] = Array.from(
    document.body.children,
  ) as Inertable[];
  anchor = document.getElementById("anchor")!;
});

afterEach(() => {
  /* The lock is module state; a test that failed half-way must not leave the
     next one starting locked. */
  releases.splice(0).forEach((release) => release());
  document.body.innerHTML = "";
});

describe("lockPage", () => {
  it("marks every other child of body inert and aria-hidden", () => {
    lock();
    for (const el of [header, footer]) {
      expect(el.inert).toBe(true);
      expect(el).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("leaves the dialog layer, the toast host and the dialog's own region alone", () => {
    /* The region the dialog is written in is Headless UI's to mark. Marking
       it here too would give it two owners, and whichever restored second
       would put back the other's `inert`. */
    lock();
    for (const el of [portalRoot, toaster, main]) {
      expect(el.inert).toBeFalsy();
      expect(el).not.toHaveAttribute("aria-hidden");
    }
  });

  it("restores exactly what each element had, not a blank slate", () => {
    /* The header was inert already, so it is someone else's and left alone;
       see the next test. */
    header.inert = true;
    footer.setAttribute("aria-hidden", "false");
    const release = lock();
    expect(footer).toHaveAttribute("aria-hidden", "true");

    release();
    expect(header.inert).toBe(true);
    expect(header).not.toHaveAttribute("aria-hidden");
    expect(footer.inert).toBeFalsy();
    expect(footer).toHaveAttribute("aria-hidden", "false");
  });

  it("holds the page until the last of several locks is released", () => {
    /* A dialog stacked on a dialog: the inner one closing must not hand the
       page back while the outer one is still open. The inner one is written
       inside the outer one's panel, so it is locked from the portal root. */
    const inner = document.createElement("span");
    portalRoot.append(inner);
    const outer = lock();
    const nested = lock(inner);

    nested();
    expect(header.inert).toBe(true);
    expect(footer).toHaveAttribute("aria-hidden", "true");
    expect(main.inert).toBeFalsy();

    outer();
    expect(header.inert).toBeFalsy();
    expect(footer).not.toHaveAttribute("aria-hidden");
  });

  it("counts a release once, however often it is called", () => {
    /* A cleanup that runs twice, or a close racing an unmount, must not
       release the other dialog's lock. */
    const first = lock();
    lock();
    first();
    first();
    expect(header.inert).toBe(true);
  });

  it("leaves an element someone else made inert to them", () => {
    /* A dialog built on Headless UI directly, with a Roster one opened inside
       it: Headless UI has marked the region already and will restore it. A
       second owner would record its `inert` as the original and write it back
       after Headless UI let go, leaving the page stuck. */
    footer.inert = true;
    lock();
    expect(footer).not.toHaveAttribute("aria-hidden");
    footer.inert = false; // the other owner lets go first
    releases.splice(0).forEach((release) => release());
    expect(footer.inert).toBe(false);
    expect(footer).not.toHaveAttribute("aria-hidden");
  });

  it("keeps it theirs while they let go and take it back mid-lock", () => {
    /* Headless UI lets go of a region and marks it again when the dialog on
       top changes. Another Roster lock released in that gap must not mark it,
       or Roster becomes a second owner and the page can be left inert. */
    footer.inert = true;
    lock();
    const inner = lock();
    footer.inert = false; // they let go
    inner();
    expect(footer.inert).toBe(false);
    expect(footer).not.toHaveAttribute("aria-hidden");
    footer.inert = true; // and take it back
    releases.splice(0).forEach((release) => release());
    expect(footer.inert).toBe(true); // still theirs to restore
  });

  it("forgets whose an element was once the last lock is released", () => {
    footer.inert = true;
    lock()();
    footer.inert = false;
    lock();
    expect(footer.inert).toBe(true);
    expect(footer).toHaveAttribute("aria-hidden", "true");
  });

  it("starts clean when a page is locked again after a release", () => {
    const release = lock();
    release();
    const again = lock();
    expect(header.inert).toBe(true);
    expect(header).toHaveAttribute("aria-hidden", "true");
    again();
    expect(header.inert).toBeFalsy();
    expect(header).not.toHaveAttribute("aria-hidden");
  });

  it("marks what mounts under body while locked, and not the exempt ones", async () => {
    lock();
    const widget = document.createElement("div");
    const lateRoot = document.createElement("div");
    lateRoot.id = "headlessui-portal-root";
    const lateToaster = document.createElement("div");
    lateToaster.setAttribute("data-roster-toaster", "");
    portalRoot.remove();
    document.body.append(widget, lateRoot, lateToaster);
    await flush();

    expect((widget as Inertable).inert).toBe(true);
    expect(widget).toHaveAttribute("aria-hidden", "true");
    expect((lateRoot as Inertable).inert).toBeFalsy();
    expect((lateToaster as Inertable).inert).toBeFalsy();
  });

  it("gives an element back when it leaves body, not when the dialog closes", async () => {
    /* Moved elsewhere, it must not carry this page's inert with it. */
    lock();
    const aside = document.createElement("aside");
    footer.remove();
    main.append(footer);
    main.append(aside);
    await flush();

    expect(footer.inert).toBeFalsy();
    expect(footer).not.toHaveAttribute("aria-hidden");
    expect((aside as Inertable).inert).toBeFalsy();
  });

  it("stops watching body once the last lock is released", async () => {
    lock()();
    const widget = document.createElement("div");
    document.body.append(widget);
    await flush();
    expect((widget as Inertable).inert).toBeFalsy();
    expect(widget).not.toHaveAttribute("aria-hidden");
  });
});
