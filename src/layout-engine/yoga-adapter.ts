import type { Yoga } from 'yoga-wasm-web';
import type { LayoutEngine, LayoutRoot, LayoutNode } from './interface.js';

class YogaNodeAdapter implements LayoutNode {
  constructor(private node: any, private yoga: Yoga) {}

  // Mapping functions to convert our semantic constants to Yoga's numeric constants
  private mapDisplay(display: string): number {
    switch (display) {
      case 'flex': return this.yoga.DISPLAY_FLEX; // 0
      case 'none': return this.yoga.DISPLAY_NONE; // 1
      default: return this.yoga.DISPLAY_FLEX;
    }
  }

  private mapFlexDirection(direction: string): number {
    switch (direction) {
      case 'row': return this.yoga.FLEX_DIRECTION_ROW; // 2
      case 'column': return this.yoga.FLEX_DIRECTION_COLUMN; // 0  
      case 'row-reverse': return this.yoga.FLEX_DIRECTION_ROW_REVERSE; // 3
      case 'column-reverse': return this.yoga.FLEX_DIRECTION_COLUMN_REVERSE; // 1
      default: return this.yoga.FLEX_DIRECTION_ROW;
    }
  }

  private mapFlexWrap(wrap: string): number {
    switch (wrap) {
      case 'nowrap': return this.yoga.WRAP_NO_WRAP; // 0
      case 'wrap': return this.yoga.WRAP_WRAP; // 1
      case 'wrap-reverse': return this.yoga.WRAP_WRAP_REVERSE; // 2
      default: return this.yoga.WRAP_NO_WRAP;
    }
  }

  private mapAlign(align: string): number {
    switch (align) {
      case 'auto': return this.yoga.ALIGN_AUTO; // 0
      case 'flex-start': return this.yoga.ALIGN_FLEX_START; // 1
      case 'center': return this.yoga.ALIGN_CENTER; // 2
      case 'flex-end': return this.yoga.ALIGN_FLEX_END; // 3
      case 'stretch': return this.yoga.ALIGN_STRETCH; // 4
      case 'baseline': return this.yoga.ALIGN_BASELINE; // 5
      case 'space-between': return this.yoga.ALIGN_SPACE_BETWEEN; // 6
      case 'space-around': return this.yoga.ALIGN_SPACE_AROUND; // 7
      default: return this.yoga.ALIGN_AUTO;
    }
  }

  private mapJustify(justify: string): number {
    switch (justify) {
      case 'flex-start': return this.yoga.JUSTIFY_FLEX_START; // 0
      case 'center': return this.yoga.JUSTIFY_CENTER; // 1
      case 'flex-end': return this.yoga.JUSTIFY_FLEX_END; // 2
      case 'space-between': return this.yoga.JUSTIFY_SPACE_BETWEEN; // 3
      case 'space-around': return this.yoga.JUSTIFY_SPACE_AROUND; // 4
      default: return this.yoga.JUSTIFY_FLEX_START;
    }
  }

  private mapPosition(position: string): number {
    switch (position) {
      case 'relative': return this.yoga.POSITION_TYPE_RELATIVE; // 0
      case 'absolute': return this.yoga.POSITION_TYPE_ABSOLUTE; // 1
      default: return this.yoga.POSITION_TYPE_RELATIVE;
    }
  }

  private mapOverflow(overflow: string): number {
    switch (overflow) {
      case 'visible': return this.yoga.OVERFLOW_VISIBLE; // 0
      case 'hidden': return this.yoga.OVERFLOW_HIDDEN; // 1
      default: return this.yoga.OVERFLOW_VISIBLE;
    }
  }

  setWidth(width: number): void {
    this.node.setWidth(width);
  }

  setHeight(height: number): void {
    this.node.setHeight(height);
  }

  setWidthAuto(): void {
    this.node.setWidthAuto();
  }

  setHeightAuto(): void {
    this.node.setHeightAuto();
  }

  setMaxHeight(height: number): void {
    this.node.setMaxHeight(height);
  }

  setMaxWidth(width: number): void {
    this.node.setMaxWidth(width);
  }

  setMinHeight(height: number): void {
    this.node.setMinHeight(height);
  }

  setMinWidth(width: number): void {
    this.node.setMinWidth(width);
  }

  setMaxHeightPercent(percent: number): void {
    this.node.setMaxHeightPercent(percent);
  }

  setMaxWidthPercent(percent: number): void {
    this.node.setMaxWidthPercent(percent);
  }

  setMinHeightPercent(percent: number): void {
    this.node.setMinHeightPercent(percent);
  }

  setMinWidthPercent(percent: number): void {
    this.node.setMinWidthPercent(percent);
  }

  setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): void {
    this.node.setFlexDirection(this.mapFlexDirection(direction));
  }

  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): void {
    this.node.setFlexWrap(this.mapFlexWrap(wrap));
  }

  setFlexBasis(basis: string | number): void {
    if (typeof basis === 'number') {
      // Direct number value
      this.node.setFlexBasis(basis);
      return;
    }

    // Handle string values - Yoga only accepts numbers, so we need to parse
    const basisStr = basis.trim().toLowerCase();
    
    // Handle special keywords
    if (basisStr === 'auto') {
      // In Yoga, auto flex-basis is typically 0 with flex-grow > 0
      // For now, we'll use 0 as Yoga doesn't have a native auto concept
      this.node.setFlexBasis(0);
      return;
    }
    
    if (basisStr === 'content' || basisStr === 'max-content' || basisStr === 'min-content' || basisStr === 'fit-content') {
      // These are intrinsic sizing keywords not directly supported by Yoga
      // We'll use 0 as a fallback
      this.node.setFlexBasis(0);
      return;
    }

    // Handle percentage values - Yoga doesn't support percentage flex-basis directly
    // We'll need to convert it or handle it as pixels for now
    if (basisStr.endsWith('%')) {
      const percentValue = parseFloat(basisStr.slice(0, -1));
      if (!isNaN(percentValue)) {
        // For now, treat percentage as pixels since Yoga doesn't support percentage flex-basis
        // In a real implementation, you'd need to resolve this against parent size
        this.node.setFlexBasis(percentValue);
        return;
      }
    }

    // Handle length values with units
    const lengthMatch = basisStr.match(/^([+-]?(?:\d+\.?\d*|\.\d+))([a-z%]+)$/);
    if (lengthMatch) {
      const value = parseFloat(lengthMatch[1]);
      const unit = lengthMatch[2];
      
      if (!isNaN(value)) {
        switch (unit) {
          case 'px':
            this.node.setFlexBasis(value);
            break;
          case 'em':
          case 'rem':
            // Convert em/rem to pixels (approximate)
            this.node.setFlexBasis(value * 16); // Assume 16px base
            break;
          case '%':
            // Yoga doesn't support percentage flex-basis, treat as pixels for now
            this.node.setFlexBasis(value);
            break;
          default:
            // Unknown units - treat as pixels
            this.node.setFlexBasis(value);
            break;
        }
        return;
      }
    }

    // Fallback: try to parse as number
    const numericValue = parseFloat(basisStr);
    if (!isNaN(numericValue)) {
      this.node.setFlexBasis(numericValue);
    } else {
      // Invalid value, use 0 as fallback
      this.node.setFlexBasis(0);
    }
  }

  setFlexGrow(grow: number): void {
    this.node.setFlexGrow(grow);
  }

  setFlexShrink(shrink: number): void {
    this.node.setFlexShrink(shrink);
  }

  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): void {
    this.node.setAlignContent(this.mapAlign(align));
  }

  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): void {
    this.node.setAlignItems(this.mapAlign(align));
  }

  setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): void {
    this.node.setAlignSelf(this.mapAlign(align));
  }

  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): void {
    this.node.setJustifyContent(this.mapJustify(justify));
  }

  setGap(gap: number): void {
    this.node.setGap(this.yoga.GUTTER_ALL, gap);
  }

  setRowGap(gap: number): void {
    this.node.setGap(this.yoga.GUTTER_ROW, gap);
  }

  setColumnGap(gap: number): void {
    this.node.setGap(this.yoga.GUTTER_COLUMN, gap);
  }

  setMargin(top: number, right: number, bottom: number, left: number): void {
    this.node.setMargin(this.yoga.EDGE_TOP, top);
    this.node.setMargin(this.yoga.EDGE_RIGHT, right);
    this.node.setMargin(this.yoga.EDGE_BOTTOM, bottom);
    this.node.setMargin(this.yoga.EDGE_LEFT, left);
  }

  setBorder(top: number, right: number, bottom: number, left: number): void {
    this.node.setBorder(this.yoga.EDGE_TOP, top);
    this.node.setBorder(this.yoga.EDGE_RIGHT, right);
    this.node.setBorder(this.yoga.EDGE_BOTTOM, bottom);
    this.node.setBorder(this.yoga.EDGE_LEFT, left);
  }

  setPadding(top: number, right: number, bottom: number, left: number): void {
    this.node.setPadding(this.yoga.EDGE_TOP, top);
    this.node.setPadding(this.yoga.EDGE_RIGHT, right);
    this.node.setPadding(this.yoga.EDGE_BOTTOM, bottom);
    this.node.setPadding(this.yoga.EDGE_LEFT, left);
  }

  setPositionType(position: 'relative' | 'absolute'): void {
    this.node.setPositionType(this.mapPosition(position));
  }

  setTop(top: number): void {
    this.node.setPosition(this.yoga.EDGE_TOP, top);
  }

  setBottom(bottom: number): void {
    this.node.setPosition(this.yoga.EDGE_BOTTOM, bottom);
  }

  setLeft(left: number): void {
    this.node.setPosition(this.yoga.EDGE_LEFT, left);
  }

  setRight(right: number): void {
    this.node.setPosition(this.yoga.EDGE_RIGHT, right);
  }

  setDisplay(display: 'flex' | 'none'): void {
    this.node.setDisplay(this.mapDisplay(display));
  }

  setOverflow(overflow: 'visible' | 'hidden'): void {
    this.node.setOverflow(this.mapOverflow(overflow));
  }

  setAspectRatio(ratio: number): void {
    this.node.setAspectRatio(ratio);
  }

  setMeasureFunc(measureFunc: (width: number, height?: number) => { width: number; height: number }): void {
    // Yoga only provides width, so we wrap the function to ignore the height parameter
    this.node.setMeasureFunc((width: number) => measureFunc(width));
  }

  getComputedLayout(): { left: number; top: number; width: number; height: number; } {
    return {
      left: this.node.getComputedLeft(),
      top: this.node.getComputedTop(),
      width: this.node.getComputedWidth(),
      height: this.node.getComputedHeight()
    };
  }

  getComputedWidth(): number {
    return this.node.getComputedWidth();
  }

  getComputedHeight(): number {
    return this.node.getComputedHeight();
  }

  getComputedLeft(): number {
    return this.node.getComputedLeft();
  }

  getComputedTop(): number {
    return this.node.getComputedTop();
  }

  getComputedPadding(edge: number): number {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    return this.node.getComputedPadding(yogaEdge);
  }

  getComputedBorder(edge: number): number {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    return this.node.getComputedBorder(yogaEdge);
  }

  getComputedMargin(edge: number): number {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    return this.node.getComputedMargin(yogaEdge);
  }

  addChild(child: LayoutNode): void {
    if (child instanceof YogaNodeAdapter) {
      this.node.insertChild(child.getNode(), this.node.getChildCount());
    } else {
      console.log('WARNING: addChild called with non-YogaNodeAdapter child:', child);
    }
  }

  getChildCount(): number {
    return this.node.getChildCount();
  }

  setWidthPercent(percent: number): void {
    this.node.setWidthPercent(percent);
  }

  setHeightPercent(percent: number): void {
    this.node.setHeightPercent(percent);
  }

  // Edge-based methods (original Yoga style)
  setMarginEdge(edge: number, value: number): void {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    this.node.setMargin(yogaEdge, value);
  }

  setBorderEdge(edge: number, value: number): void {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    this.node.setBorder(yogaEdge, value);
  }

  setPaddingEdge(edge: number, value: number): void {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    this.node.setPadding(yogaEdge, value);
  }

  setGapGutter(gutter: number, value: number): void {
    this.node.setGap(gutter, value);
  }

  setPosition(edge: number, value: number): void {
    // Map our edge constants to Yoga's edge constants
    const yogaEdge = this.mapEdgeConstant(edge);
    this.node.setPosition(yogaEdge, value);
  }

  // Helper method to map our edge constants to Yoga's edge constants
  private mapEdgeConstant(edge: number): number {
    switch (edge) {
      case 0: return this.yoga.EDGE_LEFT;   // EDGE_LEFT = 0
      case 1: return this.yoga.EDGE_TOP;    // EDGE_TOP = 1
      case 2: return this.yoga.EDGE_RIGHT;  // EDGE_RIGHT = 2
      case 3: return this.yoga.EDGE_BOTTOM; // EDGE_BOTTOM = 3
      default: return this.yoga.EDGE_LEFT;
    }
  }
}

