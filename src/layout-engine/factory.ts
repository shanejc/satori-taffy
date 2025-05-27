import type { Yoga } from 'yoga-wasm-web';
import { TaffyNode } from '../taffy/taffy-prebuilt.js';
import type { LayoutEngine } from './interface.js';
import { YogaAdapter } from './yoga-adapter.js';
import { TaffyAdapter } from './taffy-adapter.js';
import { init as initGlobalYoga } from '../yoga/index.js';
import getYoga from '../yoga/index.js';
import { LAYOUT_ENGINE_YOGA, LAYOUT_ENGINE_TAFFY } from './constants.js';

export type LayoutEngineType = typeof LAYOUT_ENGINE_YOGA | typeof LAYOUT_ENGINE_TAFFY;

let currentEngine: Promise<LayoutEngine> | null = null;
let engineType: LayoutEngineType = LAYOUT_ENGINE_YOGA; // Default to Taffy for speed and coverage

export function setLayoutEngine(type: LayoutEngineType) {
  engineType = type;
}

export function getLayoutEngineType(): LayoutEngineType { 
  return engineType;
}

export async function getLayoutEngine(engineTypeLocal?: LayoutEngineType): Promise<LayoutEngine> {  
  if (engineTypeLocal) {
    return getLayoutEngineInternal(engineTypeLocal);
  }

  currentEngine = getLayoutEngineInternal(engineType);
  return currentEngine;
}

async function getLayoutEngineInternal(engineTypeLocal?: LayoutEngineType): Promise<LayoutEngine> {
  if(engineTypeLocal) {
    if(engineTypeLocal === LAYOUT_ENGINE_YOGA) {
      const yoga = await getYoga();
      return new YogaAdapter(yoga);
    } else if(engineTypeLocal === LAYOUT_ENGINE_TAFFY) {
      return new TaffyAdapter();
    } else {
      throw new Error(`Unknown layout engine type: ${engineTypeLocal}`);
    }
  }
}
