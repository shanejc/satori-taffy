import { it, expect, describe, vi } from 'vitest'
import satori from '../src/index.js'
import { setLayoutEngine } from '../src/layout-engine/factory.js'
import { LAYOUT_ENGINE_YOGA, LAYOUT_ENGINE_TAFFY } from '../src/layout-engine/constants.js'
import { initFonts } from './utils.js'

describe('CSS Grid Warning System', () => {
  let fonts

  initFonts((f) => (fonts = f))

  it('should warn when using CSS Grid with Yoga engine', async () => {
    // Set to Yoga engine
    setLayoutEngine(LAYOUT_ENGINE_YOGA)

    // Spy on console.warn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const svg = await satori(
        <div style={{ display: 'grid', width: 200, height: 100 }}>
          <div>Grid item 1</div>
          <div>Grid item 2</div>
        </div>,
        {
          width: 200,
          height: 100,
          fonts,
        }
      )

      // Should have generated SVG (with fallback to flex)
      expect(svg).toBeTruthy()
      expect(svg).toContain('<svg')

      // Should have warned about Grid not being supported
      expect(consoleSpy).toHaveBeenCalledWith(
        'CSS Grid (display: "grid") is only supported with the Taffy layout engine. ' +
        'The current engine is Yoga. Falling back to flexbox layout. ' +
        'To use CSS Grid, switch to Taffy: setLayoutEngine("taffy")'
      )
    } finally {
      consoleSpy.mockRestore()
    }
  })

  it('should NOT warn when using CSS Grid with Taffy engine', async () => {
    // Set to Taffy engine
    setLayoutEngine(LAYOUT_ENGINE_TAFFY)

    // Spy on console.warn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const svg = await satori(
        <div style={{ display: 'grid', width: 200, height: 100 }}>
          <div>Grid item 1</div>
          <div>Grid item 2</div>
        </div>,
        {
          width: 200,
          height: 100,
          fonts,
        }
      )

      // Should have generated SVG
      expect(svg).toBeTruthy()
      expect(svg).toContain('<svg')

      // Should NOT have warned about Grid
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('CSS Grid')
      )
    } finally {
      consoleSpy.mockRestore()
    }
  })

  it('should NOT warn when using flexbox with any engine', async () => {
    // Test with Yoga
    setLayoutEngine(LAYOUT_ENGINE_YOGA)

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const svg = await satori(
        <div style={{ display: 'flex', width: 200, height: 100 }}>
          <div>Flex item 1</div>
          <div>Flex item 2</div>
        </div>,
        {
          width: 200,
          height: 100,
          fonts,
        }
      )

      expect(svg).toBeTruthy()
      expect(consoleSpy).not.toHaveBeenCalled()
    } finally {
      consoleSpy.mockRestore()
    }
  })
}) 