import type { Yoga } from 'yoga-wasm-web';
import type { TaffyNode } from '../taffy/taffy-prebuilt.js';
import type { LayoutEngine } from './interface.js';
import { YogaAdapter } from './yoga-adapter.js';
import { TaffyAdapter } from './taffy-adapter.js';
import { init as initGlobalYoga } from '../yoga/index.js';
import getYoga from '../yoga/index.js';

export type LayoutEngineType = 'yoga' | 'taffy';

let currentEngine: LayoutEngine | null = null;
let engineType: LayoutEngineType = 'yoga'; // Default to Yoga for backward compatibility

export function setLayoutEngine(type: LayoutEngineType) {
  engineType = type;
}

export function initYoga(yoga: Yoga) {
  if (engineType === 'yoga') {
    currentEngine = new YogaAdapter(yoga);
  }
  // Also initialize the global yoga instance for text rendering
  initGlobalYoga(yoga);
}

export function initTaffy(taffy: typeof TaffyNode) {
  if (engineType === 'taffy') {
    currentEngine = new TaffyAdapter(taffy);
  }
  // For hybrid mode: when using Taffy for layout, we still need Yoga for text
  // We'll let the text system auto-initialize Yoga via getLayoutEngine()
}

export async function getLayoutEngine(): Promise<LayoutEngine> {
  if (!currentEngine) {
    // Auto-initialize Yoga as the default for backward compatibility
    if (engineType === 'yoga') {
      try {
        const yoga = await getYoga();
        currentEngine = new YogaAdapter(yoga);
        initGlobalYoga(yoga);
      } catch (error) {
        throw new Error(`Failed to auto-initialize Yoga layout engine: ${error.message}. Please call initYoga() explicitly.`);
      }
    } else {
      throw new Error(`Layout engine not initialized. Please initialize ${engineType} first.`);
    }
  }
  return currentEngine;
} 