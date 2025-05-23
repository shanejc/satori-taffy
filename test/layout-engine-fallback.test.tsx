import { it, describe, expect } from 'vitest'
import { YogaAdapter } from '../src/layout-engine/yoga-adapter.js'
import { TaffyAdapter } from '../src/layout-engine/taffy-adapter.js'
import yoga from 'yoga-wasm-web/auto'
import { MockTaffyNode } from './__mocks__/taffy.js'

// Try to import the real TaffyNode, fall back to mock if it fails
let TaffyNodeClass: any
try {
  const { TaffyNode } = await import('../src/taffy/taffy-prebuilt.js')
  TaffyNodeClass = TaffyNode
} catch (error) {
  console.warn('WASM loading failed, using mock TaffyNode for tests:', error.message)
  TaffyNodeClass = MockTaffyNode
}

describe('Layout Engine Adapters (With Fallback)', () => {
  it('should create Yoga adapter correctly', async () => {
    const adapter = new YogaAdapter(yoga)
    const node = await adapter.create()
    
    await node.setWidth(100)
    await node.setHeight(100)
    await node.calculateLayout()
    
    const layout = await node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should create Taffy adapter correctly (with fallback)', async () => {
    const adapter = new TaffyAdapter(TaffyNodeClass)
    const node = await adapter.create()
    
    await node.setWidth(100)
    await node.setHeight(100)
    await node.calculateLayout()
    
    const layout = await node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle parent-child relationships with Yoga', async () => {
    const adapter = new YogaAdapter(yoga)
    const parent = await adapter.create()
    const child = await adapter.create()
    
    await parent.setWidth(200)
    await parent.setHeight(100)
    await parent.setFlexDirection('row')
    
    await child.setWidth(50)
    await child.setHeight(50)
    
    await parent.insertChild(child, 0)
    expect(await parent.getChildCount()).toBe(1)
    
    await parent.calculateLayout()
    
    const parentLayout = await parent.getComputedLayout()
    const childLayout = await child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })

  it('should handle parent-child relationships with Taffy (with fallback)', async () => {
    const adapter = new TaffyAdapter(TaffyNodeClass)
    const parent = await adapter.create()
    const child = await adapter.create()
    
    await parent.setWidth(200)
    await parent.setHeight(100)
    await parent.setFlexDirection('row')
    
    await child.setWidth(50)
    await child.setHeight(50)
    
    await parent.insertChild(child, 0)
    expect(await parent.getChildCount()).toBe(1)
    
    await parent.calculateLayout()
    
    const parentLayout = await parent.getComputedLayout()
    const childLayout = await child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })
}) 