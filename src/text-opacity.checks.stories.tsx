import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { opacityOf, textContrast } from "./test/painted";
import { Stat } from "./components/atoms/Stat/Stat";
import { Card } from "./components/atoms/Card/Card";
import { Chip } from "./components/atoms/Chip/Chip";
import { Badge } from "./components/atoms/Badge/Badge";
import { Link } from "./components/atoms/Link/Link";
import { Disclosure } from "./components/atoms/Disclosure/Disclosure";
import { AvatarStrip } from "./components/atoms/AvatarStrip/AvatarStrip";
import { CollapsibleSection } from "./components/atoms/CollapsibleSection/CollapsibleSection";
import { PasswordInput } from "./components/atoms/PasswordInput/PasswordInput";
import { MultiSelect } from "./components/atoms/MultiSelect/MultiSelect";
import { Combobox } from "./components/atoms/Combobox/Combobox";
import { Alert } from "./components/molecules/Alert/Alert";
import { CallToAction } from "./components/molecules/CallToAction/CallToAction";
import { ErrorState } from "./components/molecules/ErrorState/ErrorState";
import { MatchupCard } from "./components/molecules/MatchupCard/MatchupCard";
import { Carousel } from "./components/molecules/Carousel/Carousel";
import { Toast } from "./components/molecules/Toast/Toast";
import { Menu, MenuButton, MenuItem, MenuItems } from "./components/molecules/Menu/Menu";
import { Footer } from "./components/organisms/Footer/Footer";
import { ActionBar } from "./components/organisms/ActionBar/ActionBar";
import { DataTable } from "./components/organisms/DataTable/DataTable";
import { Dialog } from "./components/organisms/Dialog/Dialog";
import { Sheet } from "./components/organisms/Sheet/Sheet";

/**
 * Every Roster text and icon that carries an `opacity-*` or an alpha color,
 * measured as painted (`textContrast`, src/test/painted.ts): its ink through
 * its own opacity and every ancestor's, over what's behind it. Light and dark,
 * on a page and on a Card, in Chromium and WebKit (tagged `real-input` for the
 * project that runs both; nothing here takes input).
 *
 * Text is held to WCAG AA's 4.5:1 and an icon to 3:1 (1.4.11). The ones that
 * pass are held to it. The ones below it are pinned at what they measure, a
 * ledger of what's open: changing one fails here until the ledger moves.
 *
 * Not measured, by WCAG's own exceptions or because nothing reads there: a
 * disabled or otherwise inactive control's dimming, an enter or leave
 * transition's opacity, the loading dots, a Pill's ping, a skeleton block.
 * `src/text-opacity.test.ts` holds that list and fails on an opacity it
 * hasn't seen.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Text opacity/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
const TEXT = 4.5;
const ICON = 3;
const round = (n: number) => Math.round(n * 100) / 100;

const ALERTS = ["error", "success", "amber", "info", "primary", "neutral"] as const;
const CTAS = ["primary", "neutral", "warning", "error", "success", "info"] as const;
const FOOTERS = ["default", "primary", "transparent"] as const;
const BARS = ["default", "soft", "primary", "transparent"] as const;

/* Every inline site, with what to measure and its bar. */
type Site = { name: string; bar: number; at: (root: Element) => Element[] };
const all = (selector: string) => (root: Element) => [...root.querySelectorAll(selector)];
const leaves = (selector: string) => (root: Element) =>
  [...root.querySelectorAll(`${selector} *`), ...root.querySelectorAll(selector)].filter(
    (el) => el.childElementCount === 0 && el.textContent?.trim(),
  );

