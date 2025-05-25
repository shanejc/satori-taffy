import type { TaffyNode } from '../taffy/taffy-prebuilt.js';
import type { LayoutEngine, LayoutNode } from './interface.js';

export class TaffyAdapter implements LayoutEngine {
  constructor(private taffyClass: typeof TaffyNode) {}

  async create(): Promise<LayoutNode> {
    const node = await this.taffyClass.create();
    return new TaffyNodeAdapter(node);
  }

  wrap(node: any): LayoutNode {
    return new TaffyNodeAdapter(node);
  }
}

class TaffyNodeAdapter implements LayoutNode {
  constructor(private node: TaffyNode) {}

  async setWidth(width: number): Promise<void> {
    await this.node.setWidth(width);
  }

  async setHeight(height: number): Promise<void> {
    await this.node.setHeight(height);
  }

  async setWidthAuto(): Promise<void> {
    await this.node.setWidthAuto();
  }

  async setHeightAuto(): Promise<void> {
    await this.node.setHeightAuto();
  }

  async setWidthPercent(percent: number): Promise<void> {
    // Taffy accepts percentage strings like "100%"
    await this.node.setStyle({ width: `${percent}%` });
  }

  async setHeightPercent(percent: number): Promise<void> {
    // Taffy accepts percentage strings like "100%"
    await this.node.setStyle({ height: `${percent}%` });
  }

  async setMaxHeight(height: number): Promise<void> {
    await this.node.setMaxHeight(height);
  }

  async setMaxWidth(width: number): Promise<void> {
    await this.node.setMaxWidth(width);
  }

  async setMinHeight(height: number): Promise<void> {
    await this.node.setMinHeight(height);
  }

  async setMinWidth(width: number): Promise<void> {
    await this.node.setMinWidth(width);
  }

  async setMaxHeightPercent(percent: number): Promise<void> {
    await this.node.setStyle({ maxHeight: `${percent}%` });
  }

  async setMaxWidthPercent(percent: number): Promise<void> {
    await this.node.setStyle({ maxWidth: `${percent}%` });
  }

  async setMinHeightPercent(percent: number): Promise<void> {
    await this.node.setStyle({ minHeight: `${percent}%` });
  }

  async setMinWidthPercent(percent: number): Promise<void> {
    await this.node.setStyle({ minWidth: `${percent}%` });
  }

