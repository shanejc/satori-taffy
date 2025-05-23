import type { Yoga } from 'yoga-wasm-web';
import type { LayoutEngine, LayoutNode } from './interface.js';

class YogaNodeAdapter implements LayoutNode {
  constructor(private node: any, private yoga: Yoga) {}

  async setWidth(width: number): Promise<void> {
    this.node.setWidth(width);
  }

  async setHeight(height: number): Promise<void> {
    this.node.setHeight(height);
  }

  async setWidthAuto(): Promise<void> {
    this.node.setWidthAuto();
  }

  async setHeightAuto(): Promise<void> {
    this.node.setHeightAuto();
  }

  async setMaxHeight(height: number): Promise<void> {
    this.node.setMaxHeight(height);
  }

  async setMaxWidth(width: number): Promise<void> {
    this.node.setMaxWidth(width);
  }

  async setMinHeight(height: number): Promise<void> {
    this.node.setMinHeight(height);
  }

  async setMinWidth(width: number): Promise<void> {
    this.node.setMinWidth(width);
  }

  async setFlexDirection(direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'): Promise<void> {
    const directionMap = {
      'row': this.yoga.FLEX_DIRECTION_ROW,
      'column': this.yoga.FLEX_DIRECTION_COLUMN,
      'row-reverse': this.yoga.FLEX_DIRECTION_ROW_REVERSE,
      'column-reverse': this.yoga.FLEX_DIRECTION_COLUMN_REVERSE
    };
    this.node.setFlexDirection(directionMap[direction]);
  }

  async setFlexWrap(wrap: 'nowrap' | 'wrap' | 'wrap-reverse'): Promise<void> {
    const wrapMap = {
      'nowrap': this.yoga.WRAP_NO_WRAP,
      'wrap': this.yoga.WRAP_WRAP,
      'wrap-reverse': this.yoga.WRAP_WRAP_REVERSE
    };
    this.node.setFlexWrap(wrapMap[wrap]);
  }

  async setFlexBasis(basis: number): Promise<void> {
    this.node.setFlexBasis(basis);
  }

  async setFlexGrow(grow: number): Promise<void> {
    this.node.setFlexGrow(grow);
  }

  async setFlexShrink(shrink: number): Promise<void> {
    this.node.setFlexShrink(shrink);
  }

  async setAlignContent(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'space-between' | 'space-around' | 'auto'): Promise<void> {
    const alignMap = {
      'flex-start': this.yoga.ALIGN_FLEX_START,
      'flex-end': this.yoga.ALIGN_FLEX_END,
      'center': this.yoga.ALIGN_CENTER,
      'stretch': this.yoga.ALIGN_STRETCH,
      'baseline': this.yoga.ALIGN_BASELINE,
      'space-between': this.yoga.ALIGN_SPACE_BETWEEN,
      'space-around': this.yoga.ALIGN_SPACE_AROUND,
      'auto': this.yoga.ALIGN_AUTO
    };
    this.node.setAlignContent(alignMap[align]);
  }

