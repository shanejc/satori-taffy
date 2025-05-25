import { it, describe, expect } from 'vitest'
import { YogaAdapter } from '../src/layout-engine/yoga-adapter.js'
import { TaffyAdapter } from '../src/layout-engine/taffy-adapter.js'
import yoga from 'yoga-wasm-web/auto'
import { TaffyNode } from '../src/taffy/taffy-prebuilt.js'

describe('Layout Engine Adapters (Minimal)', () => {
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

  it('should create Taffy adapter correctly', async () => {
    const adapter = new TaffyAdapter(TaffyNode)
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

  it('should handle parent-child relationships with Taffy', async () => {
    const adapter = new TaffyAdapter(TaffyNode)
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