  async setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): Promise<void> {
    await this.node.setFlexDirection(direction);
  }

  async setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): Promise<void> {
    await this.node.setFlexWrap(wrap);
  }

  async setFlexBasis(basis: string | number): Promise<void> {
    await this.node.setFlexBasis(basis);
  }

  async setFlexGrow(grow: number): Promise<void> {
    await this.node.setFlexGrow(grow);
  }

  async setFlexShrink(shrink: number): Promise<void> {
    await this.node.setFlexShrink(shrink);
  }

  async setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): Promise<void> {
    await this.node.setAlignContent(align as any);
  }

  async setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void> {
    await this.node.setAlignItems(align as any);
  }

  async setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void> {
    await this.node.setAlignSelf(align as any);
  }

  async setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): Promise<void> {
    await this.node.setJustifyContent(justify);
  }

  async setGap(gap: number): Promise<void> {
    await this.node.setGap(gap);
  }

  async setRowGap(gap: number): Promise<void> {
    await this.node.setRowGap(gap);
  }

  async setColumnGap(gap: number): Promise<void> {
    await this.node.setColumnGap(gap);
  }

  async setMargin(top: number, right: number, bottom: number, left: number): Promise<void> {
    await this.node.setMargin(top, right, bottom, left);
  }

  async setBorder(top: number, right: number, bottom: number, left: number): Promise<void> {
    await this.node.setBorder(top, right, bottom, left);
  }

  async setPadding(top: number, right: number, bottom: number, left: number): Promise<void> {
    await this.node.setPadding(top, right, bottom, left);
  }

  async setPositionType(position: 'relative' | 'absolute'): Promise<void> {
    await this.node.setPositionType(position);
  }

  async setTop(top: number): Promise<void> {
    await this.node.setTop(top);
  }

  async setBottom(bottom: number): Promise<void> {
    await this.node.setBottom(bottom);
  }

  async setLeft(left: number): Promise<void> {
    await this.node.setLeft(left);
  }

  async setRight(right: number): Promise<void> {
    await this.node.setRight(right);
  }

  async setDisplay(display: 'flex' | 'none'): Promise<void> {
    await this.node.setDisplay(display);
  }

  async setOverflow(overflow: 'visible' | 'hidden'): Promise<void> {
    await this.node.setOverflow(overflow);
  }

  async setAspectRatio(ratio: number): Promise<void> {
    await this.node.setAspectRatio(ratio);
  }

  async calculateLayout(availableSpace?: number): Promise<void> {
    await this.node.calculateLayout(availableSpace);
  }

  async getComputedLayout(): Promise<{ left: number; top: number; width: number; height: number; }> {
    return await this.node.getComputedLayout();
  }

  async getComputedWidth(): Promise<number> {
    return await this.node.getComputedWidth();
  }

  async getComputedHeight(): Promise<number> {
    return await this.node.getComputedHeight();
  }

  async getComputedLeft(): Promise<number> {
    return await this.node.getComputedLeft();
  }

  async getComputedTop(): Promise<number> {
    return await this.node.getComputedTop();
  }

  async getComputedPadding(edge: number): Promise<number> {
    // Taffy doesn't have direct getComputedPadding, so we need to access the style
    // For now, return the raw style values. Edge constants: 0=top, 1=right, 2=bottom, 3=left
    const style = await this.node.getStyle();
    switch (edge) {
      case 0: return Number(style.paddingTop) || 0; // top
      case 1: return Number(style.paddingRight) || 0; // right
      case 2: return Number(style.paddingBottom) || 0; // bottom
      case 3: return Number(style.paddingLeft) || 0; // left
      default: return 0;
    }
  }

  async getComputedBorder(edge: number): Promise<number> {
    // Taffy doesn't have direct getComputedBorder, so we need to access the style
    const style = await this.node.getStyle();
    switch (edge) {
      case 0: return Number(style.borderTop) || 0; // top
      case 1: return Number(style.borderRight) || 0; // right
      case 2: return Number(style.borderBottom) || 0; // bottom
      case 3: return Number(style.borderLeft) || 0; // left
      default: return 0;
    }
  }

  async getComputedMargin(edge: number): Promise<number> {
    // Taffy doesn't have direct getComputedMargin, so we need to access the style
    const style = await this.node.getStyle();
    switch (edge) {
      case 0: return Number(style.marginTop) || 0; // top
      case 1: return Number(style.marginRight) || 0; // right
      case 2: return Number(style.marginBottom) || 0; // bottom
      case 3: return Number(style.marginLeft) || 0; // left
      default: return 0;
    }
  }

  async insertChild(child: LayoutNode, index: number): Promise<void> {
    if (child instanceof TaffyNodeAdapter) {
      await this.node.insertChild(child.getNode(), index);
    }
  }

  async getChildCount(): Promise<number> {
    return await this.node.getChildCount();
  }

  getNode() {
    return this.node;
  }

  // Edge-based methods (converting to Taffy calls)
  async setMarginEdge(edge: number, value: number): Promise<void> {
    const current = await this.node.getStyle();
    const margins = {
      marginTop: Number(current.marginTop) || 0,
      marginRight: Number(current.marginRight) || 0, 
      marginBottom: Number(current.marginBottom) || 0,
      marginLeft: Number(current.marginLeft) || 0
    };
    
    // Edge constants: 0=top, 1=right, 2=bottom, 3=left
    switch (edge) {
      case 0: margins.marginTop = value; break;
      case 1: margins.marginRight = value; break;
      case 2: margins.marginBottom = value; break;
      case 3: margins.marginLeft = value; break;
    }
    
    await this.node.setMargin(margins.marginTop, margins.marginRight, margins.marginBottom, margins.marginLeft);
  }

  async setBorderEdge(edge: number, value: number): Promise<void> {
    const current = await this.node.getStyle();
    const borders = {
      borderTop: Number(current.borderTop) || 0,
      borderRight: Number(current.borderRight) || 0,
      borderBottom: Number(current.borderBottom) || 0,
      borderLeft: Number(current.borderLeft) || 0
    };
    
    switch (edge) {
      case 0: borders.borderTop = value; break;
      case 1: borders.borderRight = value; break;
      case 2: borders.borderBottom = value; break;
      case 3: borders.borderLeft = value; break;
    }
    
    await this.node.setBorder(borders.borderTop, borders.borderRight, borders.borderBottom, borders.borderLeft);
  }

  async setPaddingEdge(edge: number, value: number): Promise<void> {
    const current = await this.node.getStyle();
    const paddings = {
      paddingTop: Number(current.paddingTop) || 0,
      paddingRight: Number(current.paddingRight) || 0,
      paddingBottom: Number(current.paddingBottom) || 0,
      paddingLeft: Number(current.paddingLeft) || 0
    };
    
    switch (edge) {
      case 0: paddings.paddingTop = value; break;
      case 1: paddings.paddingRight = value; break;
      case 2: paddings.paddingBottom = value; break;
      case 3: paddings.paddingLeft = value; break;
    }
    
    await this.node.setPadding(paddings.paddingTop, paddings.paddingRight, paddings.paddingBottom, paddings.paddingLeft);
  }

  async setGapGutter(gutter: number, value: number): Promise<void> {
    // Gutter constants: 0=all, 1=row, 2=column
    switch (gutter) {
      case 0: await this.node.setGap(value); break;
      case 1: await this.node.setRowGap(value); break;
      case 2: await this.node.setColumnGap(value); break;
    }
  }

  async setPosition(edge: number, value: number): Promise<void> {
    // Edge constants: 0=top, 1=right, 2=bottom, 3=left
    switch (edge) {
      case 0: await this.node.setTop(value); break;
      case 1: await this.node.setRight(value); break;
      case 2: await this.node.setBottom(value); break;
      case 3: await this.node.setLeft(value); break;
    }
  }
}