const SITES: Site[] = [
  { name: "Stat source", bar: TEXT, at: all('[data-site="stat"] .rst\\:text-\\[0\\.53125rem\\]') },
  ...ALERTS.flatMap((c): Site[] => [
    { name: `Alert ${c} body`, bar: TEXT, at: all(`[data-site="alert-${c}"] .rst\\:opacity-90`) },
    { name: `Alert ${c} close`, bar: ICON, at: all(`[data-site="alert-${c}"] button`) },
  ]),
  ...CTAS.flatMap((v): Site[] => [
    { name: `CallToAction ${v} description`, bar: TEXT, at: all(`[data-site="cta-${v}"] .rst\\:max-w-prose`) },
    { name: `CallToAction ${v} dismiss`, bar: ICON, at: all(`[data-site="cta-${v}"] button`) },
  ]),
  ...ALERTS.map((c): Site => ({ name: `Toast ${c} close`, bar: ICON, at: all(`[data-site="toast-${c}"] button`) })),
  ...FOOTERS.map((v): Site => ({ name: `Footer ${v} links`, bar: TEXT, at: all(`[data-site="footer-${v}"] nav a`) })),
  ...BARS.map((v): Site => ({ name: `ActionBar ${v} subtitle`, bar: TEXT, at: all(`[data-site="bar-${v}"] .rst\\:opacity-80`) })),
  { name: "ErrorState card description", bar: TEXT, at: all('[data-site="error"] .rst\\:mt-2') },
  { name: "AvatarStrip dismiss", bar: TEXT, at: all('[data-site="avatars"] [data-testid="avatar-strip-dismiss"]') },
  { name: "CollapsibleSection toggle", bar: TEXT, at: all('[data-site="collapsible"] button') },
  { name: "MatchupCard loser", bar: TEXT, at: leaves('[data-site="matchup"] .rst\\:opacity-50') },
  { name: "Carousel position", bar: TEXT, at: all('[data-site="carousel"] [data-carousel-position]') },
  { name: "DataTable sortable head", bar: TEXT, at: all('[data-site="table"] .rst\\:opacity-80') },
  { name: "Chip remove", bar: ICON, at: all('[data-site="chip"] .rst\\:opacity-70') },
  { name: "Badge icon", bar: ICON, at: all('[data-site="badge"] .rst\\:opacity-70') },
  { name: "Disclosure chevron", bar: ICON, at: all('[data-site="disclosure"] .rst\\:opacity-60') },
  { name: "Link external icon", bar: ICON, at: all('[data-site="link"] [data-testid="external-icon"]') },
  { name: "PasswordInput toggle", bar: ICON, at: all('[data-site="password"] button[aria-pressed]') },
  { name: "MultiSelect remove", bar: ICON, at: all('[data-site="multiselect"] .rst\\:opacity-70') },
];

/* Below the bar on 5.20.0, each at its lowest across the grounds, for a
   ruling. The figures are the same in both engines to 0.02. */
const BELOW: Record<string, number> = {
  "Alert info close": 2.91,
  "CallToAction primary dismiss": 2.98,
  "CallToAction neutral dismiss": 2.93,
  "CallToAction error dismiss": 2.97,
  "CallToAction success dismiss": 2.92,
  "CallToAction info dismiss": 2.96,
  "CallToAction warning dismiss": 2.86,
  "Footer default links": 3.04,
  "Footer primary links": 3.93,
  "Footer transparent links": 3.12,
  "ActionBar primary subtitle": 2.33,
  "AvatarStrip dismiss": 1.54,
  "MatchupCard loser": 3.35,
  "PasswordInput toggle": 1.85,
  "CollapsibleSection toggle hovered": 4.15,
};

function Sites() {
  const [tags, setTags] = useState<(string | number)[]>(["a"]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <dl data-site="stat" style={{ margin: 0 }}>
        <Stat size="sm" value="412" label="Entries" source="trail log, 2026" />
      </dl>
      {ALERTS.map((c) => (
        <div key={c} data-site={`alert-${c}`}>
          <Alert colorScheme={c} title="Saved" onDismiss={() => {}}>
            The body under a title.
          </Alert>
        </div>
      ))}
      {CTAS.map((v) => (
        <div key={v} data-site={`cta-${v}`}>
          <CallToAction variant={v} title="Join" description="A description under the title." onDismiss={() => {}} />
        </div>
      ))}
      {ALERTS.map((c) => (
        <div key={c} data-site={`toast-${c}`}>
          <Toast colorScheme={c} title="Saved" onDismiss={() => {}}>
            Body
          </Toast>
        </div>
      ))}
      {FOOTERS.map((v) => (
        <div key={v} data-site={`footer-${v}`}>
          <Footer variant={v} companyName="Acme" links={[{ label: "About", href: "#about" }]} />
        </div>
      ))}
      {BARS.map((v) => (
        <div key={v} data-site={`bar-${v}`}>
          <ActionBar variant={v} position="static" title="Title" subtitle="A subtitle under it" />
        </div>
      ))}
      <div data-site="error">
        <ErrorState variant="card" title="Failed" description="Something broke." />
      </div>
      <div data-site="avatars">
        <AvatarStrip items={[{ key: "a", label: "Ann" }, { key: "b", label: "Bo" }]} onDismiss={() => {}} />
      </div>
      <div data-site="collapsible">
        <CollapsibleSection size="xs">{"Lots of words ".repeat(40)}</CollapsibleSection>
      </div>
      <div data-site="matchup">
        <MatchupCard
          isCompleted
          awayTeam={{ id: 1, logoSrc: "", name: "Away", score: 10, isWinner: false }}
          homeTeam={{ id: 2, logoSrc: "", name: "Home", score: 20, isWinner: true }}
        />
      </div>
      <div data-site="carousel" style={{ width: 300 }}>
        <Carousel showPosition aria-label="Things">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} style={{ width: 120, height: 40 }}>
              Item {n}
            </div>
          ))}
        </Carousel>
      </div>
      <div data-site="table">
        <DataTable columns={[{ accessorKey: "name", header: "Name" }]} data={[{ name: "Ann" }]} />
      </div>
      <div data-site="chip">
        <Chip onRemove={() => {}}>Tag</Chip>
      </div>
      <div data-site="badge">
        <Badge leftIcon={<span>★</span>}>New</Badge>
      </div>
      <div data-site="disclosure">
        <Disclosure title="More">Body</Disclosure>
      </div>
      <div data-site="link">
        <Link href="https://example.com">Out</Link>
      </div>
      <div data-site="password">
        <PasswordInput label="Password" />
      </div>
      <div data-site="multiselect">
        <MultiSelect label="Tags" options={[{ value: "a", label: "Apple" }]} value={tags} onChange={setTags} />
      </div>
    </div>
  );
}

