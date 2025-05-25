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
