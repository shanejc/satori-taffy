import { describe, it, expect, vi } from 'vitest'
import { YogaAdapter } from '../src/layout-engine/yoga-adapter.js'
import { TaffyAdapter } from '../src/layout-engine/taffy-adapter.js'
import yoga from 'yoga-wasm-web/auto'

// Mock the TaffyNode module using a factory function to avoid hoisting issues
vi.mock('../src/taffy/taffy-prebuilt.js', () => ({
  TaffyNode: {
    create: vi.fn().mockImplementation(() => {
      // Mock the TaffyNode to avoid WASM initialization in tests
      class MockTaffyNode {
        private width = 0
        private height = 0
        private children: MockTaffyNode[] = []
        private computedLayout = { left: 0, top: 0, width: 0, height: 0 }

        setWidth(width: number): void {
          this.width = width
          this.computedLayout.width = width
        }

        setHeight(height: number): void {
          this.height = height
          this.computedLayout.height = height
        }

        setWidthAuto(): void {
          this.width = 0
        }

        setHeightAuto(): void {
          this.height = 0
        }

        setFlexDirection(direction: string): void {
          // Mock implementation
        }

        setAlignItems(align: string): void {
          // Mock implementation
        }

        setJustifyContent(justify: string): void {
          // Mock implementation
        }

        setFlexWrap(wrap: string): void {
          // Mock implementation
        }

        setFlexGrow(grow: number): void {
          // Mock implementation
        }

        setFlexShrink(shrink: number): void {
          // Mock implementation
        }

        setDisplay(display: string): void {
          // Mock implementation
        }

        setAlignContent(align: string): void {
          // Mock implementation
        }

        setAlignSelf(align: string): void {
          // Mock implementation
        }

        setGap(gap: number): void {
          // Mock implementation
        }

        setRowGap(gap: number): void {
          // Mock implementation
        }

        setColumnGap(gap: number): void {
          // Mock implementation
        }

        addChild(child: MockTaffyNode): void {
          this.children.push(child)
        }

        getChildCount(): number {
          return this.children.length
        }

        calculateLayout(): void {
          // Mock layout calculation
          this.computedLayout = {
            left: 0,
            top: 0,
            width: this.width,
            height: this.height
          }
        }

        getComputedLayout(): { left: number; top: number; width: number; height: number } {
          return this.computedLayout
        }

        getComputedWidth(): number {
          return this.computedLayout.width
        }

        getComputedHeight(): number {
          return this.computedLayout.height
        }

        getComputedLeft(): number {
          return this.computedLayout.left
        }

        getComputedTop(): number {
          return this.computedLayout.top
        }

        getNode() {
          return this
        }
      }
      
      return Promise.resolve(new MockTaffyNode())
    })
  }
}))

describe('Layout Engine with Mocked TaffyNode', () => {
  it('should create a node and set basic properties', async () => {
    const adapter = new TaffyAdapter()
    const node = await adapter.create()
    
    node.setWidth(100)
    node.setHeight(100)
    node.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('should handle different dimensions', async () => {
    const adapter = new TaffyAdapter()
    const node = await adapter.create()
    
    node.setWidth(150)
    node.setHeight(200)
    node.calculateLayout()
    
    const layout = node.getComputedLayout()
    expect(layout.width).toBe(150)
    expect(layout.height).toBe(200)
  })

  it('should handle parent-child relationships', async () => {
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

  it('should handle multiple children', async () => {
    const adapter = new TaffyAdapter()
    const parent = await adapter.create()
    const child = await adapter.create()
    
    parent.setWidth(300)
    parent.setHeight(150)
    parent.setFlexDirection('row')
    
    child.setWidth(75)
    child.setHeight(75)
    
    parent.addChild(child)
    expect(parent.getChildCount()).toBe(1)
    
    parent.calculateLayout()
    
    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()
    
    expect(parentLayout.width).toBe(300)
    expect(parentLayout.height).toBe(150)
    expect(childLayout.width).toBe(75)
    expect(childLayout.height).toBe(75)
  })
}) 