const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card"] as const;

function Ground({ id }: { id: (typeof GROUNDS)[number] }) {
  const dark = id.startsWith("dark");
  return (
    /* A page sets its text color, as an app's body does: the sites that
       inherit theirs read it. */
    <div
      data-ground={id}
      className={dark ? "dark" : undefined}
      style={{ padding: 12, width: 380, background: dark ? "#0c0a09" : "#ffffff", color: dark ? "#fafaf9" : "#1c1917" }}
    >
      {id.endsWith("card") ? (
        <Card>
          <Sites />
        </Card>
      ) : (
        <Sites />
      )}
    </div>
  );
}

/* The lowest ratio for each site across the grounds, and where it was. */
function measure(canvas: Element, sites: Site[]) {
  const lowest: Record<string, { ratio: number; where: string }> = {};
  const missing: string[] = [];
  for (const id of GROUNDS) {
    const ground = canvas.querySelector(`[data-ground="${id}"]`)!;
    for (const site of sites) {
      const found = site.at(ground);
      if (!found.length) missing.push(`${site.name} on ${id}`);
      for (const el of found) {
        const ratio = round(textContrast(el));
        if (!lowest[site.name] || ratio < lowest[site.name].ratio) lowest[site.name] = { ratio, where: id };
      }
    }
  }
  return { lowest, missing };
}

async function judge(lowest: Record<string, { ratio: number; where: string }>, bars: Record<string, number>) {
  const wrong: string[] = [];
  for (const [name, { ratio, where }] of Object.entries(lowest)) {
    if (name in BELOW) {
      if (Math.abs(ratio - BELOW[name]) > 0.05) wrong.push(`${name}: ${ratio} on ${where}, the ledger says ${BELOW[name]}`);
    } else if (ratio < bars[name]) wrong.push(`${name}: ${ratio} on ${where}, under ${bars[name]}`);
  }
  await expect(wrong).toEqual([]);
}

export const EveryInlineSite: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <style>{STILL}</style>
      {GROUNDS.map((id) => (
        <Ground key={id} id={id} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { lowest, missing } = measure(canvasElement, SITES);
    console.info(`TEXT OPACITY inline ${JSON.stringify(lowest)}`);
    /* Reach: every site rendered on every ground. */
    await expect(missing).toEqual([]);
    await judge(lowest, Object.fromEntries(SITES.map((s) => [s.name, s.bar])));

    /* A hover state set by opacity: the toggle at its hover's 0.8. */
    const toggles = [...canvasElement.querySelectorAll<HTMLElement>('[data-site="collapsible"] button')];
    const hovered = toggles.map((t) => {
      t.style.opacity = "0.8";
      const ratio = round(textContrast(t));
      t.style.opacity = "";
      return ratio;
    });
    console.info(`TEXT OPACITY hover ${JSON.stringify(hovered)}`);
    await expect(Math.min(...hovered)).toBeCloseTo(BELOW["CollapsibleSection toggle hovered"], 1);
  },
};

/* The popups and dialogs portal to <body>, so dark is the page's class. */
type Lowest = Record<string, { ratio: number; where: string }>;
function takeLowest(lowest: Lowest, theme: string, reading: Record<string, number>) {
  for (const [name, ratio] of Object.entries(reading)) {
    if (!lowest[name] || ratio < lowest[name].ratio) lowest[name] = { ratio, where: theme };
  }
}
async function eachTheme(read: () => Record<string, number>, lowest: Lowest) {
  for (const theme of ["light", "dark"]) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    takeLowest(lowest, theme, read());
  }
  document.documentElement.classList.remove("dark");
}
const reading = (out: Record<string, number>) => Object.fromEntries(Object.entries(out).map(([k, v]) => [k, round(v)]));

