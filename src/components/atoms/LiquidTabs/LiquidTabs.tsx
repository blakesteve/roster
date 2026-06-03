import { useRef, useCallback, useEffect, type ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface TabItem {
  id: string;
  /** Static label, or a render function that receives whether this tab is active. */
  label: ReactNode | ((isActive: boolean) => ReactNode);
}

export interface LiquidTabsProps {
  tabs: TabItem[];
  /** The `id` of the currently active tab. */
  activeTab: string;
  /** Called with the new tab `id` when the user selects a different tab. */
  onChange: (id: string) => void;
  /**
   * `"pill"` (default) — floating pill inside a padded container.
   *   Width is `w-fit` by default; use `fullWidth` to stretch it.
   *   Liquid feel via scaleY squash during the stretch phase.
   *
   * `"filled"` — active tab fills its entire cell; container is always `w-full`.
   *   Liquid feel via border-radius morphing (oval during stretch) so the
   *   full-height pill never gaps at the container edges.
   */
  variant?: "pill" | "filled";
  /** Stretch the `pill` variant container to full width with `flex-1` buttons. */
  fullWidth?: boolean;
  /** Extra classes applied to the outer container. */
  className?: string;
}

interface PillGeom {
  left: number;
  width: number;
}

/**
 * Controlled tab strip with a liquid sliding indicator.
 *
 * The pill animation is driven by direct DOM ref manipulation (no setState)
 * to avoid re-renders during the transition. Two-phase motion:
 *   1. Stretch — pill expands to span the gap between old and new tab (130 ms ease-out).
 *   2. Contract — pill snaps to the target tab (160 ms ease-in).
 *
 * `getBoundingClientRect` is used to measure tab positions, so the component
 * must be rendered in a document with a real layout engine to animate.
 */
export function LiquidTabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  fullWidth = false,
  className,
}: LiquidTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillGeom = useRef<PillGeom | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMounted = useRef(false);

  const isFilled = variant === "filled";

  const measure = useCallback((id: string): PillGeom | null => {
    const container = containerRef.current;
    if (!container) return null;
    const btn = container.querySelector<HTMLButtonElement>(`[data-tab-id="${id}"]`);
    if (!btn) return null;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    return { left: bRect.left - cRect.left, width: bRect.width };
  }, []);

  const applyPill = useCallback((geom: PillGeom, transition: string, scaleY: number) => {
    const pill = pillRef.current;
    if (!pill) return;
    pill.style.transition = transition;
    pill.style.left = `${geom.left}px`;
    pill.style.width = `${geom.width}px`;
    pill.style.transform = `scaleY(${scaleY})`;
  }, []);

  // Position pill on the active tab immediately on mount — no flash, no transition.
  useEffect(() => {
    const geom = measure(activeTab);
    if (!geom) return;
    pillGeom.current = geom;
    applyPill(geom, "none", 1);
    if (pillRef.current) pillRef.current.style.opacity = "1";
    hasMounted.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-snap pill if activeTab changes externally while no animation is in flight.
  useEffect(() => {
    if (!hasMounted.current || phaseTimer.current !== null) return;
    const geom = measure(activeTab);
    if (!geom) return;
    pillGeom.current = geom;
    applyPill(geom, "none", 1);
  }, [activeTab, measure, applyPill]);

  const handleChange = useCallback(
    (id: string) => {
      if (id === activeTab) return;
      onChange(id);

      if (!hasMounted.current) return;
      if (phaseTimer.current) clearTimeout(phaseTimer.current);

      const from = pillGeom.current ?? measure(activeTab);
      // Measure target before React re-renders (used for phase 1 stretch only).
      const preTo = measure(id);
      if (!from || !preTo) return;

      // Phase 1 — stretch pill to span the full old→new gap.
      const stretchLeft = Math.min(from.left, preTo.left);
      const stretchWidth = Math.max(from.left + from.width, preTo.left + preTo.width) - stretchLeft;

      applyPill(
        { left: stretchLeft, width: stretchWidth },
        "left 130ms ease-out, width 130ms ease-out, transform 130ms ease-out",
        0.55,
      );

      // Phase 2 — re-measure target after React has re-painted (label render
      // functions can change a tab's width when it becomes active), then contract.
      phaseTimer.current = setTimeout(() => {
        const postTo = measure(id) ?? preTo;
        pillGeom.current = postTo;
        applyPill(
          postTo,
          "left 160ms ease-in, width 160ms ease-in, transform 160ms ease-in",
          1,
        );
        phaseTimer.current = null;
      }, 130);
    },
    [activeTab, measure, onChange, applyPill],
  );

  useEffect(
    () => () => { if (phaseTimer.current) clearTimeout(phaseTimer.current); },
    [],
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      data-testid="liquid-tabs"
      className={cn(
        "relative flex",
        isFilled
          ? "w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
          : cn(
              "gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-1",
              fullWidth ? "w-full" : "w-fit",
            ),
        className,
      )}
    >
      {/* Pill starts invisible; the mount effect positions and reveals it before first paint. */}
      <div
        ref={pillRef}
        aria-hidden
        data-testid="liquid-tabs-pill"
        className={cn(
          "absolute rounded-lg bg-primary-500 dark:bg-primary-500",
          isFilled ? "top-0 bottom-0" : "top-1 bottom-1",
        )}
        style={{ opacity: 0, left: 0, width: 0 }}
      />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            data-tab-id={tab.id}
            data-testid={`liquid-tab-${tab.id}`}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "relative z-10 text-sm font-medium transition-colors cursor-pointer",
              isFilled
                ? cn(
                    "flex-1 py-2",
                    isActive
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
                  )
                : cn(
                    "rounded-lg py-1.5",
                    fullWidth ? "flex-1" : "px-4",
                    isActive
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
                  ),
            )}
          >
            {typeof tab.label === "function" ? tab.label(isActive) : tab.label}
          </button>
        );
      })}
    </div>
  );
}