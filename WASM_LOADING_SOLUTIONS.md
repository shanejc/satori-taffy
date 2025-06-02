# WASM Loading Solutions

This document outlines the solutions implemented to handle WASM loading issues, particularly in test environments.

## Problem

The Taffy layout engine uses WebAssembly (WASM) which can fail to load in certain environments, particularly:
- Test environments (Vitest, Jest)
- Node.js environments without proper WASM support
- Environments with strict security policies

Error typically seen:
```
Error: Loading local files are not supported in this environment
```

## Solutions Implemented

### 1. **Mocked Testing (Recommended for Tests)**

**File**: `test/layout-engine-mocked.test.tsx`

Uses Vitest's `vi.mock()` to replace the Taffy module with a mock implementation during tests.

```typescript
vi.mock('../src/taffy/taffy-prebuilt.js', () => ({
  TaffyNode: {
    async create() {
      return new MockTaffyNode()
    }
  }
}))
```

**Pros**:
- ✅ Tests run reliably
- ✅ No WASM dependency in tests
- ✅ Fast test execution
- ✅ Tests focus on API contracts

**Cons**:
- ❌ Not testing real Taffy behavior
- ❌ Mock needs to be kept in sync with real API

### 2. **Enhanced Vitest Configuration**

**File**: `vitest.config.ts`

Updated configuration to better support WASM loading:

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@jsr/loading__taffy'],
  },
})
```

**Setup file** (`test/setup.ts`) adds polyfills:
```typescript
// Configure global fetch for WASM loading
if (typeof globalThis.fetch === 'undefined') {
  const { fetch, Headers, Request, Response } = await import('undici')
  Object.assign(globalThis, { fetch, Headers, Request, Response })
}
```

### 3. **Safe Taffy Wrapper (Production)**

**File**: `src/taffy/taffy-safe.ts`

A more robust wrapper around TaffyNode that handles WASM loading gracefully:

```typescript
export class SafeTaffyNode {
  async init() {
    try {
      const wasm = await ensureWasmLoaded()
      this.tree = new wasm.TaffyTree()
      this.node = new wasm.Node(this.tree, this.style)
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Taffy WASM:', error)
      throw new Error('Taffy WASM failed to load. Consider using Yoga layout engine instead.')
    }
  }
}
```

**Features**:
- ✅ Singleton WASM loading
- ✅ Graceful error handling
- ✅ Helpful error messages
- ✅ Fallback suggestions

### 4. **Layout Engine Choice**

**Recommendation**: If WASM loading is problematic in your environment, use Yoga instead:

```typescript
import satori, { setLayoutEngine, initYoga } from './src/index.js'
import yoga from 'yoga-wasm-web/auto'

// Use Yoga instead of Taffy
setLayoutEngine('yoga')
initYoga(yoga)
```

## Best Practices

### For Development
1. **Use Taffy by default** - it's smaller and modern
2. **Have Yoga as fallback** - for environments where WASM is problematic

### For Testing
1. **Use mocked tests** for API contract testing
2. **Use real implementations** only for integration tests in supported environments
3. **Test both engines** to ensure compatibility

### For Production
1. **Detect environment capabilities** and choose appropriate engine
2. **Provide clear error messages** when WASM fails
3. **Document fallback options** for users

## Environment Compatibility

| Environment | Taffy WASM | Yoga | Notes |
|-------------|------------|------|-------|
| Browser | ✅ | ✅ | Both work well |
| Node.js 18+ | ✅ | ✅ | Both supported |
| Node.js <18 | ❌ | ✅ | Use Yoga for older Node |
| Vitest/Jest | ⚠️ | ✅ | Use mocks or Yoga |
| Webpack | ✅ | ✅ | Both work with proper config |
| Vite | ✅ | ✅ | Both work well |

## Troubleshooting

### WASM Loading Fails
1. Check Node.js version (18+ recommended)
2. Verify fetch is available (use undici polyfill if needed)
3. Check security policies (CSP, etc.)
4. Consider using Yoga as alternative

### Tests Failing
1. Use mocked approach for unit tests
2. Use real implementations only for integration tests
3. Configure test environment properly

### Performance Issues
1. Taffy generally has smaller bundle size
2. Yoga has wider compatibility
3. Choose based on your specific needs

## Migration Guide

### From Taffy-only to Flexible Engine
```typescript
// Before
import { TaffyNode } from './taffy/taffy-prebuilt.js'

// After
import satori, { setLayoutEngine, initTaffy } from './src/index.js'
import { TaffyNode } from './taffy/taffy-prebuilt.js'

setLayoutEngine('taffy')
initTaffy(TaffyNode)
```

### Adding Yoga Fallback
```typescript
import satori, { setLayoutEngine, initYoga, initTaffy } from './src/index.js'

try {
  const { TaffyNode } = await import('./taffy/taffy-prebuilt.js')
  setLayoutEngine('taffy')
  initTaffy(TaffyNode)
} catch (error) {
  console.warn('Taffy WASM failed, falling back to Yoga')
  const yoga = await import('yoga-wasm-web/auto')
  setLayoutEngine('yoga')
  initYoga(yoga.default)
}
``` 