import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { Navbar, type NavbarLabels } from "./components/organisms/Navbar/Navbar";
import { Sheet } from "./components/organisms/Sheet/Sheet";
import { Dialog } from "./components/organisms/Dialog/Dialog";
import { Breadcrumbs } from "./components/molecules/Breadcrumbs/Breadcrumbs";
import { Footer } from "./components/organisms/Footer/Footer";
import { CallToAction } from "./components/molecules/CallToAction/CallToAction";
import { AvatarStrip } from "./components/atoms/AvatarStrip/AvatarStrip";
import { ErrorState } from "./components/molecules/ErrorState/ErrorState";
import { Countdown } from "./components/organisms/Countdown/Countdown";
import { Carousel } from "./components/molecules/Carousel/Carousel";
import { MultiSelect } from "./components/atoms/MultiSelect/MultiSelect";
import { DataTable } from "./components/organisms/DataTable/DataTable";
import { MediaPreview } from "./components/molecules/MediaPreview/MediaPreview";
import { ModerationQueue, type ModerationQueueLabels } from "./components/organisms/ModerationQueue/ModerationQueue";
import { QueueEditDialog } from "./components/organisms/ModerationQueue/QueueEditDialog";
import type { QueueRunResult } from "./components/organisms/ModerationQueue/queue-actions";
import { Slider } from "./components/molecules/Slider/Slider";
import { RangeSlider } from "./components/molecules/RangeSlider/RangeSlider";

/**
 * Every word a component shows or says of its own can be replaced. Here every
 * label, and every string the test itself passes, is pseudo-localized: each
 * ASCII letter swapped for an accented one. So any plain ASCII word left in
 * the page, in its text or in a name a screen reader reads, is English the
 * component wrote itself. Each component also renders with its labels unset,
 * the twin, which must find that English, so a pass means the labels did it
 * rather than that nothing was looked at.
 */

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverMock as unknown as typeof ResizeObserver;

const LOWER = "ȧƀƈḓḗƒɠħīĵķŀḿƞǿƥɋřşŧŭṽẇẋẏż";
const UPPER = "ȦƁƇḒḖƑƓĦĪĴĶĿḾȠǾƤɊŘŞŦŬṼẆẊẎŻ";
const pseudo = (text: string) =>
  text.replace(/[A-Za-z]/g, (c) => (c <= "Z" ? UPPER[c.charCodeAt(0) - 65] : LOWER[c.charCodeAt(0) - 97]));

/* What a person can see or hear: text, and every attribute that names or
   describes. */
const SPOKEN = ["aria-label", "aria-description", "aria-roledescription", "aria-valuetext", "title", "alt", "placeholder"];

function englishIn(root: Node = document.body): string[] {
  /* Text node by text node: textContent would run neighbors together. */
  const said: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) said.push(node.textContent ?? "");
  for (const el of (root as ParentNode).querySelectorAll?.("*") ?? []) {
    for (const name of SPOKEN) {
      const value = el.getAttribute(name);
      if (value) said.push(value);
    }
  }
  return [...new Set(said.join(" ").match(/[A-Za-z]{2,}/g) ?? [])];
}

afterEach(() => cleanup());

