import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Navbar } from "./Navbar";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Navbar's promises, checked in Chromium: its accessibility tree and its
 * rendered boxes. Expected values are literals from the requirement, each
 * with a twin.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Navbar/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* A one-pixel image, so the logo has something to draw without a network. */
const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export const TheBrandIsReadOnce: Story = {
  tags: ["ax-tree"],
  render: () => (
    <>
      <Navbar logoSrc={LOGO} brandName="Tidewater" items={[{ label: "Charts", path: "/charts" }]} />
      {/* The twin: a logo with its own alt beside the same name, as 5.4.0 drew it. */}
      <a href="/" data-twin="">
        <img src={LOGO} alt="Tidewater Logo" />
        <span>Tidewater</span>
      </a>
    </>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const logo = canvasElement.querySelector<HTMLImageElement>(`nav img[src="${LOGO}"]`)!;
    const home = logo.closest("a")!;
    const twin = canvasElement.querySelector<HTMLElement>("[data-twin]")!;
    const ids = [logo, home, twin].map((el, i) => {
      const id = `nav-${i}-${Math.random().toString(36).slice(2)}`;
      el.setAttribute("data-ax-probe", id);
      return `[data-ax-probe="${id}"]`;
    });
    const states = await real.commands.axStates(ids);
    [logo, home, twin].forEach((el) => el.removeAttribute("data-ax-probe"));
    await expect(states.map((s) => [s.role, s.name])).toEqual([
      ["none", ""],
      ["link", "Tidewater"],
      ["link", "Tidewater Logo Tidewater"],
    ]);
  },
};

/* A wide lockup, 240 by 32: what a wordmark beside its mark looks like. */
const LOCKUP =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='32' viewBox='0 0 240 32'%3E%3Crect width='240' height='32' fill='%230a4f7a'/%3E%3C/svg%3E";

export const AWideLogoKeepsItsShape: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <div data-site="wide">
        <Navbar logoSrc={LOCKUP} logoHeight={32} brandName="Tidewater" brandElement={<span />} position="static" items={[{ label: "Charts", path: "/charts" }]} />
      </div>
      {/* The twin: the same lockup through the square logoSize, as before. */}
      <div data-site="square">
        <Navbar logoSrc={LOCKUP} logoSize={32} brandName="Tidewater" brandElement={<span />} position="static" items={[{ label: "Charts", path: "/charts" }]} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const box = (site: string, where: string) => {
      const img = canvasElement.querySelector<HTMLImageElement>(`[data-site="${site}"] ${where} img[src="${LOCKUP}"]`)!;
      const { width, height } = img.getBoundingClientRect();
      return [Math.round(width), Math.round(height)];
    };
    try {
      /* A phone, where the menu panel is the one that opens. */
      await real.page.viewport(414, 896);
      await waitFor(() => expect(window.innerWidth).toBe(414));
      await waitFor(() => expect(box("wide", "a")).toEqual([240, 32]));
      await expect(box("square", "a"), "the twin, squashed").toEqual([32, 32]);
      /* The panel's copy of the logo takes the same box. Its panel scales in,
         so wait for the box to settle before reading it. */
      canvasElement.querySelector<HTMLButtonElement>('[data-site="wide"] [data-roster-hamburger] button')!.click();
      await waitFor(() => expect(box("wide", "[data-roster-mobile-panel]")).toEqual([240, 32]));
      canvasElement.querySelector<HTMLButtonElement>('[data-site="square"] [data-roster-hamburger] button')!.click();
      await waitFor(() => expect(box("square", "[data-roster-mobile-panel]"), "the twin's panel").toEqual([32, 32]));
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const AFittedLogoSitsAtTheStartEdge: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["ltr", "rtl"] as const).map((dir) => (
        <div key={dir} dir={dir} data-dir={dir}>
          {/* A box wider than the lockup, so the image is fitted inside it. */}
          <Navbar logoSrc={LOCKUP} logoWidth={320} logoHeight={32} brandName="Tidewater" position="static" items={[]} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fit = (dir: string) => {
      const img = canvasElement.querySelector<HTMLImageElement>(`[data-dir="${dir}"] nav img[src="${LOCKUP}"]`)!;
      const style = getComputedStyle(img);
      return [style.objectFit, style.objectPosition];
    };
    await expect(fit("ltr")).toEqual(["contain", "0% 50%"]);
    /* The twin: a right-to-left page puts it against the right edge. */
    await expect(fit("rtl")).toEqual(["contain", "100% 50%"]);
  },
};

