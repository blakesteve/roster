import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';
import * as projectAnnotations from './preview';
import { readCursors } from '../src/test/cursors';

/* After every story in the docs, every control on the page shows the pointer,
   and a disabled one doesn't (src/test/cursors.ts). Checks stories, hidden
   from the docs (`!dev`), are left out: some draw a bare button on purpose. */
const cursors: ProjectAnnotations<Renderer> = {
  afterEach: ({ tags, id }) => {
    if (!tags.includes('dev')) return;
    const { faults } = readCursors(document);
    if (faults.length) throw new Error(`${id}, the cursor:\n${faults.join('\n')}`);
  },
  /* Handed to each story too, so src/cursors.checks.stories.tsx can see the
     sweep is set up here and run it on a fault of its own. */
  beforeEach: () => {
    (globalThis as { __rosterCursorSweep?: unknown }).__rosterCursorSweep = cursors.afterEach;
  },
};

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations, cursors]);
/* Real input and viewport control for the stories that need them; see
   ./real-input.ts. Only the test runner has `vitest/browser`, so it is handed
   over here rather than imported by a story, which Storybook's UI also loads. */
import { commands, page, userEvent } from "vitest/browser";
(globalThis as { __rosterRealInput?: unknown }).__rosterRealInput = { commands, page, userEvent };
