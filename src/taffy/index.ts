import type { TaffyNode } from './taffy-prebuilt.js'

let taffyInstance: typeof TaffyNode;

export function init(taffy: typeof TaffyNode) {
  taffyInstance = taffy;
}

let initializationPromise = null;

export default async function getTaffy(): Promise<typeof TaffyNode> {
  if (taffyInstance) return taffyInstance;

  if (initializationPromise) {
    await initializationPromise;
    return taffyInstance;
  }

  initializationPromise = import('@taffy')
    .then((mod) => mod.getTaffyModule())
    .then((taffy) => (taffyInstance = taffy));

  await initializationPromise;
  initializationPromise = null;

  return taffyInstance;
} 