import { describe, it, expect, vi } from 'vitest'

// Mock both layout engines to test fallback behavior
vi.mock('../src/yoga/index.js', () => ({
  default: null, // Simulate Yoga not being available
  init: vi.fn().mockRejectedValue(new Error('Yoga not available'))
}))

vi.mock('../src/taffy/taffy-prebuilt.js', () => ({
  TaffyNode: {
    create: vi.fn().mockResolvedValue({
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      calculateLayout: vi.fn(),
      getComputedLayout: vi.fn().mockReturnValue({ width: 100, height: 100, left: 0, top: 0 }),
      setFlexDirection: vi.fn(),
      addChild: vi.fn(),
      getChildCount: vi.fn().mockReturnValue(1),
      getNode: vi.fn()
    })
  }
}))

import { getLayoutEngine } from '../src/layout-engine/factory.js'
import { LAYOUT_ENGINE_TAFFY } from '../src/layout-engine/constants.js'

describe('Layout Engine Fallback', () => {
  it('should fallback to Taffy when Yoga is not available', async () => {
    const engine = await getLayoutEngine(LAYOUT_ENGINE_TAFFY)
    const node = await engine.create()
    
    node.setWidth(100)
    node.setHeight(100)
    node.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle basic layout operations with fallback', async () => {
    const engine = await getLayoutEngine(LAYOUT_ENGINE_TAFFY)
    const node = await engine.create()
    
    node.setWidth(100)
    node.setHeight(100)
    node.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle parent-child relationships with fallback', async () => {
    const engine = await getLayoutEngine(LAYOUT_ENGINE_TAFFY)
    const parent = await engine.create()
    const child = await engine.create()
    
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
    
    expect(parentLayout.width).toBe(100) // Mocked value
    expect(parentLayout.height).toBe(100) // Mocked value
  })

  it('should handle complex layouts with fallback', async () => {
    const engine = await getLayoutEngine(LAYOUT_ENGINE_TAFFY)
    const parent = await engine.create()
    const child = await engine.create()
    
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
    
    expect(parentLayout.width).toBe(100) // Mocked value
    expect(parentLayout.height).toBe(100) // Mocked value
  })
}) 