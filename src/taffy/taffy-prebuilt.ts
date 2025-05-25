import { instantiate } from './prebuilt/index.js'
import { toTaffyStyle, fromTaffyStyle } from './style-adapter.js'
import type { SerializedStyle } from '../handler/expand.js'

// Type definitions for the WASM classes
type Layout = {
  readonly width: number
  readonly height: number
  readonly x: number
  readonly y: number
  readonly childCount: number
  child(at: number): Layout
  free(): void
}

type Node = {
  setMeasure(measure: any): void
  addChild(child: Node): void
  removeChild(child: Node): void
  replaceChildAtIndex(index: number, child: Node): void
  removeChildAtIndex(index: number): void
  markDirty(): void
  isDirty(): boolean
  childCount(): number
  computeLayout(size: any): Layout
  setFlexBasis(value: number, unit: number): void
  free(): void
}

type TaffyTree = {
  free(): void
}

// Create a wrapper class to provide a similar API to Yoga
export class TaffyNode {
  private node: Node | null = null
  private tree: TaffyTree | null = null
  private NodeConstructor: any = null
  private children: TaffyNode[] = []
  private style: any = {}
  private lastLayout: Layout | null = null

  static async create(): Promise<TaffyNode> {
    const node = new TaffyNode()
    await node.init()
    return node
  }

  constructor() {
    // Initialize as null, will be set in init()
  }

  async init() {
    if (!this.node || !this.tree) {
      const { Node, TaffyTree } = await instantiate()
      this.NodeConstructor = Node
      this.tree = new TaffyTree()
      this.node = new Node(this.tree, this.style)
    }
    return this
  }

  // Layout methods
  async ensureInitialized() {
    if (!this.node || !this.tree) {
      await this.init()
    }
  }

  async setWidth(width: number) {
    await this.ensureInitialized()
    this.style.width = width
    this.updateNode()
  }

  async setHeight(height: number) {
    await this.ensureInitialized()
    this.style.height = height
    this.updateNode()
  }

