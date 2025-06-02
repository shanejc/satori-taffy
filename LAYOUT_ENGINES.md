# Layout Engines

This project supports two layout engines: **Yoga** and **Taffy**. Both provide CSS Flexbox layout capabilities but with different performance characteristics and feature sets.

## Engines Overview

### Yoga
- **Pros**: Mature, battle-tested, widely used in React Native
- **Cons**: Larger bundle size, synchronous API
- **Best for**: Projects already using Yoga, React Native compatibility

### Taffy
- **Pros**: Smaller bundle size, modern Rust-based implementation, async API
- **Cons**: Newer, less battle-tested
- **Best for**: New projects, web-first applications, performance-critical scenarios

## Usage

### Using Taffy (Default)

```javascript
import satori, { setLayoutEngine, initTaffy } from './src/index.js'
import { TaffyNode } from './src/taffy/taffy-prebuilt.js'

// Initialize Taffy (this is the default)
setLayoutEngine('taffy')
initTaffy(TaffyNode)

const svg = await satori(
  <div style={{ display: 'flex', width: 300, height: 200 }}>
    Hello Taffy!
  </div>,
  {
    width: 300,
    height: 200,
    fonts: [],
    layoutEngine: 'taffy' // Optional: can also be set here
  }
)
```

### Using Yoga

```javascript
import satori, { setLayoutEngine, initYoga } from './src/index.js'
import yoga from 'yoga-wasm-web/auto'

// Initialize Yoga
setLayoutEngine('yoga')
initYoga(yoga)

const svg = await satori(
  <div style={{ display: 'flex', width: 300, height: 200 }}>
    Hello Yoga!
  </div>,
  {
    width: 300,
    height: 200,
    fonts: [],
    layoutEngine: 'yoga' // Optional: can also be set here
  }
)
```

## Configuration Options

You can set the layout engine in two ways:

1. **Globally** using `setLayoutEngine()` before calling `satori()`
2. **Per-call** using the `layoutEngine` option in `SatoriOptions`

The per-call option takes precedence over the global setting.

## API Differences

Both engines provide the same API surface through the `LayoutNode` interface, but there are some internal differences:

- **Taffy**: All methods are async and return Promises
- **Yoga**: Methods are synchronous but wrapped in async adapters for compatibility

## Performance Considerations

- **Bundle Size**: Taffy has a smaller bundle size
- **Initialization**: Taffy requires async initialization
- **Runtime**: Both engines have similar performance characteristics for typical use cases

## Testing

The test suite runs the same layout tests against both engines to ensure compatibility:

```bash
npm test
```

This will test both Yoga and Taffy implementations to ensure they produce consistent results. 