  async setAlignItems(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void> {
    const alignMap = {
      'flex-start': this.yoga.ALIGN_FLEX_START,
      'flex-end': this.yoga.ALIGN_FLEX_END,
      'center': this.yoga.ALIGN_CENTER,
      'stretch': this.yoga.ALIGN_STRETCH,
      'baseline': this.yoga.ALIGN_BASELINE,
      'auto': this.yoga.ALIGN_AUTO
    };
    this.node.setAlignItems(alignMap[align]);
  }

  async setAlignSelf(align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'): Promise<void> {
    const alignMap = {
      'flex-start': this.yoga.ALIGN_FLEX_START,
      'flex-end': this.yoga.ALIGN_FLEX_END,
      'center': this.yoga.ALIGN_CENTER,
      'stretch': this.yoga.ALIGN_STRETCH,
      'baseline': this.yoga.ALIGN_BASELINE,
      'auto': this.yoga.ALIGN_AUTO
    };
    this.node.setAlignSelf(alignMap[align]);
  }

  async setJustifyContent(justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'): Promise<void> {
    const justifyMap = {
      'flex-start': this.yoga.JUSTIFY_FLEX_START,
      'flex-end': this.yoga.JUSTIFY_FLEX_END,
      'center': this.yoga.JUSTIFY_CENTER,
      'space-between': this.yoga.JUSTIFY_SPACE_BETWEEN,
      'space-around': this.yoga.JUSTIFY_SPACE_AROUND
    };
    this.node.setJustifyContent(justifyMap[justify]);
  }

  async setGap(gap: number): Promise<void> {
    this.node.setGap(this.yoga.GUTTER_ALL, gap);
  }

  async setRowGap(gap: number): Promise<void> {
    this.node.setGap(this.yoga.GUTTER_ROW, gap);
  }

  async setColumnGap(gap: number): Promise<void> {
    this.node.setGap(this.yoga.GUTTER_COLUMN, gap);
  }

  async setMargin(top: number, right: number, bottom: number, left: number): Promise<void> {
    this.node.setMargin(this.yoga.EDGE_TOP, top);
    this.node.setMargin(this.yoga.EDGE_RIGHT, right);
    this.node.setMargin(this.yoga.EDGE_BOTTOM, bottom);
    this.node.setMargin(this.yoga.EDGE_LEFT, left);
  }

  async setBorder(top: number, right: number, bottom: number, left: number): Promise<void> {
    this.node.setBorder(this.yoga.EDGE_TOP, top);
    this.node.setBorder(this.yoga.EDGE_RIGHT, right);
    this.node.setBorder(this.yoga.EDGE_BOTTOM, bottom);
    this.node.setBorder(this.yoga.EDGE_LEFT, left);
  }

  async setPadding(top: number, right: number, bottom: number, left: number): Promise<void> {
    this.node.setPadding(this.yoga.EDGE_TOP, top);
    this.node.setPadding(this.yoga.EDGE_RIGHT, right);
    this.node.setPadding(this.yoga.EDGE_BOTTOM, bottom);
    this.node.setPadding(this.yoga.EDGE_LEFT, left);
  }

  async setPositionType(position: 'relative' | 'absolute'): Promise<void> {
    const positionMap = {
      'relative': this.yoga.POSITION_TYPE_RELATIVE,
      'absolute': this.yoga.POSITION_TYPE_ABSOLUTE
    };
    this.node.setPositionType(positionMap[position]);
  }

  async setTop(top: number): Promise<void> {
    this.node.setPosition(this.yoga.EDGE_TOP, top);
  }

  async setBottom(bottom: number): Promise<void> {
    this.node.setPosition(this.yoga.EDGE_BOTTOM, bottom);
  }

  async setLeft(left: number): Promise<void> {
    this.node.setPosition(this.yoga.EDGE_LEFT, left);
  }

  async setRight(right: number): Promise<void> {
    this.node.setPosition(this.yoga.EDGE_RIGHT, right);
  }

  async setDisplay(display: 'flex' | 'none'): Promise<void> {
    const displayMap = {
      'flex': this.yoga.DISPLAY_FLEX,
      'none': this.yoga.DISPLAY_NONE
    };
    this.node.setDisplay(displayMap[display]);
  }

  async setOverflow(overflow: 'visible' | 'hidden'): Promise<void> {
    const overflowMap = {
      'visible': this.yoga.OVERFLOW_VISIBLE,
      'hidden': this.yoga.OVERFLOW_HIDDEN
    };
    this.node.setOverflow(overflowMap[overflow]);
  }

  async setAspectRatio(ratio: number): Promise<void> {
    this.node.setAspectRatio(ratio);
  }

  async calculateLayout(availableSpace?: number): Promise<void> {
    this.node.calculateLayout(availableSpace);
  }

  async getComputedLayout(): Promise<{ left: number; top: number; width: number; height: number; }> {
    return {
      left: this.node.getComputedLeft(),
      top: this.node.getComputedTop(),
      width: this.node.getComputedWidth(),
      height: this.node.getComputedHeight()
    };
  }

  async getComputedWidth(): Promise<number> {
    return this.node.getComputedWidth();
  }

  async getComputedHeight(): Promise<number> {
    return this.node.getComputedHeight();
  }

  async getComputedLeft(): Promise<number> {
    return this.node.getComputedLeft();
  }

  async getComputedTop(): Promise<number> {
    return this.node.getComputedTop();
  }

  async getComputedPadding(edge: number): Promise<number> {
    return this.node.getComputedPadding(edge);
  }

  async getComputedBorder(edge: number): Promise<number> {
    return this.node.getComputedBorder(edge);
  }

  async getComputedMargin(edge: number): Promise<number> {
    return this.node.getComputedMargin(edge);
  }

  async insertChild(child: LayoutNode, index: number): Promise<void> {
    if (child instanceof YogaNodeAdapter) {
      this.node.insertChild(child.getNode(), index);
    }
  }

  async getChildCount(): Promise<number> {
    return this.node.getChildCount();
  }

  getNode() {
    return this.node;
  }
}

export class YogaAdapter implements LayoutEngine {
  constructor(private yoga: Yoga) {}

  async create(): Promise<LayoutNode> {
    return new YogaNodeAdapter(this.yoga.Node.create(), this.yoga);
  }
} 