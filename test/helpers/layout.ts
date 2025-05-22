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

export function getTaffyLayout(node: TaffyNode): LayoutResult {
  return {
    width: node.getComputedWidth(),
    height: node.getComputedHeight(),
    left: node.getComputedLeft(),
    top: node.getComputedTop()
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
    taffy: (node: TaffyNode) => {
      node.setWidth(100)
      node.setHeight(100)
    }
  },
  flexRow: {
    yoga: (node: YogaNode, Yoga: any) => {
      node.setWidth(200)
      node.setHeight(100)
      node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
    },
    taffy: (node: TaffyNode) => {
      node.setWidth(200)
      node.setHeight(100)
      node.setFlexDirection('row')
    }
  },
  flexColumn: {
    yoga: (node: YogaNode, Yoga: any) => {
      node.setWidth(100)
      node.setHeight(200)
      node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN)
    },
    taffy: (node: TaffyNode) => {
      node.setWidth(100)
      node.setHeight(200)
      node.setFlexDirection('column')
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
    taffy: (node: TaffyNode) => {
      node.setWidth(300)
      node.setHeight(100)
      node.setFlexDirection('row')
      node.setAlignItems('center')
      node.setJustifyContent('center')
    }
  }
} 