  async setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse') {
    await this.ensureInitialized()
    this.style.flexDirection = direction
    this.updateNode()
  }

  async setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    await this.ensureInitialized()
    this.style.alignItems = align
    this.updateNode()
  }

  async setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around') {
    await this.ensureInitialized()
    this.style.justifyContent = justify
    this.updateNode()
  }

  async setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse') {
    await this.ensureInitialized()
    this.style.flexWrap = wrap
    this.updateNode()
  }

  async setFlexGrow(grow: number) {
    await this.ensureInitialized()
    this.style.flexGrow = grow
    this.updateNode()
  }

  async setFlexShrink(shrink: number) {
    await this.ensureInitialized()
    this.style.flexShrink = shrink
    this.updateNode()
  }

  // Additional layout methods
  async setDisplay(display: 'flex' | 'none') {
    await this.ensureInitialized()
    this.style.display = display
    this.updateNode()
  }

  async setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around') {
    await this.ensureInitialized()
    this.style.alignContent = align
    this.updateNode()
  }

  async setAlignSelf(align: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    await this.ensureInitialized()
    this.style.alignSelf = align
    this.updateNode()
  }

  async setGap(gap: number) {
    await this.ensureInitialized()
    this.style.gap = gap
    this.updateNode()
  }

  async setRowGap(gap: number) {
    await this.ensureInitialized()
    this.style.rowGap = gap
    this.updateNode()
  }

  async setColumnGap(gap: number) {
    await this.ensureInitialized()
    this.style.columnGap = gap
    this.updateNode()
  }

  async setFlexBasis(basis: string | number) {
    await this.ensureInitialized()
    
    if (typeof basis === 'number') {
      // Treat numbers as pixels - access the raw Node directly
      const rawNode = await this.getNode()
      rawNode.setFlexBasis(basis, 0) // 0 = StyleUnit.Px
      return
    }

    // Handle string values
    const basisStr = basis.trim().toLowerCase()
    const rawNode = await this.getNode()
    
    // Handle special keywords
    if (basisStr === 'auto') {
      rawNode.setFlexBasis(0, 2) // 2 = StyleUnit.Auto
      return
    }
    
    if (basisStr === 'max-content') {
      rawNode.setFlexBasis(0, 4) // 4 = StyleUnit.MaxContent
      return
    }
    
    if (basisStr === 'min-content') {
      rawNode.setFlexBasis(0, 3) // 3 = StyleUnit.MinContent
      return
    }
    
    if (basisStr === 'fit-content' || basisStr === 'content') {
      rawNode.setFlexBasis(0, 5) // 5 = StyleUnit.FitContentPx (approximate)
      return
    }

    // Handle percentage values
    if (basisStr.endsWith('%')) {
      const percentValue = parseFloat(basisStr.slice(0, -1))
      if (!isNaN(percentValue)) {
        rawNode.setFlexBasis(percentValue, 1) // 1 = StyleUnit.Percent
        return
      }
    }

    // Handle length values with units
    const lengthMatch = basisStr.match(/^([+-]?(?:\d+\.?\d*|\.\d+))([a-z%]+)$/)
    if (lengthMatch) {
      const value = parseFloat(lengthMatch[1])
      const unit = lengthMatch[2]
      
      if (!isNaN(value)) {
        switch (unit) {
          case 'px':
            rawNode.setFlexBasis(value, 0) // 0 = StyleUnit.Px
            break
          case 'em':
          case 'rem':
            // Convert em/rem to pixels (approximate)
            // This is a simplification - real conversion would need font size context
            rawNode.setFlexBasis(value * 16, 0) // Assume 16px base, 0 = StyleUnit.Px
            break
          case '%':
            rawNode.setFlexBasis(value, 1) // 1 = StyleUnit.Percent
            break
          default:
            // Unknown units - treat as pixels
            rawNode.setFlexBasis(value, 0) // 0 = StyleUnit.Px
            break
        }
        return
      }
    }

    // Fallback: try to parse as number (assume pixels)
    const numericValue = parseFloat(basisStr)
    if (!isNaN(numericValue)) {
      rawNode.setFlexBasis(numericValue, 0) // 0 = StyleUnit.Px
    } else {
      // Invalid value, use auto as fallback
      rawNode.setFlexBasis(0, 2) // 2 = StyleUnit.Auto
    }
  }

  async setMaxHeight(height: number) {
    await this.ensureInitialized()
    this.style.maxHeight = height
    this.updateNode()
  }

  async setMaxWidth(width: number) {
    await this.ensureInitialized()
    this.style.maxWidth = width
    this.updateNode()
  }

  async setMinHeight(height: number) {
    await this.ensureInitialized()
    this.style.minHeight = height
    this.updateNode()
  }

  async setMinWidth(width: number) {
    await this.ensureInitialized()
    this.style.minWidth = width
    this.updateNode()
  }

  async setOverflow(overflow: 'visible' | 'hidden') {
    await this.ensureInitialized()
    this.style.overflow = overflow
    this.updateNode()
  }

  async setMargin(top: number, right: number, bottom: number, left: number) {
    await this.ensureInitialized()
    this.style.marginTop = top
    this.style.marginRight = right
    this.style.marginBottom = bottom
    this.style.marginLeft = left
    this.updateNode()
  }

  async setBorder(top: number, right: number, bottom: number, left: number) {
    await this.ensureInitialized()
    this.style.borderTop = top
    this.style.borderRight = right
    this.style.borderBottom = bottom
    this.style.borderLeft = left
    this.updateNode()
  }

  async setPadding(top: number, right: number, bottom: number, left: number) {
    await this.ensureInitialized()
    this.style.paddingTop = top
    this.style.paddingRight = right
    this.style.paddingBottom = bottom
    this.style.paddingLeft = left
    this.updateNode()
  }

  async setPositionType(type: 'relative' | 'absolute') {
    await this.ensureInitialized()
    this.style.position = type
    this.updateNode()
  }

  async setTop(value: number) {
    await this.ensureInitialized()
    this.style.top = value
    this.updateNode()
  }

  async setRight(value: number) {
    await this.ensureInitialized()
    this.style.right = value
    this.updateNode()
  }

  async setBottom(value: number) {
    await this.ensureInitialized()
    this.style.bottom = value
    this.updateNode()
  }

  async setLeft(value: number) {
    await this.ensureInitialized()
    this.style.left = value
    this.updateNode()
  }

  async setHeightAuto() {
    await this.ensureInitialized()
    this.style.height = 'auto'
    this.updateNode()
  }

  async setWidthAuto() {
    await this.ensureInitialized()
    this.style.width = 'auto'
    this.updateNode()
  }

  async setStyle(style: SerializedStyle) {
    await this.ensureInitialized()
    this.style = { ...this.style, ...toTaffyStyle(style) }
    this.updateNode()
  }

  async getStyle(): Promise<Record<string, string | number>> {
    await this.ensureInitialized()
    return fromTaffyStyle(this.style)
  }

  async insertChild(child: TaffyNode, index: number) {
    await this.ensureInitialized()
    await child.ensureInitialized()
    
    this.children.splice(index, 0, child)
    const childNode = await child.getNode()
    this.node.addChild(childNode)
  }

  async getChild(index: number): Promise<TaffyNode> {
    await this.ensureInitialized()
    return this.children[index]
  }

  async getChildCount(): Promise<number> {
    await this.ensureInitialized()
    return this.children.length
  }

  async calculateLayout(availableSpace: number = 100) {
    await this.ensureInitialized()
    this.lastLayout = this.node.computeLayout({ width: availableSpace, height: availableSpace })
  }

  async getComputedLayout(): Promise<{ left: number; top: number; width: number; height: number }> {
    await this.ensureInitialized()
    if (!this.lastLayout) {
      await this.calculateLayout()
    }
    return {
      left: this.lastLayout.x,
      top: this.lastLayout.y,
      width: this.lastLayout.width,
      height: this.lastLayout.height
    }
  }

  async getComputedWidth(): Promise<number> {
    await this.ensureInitialized()
    if (!this.lastLayout) {
      await this.calculateLayout()
    }
    return this.lastLayout.width
  }

  async getComputedHeight(): Promise<number> {
    await this.ensureInitialized()
    if (!this.lastLayout) {
      await this.calculateLayout()
    }
    return this.lastLayout.height
  }

  async getComputedLeft(): Promise<number> {
    await this.ensureInitialized()
    if (!this.lastLayout) {
      await this.calculateLayout()
    }
    return this.lastLayout.x
  }

  async getComputedTop(): Promise<number> {
    await this.ensureInitialized()
    if (!this.lastLayout) {
      await this.calculateLayout()
    }
    return this.lastLayout.y
  }

  async getNode(): Promise<Node> {
    await this.ensureInitialized()
    return this.node
  }

  private updateNode() {
    if (this.node && this.tree && this.NodeConstructor) {
      // Free the old node
      this.node.free()
      
      // Create a new node with the current style
      this.node = new this.NodeConstructor(this.tree, this.style)
      
      // Reset cached layout since we have a new node
      this.lastLayout = null
    }
  }

  async setMeasureFunc(measureFunc: (width: number) => { width: number; height: number }) {
    await this.ensureInitialized()
    if (measureFunc) {
      this.node.setMeasure((size: { width: number; height: number }) => {
        const result = measureFunc(size.width)
        return { width: result.width, height: result.height }
      })
    }
  }

  async setAspectRatio(ratio: number) {
    await this.ensureInitialized()
    this.style.aspectRatio = ratio
    this.updateNode()
  }

  async free() {
    // Clean up resources if needed
    if (this.node) {
      this.node.free()
    }
  }
}

export async function getTaffyModule(): Promise<typeof TaffyNode> {
  return TaffyNode
} 