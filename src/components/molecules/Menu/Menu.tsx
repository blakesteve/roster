import * as React from "react";
import { Portal } from "@headlessui/react";
import { autoUpdate, flip, offset as offsetBy, shift, size, useFloating, type OffsetOptions, type Placement } from "@floating-ui/react-dom";
import { cn } from "../../../lib/utils";
import { POPUP_PANEL } from "../../../internal/popup";
import { Button, type ButtonProps } from "../../atoms/Button/Button";
import { nextByTypeahead } from "./menu-typeahead";

/* ── Contracts ─────────────────────────────────────────────────────────────── */

/**
 * The props every link item is rendered with. `href` and `to` carry the same
 * value, so `next/link`, React Router's `Link` and a plain `<a>` all work
 * without a wrapper. The rest must reach the DOM: the role, the tab index and
 * the handlers are what make the link an item of the menu.
 */
export interface MenuLinkProps {
  href: string;
  to: string;
  className: string;
  children: React.ReactNode;
  role: "menuitem";
  tabIndex: -1;
  "aria-disabled"?: true;
  "aria-keyshortcuts"?: string;
  "aria-describedby"?: string;
  "data-menu-item": "";
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLAnchorElement>) => void;
}

/* Named props rather than a spread, so `to` doesn't land on the anchor. */
function DefaultLink({ href, to: _to, children, ...rest }: MenuLinkProps) {
  void _to;
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

type FocusTarget = "first" | "last" | "panel";

interface TreeContextValue {
  /** Marks every element of this menu, its trigger and every panel, so a click can tell inside from outside. */
  treeId: string;
  open: boolean;
  openWith: (target: FocusTarget) => void;
  /** Closes the whole tree. `focusTrigger` puts focus back on the button. */
  close: (focusTrigger: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** The button as state, for what render reads: where the panel anchors, its direction, its dark scope. */
  triggerEl: HTMLButtonElement | null;
  registerTrigger: (el: HTMLButtonElement | null) => void;
  triggerId: string;
  panelId: string;
  focusOnOpen: React.RefObject<FocusTarget>;
  linkComponent: React.ComponentType<MenuLinkProps>;
}

interface LevelContextValue {
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** The open submenu at this level, by its trigger's id. */
  openSubmenu: string | null;
  setOpenSubmenu: (id: string | null, focusFirst?: boolean) => void;
  /** Pointer hovered an item at this level: schedule closing a submenu it doesn't own. */
  hoverItem: (submenuId: string | null) => void;
  focusFirstInSubmenu: React.RefObject<boolean>;
  /** Whether a typeahead search is under way here, so a space belongs to it. */
  typingAhead: () => boolean;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);
const LevelContext = React.createContext<LevelContextValue | null>(null);
const RadioContext = React.createContext<{ value: string | undefined; onValueChange?: (value: string) => void } | null>(null);

function useTree(part: string): TreeContextValue {
  const tree = React.useContext(TreeContext);
  if (!tree) throw new Error(`<${part}> must be inside a <Menu>.`);
  return tree;
}

function useLevel(part: string): LevelContextValue {
  const level = React.useContext(LevelContext);
  if (!level) throw new Error(`<${part}> must be inside <MenuItems> or a <MenuSubmenu>.`);
  return level;
}

/* ── Shared behavior ──────────────────────────────────────────────────────── */

const ITEM = "[data-menu-item]";
/** How long the pointer may rest before a submenu opens or closes under it. */
const HOVER_DELAY = 100;
/** The leave transition, and how long a closing panel stays mounted for it. */
const LEAVE_MS = 75;

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])';

/** This panel's own items: a submenu's panel is portaled, so it is never inside. */
function itemsOf(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  return [...panel.querySelectorAll<HTMLElement>(ITEM)].filter((el) => el.closest("[data-menu-panel]") === panel);
}

/**
 * Focus an item from the keyboard: the arrows, Home and End, typeahead, an
 * opening key, or backing out of a submenu. The pointer focuses items itself
 * and never comes through here.
 *
 * The item is marked `data-key-focus` until it loses focus, and that mark, not
 * `:focus-visible`, is what draws its ring. Focus moved by script only counts
 * as the keyboard's to a browser that has seen keys since the last click:
 * WebKit hadn't, for a menu opened with the mouse and then walked with the
 * arrows, so its rows showed the tint alone.
 */
function focusItem(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.setAttribute("data-key-focus", "");
  el.addEventListener("blur", () => el.removeAttribute("data-key-focus"), { once: true });
  el.focus({ preventScroll: true });
  el.scrollIntoView?.({ block: "nearest" });
}

function isRtl(el: HTMLElement | null): boolean {
  return !!el && getComputedStyle(el).direction === "rtl";
}

/**
 * Tab out of an open menu moves on from the button, not from the item: the
 * panel is portaled to the end of the document, and the browser would
 * otherwise take focus to whatever follows it there.
 */
function focusBeside(trigger: HTMLElement, backwards: boolean) {
  const all = [...document.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) =>
      el === trigger ||
      (el.tabIndex >= 0 &&
        !el.matches(":disabled") &&
        !el.closest("[data-menu-panel], [inert]") &&
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== "hidden" &&
        !skippedRadio(el, backwards)),
  );
  const at = all.indexOf(trigger);
  const next = backwards ? all[at - 1] : all[at + 1];
  (next ?? trigger).focus();
}

