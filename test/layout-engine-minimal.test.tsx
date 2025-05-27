import { it, describe, expect } from 'vitest'
import { YogaAdapter } from '../src/layout-engine/yoga-adapter.js'
import { TaffyAdapter } from '../src/layout-engine/taffy-adapter.js'
import yoga from 'yoga-wasm-web/auto'
import { TaffyNode } from '../src/taffy/taffy-prebuilt.js'

describe('Layout Engine Adapters (Minimal)', () => {
  it('should create Yoga adapter correctly', async () => {
    const adapter = new YogaAdapter(yoga)
    const node = await adapter.create()
    
    node.setWidth(100)
    node.setHeight(100)
    node.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should create Taffy adapter correctly', async () => {
    const adapter = new TaffyAdapter()
    const node = await adapter.create()
    
    node.setWidth(100)
    node.setHeight(100)
    node.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle parent-child relationships with Yoga', async () => {
    const adapter = new YogaAdapter(yoga)
    const parent = await adapter.create()
    const child = await adapter.create()
    
    parent.setWidth(200)
    parent.setHeight(100)
    parent.setFlexDirection('row')
    
    child.setWidth(50)
    child.setHeight(50)
    
    parent.addChild(child)
    expect(parent.getChildCount()).toBe(1)
    
    parent.calculateLayout()
    
    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })

  it('should handle parent-child relationships with Taffy', async () => {
    const adapter = new TaffyAdapter()
    const parent = await adapter.create()
    const child = await adapter.create()
    
    parent.setWidth(200)
    parent.setHeight(100)
    parent.setFlexDirection('row')
    
    child.setWidth(50)
    child.setHeight(50)
    
    parent.addChild(child)
    expect(parent.getChildCount()).toBe(1)
    
    parent.calculateLayout()
    
    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })
}) 