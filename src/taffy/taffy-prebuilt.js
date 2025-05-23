// Simple wrapper to re-export TaffyNode from the TypeScript file
// This allows tests to import from .js while the actual implementation is in .ts
export { TaffyNode, getTaffyModule } from './taffy-prebuilt.ts' 