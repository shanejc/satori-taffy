import { it, describe, beforeAll, expect } from 'vitest'
import { setLayoutEngine, initYoga, initTaffy } from '../src/index.js'
import { getLayoutEngine } from '../src/layout-engine/factory.js'
import yoga from 'yoga-wasm-web/auto'
import { TaffyNode } from '../src/taffy/taffy-prebuilt.js'

describe('Layout Engine Abstraction', () => {
  it('should initialize Yoga layout engine correctly', async () => {
    setLayoutEngine('yoga')
    initYoga(yoga)
    
    const engine = await getLayoutEngine()
    const node = await engine.create()
    
    await node.setWidth(100)
    await node.setHeight(100)
    await node.calculateLayout()
    
    const layout = await node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should initialize Taffy layout engine correctly', async () => {
    setLayoutEngine('taffy')
    initTaffy(TaffyNode)
    
    const engine = await getLayoutEngine()
    const node = await engine.create()
    
    await node.setWidth(100)
    await node.setHeight(100)
    await node.calculateLayout()
    
    const layout = await node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle flexbox layout correctly with Yoga', async () => {
    setLayoutEngine('yoga')
    initYoga(yoga)
    
    const engine = await getLayoutEngine()
    const parent = await engine.create()
    const child = await engine.create()
    
    await parent.setWidth(200)
    await parent.setHeight(100)
    await parent.setFlexDirection('row')
    
    await child.setWidth(50)
    await child.setHeight(50)
    
    await parent.insertChild(child, 0)
    await parent.calculateLayout()
    
    const parentLayout = await parent.getComputedLayout()
    const childLayout = await child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })

  it('should handle flexbox layout correctly with Taffy', async () => {
    setLayoutEngine('taffy')
    initTaffy(TaffyNode)
    
    const engine = await getLayoutEngine()
    const parent = await engine.create()
    const child = await engine.create()
    
    await parent.setWidth(200)
    await parent.setHeight(100)
    await parent.setFlexDirection('row')
    
    await child.setWidth(50)
    await child.setHeight(50)
    
    await parent.insertChild(child, 0)
    await parent.calculateLayout()
    
    const parentLayout = await parent.getComputedLayout()
    const childLayout = await child.getComputedLayout()
    
    expect(parentLayout.width).toBe(200)
    expect(parentLayout.height).toBe(100)
    expect(childLayout.width).toBe(50)
    expect(childLayout.height).toBe(50)
  })
}) 