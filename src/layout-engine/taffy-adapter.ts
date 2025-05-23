import type { TaffyNode } from '../taffy/taffy-prebuilt.js';
import type { LayoutEngine, LayoutNode } from './interface.js';

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

  async setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): Promise<void> {
    await this.node.setFlexDirection(direction);
  }

  async setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): Promise<void> {
    await this.node.setFlexWrap(wrap);
  }

  async setFlexBasis(basis: number): Promise<void> {
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
}

export class TaffyAdapter implements LayoutEngine {
  constructor(private taffyClass: typeof TaffyNode) {}

  async create(): Promise<LayoutNode> {
    const node = await this.taffyClass.create();
    return new TaffyNodeAdapter(node);
  }
} 