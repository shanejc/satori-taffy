export interface LayoutEngine {
  create(): Promise<LayoutNode>;
  wrap(node: any): LayoutNode;
  // For text rendering compatibility - get the underlying Yoga instance
  getYogaInstance?(): any;
}

export interface LayoutNode {
  // Basic dimension methods
  setWidth(width: number): Promise<void>;
  setHeight(height: number): Promise<void>;
  setWidthAuto(): Promise<void>;
  setHeightAuto(): Promise<void>;
  
  // Percentage dimension methods (matching original Yoga API)
  setWidthPercent(percent: number): Promise<void>;
  setHeightPercent(percent: number): Promise<void>;
  
  // Min/Max dimensions
  setMaxHeight(height: number): Promise<void>;
  setMaxWidth(width: number): Promise<void>;
  setMinHeight(height: number): Promise<void>;
  setMinWidth(width: number): Promise<void>;
  
  // Percentage min/max dimensions
  setMaxHeightPercent(percent: number): Promise<void>;
  setMaxWidthPercent(percent: number): Promise<void>;
  setMinHeightPercent(percent: number): Promise<void>;
  setMinWidthPercent(percent: number): Promise<void>;
  
  // Flexbox
  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): Promise<void>;
  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): Promise<void>;
  setFlexBasis(basis: string | number): Promise<void>;
  setFlexGrow(grow: number): Promise<void>;
  setFlexShrink(shrink: number): Promise<void>;
  
  // Alignment
  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): Promise<void>;
  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void>;
  setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void>;
  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): Promise<void>;
  
  // Spacing
  setGap(gap: number): Promise<void>;
  setRowGap(gap: number): Promise<void>;
  setColumnGap(gap: number): Promise<void>;
  setMargin(top: number, right: number, bottom: number, left: number): Promise<void>;
  setBorder(top: number, right: number, bottom: number, left: number): Promise<void>;
  setPadding(top: number, right: number, bottom: number, left: number): Promise<void>;
  
  // Edge-based spacing (original Yoga style)
  setMarginEdge(edge: number, value: number): Promise<void>;
  setBorderEdge(edge: number, value: number): Promise<void>;
  setPaddingEdge(edge: number, value: number): Promise<void>;
  setGapGutter(gutter: number, value: number): Promise<void>;
  
  // Position
  setPositionType(position: 'relative' | 'absolute'): Promise<void>;
  setTop(top: number): Promise<void>;
  setBottom(bottom: number): Promise<void>;
  setLeft(left: number): Promise<void>;
  setRight(right: number): Promise<void>;
  
  // Edge-based position (original Yoga style)  
  setPosition(edge: number, value: number): Promise<void>;
  
  // Display
  setDisplay(display: 'flex' | 'none'): Promise<void>;
  setOverflow(overflow: 'visible' | 'hidden'): Promise<void>;
  
  // Other
  setAspectRatio(ratio: number): Promise<void>;
  
  // Layout computation
  calculateLayout(availableSpace?: number, availableHeight?: number, direction?: number): Promise<void>;
  
  // Layout results
  getComputedLayout(): Promise<{ left: number; top: number; width: number; height: number; }>;
  getComputedWidth(): Promise<number>;
  getComputedHeight(): Promise<number>;
  getComputedLeft(): Promise<number>;
  getComputedTop(): Promise<number>;
  getComputedPadding(edge: number): Promise<number>;
  getComputedBorder(edge: number): Promise<number>;
  getComputedMargin(edge: number): Promise<number>;
  
  // Tree operations
  insertChild(child: LayoutNode, index: number): Promise<void>;
  getChildCount(): Promise<number>;
  
  // Node access
  getNode(): any;
} 