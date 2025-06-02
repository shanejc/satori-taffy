import type { Style } from 'taffy-wasm/Style.js'
import { CompactLength } from 'taffy-wasm/CompactLength.js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Size } from 'taffy-wasm/Size.js'
import { AvailableSpace } from 'taffy-wasm/AvailableSpace.js'

// Import the actual WASM types and initialization
import { TaffyTree } from 'taffy-wasm'
import wasmInit from 'taffy-wasm'

// Global promise to ensure WASM is only initialized once
let wasmInitPromise: Promise<void> | null = null

async function ensureWasmInitialized(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = initializeWasm()
  }
  return wasmInitPromise
}

async function initializeWasm(): Promise<void> {
  try {
    // Try default initialization first (works in browser/vite)
    await wasmInit()
  } catch (error) {
    // Fallback for Node.js test environment
    try {
      // Get the path to the WASM file
      const wasmPath = resolve(process.cwd(), '../taffy/taffy-wasm/pkg/taffy_wasm_bg.wasm')
      const wasmBytes = readFileSync(wasmPath)
      await wasmInit({ module_or_path: wasmBytes })
    } catch (fallbackError) {
      console.error('Failed to initialize Taffy WASM:', error, fallbackError)
      throw new Error('Could not initialize Taffy WASM module')
    }
  }
}

// Define local types since they're not exported by taffy-wasm
interface Layout {
  x: number
  y: number
  width: number
  height: number
  free?(): void
}

// Add BigInt JSON serialization support for debugging
;(BigInt.prototype as any).toJSON = function() {
  return {
    $bigint: this.toString(),
    $hex: '0x' + this.toString(16),
    $binary: '0b' + this.toString(2)
  }
}

// JSON replacer function for BigInt values
function bigintReplacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return {
      $bigint: value.toString(),
      $hex: '0x' + value.toString(16),
      $binary: '0b' + value.toString(2)
    }
  }
  return value
}

// Root class that owns the TaffyTree
export class TaffyRoot {
  private tree: TaffyTree
  private rootNode: TaffyNode
  private pendingStyleUpdates: Set<number> = new Set()
  private measureFunctions: Map<number, (width: number, height?: number) => { width: number; height: number }> = new Map()
  private hasLayoutBeenCalculated = false

  constructor(tree: TaffyTree) {
    this.tree = tree
    // Create root node with basic container style
    const rootStyle = {
      display: 'Flex',
      size: { width: CompactLength.auto(), height: CompactLength.auto() },
      flex_direction: 'Column'
    }
    this.rootNode = this.createNode(rootStyle)
  }

  createNode(style: any = {}): TaffyNode {
    const nodeId = this.tree.new_leaf({})
    
    return new TaffyNode(this, nodeId, style)
  }

  getRootNode(): TaffyNode {
    return this.rootNode
  }

  // Internal methods for TaffyNode to use
  addChild(parentNodeId: number, childNodeId: number) {
    this.tree.add_child(parentNodeId, childNodeId)
  }

  markForStyleUpdate(nodeId: number) {
    this.pendingStyleUpdates.add(nodeId)
  }

  updateNodeStyle(nodeId: number, style: Style) {
    try {
      this.tree.update_style(nodeId, style)
    } catch (error) {
      console.error('Failed to update style:', error)
    }
    
    this.pendingStyleUpdates.delete(nodeId)
  }

