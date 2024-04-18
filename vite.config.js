'use strict'

import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react').default
const path = require('node:path')

const rendererDir = path.resolve(__dirname, 'renderer')

// https://vitejs.dev/config/
export default defineConfig({
  root: rendererDir,
  plugins: [tsconfigPaths(), svgr(), react()],
  base: './',
  build: {
    emptyOutDir: true,
    sourcemap: true,
    target: 'chrome100'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    isolate: true,
    threads: true,
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
})