class YogaRootAdapter implements LayoutRoot {
  private actualRoot: YogaNodeAdapter | null = null;

  constructor(private yoga: Yoga) {
    this.createNode();
  }

  createNode(): LayoutNode {
    const node = new YogaNodeAdapter(this.yoga.Node.create(), this.yoga);
    // The first node created becomes the root
    if (!this.actualRoot) {
      this.actualRoot = node;
    }
    return node;
  }

  getRootNode(): YogaNodeAdapter {
    return this.actualRoot;
  }

  calculateLayout(availableSpace?: number, availableHeight?: number, direction?: number): void {
    // Calculate layout on the actual root node (the first node created)
    if (this.actualRoot) {
      // Use DIRECTION_LTR (0) as default if no direction is provided
      const layoutDirection = direction !== undefined ? direction : this.yoga.DIRECTION_LTR || 0;
      this.actualRoot.getNode().calculateLayout(availableSpace, availableHeight, layoutDirection);
    }
  }
}

export class YogaAdapter implements LayoutEngine {
  constructor(private yoga: Yoga) {}

  async createRoot(): Promise<LayoutRoot> {
    return new YogaRootAdapter(this.yoga);
  }

  wrap(node: any): LayoutNode {
    return new YogaNodeAdapter(node, this.yoga);
  }

  getYogaInstance() {
    return this.yoga;
  }
} 