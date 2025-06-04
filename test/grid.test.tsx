import { it, describe, expect, beforeEach } from 'vitest'
import { initFonts, toImage } from './utils.js'
import satori from '../src/index.js'
import { setLayoutEngine } from '../src/layout-engine/factory.js'
import { LAYOUT_ENGINE_TAFFY } from '../src/layout-engine/constants.js'

describe('CSS Grid', () => {
  let fonts
  initFonts((f) => (fonts = f))

  // Set to Taffy engine for all grid tests
  beforeEach(() => {
    setLayoutEngine(LAYOUT_ENGINE_TAFFY)
  })

  it('should render basic 2x2 grid', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr', 
          gridTemplateRows: '1fr 1fr',
          width: 100,
          height: 100,
          gap: 4,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>1</div>
        <div style={{ backgroundColor: 'blue' }}>2</div>
        <div style={{ backgroundColor: 'green' }}>3</div>
        <div style={{ backgroundColor: 'yellow' }}>4</div>
      </div>,
      {
        width: 100,
        height: 100,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with fixed and flexible columns', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 60px',
          gridTemplateRows: '1fr',
          width: 100,
          height: 60,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>Fixed</div>
        <div style={{ backgroundColor: 'blue' }}>Flex</div>
        <div style={{ backgroundColor: 'green' }}>End</div>
      </div>,
      {
        width: 100,
        height: 60,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with repeat() notation', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: '40px',
          width: 100,
          height: 50,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>1</div>
        <div style={{ backgroundColor: 'blue' }}>2</div>
        <div style={{ backgroundColor: 'green' }}>3</div>
        <div style={{ backgroundColor: 'yellow' }}>4</div>
      </div>,
      {
        width: 100,
        height: 50,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with minmax() columns', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(20px, 1fr) minmax(30px, 2fr) minmax(15px, 1fr)',
          gridTemplateRows: '50px',
          width: 100,
          height: 60,
          gap: 3,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>Min</div>
        <div style={{ backgroundColor: 'blue' }}>Big</div>
        <div style={{ backgroundColor: 'green' }}>End</div>
      </div>,
      {
        width: 100,
        height: 60,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with auto-sized content', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gridTemplateRows: 'auto',
          width: 100,
          height: 60,
          gap: 4,
          fontSize: 12,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>Start</div>
        <div style={{ backgroundColor: 'blue' }}>Center Content</div>
        <div style={{ backgroundColor: 'green' }}>End</div>
      </div>,
      {
        width: 100,
        height: 60,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render complex grid layout', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          gridTemplateRows: '30px 1fr 20px',
          width: 100,
          height: 100,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red', gridColumn: '1 / -1' }}>Header</div>
        <div style={{ backgroundColor: 'blue' }}>Left</div>
        <div style={{ backgroundColor: 'green' }}>Main</div>
        <div style={{ backgroundColor: 'yellow' }}>Right</div>
        <div style={{ backgroundColor: 'purple', gridColumn: '1 / -1' }}>Footer</div>
      </div>,
      {
        width: 100,
        height: 100,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with different gap sizes', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          width: 100,
          height: 100,
          gap: 8,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>A</div>
        <div style={{ backgroundColor: 'blue' }}>B</div>
        <div style={{ backgroundColor: 'green' }}>C</div>
        <div style={{ backgroundColor: 'yellow' }}>D</div>
      </div>,
      {
        width: 100,
        height: 100,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with row and column gaps', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          width: 100,
          height: 80,
          rowGap: 8,
          columnGap: 4,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>1</div>
        <div style={{ backgroundColor: 'blue' }}>2</div>
        <div style={{ backgroundColor: 'green' }}>3</div>
        <div style={{ backgroundColor: 'yellow' }}>4</div>
        <div style={{ backgroundColor: 'purple' }}>5</div>
        <div style={{ backgroundColor: 'orange' }}>6</div>
      </div>,
      {
        width: 100,
        height: 80,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with mixed unit types', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '30px 1fr 25%',
          gridTemplateRows: 'auto 1fr',
          width: 100,
          height: 80,
          gap: 3,
        }}
      >
        <div style={{ backgroundColor: 'red', fontSize: 10 }}>Px</div>
        <div style={{ backgroundColor: 'blue' }}>Fr</div>
        <div style={{ backgroundColor: 'green' }}>%</div>
        <div style={{ backgroundColor: 'yellow' }}>Bottom</div>
        <div style={{ backgroundColor: 'purple' }}>Center</div>
        <div style={{ backgroundColor: 'orange' }}>Right</div>
      </div>,
      {
        width: 100,
        height: 80,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with explicit row sizing', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '25px 1fr 30px',
          width: 100,
          height: 100,
          gap: 3,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>Top 1</div>
        <div style={{ backgroundColor: 'blue' }}>Top 2</div>
        <div style={{ backgroundColor: 'green' }}>Mid 1</div>
        <div style={{ backgroundColor: 'yellow' }}>Mid 2</div>
        <div style={{ backgroundColor: 'purple' }}>Bot 1</div>
        <div style={{ backgroundColor: 'orange' }}>Bot 2</div>
      </div>,
      {
        width: 100,
        height: 100,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })
}) 