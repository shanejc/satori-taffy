// Mock implementation of TaffyNode for testing
export class MockTaffyNode {
  private style: any = {}
  private children: MockTaffyNode[] = []
  private layout = { left: 0, top: 0, width: 100, height: 100 }

  static async create(): Promise<MockTaffyNode> {
    return new MockTaffyNode()
  }

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
    // Mock layout calculation - just use the set dimensions
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

  async ensureInitialized(): Promise<void> {
    // Mock - no-op
  }

  // Add other methods as needed to match TaffyNode interface
} 