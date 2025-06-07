/**
 * This configuration ensures that the prebuilt Yoga (asm.js) is not included in
 * the WASM bundle.
 */

import { defineConfig } from 'tsup'
import { join } from 'path'
import { replace } from 'esbuild-plugin-replace'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  // Use browser target for WASM builds, Node.js target for default builds
  target: process.env.WASM ? 'es2020' : 'node16',
  dts: process.env.NODE_ENV !== 'development' && {
    resolve: ['twrnc', './tw-config', './types'],
  },
  minify: process.env.NODE_ENV !== 'development',
  format: process.env.WASM ? ['esm'] : ['esm', 'cjs'],
  noExternal: ['twrnc', 'emoji-regex-xs'],
  // For WASM builds (browser), don't exclude anything since we want everything bundled
  // For default builds, exclude taffy-wasm to avoid import.meta issues in CJS
  external: process.env.WASM ? [] : [/taffy-wasm/],
  // Browser-specific configuration for WASM builds
  platform: process.env.WASM ? 'browser' : 'neutral',
  esbuildOptions(options) {
    if (process.env.WASM) {
      options.outExtension = {
        '.js': `.wasm.${options.format === 'cjs' ? 'cjs' : 'js'}`,
      }
      // Browser-specific optimizations
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        'process.env.WASM': '"1"',
        global: 'globalThis',
      }
    } else {
      // For non-WASM builds, ensure WASM is undefined
      options.define = {
        ...options.define,
        'process.env.WASM': 'undefined',
      }
    }
    options.tsconfig = process.env.WASM ? 'tsconfig.wasm.json' : 'tsconfig.json'
    options.legalComments = 'external'
    
    // Add WASM loader configuration
    options.loader = {
      ...options.loader,
      '.wasm': 'file'
    }
  },
  esbuildPlugins: [
    {
      name: 'optimize tailwind',
      setup(build) {
        // Get rid of chalk
        // https://github.com/tailwindlabs/tailwindcss/blob/b8cda161dd0993083dcef1e2a03988c70be0ce93/src/util/log.js
        build.onResolve({ filter: /\/log$/ }, (args) => {
          if (args.importer.includes('/tailwindcss/')) {
            return {
              path: join(__dirname, 'src', 'vendor', 'twrnc', 'log.js'),
            }
          }
        })

        // Get rid of picocolors
        // https://github.com/tailwindlabs/tailwindcss/blob/bf4494104953b13a5f326b250d7028074815e77e/src/featureFlags.js
        build.onResolve({ filter: /^picocolors$/ }, () => {
          return {
            path: join(__dirname, 'src', 'vendor', 'twrnc', 'picocolors.js'),
          }
        })

        // Get rid of util-deprecate/node.js
        build.onResolve({ filter: /util-deprecate/ }, () => {
          return {
            path: join(__dirname, 'src', 'vendor', 'twrnc', 'deprecate.js'),
          }
        })
      },
    },
    // We don't like `Function`.
    // https://github.com/tailwindlabs/tailwindcss/blob/bf4494104953b13a5f326b250d7028074815e77e/src/util/getAllConfigs.js#L8
    replace({
      'preset instanceof Function': 'typeof preset === "function"',
    }),
  ],
})
