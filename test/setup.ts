// Test setup for WASM support and global mocks
import { beforeAll, vi } from 'vitest'

// Provide fetch support for WASM loading in tests
if (typeof globalThis.fetch === 'undefined') {
  // Use dynamic import to handle potential absence of undici
  beforeAll(async () => {
    try {
      const { fetch, Headers, Request, Response } = await import('undici')
      Object.assign(globalThis, { fetch, Headers, Request, Response })
    } catch (error) {
      console.warn('Could not load undici for fetch support:', error)
    }
  })
}

// Mock font loader for consistent test snapshots
// (Real font loading is now working, but mocked for test reproducibility)
vi.mock('../src/font.ts', () => ({
  default: class MockFontLoader {
    getEngine() {
      return {
        height: (s, resolvedFont) => {
          return 20 // Fixed height for testing
        },
        baseline: (s, resolvedFont) => {
          return 16 // Fixed baseline for testing
        },
        has: (char) => {
          return true
        },
        measure: (text, style) => {
          const fontSize = style?.fontSize || 20
          const letterSpacing = style?.letterSpacing || 0
          const width = text.length * fontSize * 0.6 + (text.length - 1) * letterSpacing
          return width
        },
        getSVG: (text, style) => {
          const fontSize = style?.fontSize || 20
          const width = text.length * fontSize * 0.6
          return `<path d="M0,0 L${width},0 L${width},${fontSize} L0,${fontSize} Z"/>`
        },
      }
    }
  }
})) 