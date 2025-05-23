// Pre-built Taffy WASM type declarations
export * from '@loading/taffy'
export function instantiate(): Promise<{ Layout: any, Node: any, TaffyTree: any }>
export function instantiateWithInstance(): Promise<{ instance: WebAssembly.Instance, exports: any }>
export function isInstantiated(): boolean