/* The user menu, rebuilt on Roster's Menu, measured against the one it
   replaced (5.8.0, Headless UI's): every literal below was read from that
   menu in Chromium, the same story at the same width. Its rows grew from
   36px to 44, Menu's minimum target, and that is the one change. */
/* The fixture both user menu checks open. */
const UserMenuFixture = () => (
  /* Narrower than the screen, so a panel lined up with the avatar's left
     edge would have the room to stay there: it has to line up right. */
  <div style={{ minHeight: 360, width: 640 }}>
    <Navbar
      logoSrc={LOGO}
      brandName="Tidewater"
      position="static"
      items={[{ label: "Charts", path: "/charts" }]}
      user={{ initials: "TW", notificationCount: 2 }}
      onInboxClick={() => {}}
      onThemeToggle={() => {}}
      onLogout={() => {}}
      userMenuItems={[{ label: "Settings", path: "/settings" }]}
    />
  </div>
);

const openUserMenu = async (canvasElement: HTMLElement) => {
  const trigger = canvasElement.querySelector<HTMLButtonElement>("nav button[aria-haspopup='menu']")!;
  trigger.click();
  const panel = await waitFor(() => {
    const el = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
    expect(el).not.toBeNull();
    return el!;
  });
  await waitFor(() => expect([panel.getAnimations().length, getComputedStyle(panel).scale]).toEqual([0, "none"]));
  return { trigger, panel, rows: [...panel.querySelectorAll<HTMLElement>("[data-menu-item]")] };
};

/* A row's words as drawn: the element holding its first text, and where that
   text starts from the panel's left edge. */
const labelOf = (row: HTMLElement, panel: HTMLElement) => {
  const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
  const text = walker.nextNode()!;
  const range = document.createRange();
  range.selectNodeContents(text);
  return { style: getComputedStyle(text.parentElement!), x: Math.round(range.getBoundingClientRect().left - panel.getBoundingClientRect().left) };
};

/* Every literal in these two checks is 5.8.0's, read from its rendered menu in
   Chromium, in both themes. The one change is the rows' height: 36px then,
   44 now. */
const looksAsItDid = async (canvasElement: HTMLElement) => {
  const { trigger, panel, rows } = await openUserMenu(canvasElement);
  const p = panel.getBoundingClientRect();
  const t = trigger.getBoundingClientRect();
  const style = getComputedStyle(panel);
  const groups = [...panel.querySelectorAll<HTMLElement>(":scope > [role='group']")];
  const icon = (r: HTMLElement) => {
    const svg = r.querySelector("svg");
    if (!svg) return null;
    const b = svg.getBoundingClientRect();
    return [b.left + b.width / 2 - p.left, b.width];
  };
  await expect({
    width: p.width,
    rightEdge: Math.round(p.right - t.right),
    gap: Math.round(p.top - t.bottom),
    fill: style.backgroundColor,
    /* The twin: the app's color does reach the panel. */
    token: style.getPropertyValue("--roster-popover-bg").trim(),
    radius: style.borderTopLeftRadius,
    /* Role, words, their color, size and weight, where they start, the cursor
       and the row's corners. */
    rows: rows.map((r) => {
      const label = labelOf(r, panel);
      return [r.getAttribute("role"), r.textContent?.replace(/\s+/g, " ").trim(), label.style.color, label.style.fontSize, label.style.fontWeight, label.x, label.style.cursor, getComputedStyle(r).borderTopLeftRadius];
    }),
    /* Each icon's middle and width: Font Awesome's own 1.25em, not a 16px slot. */
    icons: rows.map(icon),
    heights: rows.map((r) => r.getBoundingClientRect().height),
    rule: getComputedStyle(groups[1]).borderTopColor,
    sections: groups.map((g) => [getComputedStyle(g).paddingTop, getComputedStyle(g).paddingBottom]),
  }).toEqual({
    width: 192,
    rightEdge: 0,
    gap: 8,
    fill: "rgb(255, 255, 255)",
    token: "rgb(20, 40, 60)",
    radius: "6px",
    rows: [
      ["menuitem", "Inbox (2)", "rgb(87, 83, 78)", "14px", "500", 43, "pointer", "0px"],
      ["menuitemcheckbox", "Dark Mode", "rgb(68, 64, 60)", "14px", "500", 42, "pointer", "0px"],
      ["menuitem", "Settings", "rgb(68, 64, 60)", "14px", "600", 16, "pointer", "4px"],
      ["menuitem", "Log Out", "rgb(87, 83, 78)", "14px", "500", 43, "pointer", "0px"],
    ],
    icons: [[25.75, 17.5], [24.75, 17.5], null, [25.75, 17.5]],
    heights: [44, 44, 44, 44],
    rule: "rgb(245, 245, 244)",
    sections: [
      ["4px", "4px"],
      ["4px", "4px"],
      ["4px", "4px"],
    ],
  });
  /* The ring is the old faint one, not the popover border a plain Menu draws. */
  await expect(style.getPropertyValue("--tw-ring-color").trim()).toBe("color-mix(in oklab, #1e1c1a 5%, transparent)");
  /* The avatar is 32px and its target 44: a press 5px outside the avatar,
     inside the hit area, lands on the button. The twin: 8px outside doesn't. */
  const hit = (dx: number) => document.elementFromPoint(t.left - dx, t.top + t.height / 2)?.closest("button") === trigger;
  await expect([t.width, hit(5), hit(8)]).toEqual([32, true, false]);
  trigger.click();
};

