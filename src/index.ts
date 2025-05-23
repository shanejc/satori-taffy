import satori from './satori.js'
import { setLayoutEngine, initYoga, initTaffy, type LayoutEngineType } from './layout-engine/factory.js'

export { setLayoutEngine, initYoga, initTaffy, type LayoutEngineType }
// Backward compatibility - map init to initYoga
export { initYoga as init }
export default satori
export type { SatoriOptions, SatoriNode } from './satori.js'

export type {
  FontOptions as Font,
  Weight as FontWeight,
  FontStyle,
} from './font.js'
export type { Locale } from './language.js'
