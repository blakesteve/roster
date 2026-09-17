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

/**
 * The three stylesheets are imported by path by every consuming app, so their
 * published names are part of the API. Under `preserveModules` the CSS follows
 * its source module rather than its entry, which would land `src/index.css` as
 * `index.css` and break every one of those imports at once.
 *
 * Declared once and shared by both outputs: Vite compares this by reference
 * across the output array and warns if the formats disagree.
 */
const assetFileNames = (asset: { names?: string[] }) =>
  asset.names?.[0] === 'index.css' ? 'roster.css' : '[name][extname]';

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
    },
    rollupOptions: {
      // @tanstack/react-table is an optional peer: v9's types are generic over
      // the feature set, so consumer column defs must resolve against the same
      // copy roster uses. Bundling it would give them two.
      /* `react-hot-toast` is external and a peer, not bundled. Its queue lives
         in module scope, so an inlined copy gives a consumer TWO stores: the
         app's own `toast.success(...)` writes to one and Roster's `Toaster`
         subscribes to the other, and the toast silently never appears. That
         is the opposite of the point — the component exists so existing call
         sites do not have to move. */
      /* The subpaths are as load-bearing as the bare specifiers, and only
         under `preserveModules`. `react/jsx-runtime` left off this list gets
         bundled, and a bundled module is now written to its own file at
         `dist/node_modules/react/jsx-runtime.js`. That directory has no
         `package.json`, so Node's ESM resolver walking up from any emitted
         component finds it before the real React and throws
         ERR_MODULE_NOT_FOUND on a bare `import "react"`. A single bundle hid
         this completely: there was no directory to shadow anything. */
      external: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'tailwindcss',
        '@tanstack/react-table',
        'react-hot-toast',
      ],
      /* An array rather than one object, because `preserveModules` mirrors the
         source tree into `dist` and both formats would then want to write the
         same `index.js`. Each format names its own files instead. */
      output: (['es', 'cjs'] as const).map((format) => ({
        format,
        /* The whole point of this build. One bundled module gives a consumer's
           bundler nothing to cut along: `sideEffects` works at module
           granularity, so with a single module it has nothing to act on.
           Emitting the source tree gives every component its own module, which
           is what lets an app that imports three of them pay for three. */
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: format === 'es' ? '[name].js' : '[name].cjs',
        assetFileNames,
        /* Only the two public entries that contain components.

           Matched on the module's own id rather than on `chunk.isEntry &&
           chunk.name`, which is what this used to read. Under `preserveModules`
           a name is no longer a reliable handle: there are hundreds of chunks
           and their names come from source paths, so the test depends on
           nothing colliding. An id is the module itself and is unambiguous
           under either build shape.

           What must NOT be stamped is as important as what must. Marking the
           utility entry or the CSS shims as client references meant importing
           `cn` from the root and calling it inside a React Server Component
           typechecked and then threw at render. The directive belongs on the
           module boundary a consumer imports, not on its implementation
           details, and under `preserveModules` there are a great many more
           implementation details to get this wrong on. */
        banner: (chunk) => {
          const id = chunk.facadeModuleId ?? '';
          return id.endsWith('/src/index.ts') || id.endsWith('/src/data-table.ts')
            ? '"use client";'
            : '';
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          tailwindcss: 'tailwindcss',
          '@tanstack/react-table': 'ReactTable'
        }
      }))
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
