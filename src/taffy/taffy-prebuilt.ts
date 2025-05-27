import { instantiate } from './prebuilt/index.js'
import { toTaffyStyle, fromTaffyStyle } from './style-adapter.js'
import type { SerializedStyle } from '../handler/expand.js'

// Import the actual WASM types
type WasmModule = Awaited<ReturnType<typeof instantiate>>
type Layout = InstanceType<WasmModule['Layout']>
type Node = InstanceType<WasmModule['Node']>
type TaffyTree = InstanceType<WasmModule['TaffyTree']>

// Global tree instance - shared across all nodes
let globalTree: TaffyTree | null = null
let NodeConstructor: WasmModule['Node'] | null = null
let isInitialized = false

// Initialize the global tree and constructors
async function initializeGlobalTree() {
  if (isInitialized) return
  
  const { Node, TaffyTree } = await instantiate()
  NodeConstructor = Node
  globalTree = new TaffyTree()
  isInitialized = true
}

// Create a wrapper class to provide a similar API to Yoga
export class TaffyNode {
  private node: Node | null = null
  private children: TaffyNode[] = []
  private lastLayout: Layout | null = null
  
  // Track style values since WASM API doesn't provide getters
  private trackedPadding = { top: 0, right: 0, bottom: 0, left: 0 }
  private trackedMargin = { top: 0, right: 0, bottom: 0, left: 0 }
  private trackedBorder = { top: 0, right: 0, bottom: 0, left: 0 }

  static async create(): Promise<TaffyNode> {
    await initializeGlobalTree()
    const node = new TaffyNode()
    await node.init()
    return node
  }

  constructor() {
    // Initialize as null, will be set in init()
  }

  async init() {
    if (!this.node) {
      await initializeGlobalTree()
      if (!globalTree || !NodeConstructor) {
        throw new Error('Failed to initialize Taffy WASM')
      }
      // Create node with the global tree and empty style object
      this.node = new NodeConstructor(globalTree, {})
    }
    return this
  }

  // Layout methods
  ensureInitialized() {
    if (!this.node) {
      throw new Error('TaffyNode not initialized');
    }
  }

  setWidth(width: number) {
    this.ensureInitialized()
    this.node.setWidth(width, 0) // 0 = StyleUnit.Px
  }

  setWidthPercent(percent: number) {
    this.ensureInitialized()
    this.node.setWidth(percent, 1) // 1 = StyleUnit.Percent
  }

  setHeight(height: number) {
    this.ensureInitialized()
    this.node.setHeight(height, 0) // 0 = StyleUnit.Px
  }

