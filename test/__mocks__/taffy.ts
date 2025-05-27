// Mock implementation of TaffyNode for testing
export class MockTaffyNode {
  private style: any = {}
  private children: MockTaffyNode[] = []
  private layout = { left: 0, top: 0, width: 100, height: 100 }

  static async create(): Promise<MockTaffyNode> {
    return new MockTaffyNode()
  }

  setWidth(width: number): void {
    this.style.width = width
    this.layout.width = width
  }

  setHeight(height: number): void {
    this.style.height = height
    this.layout.height = height
  }

  setFlexDirection(direction: string): void {
    this.style.flexDirection = direction
  }

  setFlexWrap(wrap: string): void {
    this.style.flexWrap = wrap
  }

  setAlignContent(align: string): void {
    this.style.alignContent = align
  }

  setAlignItems(align: string): void {
    this.style.alignItems = align
  }

  setJustifyContent(justify: string): void {
    this.style.justifyContent = justify
  }

  setOverflow(overflow: string): void {
    this.style.overflow = overflow
  }

  calculateLayout(): void {
    // Mock layout calculation - just use the set dimensions
  }

  getComputedLayout(): { left: number; top: number; width: number; height: number } {
    return { ...this.layout }
  }

  addChild(child: MockTaffyNode): void {
    this.children.push(child)
  }

  getChildCount(): number {
    return this.children.length
  }

  ensureInitialized(): void {
    // Mock - no-op
  }

  // Add other methods as needed to match TaffyNode interface
} 