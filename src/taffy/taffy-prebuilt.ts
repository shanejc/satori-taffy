import type { Style } from 'taffy-wasm/Style.js'
import { CompactLength } from 'taffy-wasm/CompactLength.js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Size } from 'taffy-wasm/Size.js'
import { AvailableSpace } from 'taffy-wasm/AvailableSpace.js'
import type { GridTrack } from '../layout-engine/interface.js'

// Import the actual WASM types and initialization
import { TaffyTree } from 'taffy-wasm'
import wasmInit from 'taffy-wasm'

// Import grid types from the new streamlined index
import { 
  TrackSizingFunction, 
  NonRepeatedTrackSizingFunction, 
  MinTrackSizingFunction,
  MaxTrackSizingFunction,
  GridPlacement, 
  GridTrackRepetition 
} from 'taffy-wasm/GridTypes.js'

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
    // Check if we're in a Node.js environment
    const isNode = typeof window === 'undefined' && typeof process !== 'undefined'
    
    if (isNode) {
      // In Node.js, load the WASM file from node_modules
      const wasmPath = resolve(process.cwd(), 'node_modules/taffy-wasm/taffy_wasm_bg.wasm')
      const wasmBytes = readFileSync(wasmPath)
      
      // Use async initialization with proper object parameter format
      await wasmInit({ module_or_path: wasmBytes })
    } else {
      // In browser environments, use async initialization
      await wasmInit()
    }
  } catch (error) {
    console.error('Failed to initialize Taffy WASM:', error)
    throw new Error('Could not initialize Taffy WASM module')
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
    // CRITICAL: Apply all pending style updates before layout computation
    this.applyAllPendingStyleUpdates()
    
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
    // CRITICAL FIX: Always apply pending styles before layout access
    // Layout might have been calculated elsewhere with stale styles
    this.applyAllPendingStyleUpdates()
    
    if (!this.hasLayoutBeenCalculated) {
      this.tree.compute_layout(this.rootNode.getNodeId(), undefined, undefined)
      this.hasLayoutBeenCalculated = true
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

  private applyAllPendingStyleUpdates() {
    // Apply pending style updates starting from root node
    this.rootNode.applyPendingStyleUpdates()
    this.rootNode.applyChildrenStyleUpdates()
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
    grid_auto_flow: 'Row',
    grid_template_rows: [],
    grid_template_columns: [],
    grid_auto_rows: [],
    grid_auto_columns: [],
    grid_row: { start: 'Auto', end: 'Auto' },
    grid_column: { start: 'Auto', end: 'Auto' }
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
  private markStyleUpdate() {
    this.styleNeedsUpdate = true
    this.root.markForStyleUpdate(this.nodeId)
  }

  setWidth(width: number) {
    // Store using CompactLength for proper serde format
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.width = CompactLength.length(width)
    this.markStyleUpdate()
  }

  setWidthPercent(percent: number) {
    // Store using CompactLength for percentages
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.width = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setHeight(height: number) {
    // Store using CompactLength for proper serde format
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.height = CompactLength.length(height)
    this.markStyleUpdate()
  }

  setHeightPercent(percent: number) {
    // Store using CompactLength for percentages
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.height = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setHeightAuto() {
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.height = CompactLength.auto()
    this.markStyleUpdate()
  }

  setWidthAuto() {
    if (!this.pendingStyle.size) {
      this.pendingStyle.size = { width: CompactLength.length(0), height: CompactLength.length(0) }
    }
    this.pendingStyle.size.width = CompactLength.auto()
    this.markStyleUpdate()
  }

  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse') {
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
    this.pendingStyle.flex_grow = grow
    this.markStyleUpdate()
  }

  setFlexShrink(shrink: number) {
    this.pendingStyle.flex_shrink = shrink
    this.markStyleUpdate()
  }

  setDisplay(display: 'flex' | 'none' | 'grid') {
    // Convert to correct capitalized enum values
    switch (display) {
      case 'flex': this.pendingStyle.display = 'Flex'; break;
      case 'grid': this.pendingStyle.display = 'Grid'; break;
      case 'none': this.pendingStyle.display = 'None'; break;
      default: this.pendingStyle.display = 'Flex';
    }
    this.markStyleUpdate()
  }

  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around') {
    // Convert to correct capitalized enum values
    switch (align) {
      case 'flex-start': this.pendingStyle.align_content = 'FlexStart'; break;
      case 'flex-end': this.pendingStyle.align_content = 'FlexEnd'; break;
      case 'stretch': this.pendingStyle.align_content = 'Stretch'; break;
      case 'baseline': this.pendingStyle.align_content = 'Center'; break;
      case 'space-between': this.pendingStyle.align_content = 'SpaceBetween'; break;
      case 'space-around': this.pendingStyle.align_content = 'SpaceAround'; break;
      default: this.pendingStyle.align_content = 'Stretch';
    }
    this.markStyleUpdate()
  }

  setAlignSelf(align: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
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
    this.pendingStyle.gap.width = CompactLength.length(gap)
    this.pendingStyle.gap.height = CompactLength.length(gap)
    this.markStyleUpdate()
  }

  setRowGap(gap: number) {
    this.pendingStyle.gap.height = CompactLength.length(gap)
    this.markStyleUpdate()
  }

  setColumnGap(gap: number) {
    this.pendingStyle.gap.width = CompactLength.length(gap)
    this.markStyleUpdate()
  }

  setFlexBasis(basis: string | number) {
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
    this.pendingStyle.max_size.height = CompactLength.length(height)
    this.markStyleUpdate()
  }

  setMaxWidth(width: number) {
    this.pendingStyle.max_size.width = CompactLength.length(width)
    this.markStyleUpdate()
  }

  setMaxHeightPercent(percent: number) {
    this.pendingStyle.max_size.height = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setMaxWidthPercent(percent: number) {
    this.pendingStyle.max_size.width = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setMinHeight(height: number) {
    this.pendingStyle.min_size.height = CompactLength.length(height)
    this.markStyleUpdate()
  }

  setMinWidth(width: number) {
    this.pendingStyle.min_size.width = CompactLength.length(width)
    this.markStyleUpdate()
  }

  setMinHeightPercent(percent: number) {
    this.pendingStyle.min_size.height = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setMinWidthPercent(percent: number) {
    this.pendingStyle.min_size.width = CompactLength.percent(percent / 100.0)
    this.markStyleUpdate()
  }

  setOverflow(overflow: 'visible' | 'hidden') {
    // Convert to correct capitalized enum values
    const overflowValue = overflow === 'hidden' ? 'Hidden' : 'Visible'
    this.pendingStyle.overflow = {
      x: overflowValue,
      y: overflowValue
    }
    this.markStyleUpdate()
  }

  setMargin(top: number, right: number, bottom: number, left: number) {
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
    // Convert to correct capitalized enum values
    switch (type) {
      case 'relative': this.pendingStyle.position = 'Relative'; break;
      case 'absolute': this.pendingStyle.position = 'Absolute'; break;
      default: this.pendingStyle.position = 'Relative';
    }
    this.markStyleUpdate()
  }

  setTop(value: number) {
    this.pendingStyle.inset.top = CompactLength.length(value)
    this.markStyleUpdate()
  }

  setBottom(value: number) {
    this.pendingStyle.inset.bottom = CompactLength.length(value)
    this.markStyleUpdate()
  }

  setLeft(value: number) {
    this.pendingStyle.inset.left = CompactLength.length(value)
    this.markStyleUpdate()
  }

  setRight(value: number) {
    this.pendingStyle.inset.right = CompactLength.length(value)
    this.markStyleUpdate()
  }

  getStyle(): Record<string, any> {
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
    this.root.addChild(this.nodeId, child.nodeId)
    this.children.push(child)
  }

  getChildCount(): number {
    return this.children.length
  }

  calculateLayout(availableWidth: number, availableHeight?: number) {
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

  public applyChildrenStyleUpdates() {
    for (const child of this.children) {
      child.applyPendingStyleUpdates()
      child.applyChildrenStyleUpdates()
    }
  }

  public applyPendingStyleUpdates() {
    if (this.styleNeedsUpdate) {
      // Use the root's method to apply the style update
      this.root.updateNodeStyle(this.nodeId, this.pendingStyle)
      this.styleNeedsUpdate = false
    }
  }

  getComputedLayout(): { left: number; top: number; width: number; height: number } {
    return {
      left: this.getComputedLeft(),
      top: this.getComputedTop(),
      width: this.getComputedWidth(),
      height: this.getComputedHeight()
    }
  }

  getComputedWidth(): number {
    // Get computed width from layout
    return this.root.getLayoutWidth(this.nodeId)
  }

  getComputedHeight(): number {
    // Get computed height from layout
    return this.root.getLayoutHeight(this.nodeId)
  }

  getComputedLeft(): number {
    return this.root.getLayoutLeft(this.nodeId)
  }

  getComputedTop(): number {
    return this.root.getLayoutTop(this.nodeId)
  }

  getNodeId(): number {
    return this.nodeId
  }

  setMeasureFunc(measureFunc: (width: number, height?: number) => { width: number; height: number }) {
    // Store the measure function in the root
    this.root.setMeasureFunction(this.nodeId, measureFunc)
  }

  setAspectRatio(ratio: number) {
    this.pendingStyle.aspect_ratio = ratio
    this.markStyleUpdate()
  }

  // CSS Grid methods
  // CURRENT STATE OF GRID SUPPORT IN TAFFY WASM:
  // ✅ display: grid - Works (creates grid context)
  // ✅ grid-template-columns - Works (creates columns) 
  // ✅ grid-auto-flow - Works
  // ❌ grid-template-rows - Data is sent correctly but appears to be ignored by layout algorithm
  // 
  // Result: Creates single row with correct number of columns instead of proper 2D grid
  // This is a limitation in the underlying Taffy layout engine, not our implementation

  setGridTemplateColumns(tracks: GridTrack[]) {
    // Using real taffy-wasm grid properties
    this.pendingStyle.grid_template_columns = this.convertTracksToTaffy(tracks)
    this.markStyleUpdate()
  }

  setGridTemplateRows(tracks: GridTrack[]) {
    // Using real taffy-wasm grid properties (data sent correctly, but may be ignored by layout algorithm)
    this.pendingStyle.grid_template_rows = this.convertTracksToTaffy(tracks)
    this.markStyleUpdate()
  }

  setGridTemplateAreas(areas: string[][]) {
    // grid-template-areas could be implemented by converting to explicit grid-row/grid-column placements
    // For now, store for potential future implementation
    (this.pendingStyle as any)._gridTemplateAreas = areas
    this.markStyleUpdate()
  }

  setGridAutoFlow(flow: 'row' | 'column' | 'row dense' | 'column dense') {
    // Fully supported in taffy-wasm
    switch (flow) {
      case 'row': this.pendingStyle.grid_auto_flow = 'Row'; break;
      case 'column': this.pendingStyle.grid_auto_flow = 'Column'; break;
      case 'row dense': this.pendingStyle.grid_auto_flow = 'RowDense'; break;
      case 'column dense': this.pendingStyle.grid_auto_flow = 'ColumnDense'; break;
      default: this.pendingStyle.grid_auto_flow = 'Row';
    }
    this.markStyleUpdate()
  }

  setGridAutoColumns(tracks: GridTrack[]) {
    // Using real taffy-wasm grid properties
    this.pendingStyle.grid_auto_columns = this.convertAutoTracksToTaffy(tracks)
    this.markStyleUpdate()
  }

  setGridAutoRows(tracks: GridTrack[]) {
    // Using real taffy-wasm grid properties
    this.pendingStyle.grid_auto_rows = this.convertAutoTracksToTaffy(tracks)
    this.markStyleUpdate()
  }

  setGridColumn(value: string) {
    // Using real taffy-wasm grid properties
    this.pendingStyle.grid_column = this.parseGridPlacement(value)
    this.markStyleUpdate()
  }

  setGridRow(value: string) {
    // Using real taffy-wasm grid properties
    this.pendingStyle.grid_row = this.parseGridPlacement(value)
    this.markStyleUpdate()
  }

  // Helper methods to convert between our parsed format and Taffy types
  // These will be used when taffy-wasm is rebuilt with full grid support

  private convertTracksToTaffy(tracks: GridTrack[]): TrackSizingFunction[] {
    return tracks.map(track => {
      switch (track.type) {
        case 'px':
          return { Single: { min: CompactLength.length(Number(track.value)), max: CompactLength.length(Number(track.value)) } }
        case 'fr':
          return { Single: { min: CompactLength.auto(), max: CompactLength.fr(Number(track.value)) } }
        case 'auto':
          return { Single: { min: CompactLength.auto(), max: CompactLength.auto() } }
        case 'min-content':
          return { Single: { min: CompactLength.auto(), max: CompactLength.auto() } } // min_content not yet supported in WASM
        case 'max-content':
          return { Single: { min: CompactLength.auto(), max: CompactLength.auto() } } // max_content not yet supported in WASM
        case 'minmax':
          return {
            Single: {
              min: this.convertToMinTrackSizingFunction(track.min!),
              max: this.convertToMaxTrackSizingFunction(track.max!)
            }
          }
        default:
          return { Single: { min: CompactLength.auto(), max: CompactLength.auto() } }
      }
    })
  }

  private convertAutoTracksToTaffy(tracks: GridTrack[]): NonRepeatedTrackSizingFunction[] {
    return tracks.map(track => {
      switch (track.type) {
        case 'px':
          return { min: CompactLength.length(Number(track.value)), max: CompactLength.length(Number(track.value)) }
        case 'fr':
          return { min: CompactLength.auto(), max: CompactLength.fr(Number(track.value)) }
        case 'auto':
          return { min: CompactLength.auto(), max: CompactLength.auto() }
        case 'min-content':
          return { min: CompactLength.auto(), max: CompactLength.auto() } // min_content not yet supported in WASM
        case 'max-content':
          return { min: CompactLength.auto(), max: CompactLength.auto() } // max_content not yet supported in WASM
        case 'minmax':
          return {
            min: this.convertToMinTrackSizingFunction(track.min!),
            max: this.convertToMaxTrackSizingFunction(track.max!)
          }
        default:
          return { min: CompactLength.auto(), max: CompactLength.auto() }
      }
    })
  }

  private convertMinMaxToTaffy(min: GridTrack, max: GridTrack): any {
    return {
      Single: {
        min: this.convertToMinTrackSizingFunction(min),
        max: this.convertToMaxTrackSizingFunction(max)
      }
    }
  }

  private convertMinMaxToNonRepeatedTaffy(min: GridTrack, max: GridTrack): any {
    return {
      min: this.convertToMinTrackSizingFunction(min),
      max: this.convertToMaxTrackSizingFunction(max)
    }
  }

  private convertToMinTrackSizingFunction(track: GridTrack | number | string): any {
    if (typeof track === 'number') {
      return CompactLength.length(track)
    }
    if (typeof track === 'string') {
      switch (track) {
        case 'auto': return CompactLength.auto()
        case 'min-content': return CompactLength.auto() // min_content not yet supported in WASM
        case 'max-content': return CompactLength.auto() // max_content not yet supported in WASM
        default: return CompactLength.auto()
      }
    }
    // track is GridTrack
    switch (track.type) {
      case 'px': return CompactLength.length(Number(track.value))
      case 'auto': return CompactLength.auto()
      case 'min-content': return CompactLength.auto() // min_content not yet supported in WASM
      case 'max-content': return CompactLength.auto() // max_content not yet supported in WASM
      default: return CompactLength.auto()
    }
  }

  private convertToMaxTrackSizingFunction(track: GridTrack | number | string): any {
    if (typeof track === 'number') {
      return CompactLength.length(track)
    }
    if (typeof track === 'string') {
      switch (track) {
        case 'auto': return CompactLength.auto()
        case 'min-content': return CompactLength.auto() // min_content not yet supported in WASM
        case 'max-content': return CompactLength.auto() // max_content not yet supported in WASM
        default: return CompactLength.auto()
      }
    }
    // track is GridTrack
    switch (track.type) {
      case 'px': return CompactLength.length(Number(track.value))
      case 'fr': return CompactLength.fr(Number(track.value)) // Use CompactLength.fr() for WASM compatibility
      case 'auto': return CompactLength.auto()
      case 'min-content': return CompactLength.auto() // min_content not yet supported in WASM
      case 'max-content': return CompactLength.auto() // max_content not yet supported in WASM
      default: return CompactLength.auto()
    }
  }

  private convertRepeatToTaffy(count: number | 'auto-fill' | 'auto-fit', tracks: GridTrack[]): any {
    const repetition = count === 'auto-fill' ? 'AutoFill' : 
                      count === 'auto-fit' ? 'AutoFit' : 
                      { Count: count }
    
    const convertedTracks = this.convertAutoTracksToTaffy(tracks)
    return { Repeat: { repetition, tracks: convertedTracks } }
  }

  private parseGridPlacement(value: string): { start: any, end: any } {
    // Parse CSS grid-column/grid-row values like "1", "span 2", "1 / 3", etc.
    const trimmed = value.trim()
    
    if (trimmed === 'auto') {
      return { start: 'Auto', end: 'Auto' }
    }
    
    // Handle "span N" format 
    if (trimmed.startsWith('span ')) {
      const spanValue = parseInt(trimmed.substring(5))
      return { start: 'Auto', end: { Span: spanValue } }
    }
    
    // Handle "start / end" format
    if (trimmed.includes(' / ')) {
      const [start, end] = trimmed.split(' / ').map(s => s.trim())
      return {
        start: this.parseGridPlacementValue(start),
        end: this.parseGridPlacementValue(end)
      }
    }
    
    // Single value (line number)
    const lineNumber = parseInt(trimmed)
    if (!isNaN(lineNumber)) {
      return { start: { Line: lineNumber }, end: 'Auto' }
    }
    
    return { start: 'Auto', end: 'Auto' }
  }

  private parseGridPlacementValue(value: string): any {
    if (value === 'auto') return 'Auto'
    
    if (value.startsWith('span ')) {
      const spanValue = parseInt(value.substring(5))
      return { Span: spanValue }
    }
    
    const lineNumber = parseInt(value)
    if (!isNaN(lineNumber)) {
      return { Line: lineNumber }
    }
    
    return 'Auto'
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
}

export async function getTaffyModule(): Promise<typeof TaffyNode> {
  return TaffyNode
}

// After the WASM initialization, let's add a debug function to check defaults
async function logTaffyDefaults(): Promise<void> {
  await ensureWasmInitialized()
  
  console.log('[TAFFY DEFAULTS] Checking taffy-wasm default values...')
  
  try {
    // Import these functions to check defaults
    const { 
      get_default_track_sizing_function,
      get_default_non_repeated_track_sizing_function, 
      get_default_grid_placement,
      get_default_min_track_sizing_function,
      get_default_max_track_sizing_function,
      get_default_grid_track_repetition
    } = await import('taffy-wasm')
    
    console.log('Default TrackSizingFunction:', get_default_track_sizing_function())
    console.log('Default NonRepeatedTrackSizingFunction:', get_default_non_repeated_track_sizing_function())
    console.log('Default GridPlacement:', get_default_grid_placement())
    console.log('Default MinTrackSizingFunction:', get_default_min_track_sizing_function())
    console.log('Default MaxTrackSizingFunction:', get_default_max_track_sizing_function())
    console.log('Default GridTrackRepetition:', get_default_grid_track_repetition())
  } catch (error) {
    console.log('Error getting defaults:', error)
  }
}

// Call this function to see the expected formats
// logTaffyDefaults().catch(console.error) 