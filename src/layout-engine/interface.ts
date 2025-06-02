export interface LayoutEngine {
  createRoot(): Promise<LayoutRoot>;
  wrap<T>(node: T): LayoutNode;
}

export interface LayoutRoot {
  createNode(): LayoutNode;
  calculateLayout(availableSpace?: number, availableHeight?: number, direction?: number): void;
  getRootNode(): LayoutNode;
}

export interface LayoutNode {
  // Basic dimension methods
  setWidth(width: number): void;
  setHeight(height: number): void;
  setWidthAuto(): void;
  setHeightAuto(): void;
  
  // Percentage dimension methods (matching original Yoga API)
  setWidthPercent(percent: number): void;
  setHeightPercent(percent: number): void;
  
  // Min/Max dimensions
  setMaxHeight(height: number): void;
  setMaxWidth(width: number): void;
  setMinHeight(height: number): void;
  setMinWidth(width: number): void;
  
  // Percentage min/max dimensions
  setMaxHeightPercent(percent: number): void;
  setMaxWidthPercent(percent: number): void;
  setMinHeightPercent(percent: number): void;
  setMinWidthPercent(percent: number): void;
  
  // Flexbox
  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): void;
  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): void;
  setFlexBasis(basis: string | number): void;
  setFlexGrow(grow: number): void;
  setFlexShrink(shrink: number): void;
  
  // Alignment
  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): void;
  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): void;
  setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): void;
  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): void;
  
  // Spacing
  setGap(gap: number): void;
  setRowGap(gap: number): void;
  setColumnGap(gap: number): void;
  setMargin(top: number, right: number, bottom: number, left: number): void;
  setBorder(top: number, right: number, bottom: number, left: number): void;
  setPadding(top: number, right: number, bottom: number, left: number): void;
  
  // Edge-based spacing (original Yoga style)
  setMarginEdge(edge: number, value: number): void;
  setBorderEdge(edge: number, value: number): void;
  setPaddingEdge(edge: number, value: number): void;
  setGapGutter(gutter: number, value: number): void;
  
  // Position
  setPositionType(position: 'relative' | 'absolute'): void;
  setTop(top: number): void;
  setBottom(bottom: number): void;
  setLeft(left: number): void;
  setRight(right: number): void;
  
  // Edge-based position (original Yoga style)  
  setPosition(edge: number, value: number): void;
  
  // Display
  setDisplay(display: 'flex' | 'none'): void;
  setOverflow(overflow: 'visible' | 'hidden'): void;
  
  // Other
  setAspectRatio(ratio: number): void;
  setMeasureFunc(measureFunc: (width: number, height?: number) => { width: number; height: number }): void;
  
  // Layout results
  getComputedLayout(): { left: number; top: number; width: number; height: number; };
  getComputedWidth(): number;
  getComputedHeight(): number;
  getComputedLeft(): number;
  getComputedTop(): number;
  getComputedPadding(edge: number): number;
  getComputedBorder(edge: number): number;
  getComputedMargin(edge: number): number;
  
  // Tree operations
  addChild(child: LayoutNode): void;
  getChildCount(): number;
} 