  computeLayout(width?: number, height?: number) {
    if (this.measureFunctions.size > 0) {
      this.tree.compute_layout_with_measure(this.rootNode.getNodeId(), width, height, (nodeId: any, availableSpace: Size<AvailableSpace>) => {
        // Convert WASM objects to actual numbers
        let actualNodeId = nodeId
        
        if (typeof nodeId === 'object') {
          actualNodeId = Number(nodeId) || 0
        }
        
        // Extract width and height from Size<AvailableSpace> structure
        let actualAvailableWidth = 0
        let actualAvailableHeight = 0
        
        // Handle the width dimension
        if (availableSpace.width) {
          if (typeof availableSpace.width === 'object' && 'Definite' in availableSpace.width) {
            // Definite width: { "Definite": number }
            actualAvailableWidth = availableSpace.width.Definite
          } else if (availableSpace.width === 'MaxContent') {
            // MaxContent: wants maximum intrinsic width - use a very large number
            actualAvailableWidth = Number.MAX_SAFE_INTEGER
          } else if (availableSpace.width === 'MinContent') {
            // MinContent: wants minimum intrinsic width - use 0 to trigger min-content measurement
            actualAvailableWidth = 0
          }
        }
        
        // Handle the height dimension  
        if (availableSpace.height) {
          if (typeof availableSpace.height === 'object' && 'Definite' in availableSpace.height) {
            // Definite height: { "Definite": number }
            actualAvailableHeight = availableSpace.height.Definite
          } else if (availableSpace.height === 'MaxContent') {
            // MaxContent: wants maximum intrinsic height - use a very large number
            actualAvailableHeight = Number.MAX_SAFE_INTEGER
          } else if (availableSpace.height === 'MinContent') {
            // MinContent: wants minimum intrinsic height - use 0 to trigger min-content measurement
            actualAvailableHeight = 0
          }
        }
        
        // Special handling for MaxContent: Apply width constraint when we have
        // a definite width but undefined height (width-constrained dynamic sizing)
        if (actualAvailableWidth === 0 && width !== undefined && height === undefined) {
          actualAvailableWidth = width
        }
        
        // Console logging for debugging the new format
        const measureFunc = this.measureFunctions.get(actualNodeId)
        if (measureFunc) {
          // Pass both width and height constraints to the enhanced measure function
          const result = measureFunc(actualAvailableWidth, actualAvailableHeight)
          return result
        }
        return { width: 0, height: 0 }
      })
    } else {
      this.tree.compute_layout(this.rootNode.getNodeId(), width, height)
    }
  
    // Mark that layout has been calculated
    this.hasLayoutBeenCalculated = true
  }

  // Ensure layout is calculated for any access to computed values
  private ensureLayoutCalculated() {
    if (!this.hasLayoutBeenCalculated) {
      // Calculate layout with default size - satori will call this properly later
      this.computeLayout(100, 100)
    }
  }

  setMeasureFunction(nodeId: number, measureFunc: (width: number, height?: number) => { width: number; height: number }) {
    // taffy-wasm appears to always call measure functions for nodeId 0 (root)
    this.tree.set_node_context(nodeId, nodeId)
    
    // Add recursion guard specific to Taffy's measure function calls
    let measureDepth = 0
    const MAX_MEASURE_DEPTH = 10
    let lastGoodMeasurement: { width: number; height: number } | null = null
    
    const taffyEnhancedMeasureFunc = (width: number, height?: number) => {
      measureDepth++
      if (measureDepth > MAX_MEASURE_DEPTH) {
        measureDepth--
        // Return last known good measurement to break infinite loops specific to Taffy
        return lastGoodMeasurement || { width: Math.max(width, 1), height: 20 }
      }

      // Get the basic measurement from the shared text logic (now with optional height)
      const basicResult = measureFunc(width, height)
            
      lastGoodMeasurement = basicResult
      measureDepth--
      
      return basicResult
    }
    
    // Store the enhanced measure function for use during layout computation
    this.measureFunctions.set(nodeId, taffyEnhancedMeasureFunc)
  }

  removeMeasureFunction(nodeId: number) {
    this.measureFunctions.delete(nodeId)
  }

  getLayoutLeft(nodeId: number): number {
    this.ensureLayoutCalculated()
    return this.tree.layout_left(nodeId)
  }

  getLayoutTop(nodeId: number): number {
    this.ensureLayoutCalculated()
    return this.tree.layout_top(nodeId)
  }

  getLayoutWidth(nodeId: number): number {
    this.ensureLayoutCalculated()
    return this.tree.layout_width(nodeId)
  }

  getLayoutHeight(nodeId: number): number {
    this.ensureLayoutCalculated()
    return this.tree.layout_height(nodeId)
  }

  free() {
    this.tree.free()
  }

  static async createRoot(): Promise<TaffyRoot> {
    await ensureWasmInitialized()
    const tree = new TaffyTree()
    return new TaffyRoot(tree)
  }
}

