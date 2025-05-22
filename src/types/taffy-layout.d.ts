declare module '@loading/taffy' {
  export interface ComputedLayout {
    width: number;
    height: number;
    x: number;
    y: number;
    child(index: number): ComputedLayout;
  }

  export interface TaffyStyle {
    width?: number;
    height?: number;
    marginTop?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    flexGrow?: number;
    flexShrink?: number;
  }

  export interface TaffyTree {
    new(): TaffyTree;
  }

  export interface Node {
    new(tree: TaffyTree, style?: TaffyStyle): Node;
    addChild(child: Node): void;
    computeLayout(availableSpace: number): ComputedLayout;
  }

  export function instantiate(): Promise<{
    Node: Node;
    TaffyTree: TaffyTree;
  }>;
} 