import { TaffyNode } from '../taffy/taffy-prebuilt.js';
import type { LayoutEngine, LayoutNode } from './interface.js';

export class TaffyAdapter implements LayoutEngine {

  async create(): Promise<LayoutNode> {
    const node = await TaffyNode.create();
    return new TaffyNodeAdapter(node);
  }

  wrap(node: any): LayoutNode {
    return new TaffyNodeAdapter(node);
  }
}

class TaffyNodeAdapter implements LayoutNode {
  constructor(private node: TaffyNode) {}

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

  setWidthPercent(percent: number): void {
    this.node.setWidthPercent(percent);
  }

  setHeightPercent(percent: number): void {
    this.node.setHeightPercent(percent);
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
    this.node.setFlexDirection(direction);
  }

  setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): void {
    this.node.setFlexWrap(wrap);
  }

  setFlexBasis(basis: string | number): void {
    this.node.setFlexBasis(basis);
  }

  setFlexGrow(grow: number): void {
    this.node.setFlexGrow(grow);
  }

  setFlexShrink(shrink: number): void {
    this.node.setFlexShrink(shrink);
  }

  setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): void {
    this.node.setAlignContent(align as any);
  }

  setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): void {
    this.node.setAlignItems(align as any);
  }

  setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): void {
    this.node.setAlignSelf(align as any);
  }

  setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): void {
    this.node.setJustifyContent(justify);
  }

  setGap(gap: number): void {
    this.node.setGap(gap);
  }

  setRowGap(gap: number): void {
    this.node.setRowGap(gap);
  }

  setColumnGap(gap: number): void {
    this.node.setColumnGap(gap);
  }

  setMargin(top: number, right: number, bottom: number, left: number): void {
    this.node.setMargin(top, right, bottom, left);
  }

  setBorder(top: number, right: number, bottom: number, left: number): void {
    this.node.setBorder(top, right, bottom, left);
  }

  setPadding(top: number, right: number, bottom: number, left: number): void {
    this.node.setPadding(top, right, bottom, left);
  }

  setPositionType(position: 'relative' | 'absolute'): void {
    this.node.setPositionType(position);
  }

  // Position setters - now implemented using WASM API
  setTop(top: number): void {
    this.node.setTop(top);
  }

  setBottom(bottom: number): void {
    this.node.setBottom(bottom);
  }

  setLeft(left: number): void {
    this.node.setLeft(left);
  }

  setRight(right: number): void {
    this.node.setRight(right);
  }

  setDisplay(display: 'flex' | 'none'): void {
    this.node.setDisplay(display);
  }

  setOverflow(overflow: 'visible' | 'hidden'): void {
    this.node.setOverflow(overflow);
  }

  setAspectRatio(ratio: number): void {
    this.node.setAspectRatio(ratio);
  }

  setMeasureFunc(measureFunc: (width: number) => { width: number; height: number }): void {
    this.node.setMeasureFunc(measureFunc);
  }

  calculateLayout(availableSpace?: number, availableHeight?: number, direction?: number): void {
    this.node.calculateLayout(availableSpace, availableHeight);
  }

  getComputedLayout(): { left: number; top: number; width: number; height: number; } {
    return this.node.getComputedLayout();
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
    return this.node.getComputedPadding(edge);
  }

  getComputedBorder(edge: number): number {
    return this.node.getComputedBorder(edge);
  }

  getComputedMargin(edge: number): number {
    return this.node.getComputedMargin(edge);
  }

  addChild(child: LayoutNode): void {
    if (child instanceof TaffyNodeAdapter) {
      this.node.addChild(child.getNode());
    }
    else {
      throw new Error('Child is not a TaffyNodeAdapter');
    }
  }

  getChildCount(): number {
    return this.node.getChildCount();
  }

  getNode() {
    return this.node;
  }

  // Edge-based methods - translate edge constants to individual TaffyNode methods
  setMarginEdge(edge: number, value: number): void {
    // Edge constants: 0=left, 1=top, 2=right, 3=bottom
    switch (edge) {
      case 0: this.node.setMarginLeft(value); break;   // EDGE_LEFT
      case 1: this.node.setMarginTop(value); break;    // EDGE_TOP
      case 2: this.node.setMarginRight(value); break;  // EDGE_RIGHT
      case 3: this.node.setMarginBottom(value); break; // EDGE_BOTTOM
    }
  }

  setBorderEdge(edge: number, value: number): void {
    // Edge constants: 0=left, 1=top, 2=right, 3=bottom
    switch (edge) {
      case 0: this.node.setBorderLeft(value); break;   // EDGE_LEFT
      case 1: this.node.setBorderTop(value); break;    // EDGE_TOP
      case 2: this.node.setBorderRight(value); break;  // EDGE_RIGHT
      case 3: this.node.setBorderBottom(value); break; // EDGE_BOTTOM
    }
  }

  setPaddingEdge(edge: number, value: number): void {
    // Edge constants: 0=left, 1=top, 2=right, 3=bottom
    switch (edge) {
      case 0: this.node.setPaddingLeft(value); break;   // EDGE_LEFT
      case 1: this.node.setPaddingTop(value); break;    // EDGE_TOP
      case 2: this.node.setPaddingRight(value); break;  // EDGE_RIGHT
      case 3: this.node.setPaddingBottom(value); break; // EDGE_BOTTOM
    }
  }

  setGapGutter(gutter: number, value: number): void {
    // Gutter constants: 0=all, 1=row, 2=column
    switch (gutter) {
      case 0: this.node.setGap(value); break;
      case 1: this.node.setRowGap(value); break;
      case 2: this.node.setColumnGap(value); break;
    }
  }

  setPosition(edge: number, value: number): void {
    // Edge constants: 0=top, 1=right, 2=bottom, 3=left
    // These methods don't exist on TaffyNode anymore
    switch (edge) {
      case 0: this.setTop(value); break;
      case 1: this.setRight(value); break;
      case 2: this.setBottom(value); break;
      case 3: this.setLeft(value); break;
    }
  }
}