// Create a wrapper class to provide a similar API to Yoga
export class TaffyNode {
  private root: TaffyRoot
  private nodeId: number
  private children: TaffyNode[] = []
  private pendingStyle: Style = {
    display: 'Flex',
    item_is_table: false,
    item_is_replaced: false,
    box_sizing: 'BorderBox',
    overflow: { x: 'Visible', y: 'Visible' },
    scrollbar_width: 0,
    position: 'Relative',
    inset: { 
      top: CompactLength.auto(), 
      right: CompactLength.auto(), 
      bottom: CompactLength.auto(), 
      left: CompactLength.auto() 
    },
    size: { width: CompactLength.auto(), height: CompactLength.auto() },
    min_size: { width: CompactLength.auto(), height: CompactLength.auto() },
    max_size: { width: CompactLength.auto(), height: CompactLength.auto() },
    aspect_ratio: null,
    margin: {
      top: CompactLength.length(0),
      right: CompactLength.length(0),
      bottom: CompactLength.length(0),
      left: CompactLength.length(0)
    },
    padding: {
      top: CompactLength.length(0),
      right: CompactLength.length(0),
      bottom: CompactLength.length(0),
      left: CompactLength.length(0)
    },
    border: {
      top: CompactLength.length(0),
      right: CompactLength.length(0),
      bottom: CompactLength.length(0),
      left: CompactLength.length(0)
    },
    align_items: null,
    align_self: null,
    justify_items: null,
    justify_self: null,
    align_content: null,
    justify_content: null,
    gap: { width: CompactLength.length(0), height: CompactLength.length(0) },
    text_align: 'Auto',
    flex_direction: 'Row',
    flex_wrap: 'NoWrap',
    flex_basis: CompactLength.auto(),
    flex_grow: 0,
    flex_shrink: 1,
    grid_auto_flow: 'Row'
  }
  private lastLayout: Layout | null = null
  
  // Track style values since WASM API doesn't provide getters
  private trackedPadding = { top: 0, right: 0, bottom: 0, left: 0 }
  private trackedMargin = { top: 0, right: 0, bottom: 0, left: 0 }
  private trackedBorder = { top: 0, right: 0, bottom: 0, left: 0 }
  private styleNeedsUpdate = false

  constructor(root: TaffyRoot, nodeId: number, initialStyle: any = {}) {
    this.root = root
    this.nodeId = nodeId
    // Don't overwrite the properly initialized pendingStyle
    // If we need to apply initialStyle, we should merge it properly
    // For now, keep the properly initialized pendingStyle as-is
  }

  static async createRoot(): Promise<TaffyNode> {
    const root = await TaffyRoot.createRoot()
    return root.getRootNode()
  }

  // Layout methods
  ensureInitialized() {
    if (this.nodeId === null) {
      throw new Error('TaffyNode not initialized')
    }
  }

  private markStyleUpdate() {
    this.styleNeedsUpdate = true
    this.root.markForStyleUpdate(this.nodeId)
  }

  setWidth(width: number) {
    this.ensureInitialized()
    
    // Store using CompactLength for proper serde format
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.width = CompactLength.length(width)
    this.markStyleUpdate()
  }

