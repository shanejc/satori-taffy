import type { Yoga } from 'yoga-wasm-web';
import type { TaffyNode } from '../taffy/taffy-prebuilt.js';
import type { LayoutEngine } from './interface.js';
import { YogaAdapter } from './yoga-adapter.js';
import { TaffyAdapter } from './taffy-adapter.js';
import { init as initGlobalYoga } from '../yoga/index.js';
import getYoga from '../yoga/index.js';
import { LAYOUT_ENGINE_YOGA, LAYOUT_ENGINE_TAFFY } from './constants.js';

export type LayoutEngineType = typeof LAYOUT_ENGINE_YOGA | typeof LAYOUT_ENGINE_TAFFY;

let currentEngine: LayoutEngine | null = null;
let engineType: LayoutEngineType = LAYOUT_ENGINE_YOGA; // Default to Yoga for backward compatibility

export function setLayoutEngine(type: LayoutEngineType) {
  engineType = type;
}

export function initYoga(yoga: Yoga) {
  if (engineType === LAYOUT_ENGINE_YOGA) {
    currentEngine = new YogaAdapter(yoga);
  }
  // Also initialize the global yoga instance for text rendering
  initGlobalYoga(yoga);
}

export function initTaffy(taffyNode: typeof TaffyNode) {
  // Store Taffy constructor for later use
  (globalThis as any).TaffyNode = taffyNode;
}

export async function getLayoutEngine(): Promise<LayoutEngine> {
  if (currentEngine) {
    return currentEngine;
  }

  if (engineType === LAYOUT_ENGINE_YOGA) {
    const yoga = await getYoga();
    currentEngine = new YogaAdapter(yoga);
  } else if (engineType === LAYOUT_ENGINE_TAFFY) {
    const TaffyNodeConstructor = (globalThis as any).TaffyNode;
    if (!TaffyNodeConstructor) {
      throw new Error('Taffy layout engine not initialized. Please call initTaffy() first.');
    }
    currentEngine = new TaffyAdapter(TaffyNodeConstructor);
  } else {
    throw new Error(`Unknown layout engine type: ${engineType}`);
  }

  return currentEngine;
} 