const MENU_BARS: Record<string, number> = { "Menu description": TEXT, "Menu shortcut": TEXT, "Combobox no matches": TEXT };

export const EveryMenuSite: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <style>{STILL}</style>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Actions
        </MenuButton>
        <MenuItems>
          <MenuItem description="Change its name" shortcut="⌘E">
            Edit
          </MenuItem>
        </MenuItems>
      </Menu>
      <div data-site="combobox">
        <Combobox label="Fruit" options={[{ value: "a", label: "Apple" }]} value={null} onChange={() => {}} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const lowest: Lowest = {};
    /* Opened the way a person opens them. */
    await userEvent.click(canvasElement.querySelector("button")!);
    /* Read once the panel has entered: its first frame is at opacity 0. The
       description carries its own 0.75. */
    await waitFor(() => expect(opacityOf(document.querySelector("[data-menu-description]")!)).toBe(0.75));
    await eachTheme(
      () =>
        reading({
          "Menu description": textContrast(document.querySelector("[data-menu-description]")!),
          "Menu shortcut": textContrast(document.querySelector("[data-menu-shortcut]")!),
        }),
      lowest,
    );
    await userEvent.keyboard("{Escape}");
    const combo = canvasElement.querySelector<HTMLInputElement>('[data-site="combobox"] input')!;
    await userEvent.click(combo);
    await userEvent.type(combo, "zzz");
    const empty = () => [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent?.includes("No matches"));
    await waitFor(() => expect(opacityOf(empty()!)).toBe(0.7));
    await eachTheme(() => reading({ "Combobox no matches": textContrast(empty()!) }), lowest);
    console.info(`TEXT OPACITY menus ${JSON.stringify(lowest)}`);
    await expect(Object.keys(lowest).sort()).toEqual(Object.keys(MENU_BARS).sort());
    await judge(lowest, MENU_BARS);
  },
};

const DIALOGS = ["white", "slate", "primary"] as const;
const DIALOG_BARS: Record<string, number> = {
  ...Object.fromEntries(DIALOGS.flatMap((v) => [[`Dialog ${v} description`, TEXT], [`Dialog ${v} close`, ICON]])),
  "Sheet description": TEXT,
  "Sheet close": ICON,
};

function Dialogs() {
  /* Focus starts in each body, so no close button reads as focused. */
  const sheet = useRef<HTMLButtonElement>(null);
  return (
    <>
      <style>{STILL}</style>
      {DIALOGS.map((variant) => (
        <Dialog key={variant} isOpen onClose={() => {}} title={`Dialog ${variant}`} description="What this asks." variant={variant}>
          <button data-autofocus>Body</button>
        </Dialog>
      ))}
      <Sheet isOpen onClose={() => {}} title="Sheet" description="What this holds." initialFocus={sheet}>
        <button ref={sheet}>Body</button>
      </Sheet>
    </>
  );
}

export const EveryDialogSite: Story = {
  render: () => <Dialogs />,
  play: async () => {
    const dialog = (title: string) => [...document.querySelectorAll("[role=dialog]")].find((d) => d.querySelector("h2")?.textContent === title);
    await waitFor(() => expect([...DIALOGS.map((v) => `Dialog ${v}`), "Sheet"].every((t) => dialog(t))).toBe(true));
    const description = (d: Element) => [...d.querySelectorAll("p, div")].find((e) => e.childElementCount === 0 && /^What this/.test(e.textContent ?? ""))!;
    const close = (d: Element) => d.querySelector('button[aria-label^="Close"]')!;
    /* Read once every panel has entered: before, they're at opacity 0. Each
       description carries its own 0.75. */
    await waitFor(() => expect([...DIALOGS.map((v) => `Dialog ${v}`), "Sheet"].map((t) => opacityOf(description(dialog(t)!)))).toEqual([0.75, 0.75, 0.75, 0.75]));
    const lowest: Lowest = {};
    await eachTheme(() => {
      const out: Record<string, number> = {};
      for (const v of DIALOGS) {
        out[`Dialog ${v} description`] = textContrast(description(dialog(`Dialog ${v}`)!));
        out[`Dialog ${v} close`] = textContrast(close(dialog(`Dialog ${v}`)!));
      }
      out["Sheet description"] = textContrast(description(dialog("Sheet")!));
      out["Sheet close"] = textContrast(close(dialog("Sheet")!));
      return reading(out);
    }, lowest);
    console.info(`TEXT OPACITY dialogs ${JSON.stringify(lowest)}`);
    await expect(Object.keys(lowest).sort()).toEqual(Object.keys(DIALOG_BARS).sort());
    await judge(lowest, DIALOG_BARS);
  },
};
