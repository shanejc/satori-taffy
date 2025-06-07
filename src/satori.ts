import type { ReactNode } from 'react'
import type { TwConfig } from 'twrnc'
import type { SatoriNode } from './layout.js'

import { getLayoutEngine, setLayoutEngine, LayoutEngineType } from './layout-engine/factory.js'
import layout from './layout.js'
import FontLoader, { FontOptions } from './font.js'
import svg from './builder/svg.js'
import { segment } from './utils.js'
import { detectLanguageCode, LangCode, Locale } from './language.js'
import getTw from './handler/tailwind.js'
import { preProcessNode } from './handler/preprocess.js'
import { cache, inflightRequests } from './handler/image.js'

let raster: typeof import("satori-raster");
let rasterInitialized = false;

export async function initRaster() {
  if (!raster) {
    raster = await import("satori-raster");
  }
  
  if (!rasterInitialized) {
    const isNode = typeof process !== 'undefined' && process.versions?.node;
    
    if (isNode) {
      // Node.js: read WASM file directly
      try {
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        
        const wasmPath = resolve(process.cwd(), '../satori-raster/pkg/satori_raster_bg.wasm');
        const wasmBytes = readFileSync(wasmPath);
        raster.initSync(wasmBytes);
      } catch (error) {
        // Fallback to default loading if file read fails
        await raster.default();
      }
    } else {
      // Browser: explicitly try public paths first (Vite puts modules in deps cache)
      const publicPaths = [
        '/satori_raster_bg.wasm',
        '/public/satori_raster_bg.wasm', 
        '/assets/satori_raster_bg.wasm'
      ];
      
      let success = false;
      for (const path of publicPaths) {
        try {
          await raster.default({ module_or_path: path });
          success = true;
          break;
        } catch (error) {
          // Try next path
        }
      }
      
      if (!success) {
        // Fallback to default loading
        try {
          await raster.default();
        } catch (error) {
          throw new Error(
            `Failed to load WASM. Make sure satori_raster_bg.wasm is in your public directory. ` +
            `Tried: ${publicPaths.join(', ')}. Original error: ${error.message}`
          );
        }
      }
    }
    
    rasterInitialized = true;
  }
  
  return raster;
}

// We don't need to initialize the opentype instances every time.
const fontCache = new WeakMap()

export type SatoriOptions = (
  | {
      width: number
      height: number
    }
  | {
      width: number
    }
  | {
      height: number
    }
) & {
  fonts: FontOptions[]
  embedFont?: boolean
  debug?: boolean
  graphemeImages?: Record<string, string>
  loadAdditionalAsset?: (
    languageCode: string,
    segment: string
  ) => Promise<string | Array<FontOptions>>
  tailwindConfig?: TwConfig
  onNodeDetected?: (node: SatoriNode) => void
  layoutEngine?: LayoutEngineType
  output?: 'svg' | 'rgba'
}
export type { SatoriNode }

export type RgbaWithSize = {
  rgba: string
  width: number
  height: number
}

