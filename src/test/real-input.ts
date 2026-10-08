/**
 * The trusted input the story test runner hands over (see
 * .storybook/real-input.ts), or `undefined` in Storybook's own UI, where a
 * story skips the steps that need it.
 */
/** A file for realSetFiles and realDropFiles: its bytes as base64, or `size` zero bytes. */
export type RealFile = { name: string; mimeType: string; base64?: string; size?: number };

export interface RealInput {
  commands: {
    realWheel: (selector: string, deltaX: number, deltaY: number) => Promise<void>;
    realDrag: (
      selector: string,
      dx: number,
      options?: { steps?: number; holdMs?: number; fx?: number; fy?: number },
    ) => Promise<void>;
    realClick: (selector: string, at?: { fx?: number; fy?: number }) => Promise<void>;
    /** Picks files in a file input through the browser's own chooser path (.storybook/real-input.ts). */
    realSetFiles: (selector: string, files: RealFile[]) => Promise<void>;
    /** Drops files on an element: dispatched drag events carrying real Files. */
    realDropFiles: (selector: string, files: RealFile[]) => Promise<void>;
    /** The accessibility tree's role, name, description and states for each element (.storybook/ax-tree.ts). */
    axStates: (selectors: string[]) => Promise<
      {
        role: string;
        name: string;
        description: string;
        invalid: string | null;
        ignored: boolean;
        disabled: boolean;
        busy: boolean;
      }[]
    >;
  };
  page: { viewport: (width: number, height: number) => Promise<void> };
  userEvent: { keyboard: (text: string) => Promise<void>; tab: (options?: { shift?: boolean }) => Promise<void> };
}

export function realInput(): RealInput | undefined {
  return (globalThis as { __rosterRealInput?: RealInput }).__rosterRealInput;
}

/**
 * For a story whose point is real input: the input, or `undefined` in
 * Storybook's UI. Under the test runner (a browser driven by automation) it
 * throws instead, so a setup that stopped handing input over fails loudly
 * rather than letting the story pass without running its steps.
 */
export function realInputOrSkip(): RealInput | undefined {
  const input = realInput();
  if (!input && typeof navigator !== "undefined" && navigator.webdriver) {
    throw new Error("real input is missing: .storybook/vitest.setup.ts did not hand it over");
  }
  return input;
}