export const TheUserMenuLooksAsItDid: Story = {
  render: () => <UserMenuFixture />,
  play: async ({ canvasElement }) => {
    /* An app that repaints Roster's popups, as one does with its card color,
       doesn't repaint this menu: it was white before it was a Roster Menu. */
    document.documentElement.style.setProperty("--roster-popover-bg", "rgb(20, 40, 60)");
    try {
      await looksAsItDid(canvasElement);
    } finally {
      document.documentElement.style.removeProperty("--roster-popover-bg");
    }
  },
};


/* Engines print the same oklab color to different precision (Chromium
   0.500224, WebKit 0.500227): compared to three places. */
const tidy = (color: string) => color.replace(/\d*\.\d+/g, (n) => String(Math.round(Number(n) * 1000) / 1000));

export const TheUserMenuPointsAsItDid: Story = {
  tags: ["real-input"],
  render: () => <UserMenuFixture />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const { trigger, panel, rows } = await openUserMenu(canvasElement);
    rows.forEach((r, i) => r.setAttribute("data-check", `row-${i}`));
    const under = async (i: number) => {
      await real.commands.realHover(`[data-check="row-${i}"]`);
      await waitFor(() => expect(document.activeElement).toBe(rows[i]));
      const r = rows[i];
      /* Read once the colors have finished easing in. */
      await waitFor(() => expect(r.getAnimations({ subtree: true }).length).toBe(0));
      return [tidy(getComputedStyle(r).backgroundColor), labelOf(r, panel).style.color];
    };
    /* Under the pointer, Inbox takes a ghost Button's own fill and Settings a
       Link's darker words, each over the focused row's pale fill. The twin:
       Dark Mode, a plain row then too, takes the pale fill and keeps its words. */
    await expect([await under(0), await under(1), await under(2), await under(3)]).toEqual([
      ["oklab(0.5 0.001 0.007 / 0.1)", "rgb(87, 83, 78)"],
      ["rgb(250, 250, 249)", "rgb(68, 64, 60)"],
      ["rgb(250, 250, 249)", "rgb(28, 25, 23)"],
      ["oklab(0.5 0.001 0.007 / 0.1)", "rgb(87, 83, 78)"],
    ]);
    trigger.click();
  },
};

export const TheOpenPanelCoversTheHamburger: Story = {
  tags: ["real-input"],
  render: () => <Navbar logoSrc={LOGO} brandName="Tidewater" position="static" items={[{ label: "Charts", path: "/charts" }]} />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    try {
      await real.page.viewport(414, 800);
      await waitFor(() => expect(window.innerWidth).toBe(414));
      const hamburger = canvasElement.querySelector<HTMLButtonElement>("[data-roster-hamburger] button")!;
      const box = hamburger.getBoundingClientRect();
      const atHamburger = () => document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      /* The twin first: shut, a press there lands on the hamburger. */
      await expect(hamburger.contains(atHamburger())).toBe(true);
      hamburger.setAttribute("data-check", "hamburger");
      await real.commands.realClick('[data-check="hamburger"]');
      await waitFor(() => expect(hamburger).toHaveAttribute("aria-expanded", "true"));
      const panel = document.querySelector<HTMLElement>("[data-roster-mobile-panel]")!;
      await waitFor(() => expect(panel.getAnimations({ subtree: true })).toHaveLength(0));
      /* Open, the panel covers it: a press there lands on the panel, and
         focus on the hamburger would be focus out of sight, so it closes the
         panel (Navbar.test.tsx). */
      await expect([panel.contains(atHamburger()), hamburger.contains(atHamburger())]).toEqual([true, false]);
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};