/**
 * A radio Tab passes over. A group is one stop: its checked radio, or with
 * none checked, the first one going forward and the last going back.
 */
function skippedRadio(el: HTMLElement, backwards: boolean): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== "radio" || !el.name) return false;
  const group = [...el.ownerDocument.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`)].filter(
    (r) => r.form === el.form && !r.disabled,
  );
  const stop = group.find((r) => r.checked) ?? (backwards ? group[group.length - 1] : group[0]);
  return stop !== el;
}

/**
 * Whether the pointer really moved. WebKit sends a pointermove without a move
 * when a panel scrolls under a resting pointer: End, or the arrows scrolling
 * a tall menu, would otherwise hand focus from the keyboard to whatever item
 * lands under it. Such a move repeats the last position, so the position is
 * what's compared (`movementX` reads 0 for every move in some engines). The
 * window hears each move after the menu does, so `last` is always the move
 * before.
 */
const last = { x: Number.NaN, y: Number.NaN };
let tracking = false;
function trackPointer() {
  if (tracking || typeof window === "undefined") return;
  tracking = true;
  window.addEventListener(
    "pointermove",
    (event) => {
      last.x = event.clientX;
      last.y = event.clientY;
    },
    { passive: true },
  );
}
function pointerMoved(event: React.PointerEvent): boolean {
  return !Number.isNaN(last.x) && (event.clientX !== last.x || event.clientY !== last.y);
}

/**
 * The scroll affordance: a shadow along whichever edge has more to scroll to,
 * set from the scroll position (`useScrollEdges`). Images only, so the
 * panel's background color stays the class's to set.
 */
const EDGE_SHADOW = (side: "top" | "bottom") => `radial-gradient(farthest-side at 50% ${side === "top" ? "0" : "100%"}, var(--menu-edge), transparent)`;
const SCROLL_SHADOWS: React.CSSProperties = {
  backgroundImage: "var(--menu-edge-top, none), var(--menu-edge-bottom, none)",
  backgroundPosition: "top, bottom",
  backgroundSize: "100% 0.5rem",
  backgroundRepeat: "no-repeat",
};

/** Marks which edges have more to scroll to, and keeps it true as the panel scrolls and resizes. */
function useScrollEdges(panel: HTMLElement | null) {
  React.useLayoutEffect(() => {
    if (!panel) return;
    /* More than the panel's own padding: an item, or part of one. */
    const update = () => {
      const above = panel.scrollTop > 8;
      const below = panel.scrollTop + panel.clientHeight < panel.scrollHeight - 8;
      panel.toggleAttribute("data-more-above", above);
      panel.toggleAttribute("data-more-below", below);
      panel.style.setProperty("--menu-edge-top", above ? EDGE_SHADOW("top") : "none");
      panel.style.setProperty("--menu-edge-bottom", below ? EDGE_SHADOW("bottom") : "none");
    };
    update();
    panel.addEventListener("scroll", update, { passive: true });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resize?.observe(panel);
    return () => {
      panel.removeEventListener("scroll", update);
      resize?.disconnect();
    };
  }, [panel]);
}

/** Where the panel grows from: the corner nearest what it opened from, on whichever side it landed. */
function originOf(placement: Placement, rtl: boolean): string {
  const [side, align] = placement.split("-");
  const start = rtl ? "right" : "left";
  const end = rtl ? "left" : "right";
  if (side === "top" || side === "bottom") {
    return `${side === "bottom" ? "top" : "bottom"} ${align === "end" ? end : align === "start" ? start : "center"}`;
  }
  return `${align === "end" ? "bottom" : "top"} ${side === "right" ? "left" : "right"}`;
}

const PANEL = /* @__PURE__ */ cn(
  "rst:font-ui",
  POPUP_PANEL,
  /* Its own width wherever it lands: a fixed panel sized by the room to its
     right resizes as it's placed, and the placement runs again. */
  "rst:w-max rst:min-w-48 rst:max-w-[min(20rem,calc(100vw-1rem))] rst:overflow-y-auto rst:overscroll-contain rst:custom-scrollbar",
  /* The scroll shadows' color: stronger on a dark panel, where a faint one vanishes. */
  "rst:[--menu-edge:rgb(0_0_0/0.18)] rst:dark:[--menu-edge:rgb(0_0_0/0.6)]",
  /* The entrance: a fade and a slight grow from the corner nearest the
     button. Leaving is quicker. Neither moves under reduced motion. Opacity
     and scale only: a transition on the position would fly the panel in
     from the corner of the screen. */
  "rst:transition-[opacity,scale] rst:duration-100 rst:ease-out rst:data-closed:opacity-0 rst:data-closed:scale-95 rst:data-leaving:duration-75 rst:data-leaving:ease-in rst:data-closed:pointer-events-none rst:motion-reduce:transition-none",
);

/**
 * Mounts a panel for its whole life: open, then its leave transition. `closed`
 * drives `data-closed` one frame after mounting, so the entrance has a start.
 */
function usePresence(open: boolean) {
  const [mounted, setMounted] = React.useState(open);
  const [closed, setClosed] = React.useState(true);
  React.useLayoutEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setClosed(false));
      return () => cancelAnimationFrame(frame);
    }
    setClosed(true);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMounted(false), reduce ? 0 : LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);
  return { mounted, closed, leaving: mounted && !open };
}

/** Where a panel opens, kept on screen: flipped when the far side has more room, shifted in, and capped at the room there is. */
function usePlacement(
  reference: HTMLElement | null,
  mounted: boolean,
  placement: Placement,
  gap: OffsetOptions,
  panelRef: React.RefObject<HTMLDivElement | null>,
  /* A submenu opens sideways, so keeping it on screen moves it sideways too. */
  shiftBothWays = false,
) {
  const [panelEl, setPanelEl] = React.useState<HTMLDivElement | null>(null);
  const floating = useFloating({
    open: mounted,
    strategy: "fixed",
    /* Placed by top and left, not a transform: the entrance's scale would
       scale a transform's translation too, and slide the panel in. */
    transform: false,
    placement,
    elements: { reference },
    whileElementsMounted: autoUpdate,
    middleware: [
      offsetBy(gap),
      flip({ padding: 8 }),
      shift({ padding: 8, crossAxis: shiftBothWays }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          /* `--anchor-max-height` caps it shorter, as on Roster's other popups. */
          elements.floating.style.maxHeight = `min(var(--anchor-max-height, 100vh), ${Math.max(availableHeight, 96)}px)`;
        },
      }),
    ],
  });
  const { setFloating } = floating.refs;
  /* Stable, or each render would hand React a new ref and reset the panel. */
  const setPanel = React.useCallback(
    (el: HTMLDivElement | null) => {
      panelRef.current = el;
      setPanelEl(el);
      setFloating(el);
    },
    [panelRef, setFloating],
  );
  useScrollEdges(panelEl);
  return { ...floating, setPanel, panelEl };
}

/**
 * Keys inside one panel. The root panel and each submenu's run the same
 * handler; only what Escape and the arrow toward the parent do differs.
 */
/** What has been typed toward an item, and when: a search runs for half a second. */
const TYPEAHEAD_MS = 500;
function useTypeahead() {
  const typedRef = React.useRef({ text: "", at: 0 });
  const typingAhead = React.useCallback(() => typedRef.current.text !== "" && performance.now() - typedRef.current.at <= TYPEAHEAD_MS, []);
  return { typedRef, typingAhead };
}

function usePanelKeys({
  panelRef,
  typedRef,
  onEscape,
  onBack,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  typedRef: React.RefObject<{ text: string; at: number }>;
  onEscape: () => void;
  onBack?: () => void;
}) {
  const tree = useTree("MenuItems");
  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    /* React carries events up its own tree, through portals: a key in a
       submenu would reach this panel too. Only this panel's own keys count. */
    if (!panel || !panel.contains(event.target as Node)) return;
    /* The menu's keys stay in the menu: Enter on an item shouldn't also open
       the row around it. A combination with Ctrl, Meta or Alt goes on, for
       the app's own shortcuts. */
    if (!event.ctrlKey && !event.metaKey && !event.altKey) event.stopPropagation();
    /* An item that handled the key itself (Space choosing it) has the last word. */
    if (event.defaultPrevented) return;
    const items = itemsOf(panel);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const rtl = isRtl(panel);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        focusItem(items[(at + 1) % items.length]);
        return;
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        focusItem(items[at <= 0 ? items.length - 1 : at - 1]);
        return;
      case "Home":
      case "PageUp":
        event.preventDefault();
        event.stopPropagation();
        focusItem(items[0]);
        return;
      case "End":
      case "PageDown":
        event.preventDefault();
        event.stopPropagation();
        focusItem(items[items.length - 1]);
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      case "Tab": {
        event.preventDefault();
        event.stopPropagation();
        const trigger = tree.triggerRef.current;
        tree.close(false);
        if (trigger) focusBeside(trigger, event.shiftKey);
        return;
      }
      case "ArrowLeft":
      case "ArrowRight":
        if (onBack && event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
          event.preventDefault();
          event.stopPropagation();
          onBack();
        }
        return;
    }
    /* Typeahead: a printable key jumps to the next item starting with what
       has been typed in the last half second. */
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = performance.now();
      const searching = typedRef.current.text !== "" && now - typedRef.current.at <= TYPEAHEAD_MS;
      if (event.key === " " && !searching) return;
      /* Part of the search, matched or not: a space here never reaches the
         item as a press, which would click it when the key comes up. */
      event.preventDefault();
      typedRef.current = { text: searching ? typedRef.current.text + event.key : event.key, at: now };
      const labels = items.map((el) => el.dataset.menuText ?? el.textContent ?? "");
      const next = nextByTypeahead(labels, at, typedRef.current.text);
      if (next !== -1) focusItem(items[next]);
    }
  };
}

/* ── Menu ─────────────────────────────────────────────────────────────────── */

export interface MenuProps {
  /** The trigger (`MenuButton`) and the panel (`MenuItems`). */
  children: React.ReactNode;
  /**
   * Controlled open state. Leave both off to let the menu keep its own. Pass
   * `onOpenChange` with `open`: every way the menu closes itself (Escape,
   * Tab, a press outside, a choice) is a call to it.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Renders every link item (a `MenuItem` with an `href`). Defaults to a plain
   * `<a>`, which inside a router turns each choice into a full page load: pass
   * `next/link` or your router's link, from a client component.
   */
  linkComponent?: React.ComponentType<MenuLinkProps>;
}

/**
 * A button that opens a panel of actions: the menu button pattern. Compose it:
 *
 * ```tsx
 * <Menu>
 *   <MenuButton>Actions</MenuButton>
 *   <MenuItems>
 *     <MenuItem icon={<EditIcon />} shortcut="⌘E" onSelect={edit}>Edit</MenuItem>
 *     <MenuSeparator />
 *     <MenuItem destructive onSelect={remove}>Delete</MenuItem>
 *   </MenuItems>
 * </Menu>
 * ```
 *
 * The keyboard follows the pattern: Enter, Space or Down open it on the first
 * item and Up on the last; arrows move, Home and End jump, a typed letter
 * jumps to the next item starting with it; Escape closes it and puts focus
 * back on the button; Tab closes it and moves on. A submenu opens with the
 * arrow away from the parent and closes with the arrow back.
 */
function Menu({ children, open: openProp, onOpenChange, linkComponent = DefaultLink }: MenuProps) {
  const [ownOpen, setOwnOpen] = React.useState(false);
  const open = openProp ?? ownOpen;
  const id = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [triggerEl, setTriggerEl] = React.useState<HTMLButtonElement | null>(null);
  const registerTrigger = React.useCallback((el: HTMLButtonElement | null) => {
    triggerRef.current = el;
    setTriggerEl(el);
  }, []);
  const focusOnOpen = React.useRef<FocusTarget>("panel");

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwnOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const tree = React.useMemo<TreeContextValue>(
    () => ({
      treeId: id,
      open,
      openWith: (target) => {
        focusOnOpen.current = target;
        setOpen(true);
      },
      close: (focusTrigger) => {
        setOpen(false);
        if (focusTrigger) triggerRef.current?.focus();
      },
      triggerRef,
      triggerEl,
      registerTrigger,
      triggerId: `${id}-button`,
      panelId: `${id}-menu`,
      focusOnOpen,
      linkComponent,
    }),
    [id, open, setOpen, linkComponent, triggerEl, registerTrigger],
  );

  /* Outside the tree, a press closes it. Focus stays where the press put it,
     unless it put it nowhere: then it goes back to the button. */
  React.useEffect(() => {
    if (!open) return;
    trackPointer();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(`[data-menu-tree="${id}"]`)) return;
      setOpen(false);
      requestAnimationFrame(() => {
        if (document.activeElement === document.body || !document.activeElement) triggerRef.current?.focus({ preventScroll: true });
      });
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, id, setOpen]);

  return <TreeContext.Provider value={tree}>{children}</TreeContext.Provider>;
}

/* ── MenuButton ───────────────────────────────────────────────────────────── */

export interface MenuButtonProps extends ButtonProps {
  /**
   * A plain `<button>` with only your `className`, for a trigger drawn its own
   * way: an avatar, an icon. Keep its target at least 44 by 44, with
   * padding or a hit area, if you draw it smaller.
   */
  plain?: boolean;
}

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton(
  { plain = false, className, onClick, onKeyDown, children, ...props },
  ref,
) {
  /* What only a Button understands stays off a plain `<button>`. */
  const { variant, colorScheme, size, isLoading, loadingLabel, startIcon, endIcon, surface, ...nativeProps } = props;
  const tree = useTree("MenuButton");
  const { registerTrigger } = tree;
  const setRefs = React.useCallback(
    (el: HTMLButtonElement | null) => {
      registerTrigger(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [registerTrigger, ref],
  );
  const wiring = {
    id: tree.triggerId,
    "aria-haspopup": "menu" as const,
    "aria-expanded": tree.open,
    "aria-controls": tree.open ? tree.panelId : undefined,
    "data-menu-tree": tree.treeId,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (tree.open) tree.close(false);
      else tree.openWith("panel");
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const target: FocusTarget | null =
        event.key === "Enter" || event.key === " " || event.key === "ArrowDown" ? "first" : event.key === "ArrowUp" ? "last" : null;
      if (!target) return;
      event.preventDefault();
      /* Already open (an owner holding it open, say): into the items. */
      const panel = tree.open ? document.getElementById(tree.panelId) : null;
      if (panel) {
        const items = itemsOf(panel);
        focusItem(target === "last" ? items[items.length - 1] : items[0]);
        return;
      }
      tree.openWith(target);
    },
  };
  if (plain) {
    return (
      <button ref={setRefs} type="button" className={className} {...nativeProps} {...wiring}>
        {children}
      </button>
    );
  }
  return (
    /* min 44 by 44 whatever the size: the target a finger needs. */
    <Button
      ref={setRefs}
      className={cn("rst:min-h-11 rst:min-w-11", className)}
      {...{ variant, colorScheme, size, isLoading, loadingLabel, startIcon, endIcon, surface }}
      {...nativeProps}
      {...wiring}
    >
      {children}
    </Button>
  );
});

/* ── MenuItems: the panel ─────────────────────────────────────────────────── */

export interface MenuItemsProps {
  children: React.ReactNode;
  /** Which edge of the button the panel lines up with. */
  align?: "start" | "end";
  /** The gap between the button and the panel, in px. */
  offset?: number;
  /** Names the menu when the button's own name shouldn't. By default the button names it. */
  "aria-label"?: string;
  /** Applied to the panel. Its surface reads `--roster-popover-*`; set those to repaint it. */
  className?: string;
}

function MenuItems({ children, align = "start", offset = 4, className, ...aria }: MenuItemsProps) {
  const tree = useTree("MenuItems");
  const { mounted, closed, leaving } = usePresence(tree.open);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const rtl = isRtl(tree.triggerEl);
  /* Logical: Floating UI reads the panel's direction (carried below) and
     puts `start` on the right in a right-to-left page itself. */
  const { setPanel, panelEl, floatingStyles, placement, isPositioned } = usePlacement(tree.triggerEl, mounted, `bottom-${align}`, offset, panelRef);
  const level = useLevelState();
  const { typedRef, typingAhead } = useTypeahead();
  const onKeyDown = usePanelKeys({ panelRef, typedRef, onEscape: () => tree.close(true) });

  /* Focus lands where the opening asked: the first item, the last, or the
     panel itself after a click, so the arrows and typeahead start from there.
     Run once the panel is in the document, a render after the portal mounts. */
  React.useLayoutEffect(() => {
    if (!tree.open || !panelEl) return;
    const items = itemsOf(panelEl);
    const target = tree.focusOnOpen.current;
    if (target === "first" && items[0]) focusItem(items[0]);
    else if (target === "last" && items.length) focusItem(items[items.length - 1]);
    else panelEl.focus({ preventScroll: true });
  }, [tree.open, panelEl, tree.focusOnOpen]);

  /* Once placed, the panel is its final height: bring the focused item into
     view again, since it was scrolled to before the panel was capped. */
  React.useLayoutEffect(() => {
    if (!isPositioned || !panelEl) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== panelEl && panelEl.contains(active)) active.scrollIntoView?.({ block: "nearest" });
  }, [isPositioned, panelEl]);

  /* Closed while focus is inside (by an owner holding `open`, or a press
     outside): focus goes back to the button rather than to the page as the
     panel leaves. Without scrolling: after a press further down the page, the
     page stays where it was. */
  React.useLayoutEffect(() => {
    if (!tree.open && panelEl?.contains(document.activeElement)) tree.triggerRef.current?.focus({ preventScroll: true });
  }, [tree.open, panelEl, tree.triggerRef]);

  /* Focus leaving for somewhere outside the menu closes it. */
  const onBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget as Element | null;
    if (next && !next.closest(`[data-menu-tree="${tree.treeId}"]`)) tree.close(false);
  };

  if (!mounted) return null;
  const inDark = !!tree.triggerEl?.closest(".dark");
  /* Headless UI's portal, not a bare one: inside a Dialog, a Sheet or a
     Popover, it's where they look for their own nested layers, so the panel
     isn't made inert behind a dialog or taken for a click outside one. */
  return (
    <Portal>
      <LevelContext.Provider value={{ ...level, panelRef, typingAhead }}>
        <div
          ref={setPanel}
          id={tree.panelId}
          dir={rtl ? "rtl" : "ltr"}
          role="menu"
          aria-labelledby={aria["aria-label"] ? undefined : tree.triggerId}
          aria-label={aria["aria-label"]}
          tabIndex={-1}
          data-menu-panel=""
          data-menu-tree={tree.treeId}
          data-closed={closed ? "" : undefined}
          data-leaving={leaving ? "" : undefined}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          style={{ ...floatingStyles, ...SCROLL_SHADOWS, transformOrigin: originOf(placement, rtl) }}
          className={cn(inDark && "dark", PANEL, className)}
        >
          {children}
        </div>
      </LevelContext.Provider>
    </Portal>
  );
}

/** One panel's submenu bookkeeping: which is open, and the pointer's grace period. */
function useLevelState(): Omit<LevelContextValue, "panelRef" | "typingAhead"> {
  const [openSubmenu, setOpenSubmenuState] = React.useState<string | null>(null);
  const focusFirstInSubmenu = React.useRef(false);
  const closeTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  return {
    openSubmenu,
    focusFirstInSubmenu,
    setOpenSubmenu: (id, focusFirst = false) => {
      window.clearTimeout(closeTimer.current);
      focusFirstInSubmenu.current = focusFirst;
      setOpenSubmenuState(id);
    },
    hoverItem: (submenuId) => {
      window.clearTimeout(closeTimer.current);
      if (submenuId !== null) return;
      closeTimer.current = window.setTimeout(() => setOpenSubmenuState(null), HOVER_DELAY);
    },
  };
}

/* ── Items ────────────────────────────────────────────────────────────────── */

const ITEM_CLASS = /* @__PURE__ */ cn(
  /* A button or a link reset to a row: no border, no fill, the panel's type. */
  "rst:relative rst:flex rst:w-full rst:min-h-11 rst:items-center rst:gap-2.5 rst:border-0 rst:bg-transparent rst:px-3 rst:py-2 rst:text-start rst:text-sm rst:text-inherit rst:no-underline rst:[font-family:inherit] rst:cursor-pointer rst:select-none rst:outline-none rst:transition-colors",
  /* Focus follows the pointer, so the highlight is focus. In forced colors a
     fill is dropped, so focus draws an outline there instead. */
  "rst:focus:bg-primary-100 rst:focus:text-primary-900 rst:dark:focus:bg-primary-900/30 rst:dark:focus:text-primary-100 rst:forced-colors:focus:outline-solid rst:forced-colors:focus:outline-2 rst:forced-colors:focus:-outline-offset-2",
  /* The tint alone isn't a focus indicator: it measures under 1.2:1 against
     the panel in both themes, on the default surface and a consumer's. So
     keyboard focus adds an inset ring in the focus token, which a consumer
     tunes against their own surfaces, and holds 3:1 on any of them. The
     pointer's focus is the tint alone: the ring follows the mark `focusItem`
     leaves, which only the keyboard's paths set. */
  "rst:data-key-focus:ring-2 rst:data-key-focus:ring-inset rst:data-key-focus:ring-ring",
  "rst:aria-disabled:opacity-50 rst:aria-disabled:cursor-not-allowed",
);

const DESTRUCTIVE = "rst:text-error-600 rst:dark:text-error-400 rst:focus:bg-error-50 rst:focus:text-error-700 rst:dark:focus:bg-error-900/30 rst:dark:focus:text-error-300";

const Check = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </svg>
);

const Dot = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <circle cx="8" cy="8" r="3.5" fill="currentColor" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rst:rtl:rotate-180">
    <path d="M6 3.5 10.5 8 6 12.5" />
  </svg>
);

interface ItemContent {
  /** A leading icon. Decorative: the item's words name it. */
  icon?: React.ReactNode;
  /** A second, quieter line under the label: what the item does, or to what. Read as the item's description. */
  description?: React.ReactNode;
  /** A count or a status at the end of the row, read with the item's name. */
  badge?: React.ReactNode;
  /** A keyboard shortcut to show, right-aligned: display only. The app handles the keys. */
  shortcut?: string;
  /** The same shortcut in `aria-keyshortcuts` form ("Control+E"), for assistive technology. */
  keyshortcuts?: string;
  /** Reads as a consequence: red. The words still have to say what it does. */
  destructive?: boolean;
  /** Can be reached by the arrows but not chosen. */
  disabled?: boolean;
  /** What typeahead matches, when the item's text isn't the right thing to match. */
  textValue?: string;
  className?: string;
  children: React.ReactNode;
}

function contentOf(
  { icon, shortcut, description, badge, children }: Pick<ItemContent, "icon" | "shortcut" | "description" | "badge" | "children">,
  lead?: React.ReactNode,
  trail?: React.ReactNode,
  descriptionId?: string,
) {
  const leading = lead ?? icon;
  return (
    <>
      {leading !== undefined && leading !== null && (
        /* With a description, the icon lines up with the label, not the middle of both lines. */
        <span aria-hidden="true" className={cn("rst:flex rst:size-4 rst:shrink-0 rst:items-center rst:justify-center", description != null && "rst:self-start rst:mt-0.5")} data-menu-lead="">
          {leading}
        </span>
      )}
      <span className="rst:min-w-0 rst:flex-1 rst:break-words" data-menu-label="">
        {children}
        {/* Hidden from the name, so it's read once: as the description
            `aria-describedby` points at, which reads hidden text. */}
        {description != null && (
          <span id={descriptionId} aria-hidden="true" className="rst:block rst:text-xs rst:opacity-75" data-menu-description="">
            {description}
          </span>
        )}
      </span>
      {badge != null && (
        <span className="rst:flex rst:shrink-0 rst:items-center" data-menu-badge="">
          {badge}
        </span>
      )}
      {shortcut && (
        <span aria-hidden="true" className="rst:ms-auto rst:shrink-0 rst:ps-4 rst:text-xs rst:tracking-wide rst:opacity-70" data-menu-shortcut="">
          {shortcut}
        </span>
      )}
      {trail}
    </>
  );
}

/**
 * What every item shares: focus following the pointer, the keys that choose
 * it, and closing the menu once it's chosen.
 */
function useItemBehavior({
  disabled,
  closeOnSelect,
  onChoose,
  spaceKeepsOpen,
}: {
  disabled?: boolean;
  closeOnSelect: boolean;
  onChoose: (event: React.SyntheticEvent) => void;
  spaceKeepsOpen?: boolean;
}) {
  const tree = useTree("MenuItem");
  const level = useLevel("MenuItem");
  const choose = (event: React.SyntheticEvent, close: boolean) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onChoose(event);
    if (close) tree.close(true);
  };
  return {
    onClick: (event: React.MouseEvent<HTMLElement>) => choose(event, closeOnSelect),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      /* Space chooses too. On a checkbox or radio item it keeps the menu open,
         so several can be set in one visit, as the pattern asks. */
      if (event.key === " ") {
        /* Mid-search, a space is part of what's being typed: "save a". */
        if (level.typingAhead()) return;
        event.preventDefault();
        choose(event, closeOnSelect && !spaceKeepsOpen);
      }
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!pointerMoved(event)) return;
      level.hoverItem(null);
      if (document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
    },
  };
}

export interface MenuItemProps extends ItemContent {
  /** Called when the item is chosen: a click, Enter or Space. */
  onSelect?: (event: React.SyntheticEvent) => void;
  /** Makes it a link item. It navigates through the menu's `linkComponent`. */
  href?: string;
  /** Close the menu once chosen. On by default. */
  closeOnSelect?: boolean;
}

/** One action. With `href`, a link. */
function MenuItem({ onSelect, href, closeOnSelect = true, disabled, destructive, keyshortcuts, textValue, className, ...content }: MenuItemProps) {
  const tree = useTree("MenuItem");
  const level = useLevel("MenuItem");
  const descriptionId = React.useId();
  const behavior = useItemBehavior({ disabled, closeOnSelect, onChoose: (event) => onSelect?.(event) });
  const classes = cn(ITEM_CLASS, destructive && DESTRUCTIVE, className);
  const common = {
    role: "menuitem" as const,
    tabIndex: -1 as const,
    "aria-disabled": disabled ? (true as const) : undefined,
    "aria-keyshortcuts": keyshortcuts,
    "aria-describedby": content.description != null ? descriptionId : undefined,
    "data-menu-item": "" as const,
    "data-menu-text": textValue,
    "data-destructive": destructive ? "" : undefined,
  };
  if (href !== undefined) {
    const Link = tree.linkComponent;
    return (
      <Link
        href={href}
        to={href}
        className={classes}
        {...common}
        onClick={behavior.onClick}
        onPointerMove={behavior.onPointerMove}
        onKeyDown={(event) => {
          /* A link chooses with Enter natively; Space does it here, unless
             it's part of a search. */
          if (event.key === " ") {
            if (level.typingAhead()) return;
            event.preventDefault();
            if (!disabled) event.currentTarget.click();
          }
        }}
      >
        {contentOf(content, undefined, undefined, descriptionId)}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...common} {...behavior}>
      {contentOf(content, undefined, undefined, descriptionId)}
    </button>
  );
}

export interface MenuCheckboxItemProps extends ItemContent {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /**
   * Replaces the leading check mark with an indicator of your own at the end
   * of the row: a switch's track, say. Its state still reaches assistive
   * technology through `aria-checked`.
   */
  indicator?: React.ReactNode;
  /** Close the menu once chosen by click or Enter. Space always keeps it open. */
  closeOnSelect?: boolean;
}

/** An on/off choice: `menuitemcheckbox`. */
function MenuCheckboxItem({ checked, onCheckedChange, indicator, closeOnSelect = true, disabled, destructive, keyshortcuts, textValue, className, ...content }: MenuCheckboxItemProps) {
  const behavior = useItemBehavior({ disabled, closeOnSelect, spaceKeepsOpen: true, onChoose: () => onCheckedChange(!checked) });
  const descriptionId = React.useId();
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-describedby={content.description != null ? descriptionId : undefined}
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      aria-keyshortcuts={keyshortcuts}
      data-menu-item=""
      data-menu-text={textValue}
      className={cn(ITEM_CLASS, destructive && DESTRUCTIVE, className)}
      {...behavior}
    >
      {indicator === undefined
        ? contentOf(content, <span className={checked ? undefined : "rst:invisible"} data-menu-check="">{<Check />}</span>, undefined, descriptionId)
        : contentOf(content, undefined, <span aria-hidden="true" className="rst:ms-auto rst:flex rst:shrink-0 rst:items-center">{indicator}</span>, descriptionId)}
    </button>
  );
}

export interface MenuRadioGroupProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  /** The choice's name, shown above its items and read with them. */
  label?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** One choice among several: its items are `menuitemradio`. */
function MenuRadioGroup({ value, onValueChange, label, children, className }: MenuRadioGroupProps) {
  return (
    <RadioContext.Provider value={{ value, onValueChange }}>
      <MenuGroup label={label} className={className}>
        {children}
      </MenuGroup>
    </RadioContext.Provider>
  );
}

export interface MenuRadioItemProps extends ItemContent {
  value: string;
  /** Close the menu once chosen by click or Enter. Space always keeps it open. */
  closeOnSelect?: boolean;
}

function MenuRadioItem({ value, closeOnSelect = true, disabled, destructive, keyshortcuts, textValue, className, ...content }: MenuRadioItemProps) {
  const group = React.useContext(RadioContext);
  if (!group) throw new Error("<MenuRadioItem> must be inside a <MenuRadioGroup>.");
  const checked = group.value === value;
  const behavior = useItemBehavior({ disabled, closeOnSelect, spaceKeepsOpen: true, onChoose: () => group.onValueChange?.(value) });
  const descriptionId = React.useId();
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      aria-describedby={content.description != null ? descriptionId : undefined}
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      aria-keyshortcuts={keyshortcuts}
      data-menu-item=""
      data-menu-text={textValue}
      className={cn(ITEM_CLASS, destructive && DESTRUCTIVE, className)}
      {...behavior}
    >
      {contentOf(content, <span className={checked ? undefined : "rst:invisible"} data-menu-check="">{<Dot />}</span>, undefined, descriptionId)}
    </button>
  );
}

/* ── Structure ────────────────────────────────────────────────────────────── */

export interface MenuGroupProps {
  /** Shown above the group's items, and names the group. */
  label?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Items that belong together, under an optional label. */
function MenuGroup({ label, children, className }: MenuGroupProps) {
  const id = React.useId();
  return (
    <div role="group" aria-labelledby={label ? id : undefined} className={className}>
      {label && (
        <div
          id={id}
          /* Sentence case: Chromium hands capitals made by `uppercase` to a
             screen reader as capitals, which some spell out. */
          className="rst:px-3 rst:pt-2 rst:pb-1 rst:text-xs rst:font-semibold rst:text-gray-600 rst:dark:text-gray-400"
          data-menu-heading=""
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

/** A rule between groups of items. */
function MenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn("rst:my-1 rst:h-[var(--roster-border-width,1px)] rst:bg-[var(--roster-popover-border)]", className)} />;
}

/* ── Submenu ──────────────────────────────────────────────────────────────── */

export interface MenuSubmenuProps extends Omit<ItemContent, "shortcut" | "keyshortcuts" | "children" | "destructive" | "description" | "badge"> {
  /** The item that opens it. */
  label: React.ReactNode;
  /** Its items. */
  children: React.ReactNode;
  /** Applied to the submenu's panel. */
  panelClassName?: string;
}

/**
 * An item that opens a menu of its own beside it. It opens with the arrow away
 * from its parent, Enter, Space, a click, or the pointer resting on it; the
 * arrow back, or Escape, closes it and returns to its item.
 */
function MenuSubmenu({ label, children, icon, disabled, textValue, className, panelClassName }: MenuSubmenuProps) {
  const tree = useTree("MenuSubmenu");
  const parent = useLevel("MenuSubmenu");
  const id = React.useId();
  const triggerId = `${id}-item`;
  const panelId = `${id}-menu`;
  const open = parent.openSubmenu === triggerId;
  const itemRef = React.useRef<HTMLButtonElement | null>(null);
  const [itemEl, setItemEl] = React.useState<HTMLButtonElement | null>(null);
  /* Stable, or each render would hand React a new ref and set the state again. */
  const setItem = React.useCallback((el: HTMLButtonElement | null) => {
    itemRef.current = el;
    setItemEl(el);
  }, []);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const openTimer = React.useRef<number | undefined>(undefined);
  const pointerTypeRef = React.useRef("mouse");
  const { mounted, closed, leaving } = usePresence(open);
  const rtl = isRtl(itemEl);
  /* Beside its item, the first rows level: the panel's own padding is 4px. */
  const { setPanel, panelEl, floatingStyles, placement } = usePlacement(
    itemEl,
    mounted,
    rtl ? "left-start" : "right-start",
    { mainAxis: 0, alignmentAxis: -4 },
    panelRef,
    true,
  );
  const level = useLevelState();
  React.useEffect(() => () => window.clearTimeout(openTimer.current), []);

  const backToItem = () => {
    parent.setOpenSubmenu(null);
    focusItem(itemRef.current);
  };
  const { typedRef, typingAhead } = useTypeahead();
  const onKeyDown = usePanelKeys({ panelRef, typedRef, onEscape: backToItem, onBack: backToItem });

  React.useLayoutEffect(() => {
    if (!open || !panelEl) return;
    if (parent.focusFirstInSubmenu.current) focusItem(itemsOf(panelEl)[0]);
  }, [open, panelEl, parent.focusFirstInSubmenu]);

  const openNow = (focusFirst: boolean) => {
    if (disabled) return;
    /* Already open, by the pointer: the keys still go in. */
    if (open && focusFirst && panelRef.current) {
      focusItem(itemsOf(panelRef.current)[0]);
      return;
    }
    parent.setOpenSubmenu(triggerId, focusFirst);
  };

  const inDark = !!tree.triggerEl?.closest(".dark");
  return (
    <>
      <button
        ref={setItem}
        id={triggerId}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-disabled={disabled || undefined}
        data-menu-item=""
        data-menu-text={textValue}
        data-menu-tree={tree.treeId}
        className={cn(ITEM_CLASS, open && "rst:bg-gray-100 rst:dark:bg-gray-700/50", className)}
        /* A mouse click only ever opens it: resting on it may have opened it
           already, and the click then shouldn't shut it. A tap has no resting
           pointer, so a second tap is the way to shut it. */
        onPointerDown={(event) => {
          pointerTypeRef.current = event.pointerType;
        }}
        onClick={() => (open && pointerTypeRef.current !== "mouse" ? parent.setOpenSubmenu(null) : openNow(false))}
        onKeyDown={(event) => {
          const forward = rtl ? "ArrowLeft" : "ArrowRight";
          if (event.key === " " && parent.typingAhead()) return;
          if (event.key === forward || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openNow(true);
          }
        }}
        onPointerMove={(event) => {
          if (!pointerMoved(event)) return;
          parent.hoverItem(triggerId);
          if (document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
          if (!open && !disabled) {
            window.clearTimeout(openTimer.current);
            openTimer.current = window.setTimeout(() => openNow(false), HOVER_DELAY);
          }
        }}
        onPointerLeave={() => window.clearTimeout(openTimer.current)}
      >
        {contentOf({ icon, children: label }, undefined, (
          <span aria-hidden="true" className="rst:ms-auto rst:flex rst:shrink-0 rst:items-center rst:opacity-70" data-menu-chevron="">
            <Chevron />
          </span>
        ))}
      </button>
      {mounted && (
        <Portal>
          <LevelContext.Provider value={{ ...level, panelRef, typingAhead }}>
            <div
              ref={setPanel}
              id={panelId}
              dir={rtl ? "rtl" : "ltr"}
              role="menu"
              aria-labelledby={triggerId}
              tabIndex={-1}
              data-menu-panel=""
              data-menu-tree={tree.treeId}
              data-closed={closed ? "" : undefined}
              data-leaving={leaving ? "" : undefined}
              onKeyDown={onKeyDown}
              /* The pointer reaching the submenu keeps it open. */
              onPointerEnter={() => parent.hoverItem(triggerId)}
              style={{ ...floatingStyles, ...SCROLL_SHADOWS, transformOrigin: originOf(placement, rtl) }}
              className={cn(inDark && "dark", PANEL, panelClassName)}
            >
              {children}
            </div>
          </LevelContext.Provider>
        </Portal>
      )}
    </>
  );
}

export {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuGroup,
  MenuSeparator,
  MenuSubmenu,
};
