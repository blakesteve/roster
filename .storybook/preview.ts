import type { Preview } from '@storybook/react-vite'
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from 'storybook/viewport';
/* Storybook is itself a consumer with no app-level reset, so it opts into the
   preflight the same way a non-Tailwind host app would. Roster's own
   stylesheet deliberately ships no global reset — see src/index.css. Import
   order matters: reset first, then component styles. */
import '../src/preflight.css';
import '../src/index.css';
import '../src/tokens.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    viewport: {
      options: { ...MINIMAL_VIEWPORTS, ...INITIAL_VIEWPORTS },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;