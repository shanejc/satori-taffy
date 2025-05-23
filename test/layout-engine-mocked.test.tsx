import { it, describe, expect, vi } from 'vitest'
import { YogaAdapter } from '../src/layout-engine/yoga-adapter.js'
import { TaffyAdapter } from '../src/layout-engine/taffy-adapter.js'
import yoga from 'yoga-wasm-web/auto'

// Mock the taffy module to avoid WASM loading issues in tests
vi.mock('../src/taffy/taffy-prebuilt.js', () => ({
  TaffyNode: {
    async create() {
      return new MockTaffyNode()
    }
  }
}))

class MockTaffyNode {
  private style: any = {}
  private children: MockTaffyNode[] = []
  private layout = { left: 0, top: 0, width: 100, height: 100 }

  async setWidth(width: number): Promise<void> {
    this.style.width = width
    this.layout.width = width
  }

  async setHeight(height: number): Promise<void> {
    this.style.height = height
    this.layout.height = height
  }

  async setFlexDirection(direction: string): Promise<void> {
    this.style.flexDirection = direction
  }

  async setFlexWrap(wrap: string): Promise<void> {
    this.style.flexWrap = wrap
  }

  async setAlignContent(align: string): Promise<void> {
    this.style.alignContent = align
  }

  async setAlignItems(align: string): Promise<void> {
    this.style.alignItems = align
  }

  async setJustifyContent(justify: string): Promise<void> {
    this.style.justifyContent = justify
  }

  async setOverflow(overflow: string): Promise<void> {
    this.style.overflow = overflow
  }

  async calculateLayout(): Promise<void> {
    // Mock layout calculation
  }

  async getComputedLayout(): Promise<{ left: number; top: number; width: number; height: number }> {
    return { ...this.layout }
  }

  async insertChild(child: MockTaffyNode, index: number): Promise<void> {
    this.children.splice(index, 0, child)
  }

  async getChildCount(): Promise<number> {
    return this.children.length
  }
}

describe('Layout Engine Adapters (Mocked)', () => {
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

  it('should create Taffy adapter correctly (mocked)', async () => {
    const { TaffyNode } = await import('../src/taffy/taffy-prebuilt.js')
    const adapter = new TaffyAdapter(TaffyNode)
    const node = await adapter.create()
    
    await node.setWidth(150)
    await node.setHeight(200)
    await node.calculateLayout()
    
    const layout = await node.getComputedLayout()
    expect(layout.width).toBe(150)
    expect(layout.height).toBe(200)
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

  it('should handle parent-child relationships with Taffy (mocked)', async () => {
    const { TaffyNode } = await import('../src/taffy/taffy-prebuilt.js')
    const adapter = new TaffyAdapter(TaffyNode)
    const parent = await adapter.create()
    const child = await adapter.create()
    
    await parent.setWidth(300)
    await parent.setHeight(150)
    await parent.setFlexDirection('row')
    
    await child.setWidth(75)
    await child.setHeight(75)
    
    await parent.insertChild(child, 0)
    expect(await parent.getChildCount()).toBe(1)
    
    await parent.calculateLayout()
    
    const parentLayout = await parent.getComputedLayout()
    const childLayout = await child.getComputedLayout()
    
    expect(parentLayout.width).toBe(300)
    expect(parentLayout.height).toBe(150)
    expect(childLayout.width).toBe(75)
    expect(childLayout.height).toBe(75)
  })
}) 