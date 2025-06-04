import { it, describe, expect, beforeEach } from 'vitest'
import { initFonts, toImage } from './utils.js'
import satori from '../src/index.js'
import { setLayoutEngine } from '../src/layout-engine/factory.js'
import { LAYOUT_ENGINE_TAFFY } from '../src/layout-engine/constants.js'

describe('CSS Grid Advanced', () => {
  let fonts
  initFonts((f) => (fonts = f))

  // Set to Taffy engine for all grid tests
  beforeEach(() => {
    setLayoutEngine(LAYOUT_ENGINE_TAFFY)
  })

  // Taffy doesn't support template areas, yet
  // it('should render grid with template areas', async () => {
  //   const svg = await satori(
  //     <div
  //       style={{
  //         display: 'grid',
  //         gridTemplateColumns: '1fr 2fr 1fr',
  //         gridTemplateRows: '40px 1fr 30px',
  //         gridTemplateAreas: '"header header header" "sidebar main aside" "footer footer footer"',
  //         width: 120,
  //         height: 100,
  //         gap: 2,
  //       }}
  //     >
  //       <div style={{ backgroundColor: 'red', gridArea: 'header' }}>Header</div>
  //       <div style={{ backgroundColor: 'blue', gridArea: 'sidebar' }}>Side</div>
  //       <div style={{ backgroundColor: 'green', gridArea: 'main' }}>Main</div>
  //       <div style={{ backgroundColor: 'yellow', gridArea: 'aside' }}>Aside</div>
  //       <div style={{ backgroundColor: 'purple', gridArea: 'footer' }}>Footer</div>
  //     </div>,
  //     {
  //       width: 120,
  //       height: 100,
  //       fonts,
  //     }
  //   )
  //   expect(toImage(svg, 120)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  // })

  it('should render grid with column auto-flow', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoFlow: 'column',
          gridAutoRows: '25px',
          width: 100,
          height: 80,
          gap: 2,
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

  it('should render grid with spanning elements', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 100,
          height: 90,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red', gridColumn: 'span 2' }}>Span 2</div>
        <div style={{ backgroundColor: 'blue' }}>1</div>
        <div style={{ backgroundColor: 'green' }}>2</div>
        <div style={{ backgroundColor: 'yellow', gridRow: 'span 2' }}>Span Rows</div>
        <div style={{ backgroundColor: 'purple' }}>3</div>
        <div style={{ backgroundColor: 'orange' }}>4</div>
        <div style={{ backgroundColor: 'brown' }}>5</div>
        <div style={{ backgroundColor: 'pink' }}>6</div>
        <div style={{ backgroundColor: 'cyan' }}>7</div>
        <div style={{ backgroundColor: 'lime' }}>8</div>
      </div>,
      {
        width: 100,
        height: 90,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with auto columns', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridAutoColumns: '30px',
          gridAutoFlow: 'column',
          width: 165,
          height: 60,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>Auto 1</div>
        <div style={{ backgroundColor: 'blue' }}>Auto 2</div>
        <div style={{ backgroundColor: 'green' }}>Extra 1</div>
        <div style={{ backgroundColor: 'yellow' }}>Extra 2</div>
        <div style={{ backgroundColor: 'purple' }}>Extra 3</div>
      </div>,
      {
        width: 165,
        height: 60,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render dense grid auto-flow', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoFlow: 'row dense',
          width: 100,
          height: 100,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>1</div>
        <div style={{ backgroundColor: 'blue', gridColumn: 'span 2' }}>Wide</div>
        <div style={{ backgroundColor: 'green' }}>3</div>
        <div style={{ backgroundColor: 'yellow' }}>4</div>
        <div style={{ backgroundColor: 'purple' }}>5</div>
        <div style={{ backgroundColor: 'orange' }}>6</div>
      </div>,
      {
        width: 100,
        height: 100,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with min-content and max-content', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr max-content',
          gridTemplateRows: 'auto',
          width: 120,
          height: 50,
          gap: 3,
          fontSize: 10,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>Min</div>
        <div style={{ backgroundColor: 'blue' }}>Flexible Content</div>
        <div style={{ backgroundColor: 'green' }}>Maximum</div>
      </div>,
      {
        width: 120,
        height: 50,
        fonts,
      }
    )
    expect(toImage(svg, 120)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render nested grids', async () => {
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
        <div
          style={{
            backgroundColor: 'red',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
          }}
        >
          <div style={{ backgroundColor: 'darkred' }}>A</div>
          <div style={{ backgroundColor: 'pink' }}>B</div>
        </div>
        <div style={{ backgroundColor: 'blue' }}>2</div>
        <div style={{ backgroundColor: 'green' }}>3</div>
        <div
          style={{
            backgroundColor: 'yellow',
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            gap: 2,
          }}
        >
          <div style={{ backgroundColor: 'orange' }}>X</div>
          <div style={{ backgroundColor: 'gold' }}>Y</div>
        </div>
      </div>,
      {
        width: 100,
        height: 100,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })

  it('should render grid with percentage units', async () => {
    const svg = await satori(
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '25% 50% 25%',
          gridTemplateRows: '1fr',
          width: 100,
          height: 50,
          gap: 2,
        }}
      >
        <div style={{ backgroundColor: 'red' }}>25%</div>
        <div style={{ backgroundColor: 'blue' }}>50%</div>
        <div style={{ backgroundColor: 'green' }}>25%</div>
      </div>,
      {
        width: 100,
        height: 50,
        fonts,
      }
    )
    expect(toImage(svg, 100)).toMatchImageSnapshotWithTolerance('percent', 0.1)
  })
}) 