import { beforeAll, expect } from 'vitest'
import { join } from 'path'
import { Resvg } from '@resvg/resvg-js'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
import { readFile } from 'node:fs/promises'
import yoga from 'yoga-wasm-web/auto'

import { init, initYoga, setLayoutEngine, type SatoriOptions } from '../src/index.js'

export function initYogaWasm() {
  beforeAll(async () => {
    init(yoga)
  })
}

export async function getDynamicAsset(text: string): Promise<Buffer> {
  const fontPath = join(process.cwd(), 'test', 'assets', text)
  return await readFile(fontPath)
}

export async function loadDynamicAsset(code: string, text: string) {
  return [
    {
      name: `satori_${code}_fallback_${text}`,
      data: await getDynamicAsset(text),
      weight: 400,
      style: 'normal',
      lang: code === 'unknown' ? undefined : code.split('|')[0],
    },
  ]
}

export function initFonts(callback: (fonts: SatoriOptions['fonts']) => void) {
  beforeAll(async () => {
    // Initialize layout engines for tests
    setLayoutEngine('yoga')
    initYoga(yoga)
    
    const fontPath = join(process.cwd(), 'test', 'assets', 'Roboto-Regular.ttf')
    const fontData = await readFile(fontPath)
    callback([
      {
        name: 'Roboto',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ])
  })
}

export function toImage(svg: string, width = 100) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
    font: {
      // As system fallback font
      fontFiles: [
        join(process.cwd(), 'test', 'assets', 'playfair-display.ttf'),
      ],
      loadSystemFonts: false,
      defaultFontFamily: 'Playfair Display',
    },
  })
  const pngData = resvg.render()
  return pngData.asPng()
}

// Helper function for tests with small differences
export function toMatchImageSnapshotWithTolerance(received: Buffer, failureThresholdType: 'pixel' | 'percent' = 'percent', failureThreshold: number = 0.1) {
  return toMatchImageSnapshot.call(
    this,
    received,
    {
      failureThresholdType,
      failureThreshold,
    }
  )
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchImageSnapshot(): R
      toMatchImageSnapshotWithTolerance(failureThresholdType?: 'pixel' | 'percent', failureThreshold?: number): R
    }
  }
}

expect.extend({ 
  toMatchImageSnapshot,
  toMatchImageSnapshotWithTolerance
})
