import { expect } from 'vitest'
import type { Node as YogaNode } from 'yoga-wasm-web'
import type { TaffyNode } from '../../src/taffy/taffy-prebuilt.js'

export interface LayoutResult {
  width: number
  height: number
  left: number
  top: number
}

export function getYogaLayout(node: YogaNode): LayoutResult {
  return {
    width: node.getComputedWidth(),
    height: node.getComputedHeight(),
    left: node.getComputedLeft(),
    top: node.getComputedTop()
  }
}

export async function getTaffyLayout(node: TaffyNode): Promise<LayoutResult> {
  return {
    width: await node.getComputedWidth(),
    height: await node.getComputedHeight(),
    left: await node.getComputedLeft(),
    top: await node.getComputedTop()
  }
}

export function compareLayouts(yogaLayout: LayoutResult, taffyLayout: LayoutResult, precision = 1) {
  expect(taffyLayout.width).toBeCloseTo(yogaLayout.width, precision)
  expect(taffyLayout.height).toBeCloseTo(yogaLayout.height, precision)
  expect(taffyLayout.left).toBeCloseTo(yogaLayout.left, precision)
  expect(taffyLayout.top).toBeCloseTo(yogaLayout.top, precision)
}

// Common test cases that both engines should handle
export const testCases = {
  basicContainer: {
    yoga: (node: YogaNode) => {
      node.setWidth(100)
      node.setHeight(100)
    },
    taffy: async (node: TaffyNode) => {
      await node.setWidth(100)
      await node.setHeight(100)
    }
  },
  flexRow: {
    yoga: (node: YogaNode, Yoga: any) => {
      node.setWidth(200)
      node.setHeight(100)
      node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
    },
    taffy: async (node: TaffyNode) => {
      await node.setWidth(200)
      await node.setHeight(100)
      await node.setFlexDirection('row')
    }
  },
  flexColumn: {
    yoga: (node: YogaNode, Yoga: any) => {
      node.setWidth(100)
      node.setHeight(200)
      node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
    },
    taffy: async (node: TaffyNode) => {
      await node.setWidth(100)
      await node.setHeight(200)
      await node.setFlexDirection('column')
    }
  },
  flexRowWithAlignment: {
    yoga: (node: YogaNode, Yoga: any) => {
      node.setWidth(300)
      node.setHeight(100)
      node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
      node.setAlignItems(Yoga.ALIGN_CENTER)
      node.setJustifyContent(Yoga.JUSTIFY_CENTER)
    },
    taffy: async (node: TaffyNode) => {
      await node.setWidth(300)
      await node.setHeight(100)
      await node.setFlexDirection('row')
      await node.setAlignItems('center')
      await node.setJustifyContent('center')
    }
  }
} 