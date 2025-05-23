export interface LayoutEngine {
  create(): Promise<LayoutNode>;
}

export interface LayoutNode {
  // Layout dimensions
  setWidth(width: number): Promise<void>;
  setHeight(height: number): Promise<void>;
  setWidthAuto(): Promise<void>;
  setHeightAuto(): Promise<void>;
  
  // Min/Max dimensions
  setMaxHeight(height: number): Promise<void>;
  setMaxWidth(width: number): Promise<void>;
  setMinHeight(height: number): Promise<void>;
  setMinWidth(width: number): Promise<void>;
  
  // Flexbox
  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): Promise<void>;
  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): Promise<void>;
  setFlexBasis(basis: number): Promise<void>;
  setFlexGrow(grow: number): Promise<void>;
  setFlexShrink(shrink: number): Promise<void>;
  
  // Alignment
  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): Promise<void>;
  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void>;
  setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void>;
  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): Promise<void>;
  
  // Gaps
  setGap(gap: number): Promise<void>;
  setRowGap(gap: number): Promise<void>;
  setColumnGap(gap: number): Promise<void>;
  
  // Spacing
  setMargin(top: number, right: number, bottom: number, left: number): Promise<void>;
  setBorder(top: number, right: number, bottom: number, left: number): Promise<void>;
  setPadding(top: number, right: number, bottom: number, left: number): Promise<void>;
  
  // Position
  setPositionType(position: 'relative' | 'absolute'): Promise<void>;
  setTop(top: number): Promise<void>;
  setBottom(bottom: number): Promise<void>;
  setLeft(left: number): Promise<void>;
  setRight(right: number): Promise<void>;
  
  // Other properties
  setDisplay(display: 'flex' | 'none'): Promise<void>;
  setOverflow(overflow: 'visible' | 'hidden'): Promise<void>;
  setAspectRatio(ratio: number): Promise<void>;
  
  // Layout calculation
  calculateLayout(availableSpace?: number): Promise<void>;
  getComputedLayout(): Promise<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  
  // Computed dimensions and spacing (needed by text handler)
  getComputedWidth(): Promise<number>;
  getComputedHeight(): Promise<number>;
  getComputedLeft(): Promise<number>;
  getComputedTop(): Promise<number>;
  getComputedPadding(edge: number): Promise<number>;
  getComputedBorder(edge: number): Promise<number>;
  getComputedMargin(edge: number): Promise<number>;
  
  // Children management
  insertChild(child: LayoutNode, index: number): Promise<void>;
  getChildCount(): Promise<number>;
} 