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

/**
 * Packages that are themselves client modules. A first-party module importing
 * one can not run on the server, so it takes the directive.
 *
 * `react-hot-toast` ships its own `"use client"`. It is on this list because
 * leaving it off is what put a bare directive on the toast handle, which reads
 * properties off that import at module scope and so fails on import rather
 * than on call.
 */
const CLIENT_PACKAGES = ['react', 'react-dom', 'react-hot-toast'];

/** Exact prefix for "this is Roster's own source", not a substring match. */
const SRC_DIR = path.resolve(dirname, 'src') + path.sep;

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
        /* The client boundary sits on the components, not on the barrels.

           A directive on the barrel makes the BARREL the boundary, and Next
           records it in its client reference manifest as `name: "*"`: every
           export becomes a live root, because a namespace pin can not know
           which names the server actually used. When the package was one
           pre-bundled file that pin was satisfied cheaply. Emitting a module
           per source file made the same pin far more expensive, because it is
           now satisfied by hundreds of modules that scatter across route
           chunks. Leaving the barrels bare is what lets Next traverse them and
           resolve an imported name down to the one module that defines it.

           The rule is "does this module depend on client-only code", read off
           the chunk's own imports rather than off its path. Path is the
           tempting test and the wrong one: every `*-variants` file sits beside
           a component, exports through the same barrel, and is pure.

           React is not the only signal, and assuming it was is how this rule
           shipped with a hole. `react-hot-toast` carries its own `"use client"`
           directive, so a module importing it is client too — and the toast
           handle reads properties off that import at module scope, which in a
           server graph is a client-reference proxy that throws on access
           rather than on call. Stamping only React importers left that module
           bare and turned a call-time failure into an import-time one.

           So the test is React or any dependency that is itself a client
           module. `react-dom` has no first-party importer today and is listed
           anyway: a module reaching for `createPortal` is client, and finding
           that out by shipping it is the expensive way.

           What must NOT be stamped is as important. Marking the utility entry
           or the CSS shims as client references meant importing `cn` from the
           root and calling it inside a React Server Component typechecked and
           then threw at render. `scripts/check-client-boundary.mjs` pins both
           directions, because this rule is derived rather than enumerated and
           the next module shaped like the toast handle would land bare in
           silence. */
        banner: (chunk) => {
          const id = chunk.facadeModuleId ?? '';
          /* Roster's own modules only. Vendored code is emitted here too and
             uses React, but no `exports` subpath reaches it: it is only ever
             arrived at THROUGH a stamped component, so a directive on it marks
             a boundary nobody can cross. An exact prefix rather than a
             substring, so a checkout path that happens to contain the word
             cannot silently match nothing. */
          const isOurs = id.startsWith(SRC_DIR);
          const usesClientCode = chunk.imports.some((i) =>
            CLIENT_PACKAGES.some((pkg) => i === pkg || i.startsWith(pkg + '/')),
          );
          return isOurs && usesClientCode ? '"use client";' : '';
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