describe("pseudo-locale: no built-in English is left once every label is replaced", () => {
  it("checks itself: pseudo-localized text has no ASCII words, and plain text does", () => {
    expect(englishIn(Object.assign(document.createElement("p"), { textContent: pseudo("Open main menu, 3 left.") }))).toEqual([]);
    expect(englishIn(Object.assign(document.createElement("p"), { textContent: "Open main menu" }))).toEqual(["Open", "main", "menu"]);
  });

  describe("Navbar", () => {
    const labels: NavbarLabels = {
      openMainMenu: pseudo("Open main menu"),
      closeMainMenu: pseudo("Close menu"),
      openUserMenu: pseudo("Open user menu"),
      logIn: pseudo("Log In"),
      logOut: pseudo("Log Out"),
      darkMode: pseudo("Dark Mode"),
      pendingInvitations: pseudo("Pending Invitations"),
      inbox: (n) => `${pseudo("Inbox")} (${n})`,
    };
    const base = {
      logoSrc: "/logo.png",
      brandName: pseudo("Shelf"),
      items: [{ label: pseudo("Home"), path: "/" }],
      activePath: "/",
    };

    it("signed in, with its user menu and its menu panel open", async () => {
      render(
        <Navbar
          {...base}
          labels={labels}
          user={{ initials: pseudo("AB"), notificationCount: 3, avatarSrc: "/me.png" }}
          onLogout={() => {}}
          onThemeToggle={() => {}}
          onInboxClick={() => {}}
        />,
      );
      /* Named by its label and the avatar's initials. */
      await userEvent.click(screen.getByRole("button", { name: new RegExp(labels.openUserMenu) }));
      expect(await screen.findByText(labels.logOut)).toBeInTheDocument();
      expect(screen.getByText(labels.darkMode)).toBeInTheDocument();
      expect(screen.getByText(labels.inbox(3))).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
      await userEvent.keyboard("{Escape}");
      await userEvent.click(screen.getByRole("button", { name: labels.openMainMenu }));
      expect(await screen.findByText(labels.pendingInvitations)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: labels.closeMainMenu })).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
    });

    it("signed out, with its menu panel open", async () => {
      render(<Navbar {...base} labels={labels} onLogin={() => {}} />);
      await userEvent.click(screen.getByRole("button", { name: labels.openMainMenu }));
      expect((await screen.findAllByText(labels.logIn)).length).toBeGreaterThan(0);
      expect(englishIn()).toEqual([]);
    });

    it("with a catalog missing keys, it keeps the defaults rather than breaking", async () => {
      render(
        <Navbar
          {...base}
          labels={{ ...labels, inbox: undefined, openUserMenu: undefined }}
          user={{ initials: pseudo("AB"), notificationCount: 3 }}
          onInboxClick={() => {}}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: /Open user menu/ }));
      expect(await screen.findByText("Inbox (3)")).toBeInTheDocument();
    });

    it("twin: with its labels unset, its own English shows", async () => {
      render(<Navbar {...base} onLogin={() => {}} />);
      await userEvent.click(screen.getByRole("button", { name: "Open main menu" }));
      await screen.findByRole("button", { name: "Close menu" });
      expect(englishIn()).toEqual(expect.arrayContaining(["Open", "Close", "Log", "In"]));
    });
  });

  /* The rest show their words without being driven: one render each, with
     labels and without, the twin listing the English it must show. */
  const STATIC: [string, (labeled: boolean) => React.ReactElement, string[]][] = [
    [
      "Sheet",
      (labeled) => (
        <Sheet isOpen onClose={() => {}} title={pseudo("Settings")} labels={labeled ? { close: pseudo("Close") } : undefined}>
          {pseudo("Body")}
        </Sheet>
      ),
      ["Close"],
    ],
    [
      "Dialog",
      (labeled) => (
        <Dialog isOpen onClose={() => {}} title={pseudo("Rename")} labels={labeled ? { close: pseudo("Close dialog") } : undefined}>
          {pseudo("Body")}
        </Dialog>
      ),
      ["Close", "dialog"],
    ],
    [
      "Breadcrumbs",
      (labeled) => (
        <Breadcrumbs
          showHomeIcon
          items={[{ label: pseudo("Shelves"), href: "/shelves" }, { label: pseudo("Agates") }]}
          labels={labeled ? { nav: pseudo("Breadcrumb"), home: pseudo("Home") } : undefined}
        />
      ),
      ["Breadcrumb", "Home"],
    ],
    [
      "Footer",
      (labeled) => (
        <Footer
          companyName={pseudo("Shelf Club")}
          links={[{ label: pseudo("Privacy"), href: "/privacy" }]}
          labels={labeled ? { nav: pseudo("Footer navigation"), copyright: (year, name) => `© ${year} ${name}, ${pseudo("All rights reserved.")}` } : undefined}
        />
      ),
      ["Footer", "navigation", "All", "rights", "reserved"],
    ],
    [
      "CallToAction",
      (labeled) => (
        <CallToAction title={pseudo("Join the club")} onDismiss={() => {}} labels={labeled ? { dismiss: pseudo("Dismiss") } : undefined} />
      ),
      ["Dismiss"],
    ],
    [
      "AvatarStrip",
      (labeled) => (
        <AvatarStrip
          maxDisplay={1}
          items={["Ada", "Bo", "Cy"].map((name) => ({ key: name, label: pseudo(name), src: `/${name}.png` }))}
          onDismiss={() => {}}
          labels={labeled ? { dismiss: pseudo("Dismiss"), more: (n) => `${n} ${pseudo("more")}` } : undefined}
        />
      ),
      ["Dismiss", "more"],
    ],
    [
      "ErrorState",
      (labeled) => (
        <ErrorState
          title={pseudo("Not loaded")}
          description={pseudo("Try once more.")}
          onRetry={() => {}}
          labels={labeled ? { retry: pseudo("Try Again") } : undefined}
        />
      ),
      ["Try", "Again"],
    ],
    [
      "Countdown",
      (labeled) => (
        <Countdown
          targetDate={new Date(Date.now() + 3 * 86_400_000)}
          title={pseudo("Season starts")}
          labels={labeled ? { days: () => pseudo("Days"), hours: () => pseudo("Hours"), minutes: () => pseudo("Minutes"), seconds: () => pseudo("Seconds") } : undefined}
        />
      ),
      ["Days", "Hours", "Minutes", "Seconds"],
    ],
    [
      "Carousel",
      (labeled) => (
        <Carousel
          aria-label={pseudo("Photos")}
          showPosition
          prevLabel={pseudo("Previous photo")}
          nextLabel={pseudo("Next photo")}
          labels={labeled ? { position: (n, total) => `${n} ${pseudo("of")} ${total}` } : undefined}
        >
          {["A", "B", "C"].map((k) => (
            <p key={k}>{pseudo(`Photo ${k}`)}</p>
          ))}
        </Carousel>
      ),
      ["of"],
    ],
    [
      "MultiSelect",
      (labeled) => (
        <MultiSelect
          label={pseudo("Sports")}
          display="count"
          options={[{ value: "a", label: pseudo("Football") }, { value: "b", label: pseudo("Hockey") }]}
          value={["a", "b"]}
          onChange={() => {}}
          placeholder={pseudo("Pick some")}
          clearLabel={pseudo("Clear")}
          removeLabel={(name) => `${pseudo("Remove")} ${name}`}
          countLabel={labeled ? (n) => `${n} ${pseudo("chosen")}` : undefined}
        />
      ),
      ["selected"],
    ],
    [
      "DataTable",
      (labeled) => (
        <DataTable
          columns={[{ accessorKey: "name", header: pseudo("Name") }]}
          data={[]}
          emptyMessage={labeled ? pseudo("Nothing here.") : undefined}
          paginationLabels={{
            nav: pseudo("Pagination"),
            page: (n) => `${pseudo("Page")} ${n}`,
            previous: pseudo("Previous"),
            next: pseudo("Next"),
            previousPage: () => pseudo("Previous page"),
            nextPage: () => pseudo("Next page"),
            firstPage: () => pseudo("First page"),
            lastPage: () => pseudo("Last page"),
            picker: pseudo("Page"),
            of: (n) => `${pseudo("of")} ${n}`,
            status: (n, total) => `${pseudo("Page")} ${n} ${pseudo("of")} ${total}`,
          }}
        />
      ),
      ["No", "results", "found"],
    ],
    [
      "MediaPreview",
      (labeled) => (
        <MediaPreview
          src={null}
          href="/original.heic"
          alt={pseudo("A green agate")}
          unavailableLabel={pseudo("Preview unavailable")}
          openLabel={pseudo("Open original")}
          newTabLabel={labeled ? pseudo("in a new tab") : undefined}
        />
      ),
      ["in", "new", "tab"],
    ],
    [
      "Slider, not set",
      (labeled) => (
        <Slider
          label={pseudo("How sure")}
          defaultValue={null}
          snapPoints={[{ value: 70, label: pseudo("Fair") }]}
          labels={labeled ? { notSet: pseudo("Not set") } : undefined}
        />
      ),
      ["Not", "set"],
    ],
    [
      "RangeSlider",
      (labeled) => (
        <RangeSlider
          label={pseudo("Price")}
          snapPoints={[{ value: 70, label: pseudo("Fair") }]}
          labels={labeled ? { low: pseudo("Minimum"), high: pseudo("Maximum") } : undefined}
        />
      ),
      ["Minimum", "Maximum"],
    ],
  ];

  for (const [name, ui, english] of STATIC) {
    it(`${name}, and its twin`, () => {
      render(ui(true));
      expect(englishIn(), `${name}, labeled`).toEqual([]);
      cleanup();
      render(ui(false));
      expect(englishIn(), `${name}, unset`).toEqual(expect.arrayContaining(english));
    });
  }

  describe("ModerationQueue", () => {
    const labels: Required<ModerationQueueLabels> = {
      loading: (label) => `${pseudo("Loading")} ${label}`,
      loadFailed: pseudo("The queue couldn't load."),
      retry: pseudo("Retry"),
      busy: pseudo("loading"),
      cancel: pseudo("Cancel"),
      decide: (item) => `${pseudo("Decide")}: ${item}`,
      decided: (action, item) => `${action}: ${item}.`,
      failed: (action, item, message) => `${action} ${pseudo("failed for")} ${item}. ${message}`,
      unknownError: pseudo("Something went wrong."),
      decidedElsewhere: (item) => `${item} ${pseudo("was decided elsewhere.")}`,
      left: (n) => `${n} ${pseudo("left.")}`,
      pickReason: pseudo("Pick a reason."),
      addNote: pseudo("Add a note."),
      reason: pseudo("Reason"),
      reasonOptional: pseudo("Reason (optional)"),
      note: pseudo("Note"),
      noteOptional: pseudo("Note (optional)"),
      close: pseudo("Close"),
    };
    type Item = { id: string; title: string };
    const ITEMS: Item[] = [
      { id: "a", title: pseudo("Lentil soup") },
      { id: "b", title: pseudo("Rye crackers") },
      { id: "c", title: pseudo("Plum cake") },
    ];
    const settle: { run?: (fail: boolean) => void } = {};
    const run = (): Promise<QueueRunResult> =>
      new Promise((resolve, reject) => {
        settle.run = (fail) => (fail ? reject(new Error("")) : resolve());
      });

    function Queue({ items, withLabels = true }: { items: Item[]; withLabels?: boolean }) {
      return (
        <ModerationQueue<Item>
          label={pseudo("Recipes")}
          items={items}
          getKey={(r) => r.id}
          itemLabel={(r) => r.title}
          renderContent={(r) => <p>{r.title}</p>}
          empty={{ title: pseudo("Nothing waiting") }}
          labels={withLabels ? labels : undefined}
          actions={(a) => [
            { id: "approve", label: pseudo("Approve"), done: pseudo("Approved"), run },
            {
              id: "back",
              label: pseudo("Send back"),
              reason: {
                prompt: pseudo("Why?"),
                required: true,
                options: [{ value: "dup", label: pseudo("Already listed") }],
                note: "required",
              },
              run,
            },
            a.edit({
              id: "edit",
              label: pseudo("Edit"),
              edit: {
                title: pseudo("Tidy it up"),
                submitLabel: pseudo("Save"),
                surface: QueueEditDialog,
                initial: () => ({}),
                Form: () => <p>{pseudo("Form")}</p>,
              },
              run,
            }),
          ]}
        />
      );
    }

    it("loading, and failed to load", () => {
      render(<ModerationQueue<Item> label={pseudo("Recipes")} items={[]} getKey={(r) => r.id} itemLabel={(r) => r.title} renderContent={() => null} actions={[]} status="loading" labels={labels} />);
      expect(screen.getByLabelText(labels.loading(pseudo("Recipes")))).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
      cleanup();
      render(<ModerationQueue<Item> label={pseudo("Recipes")} items={[]} getKey={(r) => r.id} itemLabel={(r) => r.title} renderContent={() => null} actions={[]} status="error" onRetry={() => {}} labels={labels} />);
      expect(screen.getByText(labels.loadFailed)).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
    });

    it("a reason step, a decision that fails, one that lands, an item decided elsewhere, and an edit", async () => {
      const { rerender } = render(<Queue items={ITEMS} />);
      const status = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent ?? "";
      expect(englishIn()).toEqual([]);

      /* The reason step, blocked until a reason and a note are given. */
      const [, back] = screen.getAllByRole("button", { name: pseudo("Send back") });
      await userEvent.click(back);
      expect(screen.getByText(labels.pickReason)).toBeInTheDocument();
      expect(screen.getByText(labels.reason)).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
      await userEvent.click(screen.getByRole("radio", { name: pseudo("Already listed") }));
      expect(screen.getByText(labels.addNote)).toBeInTheDocument();
      expect(englishIn()).toEqual([]);

      /* A decision in flight: its button's spinner. */
      await userEvent.click(screen.getAllByRole("button", { name: pseudo("Approve") })[0]);
      expect(screen.getByLabelText(labels.busy)).toBeInTheDocument();
      expect(englishIn()).toEqual([]);

      /* It fails, with no message of its own. */
      await act(async () => settle.run!(true));
      await waitFor(() => expect(status()).toContain(labels.unknownError));
      expect(englishIn()).toEqual([]);

      /* One that lands: the app removes the item. */
      await userEvent.click(screen.getAllByRole("button", { name: pseudo("Approve") })[0]);
      await act(async () => {
        settle.run!(false);
        rerender(<Queue items={ITEMS.slice(1)} />);
      });
      await waitFor(() => expect(status()).toContain(labels.left(2)));
      expect(englishIn()).toEqual([]);

      /* The open step sent: its submit button's spinner. It fails, and the
         step stays open with its draft. */
      await userEvent.type(screen.getByRole("textbox", { name: labels.note }), pseudo("Listed twice"));
      const step = screen.getByRole("group", { name: pseudo("Why?") });
      await userEvent.click(within(step).getByRole("button", { name: pseudo("Send back") }));
      expect(within(step).getByLabelText(labels.busy)).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
      await act(async () => settle.run!(true));

      /* The item with the open reason step is decided by someone else. */
      rerender(<Queue items={ITEMS.slice(2)} />);
      await waitFor(() => expect(status()).toContain(labels.decidedElsewhere(ITEMS[1].title)));
      expect(englishIn()).toEqual([]);

      /* An edit, in a Dialog whose close button the queue names. */
      await userEvent.click(screen.getByRole("button", { name: pseudo("Edit") }));
      expect(await screen.findByRole("button", { name: labels.close })).toBeInTheDocument();
      expect(englishIn()).toEqual([]);
    });

    it("twin: with its labels unset, its own English shows", async () => {
      render(<Queue items={ITEMS} withLabels={false} />);
      await userEvent.click(screen.getAllByRole("button", { name: pseudo("Send back") })[0]);
      expect(englishIn()).toEqual(expect.arrayContaining(["Decide", "Cancel", "Pick", "reason"]));
    });
  });
});
