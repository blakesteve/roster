/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json', 
      exclude: ['**/*.stories.tsx', '**/*.test.tsx', '**/*.test.ts', 'src/test/**/*']
    })
  ],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        roster: path.resolve(__dirname, 'src/index.ts'),
        tokens: path.resolve(__dirname, 'src/tokens.ts'),
        preflight: path.resolve(__dirname, 'src/preflight.ts'),
        // Separate entry so the TanStack import stays out of the main bundle.
        'data-table': path.resolve(__dirname, 'src/data-table.ts'),
        // Separate entry so `cn` escapes the main bundle's "use client"
        // directive and stays callable from a server component.
        utils: path.resolve(__dirname, 'src/utils.ts'),
      },
      name: 'Roster',
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      // @tanstack/react-table is an optional peer: v9's types are generic over
      // the feature set, so consumer column defs must resolve against the same
      // copy roster uses. Bundling it would give them two.
      external: ['react', 'react-dom', 'tailwindcss', '@tanstack/react-table'],
      output: {
        // Only the entries that actually contain components. It used to be
        // applied to every chunk, which marked `cn` and the CSS shims as client
        // references too — importing `cn` from the root and calling it inside a
        // React Server Component typechecked and then threw at render. Shared
        // chunks deliberately go unstamped: the directive belongs on the module
        // boundary a consumer imports, not on its implementation details.
        banner: (chunk) =>
          chunk.isEntry && (chunk.name === 'roster' || chunk.name === 'data-table')
            ? '"use client";'
            : '',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          tailwindcss: 'tailwindcss',
          '@tanstack/react-table': 'ReactTable'
        }
      }
    }
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'], 
          globals: true,
          setupFiles: ['./src/test/setup.ts'],
        }
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          },
          setupFiles: ['.storybook/vitest.setup.ts']
        }
      }
    ]
  }
});