export default async function satori(
  element: ReactNode,
  options: SatoriOptions
): Promise<string | RgbaWithSize> {
  if (options.layoutEngine) {
    setLayoutEngine(options.layoutEngine)
  }

  const engine = await getLayoutEngine()
  if (!engine) {
    throw new Error(
      'Layout engine not initialized'
    )
  }
  options.fonts = options.fonts || []

  let font: FontLoader
  if (fontCache.has(options.fonts)) {
    font = fontCache.get(options.fonts)
  } else {
    fontCache.set(options.fonts, (font = new FontLoader(options.fonts)))
  }

  const definedWidth = 'width' in options ? options.width : undefined
  const definedHeight = 'height' in options ? options.height : undefined
  
  const layoutRoot = await engine.createRoot()
  const root = layoutRoot.getRootNode()
  if (definedWidth) root.setWidth(definedWidth)
  if (definedHeight) root.setHeight(definedHeight)
  root.setFlexDirection('row')
  root.setFlexWrap('wrap')
  root.setAlignContent('auto')
  root.setAlignItems('flex-start')
  root.setJustifyContent('flex-start')
  root.setOverflow('hidden')

  const graphemeImages = { ...options.graphemeImages }
  // Some Chinese characters have different glyphs in Chinese and
  // Japanese, but their Unicode is the same. If the user needs to display
  // the Chinese and Japanese characters simultaneously correctly, the user
  // needs to download the Chinese and Japanese fonts, respectively.
  // Assuming that the user has downloaded the corresponding Japanese font,
  // to let the program realize that the font has not been downloaded in Chinese,
  // we need to prohibit Japanese as the fallback when executing `engine.has`.
  //
  // This causes a problem. Consider a scenario where we need to display Chinese
  // correctly under tags with `lang="ja"` set. `engine.has` will repeatedly treat
  // the Chinese as missing font because we have removed the Chinese as a fallback.
  // To address this situation, we may need to add `processedWordsMissingFont`
  const processedWordsMissingFonts = new Set()

  cache.clear()
  inflightRequests.clear()
  await preProcessNode(element)

  const handler = layout(element, {
    id: 'id',
    parentStyle: {},
    inheritedStyle: {
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: 'serif',
      fontStyle: 'normal',
      lineHeight: 'normal',
      color: 'black',
      opacity: 1,
      whiteSpace: 'normal',

      // Special style properties:
      _viewportWidth: definedWidth,
      _viewportHeight: definedHeight,
    },
    parent: root,
    font,
    embedFont: options.embedFont,
    debug: options.debug,
    graphemeImages,
    canLoadAdditionalAssets: !!options.loadAdditionalAsset,
    onNodeDetected: options.onNodeDetected,
    layoutRoot,
    getTwStyles: (tw, style) => {
      const twToStyles = getTw({
        width: definedWidth,
        height: definedHeight,
        config: options.tailwindConfig,
      })
      const twStyles = { ...twToStyles([tw] as any) }
      if (typeof twStyles.lineHeight === 'number') {
        twStyles.lineHeight =
          twStyles.lineHeight / (+twStyles.fontSize || style.fontSize || 16)
      }
      if (twStyles.shadowColor && twStyles.boxShadow) {
        twStyles.boxShadow = (twStyles.boxShadow as string).replace(
          /rgba?\([^)]+\)/,
          twStyles.shadowColor as string
        )
      }
      return twStyles
    },
  })

  const segmentsMissingFont = (await handler.next()).value as {
    word: string
    locale?: Locale
  }[]

  if (options.loadAdditionalAsset) {
    if (segmentsMissingFont.length) {
      const languageCodes = convertToLanguageCodes(segmentsMissingFont)
      const fonts: FontOptions[] = []
      const images: Record<string, string> = {}

      await Promise.all(
        Object.entries(languageCodes).flatMap(([code, segments]) =>
          segments.map((_segment) => {
            const key = `${code}_${_segment}`
            if (processedWordsMissingFonts.has(key)) {
              return null
            }
            processedWordsMissingFonts.add(key)

            return options
              .loadAdditionalAsset(code, _segment)
              .then((asset: any) => {
                if (typeof asset === 'string') {
                  images[_segment] = asset
                } else if (asset) {
                  if (Array.isArray(asset)) {
                    fonts.push(...asset)
                  } else {
                    fonts.push(asset)
                  }
                }
              })
          })
        )
      )

      // Directly mutate the font provider and the grapheme map.
      font.addFonts(fonts)
      Object.assign(graphemeImages, images)
    }
  }

  await handler.next()
  
  // Calculate layout using the original three-parameter signature
  await layoutRoot.calculateLayout(definedWidth, definedHeight)

  const content = (await handler.next([0, 0])).value as string
  const computedLayout = await root.getComputedLayout()

  const svg_ =  svg({ width: computedLayout.width, height: computedLayout.height, content })
  if (options.output === 'rgba') {
    const rasterModule = await initRaster();
    const rgba_with_size = rasterModule.svg_to_rgba_with_size(svg_);
    return {
      rgba: rgba_with_size['data'],
      width: rgba_with_size['w'],
      height: rgba_with_size['h']
    }
  }
  return svg_
}

function convertToLanguageCodes(
  segmentsMissingFont: { word: string; locale?: Locale }[]
): Partial<Record<LangCode, string[]>> {
  const languageCodes = {}
  let wordsByCode = {}

  for (const { word, locale } of segmentsMissingFont) {
    const code = detectLanguageCode(word, locale).join('|')
    wordsByCode[code] = wordsByCode[code] || ''
    wordsByCode[code] += word
  }

  Object.keys(wordsByCode).forEach((code: LangCode) => {
    languageCodes[code] = languageCodes[code] || []
    if (code === 'emoji') {
      languageCodes[code].push(
        ...unique(segment(wordsByCode[code], 'grapheme'))
      )
    } else {
      languageCodes[code][0] = languageCodes[code][0] || ''
      languageCodes[code][0] += unique(
        segment(
          wordsByCode[code],
          'grapheme',
          code === 'unknown' ? undefined : code
        )
      ).join('')
    }
  })

  return languageCodes
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