  setWidthPercent(percent: number) {
    this.ensureInitialized()
    // Store using CompactLength for percentages
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.width = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setHeight(height: number) {
    this.ensureInitialized()
    
    // Store using CompactLength for proper serde format
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.height = CompactLength.length(height)
    this.markStyleUpdate()
  }

  setHeightPercent(percent: number) {
    this.ensureInitialized()
    // Store using CompactLength for percentages
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.height = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setHeightAuto() {
    this.ensureInitialized()
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.height = CompactLength.auto()
    this.markStyleUpdate()
  }

  setWidthAuto() {
    this.ensureInitialized()
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.width = CompactLength.auto()
    this.markStyleUpdate()
  }

  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (direction) {
      case 'row': this.pendingStyle.flex_direction = 'Row'; break;
      case 'column': this.pendingStyle.flex_direction = 'Column'; break;
      case 'row-reverse': this.pendingStyle.flex_direction = 'RowReverse'; break;
      case 'column-reverse': this.pendingStyle.flex_direction = 'ColumnReverse'; break;
      default: this.pendingStyle.flex_direction = 'Row';
    }
    this.markStyleUpdate()
  }

  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (align) {
      case 'flex-start': this.pendingStyle.align_items = 'FlexStart'; break;
      case 'flex-end': this.pendingStyle.align_items = 'FlexEnd'; break;
      case 'center': this.pendingStyle.align_items = 'Center'; break;
      case 'stretch': this.pendingStyle.align_items = 'Stretch'; break;
      case 'baseline': this.pendingStyle.align_items = 'Baseline'; break;
      default: this.pendingStyle.align_items = 'Stretch';
    }
    this.markStyleUpdate()
  }

  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (justify) {
      case 'flex-start': this.pendingStyle.justify_content = 'FlexStart'; break;
      case 'flex-end': this.pendingStyle.justify_content = 'FlexEnd'; break;
      case 'center': this.pendingStyle.justify_content = 'Center'; break;
      case 'space-between': this.pendingStyle.justify_content = 'SpaceBetween'; break;
      case 'space-around': this.pendingStyle.justify_content = 'SpaceAround'; break;
      default: this.pendingStyle.justify_content = 'FlexStart';
    }
    this.markStyleUpdate()
  }

  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (wrap) {
      case 'nowrap': this.pendingStyle.flex_wrap = 'NoWrap'; break;
      case 'wrap': this.pendingStyle.flex_wrap = 'Wrap'; break;
      case 'wrap-reverse': this.pendingStyle.flex_wrap = 'WrapReverse'; break;
      default: this.pendingStyle.flex_wrap = 'NoWrap';
    }
    this.markStyleUpdate()
  }

  setFlexGrow(grow: number) {
    this.ensureInitialized()
    this.pendingStyle.flex_grow = grow
    this.markStyleUpdate()
  }

  setFlexShrink(shrink: number) {
    this.ensureInitialized()
    this.pendingStyle.flex_shrink = shrink
    this.markStyleUpdate()
  }

  setDisplay(display: 'flex' | 'none') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (display) {
      case 'flex': this.pendingStyle.display = 'Flex'; break;
      case 'none': this.pendingStyle.display = 'None'; break;
      default: this.pendingStyle.display = 'Flex';
    }
    this.markStyleUpdate()
  }

  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (align) {
      case 'flex-start': this.pendingStyle.align_content = 'FlexStart'; break;
      case 'flex-end': this.pendingStyle.align_content = 'FlexEnd'; break;
      case 'center': this.pendingStyle.align_content = 'Center'; break;
      case 'stretch': this.pendingStyle.align_content = 'Stretch'; break;
      case 'baseline': this.pendingStyle.align_content = 'Center'; break;
      case 'space-between': this.pendingStyle.align_content = 'SpaceBetween'; break;
      case 'space-around': this.pendingStyle.align_content = 'SpaceAround'; break;
      default: this.pendingStyle.align_content = 'Stretch';
    }
    this.markStyleUpdate()
  }

  setAlignSelf(align: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    if (align === 'auto') {
      this.pendingStyle.align_self = null
    } else {
      switch (align) {
        case 'flex-start': this.pendingStyle.align_self = 'FlexStart'; break;
        case 'flex-end': this.pendingStyle.align_self = 'FlexEnd'; break;
        case 'center': this.pendingStyle.align_self = 'Center'; break;
        case 'stretch': this.pendingStyle.align_self = 'Stretch'; break;
        case 'baseline': this.pendingStyle.align_self = 'Baseline'; break;
        default: this.pendingStyle.align_self = null;
      }
    }
    this.markStyleUpdate()
  }

  setGap(gap: number) {
    this.ensureInitialized()
    this.pendingStyle.gap.width = CompactLength.length(gap)
    this.pendingStyle.gap.height = CompactLength.length(gap)
    this.markStyleUpdate()
  }

  setRowGap(gap: number) {
    this.ensureInitialized()
    this.pendingStyle.gap.height = CompactLength.length(gap)
    this.markStyleUpdate()
  }

  setColumnGap(gap: number) {
    this.ensureInitialized()
    this.pendingStyle.gap.width = CompactLength.length(gap)
    this.markStyleUpdate()
  }

  setFlexBasis(basis: string | number) {
    this.ensureInitialized()
    
    if (typeof basis === 'number') {
      this.pendingStyle.flex_basis = CompactLength.length(basis)
      this.markStyleUpdate()
      return
    }

    // Handle string values
    const basisStr = basis.trim().toLowerCase()
    
    // Handle special keywords
    if (basisStr === 'auto') {
      this.pendingStyle.flex_basis = CompactLength.auto()
      this.markStyleUpdate()
      return
    }
    
    // Handle percentage values
    if (basisStr.endsWith('%')) {
      const percentValue = parseFloat(basisStr.slice(0, -1))
      if (!isNaN(percentValue)) {
        this.pendingStyle.flex_basis = CompactLength.percent(percentValue / 100.0)
        this.markStyleUpdate()
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
            this.pendingStyle.flex_basis = CompactLength.length(value)
            break
          case '%':
            this.pendingStyle.flex_basis = CompactLength.percent(value / 100.0)
            break
          default:
            // Unknown units - treat as pixels
            this.pendingStyle.flex_basis = CompactLength.length(value)
            break
        }
        this.markStyleUpdate()
        return
      }
    }

    // Fallback: try to parse as number (assume pixels)
    const numericValue = parseFloat(basisStr)
    if (!isNaN(numericValue)) {
      this.pendingStyle.flex_basis = CompactLength.length(numericValue)
    } else {
      // Invalid value, use auto as fallback
      this.pendingStyle.flex_basis = CompactLength.auto()
    }
    this.markStyleUpdate()
  }

  setMaxHeight(height: number) {
    this.ensureInitialized()
    this.pendingStyle.max_size.height = CompactLength.length(height)
    this.markStyleUpdate()
  }

  setMaxWidth(width: number) {
    this.ensureInitialized()
    this.pendingStyle.max_size.width = CompactLength.length(width)
    this.markStyleUpdate()
  }

  setMaxHeightPercent(percent: number) {
    this.ensureInitialized()
    this.pendingStyle.max_size.height = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setMaxWidthPercent(percent: number) {
    this.ensureInitialized()
    this.pendingStyle.max_size.width = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setMinHeight(height: number) {
    this.ensureInitialized()
    this.pendingStyle.min_size.height = CompactLength.length(height)
    this.markStyleUpdate()
  }

  setMinWidth(width: number) {
    this.ensureInitialized()
    this.pendingStyle.min_size.width = CompactLength.length(width)
    this.markStyleUpdate()
  }

  setMinHeightPercent(percent: number) {
    this.ensureInitialized()
    this.pendingStyle.min_size.height = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setMinWidthPercent(percent: number) {
    this.ensureInitialized()
    this.pendingStyle.min_size.width = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setOverflow(overflow: 'visible' | 'hidden') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    const overflowValue = overflow === 'hidden' ? 'Hidden' : 'Visible'
    this.pendingStyle.overflow = {
      x: overflowValue,
      y: overflowValue
    }
    this.markStyleUpdate()
  }

  setMargin(top: number, right: number, bottom: number, left: number) {
    this.ensureInitialized()
    this.pendingStyle.margin = {
      top: CompactLength.length(top),
      right: CompactLength.length(right),
      bottom: CompactLength.length(bottom),
      left: CompactLength.length(left)
    }
    
    // Track the values
    this.trackedMargin = { top, right, bottom, left }
    this.markStyleUpdate()
  }

  setBorder(top: number, right: number, bottom: number, left: number) {
    this.ensureInitialized()
    this.pendingStyle.border = {
      top: CompactLength.length(top),
      right: CompactLength.length(right),
      bottom: CompactLength.length(bottom),
      left: CompactLength.length(left)
    }
    
    // Track the values
    this.trackedBorder = { top, right, bottom, left }
    this.markStyleUpdate()
  }

  setPadding(top: number, right: number, bottom: number, left: number) {
    this.ensureInitialized()
    this.pendingStyle.padding = {
      top: CompactLength.length(top),
      right: CompactLength.length(right),
      bottom: CompactLength.length(bottom),
      left: CompactLength.length(left)
    }
    
    // Track the values
    this.trackedPadding = { top, right, bottom, left }
    this.markStyleUpdate()
  }

  setPositionType(type: 'relative' | 'absolute') {
    this.ensureInitialized()
    // Convert to correct capitalized enum values
    switch (type) {
      case 'relative': this.pendingStyle.position = 'Relative'; break;
      case 'absolute': this.pendingStyle.position = 'Absolute'; break;
      default: this.pendingStyle.position = 'Relative';
    }
    this.markStyleUpdate()
  }

  setTop(value: number) {
    this.ensureInitialized()
    this.pendingStyle.inset.top = CompactLength.length(value)
    this.markStyleUpdate()
  }

  setBottom(value: number) {
    this.ensureInitialized()
    this.pendingStyle.inset.bottom = CompactLength.length(value)
    this.markStyleUpdate()
  }

  setLeft(value: number) {
    this.ensureInitialized()
    this.pendingStyle.inset.left = CompactLength.length(value)
    this.markStyleUpdate()
  }

  setRight(value: number) {
    this.ensureInitialized()
    this.pendingStyle.inset.right = CompactLength.length(value)
    this.markStyleUpdate()
  }

  getStyle(): Record<string, any> {
    this.ensureInitialized()
    // Convert back from taffy format
    return {
      size: this.pendingStyle.size,
      flex_direction: this.pendingStyle.flex_direction,
      align_items: this.pendingStyle.align_items,
      justify_content: this.pendingStyle.justify_content,
      flex_wrap: this.pendingStyle.flex_wrap,
      flex_grow: this.pendingStyle.flex_grow,
      flex_shrink: this.pendingStyle.flex_shrink,
      display: this.pendingStyle.display,
      align_content: this.pendingStyle.align_content,
      align_self: this.pendingStyle.align_self,
      gap: this.pendingStyle.gap,
      max_size: this.pendingStyle.max_size,
      min_size: this.pendingStyle.min_size,
      overflow: this.pendingStyle.overflow,
      margin: this.pendingStyle.margin,
      border: this.pendingStyle.border,
      padding: this.pendingStyle.padding,
      position: this.pendingStyle.position,
      inset: this.pendingStyle.inset,
      flex_basis: this.pendingStyle.flex_basis,
      aspect_ratio: this.pendingStyle.aspect_ratio
    }
  }

  addChild(child: TaffyNode) {
    this.ensureInitialized()
    child.ensureInitialized()
    
    this.root.addChild(this.nodeId, child.nodeId)
    this.children.push(child)
  }

  getChildCount(): number {
    this.ensureInitialized()
    return this.children.length
  }

  calculateLayout(availableWidth: number, availableHeight?: number) {
    this.ensureInitialized()
    
    // Apply pending style updates for this node and all children
    this.applyPendingStyleUpdates()
    this.applyChildrenStyleUpdates()
    
    this.root.computeLayout(availableWidth, availableHeight)
    
    // Update last layout
    this.lastLayout = {
      x: this.root.getLayoutLeft(this.nodeId),
      y: this.root.getLayoutTop(this.nodeId),
      width: this.root.getLayoutWidth(this.nodeId),
      height: this.root.getLayoutHeight(this.nodeId)
    }
  }

  private applyChildrenStyleUpdates() {
    for (const child of this.children) {
      child.applyPendingStyleUpdates()
      child.applyChildrenStyleUpdates()
    }
  }

  getComputedLayout(): { left: number; top: number; width: number; height: number } {
    this.ensureInitialized()
    return {
      left: this.getComputedLeft(),
      top: this.getComputedTop(),
      width: this.getComputedWidth(),
      height: this.getComputedHeight()
    }
  }

  getComputedWidth(): number {
    this.ensureInitialized()
    // Get computed width from layout
    return this.root.getLayoutWidth(this.nodeId)
  }

  getComputedHeight(): number {
    this.ensureInitialized()
    // Get computed height from layout
    return this.root.getLayoutHeight(this.nodeId)
  }

  getComputedLeft(): number {
    this.ensureInitialized()
    return this.root.getLayoutLeft(this.nodeId)
  }

  getComputedTop(): number {
    this.ensureInitialized()
    return this.root.getLayoutTop(this.nodeId)
  }

  getNodeId(): number {
    this.ensureInitialized()
    return this.nodeId
  }

  setMeasureFunc(measureFunc: (width: number, height?: number) => { width: number; height: number }) {
    this.ensureInitialized()
    // Store the measure function in the root
    this.root.setMeasureFunction(this.nodeId, measureFunc)
  }

  setAspectRatio(ratio: number) {
    this.ensureInitialized()
    this.pendingStyle.aspect_ratio = ratio
    this.markStyleUpdate()
  }

  free() {
    // Clean up resources
    if (this.lastLayout) {
      this.lastLayout = null
    }
    // Remove measure function if it exists
    this.root.removeMeasureFunction(this.nodeId)
    this.children = []
  }

  // Static method to clean up the root when done
  static freeRoot(root: TaffyRoot) {
    root.free()
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

  // Individual edge setters using the pending style approach
  setMarginTop(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.margin) {
      this.pendingStyle.margin = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.margin.top = CompactLength.length(value)
    this.trackedMargin.top = value
    this.markStyleUpdate()
  }

  setMarginRight(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.margin) {
      this.pendingStyle.margin = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.margin.right = CompactLength.length(value)
    this.trackedMargin.right = value
    this.markStyleUpdate()
  }

  setMarginBottom(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.margin) {
      this.pendingStyle.margin = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.margin.bottom = CompactLength.length(value)
    this.trackedMargin.bottom = value
    this.markStyleUpdate()
  }

  setMarginLeft(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.margin) {
      this.pendingStyle.margin = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.margin.left = CompactLength.length(value)
    this.trackedMargin.left = value
    this.markStyleUpdate()
  }

  setPaddingTop(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.padding) {
      this.pendingStyle.padding = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.padding.top = CompactLength.length(value)
    this.trackedPadding.top = value
    this.markStyleUpdate()
  }

  setPaddingRight(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.padding) {
      this.pendingStyle.padding = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.padding.right = CompactLength.length(value)
    this.trackedPadding.right = value
    this.markStyleUpdate()
  }

  setPaddingBottom(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.padding) {
      this.pendingStyle.padding = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.padding.bottom = CompactLength.length(value)
    this.trackedPadding.bottom = value
    this.markStyleUpdate()
  }

  setPaddingLeft(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.padding) {
      this.pendingStyle.padding = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.padding.left = CompactLength.length(value)
    this.trackedPadding.left = value
    this.markStyleUpdate()
  }

  setBorderTop(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.border) {
      this.pendingStyle.border = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.border.top = CompactLength.length(value)
    this.trackedBorder.top = value
    this.markStyleUpdate()
  }

  setBorderRight(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.border) {
      this.pendingStyle.border = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.border.right = CompactLength.length(value)
    this.trackedBorder.right = value
    this.markStyleUpdate()
  }

  setBorderBottom(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.border) {
      this.pendingStyle.border = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.border.bottom = CompactLength.length(value)
    this.trackedBorder.bottom = value
    this.markStyleUpdate()
  }

  setBorderLeft(value: number) {
    this.ensureInitialized()
    if (!this.pendingStyle.border) {
      this.pendingStyle.border = {
        top: CompactLength.length(0),
        right: CompactLength.length(0),
        bottom: CompactLength.length(0),
        left: CompactLength.length(0)
      }
    }
    this.pendingStyle.border.left = CompactLength.length(value)
    this.trackedBorder.left = value
    this.markStyleUpdate()
  }

  private applyPendingStyleUpdates() {
    if (this.styleNeedsUpdate) {
      // Use the root's method to apply the style update
      this.root.updateNodeStyle(this.nodeId, this.pendingStyle)
      this.styleNeedsUpdate = false
    }
  }
}

export async function getTaffyModule(): Promise<typeof TaffyNode> {
  return TaffyNode
} 