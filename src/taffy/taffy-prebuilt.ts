import { instantiate, Node, TaffyTree, TaffyStyle, ComputedLayout } from '@loading/taffy'
import { toTaffyStyle, fromTaffyStyle } from './style-adapter.js'
import type { SerializedStyle } from '../handler/expand.js'

// Create a wrapper class to provide a similar API to Yoga
export class TaffyNode {
  private node: Node
  private tree: TaffyTree
  private children: TaffyNode[] = []
  private style: TaffyStyle = {}

  constructor() {
    // We'll initialize the actual node in the init method after instantiation
    this.node = null as any
    this.tree = null as any
  }

  async init() {
    const { Node, TaffyTree } = await instantiate()
    this.tree = new TaffyTree()
    this.node = new Node(this.tree, this.style)
  }

  // Layout methods
  setWidth(width: number) {
    this.style.width = width
    this.updateNode()
  }

  setHeight(height: number) {
    this.style.height = height
    this.updateNode()
  }

  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse') {
    this.style.flexDirection = direction
    this.updateNode()
  }

  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline') {
    this.style.alignItems = align
    this.updateNode()
  }

  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around') {
    this.style.justifyContent = justify
    this.updateNode()
  }

  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse') {
    this.style.flexWrap = wrap
    this.updateNode()
  }

  setFlexGrow(grow: number) {
    this.style.flexGrow = grow
    this.updateNode()
  }

  setFlexShrink(shrink: number) {
    this.style.flexShrink = shrink
    this.updateNode()
  }

  // Style methods for compatibility with expand.ts
  setStyle(style: SerializedStyle) {
    this.style = toTaffyStyle(style)
    this.updateNode()
  }

  getStyle(): Record<string, string | number> {
    return fromTaffyStyle(this.style)
  }

  private updateNode() {
    if (this.node) {
      this.node = new Node(this.tree, this.style)
      this.children.forEach(child => this.node.addChild(child.getNode()))
    }
  }

  // Child management
  insertChild(child: TaffyNode, index: number) {
    this.children.splice(index, 0, child)
    if (this.node) {
      this.node.addChild(child.getNode())
    }
  }

  getChild(index: number): TaffyNode {
    return this.children[index]
  }

  getChildCount(): number {
    return this.children.length
  }

  // Layout calculation
  calculateLayout(availableSpace: number = 100) {
    return this.node.computeLayout(availableSpace)
  }

  // Layout retrieval
  getComputedLayout(): ComputedLayout {
    return this.calculateLayout()
  }

  getComputedWidth(): number {
    return this.calculateLayout().width
  }

  getComputedHeight(): number {
    return this.calculateLayout().height
  }

  getComputedLeft(): number {
    return this.calculateLayout().x
  }

  getComputedTop(): number {
    return this.calculateLayout().y
  }

  // Internal methods
  getNode(): Node {
    return this.node
  }
}

export async function getTaffyModule(): Promise<typeof TaffyNode> {
  return TaffyNode
} 