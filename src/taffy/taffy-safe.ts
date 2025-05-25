import { instantiate, Node, TaffyTree, TaffyStyle, ComputedLayout } from '@loading/taffy'
import { toTaffyStyle, fromTaffyStyle } from './style-adapter.js'
import type { SerializedStyle } from '../handler/expand.js'

let wasmLoadingPromise: Promise<any> | null = null
let wasmModule: any = null

async function ensureWasmLoaded() {
  if (wasmModule) return wasmModule
  
  if (!wasmLoadingPromise) {
    wasmLoadingPromise = instantiate().catch(error => {
      console.warn('WASM loading failed:', error.message)
      wasmLoadingPromise = null
      throw error
    })
  }
  
  wasmModule = await wasmLoadingPromise
  return wasmModule
}

export class SafeTaffyNode {
  private node: Node | null = null
  private tree: TaffyTree | null = null
  private children: SafeTaffyNode[] = []
  private style: TaffyStyle & { aspectRatio?: number } = {}
  private isInitialized = false

  static async create(): Promise<SafeTaffyNode> {
    const node = new SafeTaffyNode()
    await node.init()
    return node
  }

  constructor() {
    // Initialize with empty state
  }

  async init() {
    if (this.isInitialized) return this

    try {
      const wasm = await ensureWasmLoaded()
      this.tree = new wasm.TaffyTree()
      this.node = new wasm.Node(this.tree, this.style)
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Taffy WASM:', error)
      throw new Error('Taffy WASM failed to load. Consider using Yoga layout engine instead.')
    }
    
    return this
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  // All the same methods as TaffyNode but with better error handling
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

  async setOverflow(overflow: 'visible' | 'hidden') {
    await this.ensureInitialized()
    this.style.overflow = overflow
    this.updateNode()
  }

  async insertChild(child: SafeTaffyNode, index: number) {
    await this.ensureInitialized()
    await child.ensureInitialized()
    this.children.splice(index, 0, child)
    if (this.node && this.tree) {
      this.node.addChild(await child.getNode(), index)
    }
  }

  async getChildCount(): Promise<number> {
    await this.ensureInitialized()
    return this.children.length
  }

  async calculateLayout(availableSpace: number = 100) {
    await this.ensureInitialized()
    if (!this.node) throw new Error('Node not initialized')
    return this.node.computeLayout(availableSpace)
  }

  async getComputedLayout(): Promise<ComputedLayout> {
    await this.ensureInitialized()
    const layout = await this.calculateLayout()
    return {
      left: layout.x,
      top: layout.y,
      width: layout.width,
      height: layout.height
    }
  }

  async getNode(): Promise<Node> {
    await this.ensureInitialized()
    if (!this.node) throw new Error('Node not initialized')
    return this.node
  }

  private async updateNode() {
    if (!this.isInitialized || !this.node || !this.tree) {
      return
    }

    try {
      const wasm = await ensureWasmLoaded()
      const oldNode = this.node
      this.node = new wasm.Node(this.tree, this.style)
      await Promise.all(this.children.map(async child => 
        this.node!.addChild(await child.getNode())
      ))
      
      const parent = oldNode.getParent()
      if (parent) {
        const index = parent.getChildren().indexOf(oldNode)
        if (index !== -1) {
          parent.removeChild(oldNode)
          parent.addChild(this.node, index)
        }
      }
    } catch (error) {
      console.error('Failed to update Taffy node:', error)
    }
  }

  async setAspectRatio(ratio: number) {
    await this.ensureInitialized()
    this.style.aspectRatio = ratio
    this.updateNode()
  }
} 