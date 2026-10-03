import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
/* Real input and viewport control for the stories that need them; see
   ./real-input.ts. Only the test runner has `vitest/browser`, so it is handed
   over here rather than imported by a story, which Storybook's UI also loads. */
import { commands, page, userEvent } from "vitest/browser";
(globalThis as { __rosterRealInput?: unknown }).__rosterRealInput = { commands, page, userEvent };