  setHeightPercent(percent: number) {
    this.ensureInitialized()
    this.node.setHeight(percent, 1) // 1 = StyleUnit.Percent
  }

  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse') {
    this.ensureInitialized()
    const directionMap = {
      'row': 0,
      'column': 1,
      'row-reverse': 2,
      'column-reverse': 3
    }
    this.node.setFlexDirection(directionMap[direction])
  }

  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    this.ensureInitialized()
    const alignMap = {
      'flex-start': 0,
      'flex-end': 1,
      'center': 2,
      'stretch': 3,
      'baseline': 4
    }
    this.node.setAlignItems(alignMap[align])
  }

  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around') {
    this.ensureInitialized()
    const justifyMap = {
      'flex-start': 0,
      'flex-end': 1,
      'center': 2,
      'space-between': 3,
      'space-around': 4
    }
    this.node.setJustifyContent(justifyMap[justify])
  }

  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse') {
    this.ensureInitialized()
    const wrapMap = {
      'nowrap': 0,
      'wrap': 1,
      'wrap-reverse': 2
    }
    this.node.setFlexWrap(wrapMap[wrap])
  }

  setFlexGrow(grow: number) {
    this.ensureInitialized()
    this.node.setFlexGrow(grow)
  }

  setFlexShrink(shrink: number) {
    this.ensureInitialized()
    this.node.setFlexShrink(shrink)
  }

  setDisplay(display: 'flex' | 'none') {
    this.ensureInitialized()
    const displayMap = {
      'flex': 0,
      'none': 1
    }
    this.node.setDisplay(displayMap[display])
  }

  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around') {
    this.ensureInitialized()
    const alignMap = {
      'flex-start': 0,
      'flex-end': 1,
      'center': 2,
      'stretch': 3,
      'baseline': 4,
      'space-between': 5,
      'space-around': 6
    }
    this.node.setAlignContent(alignMap[align])
  }

  setAlignSelf(align: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    this.ensureInitialized()
    const alignMap = {
      'auto': 0,
      'flex-start': 1,
      'flex-end': 2,
      'center': 3,
      'stretch': 4,
      'baseline': 5
    }
    this.node.setAlignSelf(alignMap[align])
  }

  setGap(gap: number) {
    this.ensureInitialized()
    this.node.setGap(gap, 0) // 0 = StyleUnit.Px
  }

  setRowGap(gap: number) {
    this.ensureInitialized()
    this.node.setRowGap(gap, 0) // 0 = StyleUnit.Px
  }

  setColumnGap(gap: number) {
    this.ensureInitialized()
    this.node.setColumnGap(gap, 0) // 0 = StyleUnit.Px
  }

  setFlexBasis(basis: string | number) {
    this.ensureInitialized()
    
    if (typeof basis === 'number') {
      this.node.setFlexBasis(basis, 0) // 0 = StyleUnit.Px
      return
    }

    // Handle string values
    const basisStr = basis.trim().toLowerCase()
    
    // Handle special keywords
    if (basisStr === 'auto') {
      this.node.setFlexBasis(0, 2) // 2 = StyleUnit.Auto
      return
    }
    
    // Handle percentage values
    if (basisStr.endsWith('%')) {
      const percentValue = parseFloat(basisStr.slice(0, -1))
      if (!isNaN(percentValue)) {
        this.node.setFlexBasis(percentValue, 1) // 1 = StyleUnit.Percent
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
            this.node.setFlexBasis(value, 0) // 0 = StyleUnit.Px
            break
          case '%':
            this.node.setFlexBasis(value, 1) // 1 = StyleUnit.Percent
            break
          default:
            // Unknown units - treat as pixels
            this.node.setFlexBasis(value, 0) // 0 = StyleUnit.Px
            break
        }
        return
      }
    }

    // Fallback: try to parse as number (assume pixels)
    const numericValue = parseFloat(basisStr)
    if (!isNaN(numericValue)) {
      this.node.setFlexBasis(numericValue, 0) // 0 = StyleUnit.Px
    } else {
      // Invalid value, use auto as fallback
      this.node.setFlexBasis(0, 2) // 2 = StyleUnit.Auto
    }
  }

  setMaxHeight(height: number) {
    this.ensureInitialized()
    this.node.setMaxHeight(height, 0) // 0 = StyleUnit.Px
  }

  setMaxWidth(width: number) {
    this.ensureInitialized()
    this.node.setMaxWidth(width, 0) // 0 = StyleUnit.Px
  }

  setMaxHeightPercent(percent: number) {
    this.ensureInitialized()
    this.node.setMaxHeight(percent, 1) // 1 = StyleUnit.Percent
  }

  setMaxWidthPercent(percent: number) {
    this.ensureInitialized()
    this.node.setMaxWidth(percent, 1) // 1 = StyleUnit.Percent
  }

  setMinHeight(height: number) {
    this.ensureInitialized()
    this.node.setMinHeight(height, 0) // 0 = StyleUnit.Px
  }

  setMinWidth(width: number) {
    this.ensureInitialized()
    this.node.setMinWidth(width, 0) // 0 = StyleUnit.Px
  }

  setMinHeightPercent(percent: number) {
    this.ensureInitialized()
    this.node.setMinHeight(percent, 1) // 1 = StyleUnit.Percent
  }

  setMinWidthPercent(percent: number) {
    this.ensureInitialized()
    this.node.setMinWidth(percent, 1) // 1 = StyleUnit.Percent
  }

  setOverflow(overflow: 'visible' | 'hidden') {
    this.ensureInitialized()
    const overflowMap = {
      'visible': 0,
      'hidden': 1
    }
    this.node.setOverflow(overflowMap[overflow])
  }

  setMargin(top: number, right: number, bottom: number, left: number) {
    this.ensureInitialized()
    this.node.setMarginTop(top, 0) // 0 = StyleUnit.Px
    this.node.setMarginRight(right, 0)
    this.node.setMarginBottom(bottom, 0)
    this.node.setMarginLeft(left, 0)
    
    // Track the values
    this.trackedMargin = { top, right, bottom, left }
  }

  setBorder(top: number, right: number, bottom: number, left: number) {
    this.ensureInitialized()
    this.node.setBorderWidthTop(top, 0) // 0 = StyleUnit.Px
    this.node.setBorderWidthRight(right, 0)
    this.node.setBorderWidthBottom(bottom, 0)
    this.node.setBorderWidthLeft(left, 0)
    
    // Track the values
    this.trackedBorder = { top, right, bottom, left }
  }

  setPadding(top: number, right: number, bottom: number, left: number) {
    this.ensureInitialized()
    this.node.setPaddingTop(top, 0) // 0 = StyleUnit.Px
    this.node.setPaddingRight(right, 0)
    this.node.setPaddingBottom(bottom, 0)
    this.node.setPaddingLeft(left, 0)
    
    // Track the values
    this.trackedPadding = { top, right, bottom, left }
  }

  setPositionType(type: 'relative' | 'absolute') {
    this.ensureInitialized()
    const positionMap = {
      'relative': 0,
      'absolute': 1
    }
    this.node.setPosition(positionMap[type])
  }

  setTop(value: number) {
    this.ensureInitialized()
    this.node.setInsetTop(value, 0) // 0 = StyleUnit.Px
  }

  setBottom(value: number) {
    this.ensureInitialized()
    this.node.setInsetBottom(value, 0) // 0 = StyleUnit.Px
  }

  setLeft(value: number) {
    this.ensureInitialized()
    this.node.setInsetLeft(value, 0) // 0 = StyleUnit.Px
  }

  setRight(value: number) {
    this.ensureInitialized()
    this.node.setInsetRight(value, 0) // 0 = StyleUnit.Px
  }

  setHeightAuto() {
    this.ensureInitialized()
    this.node.setHeight(0, 2) // 2 = StyleUnit.Auto
  }

  setWidthAuto() {
    this.ensureInitialized()
    this.node.setWidth(0, 2) // 2 = StyleUnit.Auto
  }

  setStyle(style: SerializedStyle) {
    this.ensureInitialized()
    // Convert style to individual setter calls
    const taffyStyle = toTaffyStyle(style)
    
    // Apply each style property using the appropriate setter
    // This would need to be implemented based on the style adapter
    // For now, we'll just store it and apply basic properties
    if (taffyStyle.width !== undefined) {
      this.setWidth(taffyStyle.width as number)
    }
    if (taffyStyle.height !== undefined) {
      this.setHeight(taffyStyle.height as number)
    }
    // Add more style mappings as needed
  }

  getStyle(): Record<string, string | number> {
    this.ensureInitialized()
    // This would need to read back from the node, but the WASM API doesn't provide getters
    // For now, return empty object
    return {}
  }

  addChild(child: TaffyNode) {
    this.ensureInitialized()
    child.ensureInitialized()
    
    this.node.addChild(child.getNode())
    this.children.push(child)
  }

  getChildCount(): number {
    this.ensureInitialized()
    return this.children.length
  }

  calculateLayout(availableWidth: number = 100, availableHeight?: number) {
    this.ensureInitialized()
    const height = availableHeight ?? availableWidth
    this.lastLayout = this.node.computeLayout({ width: availableWidth, height: height })
  }

  getComputedLayout(): { left: number; top: number; width: number; height: number } {
    this.ensureInitialized()
    if (!this.lastLayout) {
      this.calculateLayout()
    }
    return {
      left: this.lastLayout.x,
      top: this.lastLayout.y,
      width: this.lastLayout.width,
      height: this.lastLayout.height
    }
  }

  getComputedWidth(): number {
    this.ensureInitialized()
    if (!this.lastLayout) {
      this.calculateLayout()
    }
    return this.lastLayout.width
  }

  getComputedHeight(): number {
    this.ensureInitialized()
    if (!this.lastLayout) {
      this.calculateLayout()
    }
    return this.lastLayout.height
  }

  getComputedLeft(): number {
    this.ensureInitialized()
    if (!this.lastLayout) {
      this.calculateLayout()
    }
    return this.lastLayout.x
  }

  getComputedTop(): number {
    this.ensureInitialized()
    if (!this.lastLayout) {
      this.calculateLayout()
    }
    return this.lastLayout.y
  }

  getNode(): Node {
    this.ensureInitialized()
    return this.node
  }

  setMeasureFunc(measureFunc: (width: number) => { width: number; height: number }) {
    this.ensureInitialized()
    if (measureFunc) {
      this.node.setMeasure((size: { width: number; height: number }) => {
        const result = measureFunc(size.width)
        return { width: result.width, height: result.height }
      })
    }
  }

  setAspectRatio(ratio: number) {
    this.ensureInitialized()
    this.node.setAspectRatio(ratio)
  }

  free() {
    // Clean up resources
    if (this.lastLayout) {
      this.lastLayout.free()
      this.lastLayout = null
    }
    if (this.node) {
      this.node.free()
      this.node = null
    }
    this.children = []
  }

  // Static method to clean up the global tree when done
  static freeGlobalTree() {
    if (globalTree) {
      globalTree.free()
      globalTree = null
      NodeConstructor = null
      isInitialized = false
    }
  }

  getComputedPadding(edge: number): number {
    this.ensureInitialized()
    // Edge constants: 0=left, 1=top, 2=right, 3=bottom
    switch (edge) {
      case 0: return this.trackedPadding.left   // EDGE_LEFT
      case 1: return this.trackedPadding.top    // EDGE_TOP
      case 2: return this.trackedPadding.right  // EDGE_RIGHT
      case 3: return this.trackedPadding.bottom // EDGE_BOTTOM
      default: return 0
    }
  }

  getComputedBorder(edge: number): number {
    this.ensureInitialized()
    // Edge constants: 0=left, 1=top, 2=right, 3=bottom
    switch (edge) {
      case 0: return this.trackedBorder.left   // EDGE_LEFT
      case 1: return this.trackedBorder.top    // EDGE_TOP
      case 2: return this.trackedBorder.right  // EDGE_RIGHT
      case 3: return this.trackedBorder.bottom // EDGE_BOTTOM
      default: return 0
    }
  }

  getComputedMargin(edge: number): number {
    this.ensureInitialized()
    // Edge constants: 0=left, 1=top, 2=right, 3=bottom
    switch (edge) {
      case 0: return this.trackedMargin.left   // EDGE_LEFT
      case 1: return this.trackedMargin.top    // EDGE_TOP
      case 2: return this.trackedMargin.right  // EDGE_RIGHT
      case 3: return this.trackedMargin.bottom // EDGE_BOTTOM
      default: return 0
    }
  }

  // Individual edge setters using the actual WASM API
  setMarginTop(value: number) {
    this.ensureInitialized()
    this.node.setMarginTop(value, 0) // 0 = StyleUnit.Px
    this.trackedMargin.top = value
  }

  setMarginRight(value: number) {
    this.ensureInitialized()
    this.node.setMarginRight(value, 0) // 0 = StyleUnit.Px
    this.trackedMargin.right = value
  }

  setMarginBottom(value: number) {
    this.ensureInitialized()
    this.node.setMarginBottom(value, 0) // 0 = StyleUnit.Px
    this.trackedMargin.bottom = value
  }

  setMarginLeft(value: number) {
    this.ensureInitialized()
    this.node.setMarginLeft(value, 0) // 0 = StyleUnit.Px
    this.trackedMargin.left = value
  }

  setPaddingTop(value: number) {
    this.ensureInitialized()
    this.node.setPaddingTop(value, 0) // 0 = StyleUnit.Px
    this.trackedPadding.top = value
  }

  setPaddingRight(value: number) {
    this.ensureInitialized()
    this.node.setPaddingRight(value, 0) // 0 = StyleUnit.Px
    this.trackedPadding.right = value
  }

  setPaddingBottom(value: number) {
    this.ensureInitialized()
    this.node.setPaddingBottom(value, 0) // 0 = StyleUnit.Px
    this.trackedPadding.bottom = value
  }

  setPaddingLeft(value: number) {
    this.ensureInitialized()
    this.node.setPaddingLeft(value, 0) // 0 = StyleUnit.Px
    this.trackedPadding.left = value
  }

  setBorderTop(value: number) {
    this.ensureInitialized()
    this.node.setBorderWidthTop(value, 0) // 0 = StyleUnit.Px
    this.trackedBorder.top = value
  }

  setBorderRight(value: number) {
    this.ensureInitialized()
    this.node.setBorderWidthRight(value, 0) // 0 = StyleUnit.Px
    this.trackedBorder.right = value
  }

  setBorderBottom(value: number) {
    this.ensureInitialized()
    this.node.setBorderWidthBottom(value, 0) // 0 = StyleUnit.Px
    this.trackedBorder.bottom = value
  }

  setBorderLeft(value: number) {
    this.ensureInitialized()
    this.node.setBorderWidthLeft(value, 0) // 0 = StyleUnit.Px
    this.trackedBorder.left = value
  }
}

export async function getTaffyModule(): Promise<typeof TaffyNode> {
  return TaffyNode
} 