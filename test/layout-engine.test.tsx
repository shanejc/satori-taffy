import { describe, it, expect } from 'vitest'
import { getLayoutEngine } from '../src/layout-engine/factory.js'

describe('Layout Engine', () => {
  it('should create a node and set basic properties', async () => {
    const engine = await getLayoutEngine()
    const root = await engine.createRoot()
    const node = root.getRootNode()
    
    node.setWidth(100)
    node.setHeight(100)
    root.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle different dimensions', async () => {
    const engine = await getLayoutEngine()
    const root = await engine.createRoot()
    const node = root.getRootNode()
    
    node.setWidth(100)
    node.setHeight(100)
    root.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle parent-child relationships with addChild', async () => {
    const engine = await getLayoutEngine()
    const root = await engine.createRoot()
    const parent = root.getRootNode()
    const child = root.createNode()
    
    parent.setWidth(200)
    parent.setHeight(100)
    parent.setFlexDirection('row')
    
    child.setWidth(50)
    child.setHeight(50)
    
    parent.addChild(child)
    root.calculateLayout()

    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })

  it('should handle parent-child relationships with addChild (legacy test)', async () => {
    const engine = await getLayoutEngine()
    const root = await engine.createRoot()
    const parent = root.getRootNode()
    const child = root.createNode()
    
    parent.setWidth(200)
    parent.setHeight(100)
    parent.setFlexDirection('row')
    
    child.setWidth(50)
    child.setHeight(50)
    
    parent.addChild(child)
    root.calculateLayout()
    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })
}) 