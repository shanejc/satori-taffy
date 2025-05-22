import { it, describe, beforeAll } from 'vitest'
import { init as initYoga } from '../src/yoga/index.js'
import { init as initTaffy } from '../src/taffy/index.js'
import yoga from 'yoga-wasm-web/auto'
import { TaffyNode } from '../src/taffy/taffy-prebuilt.js'
import { compareLayouts, getYogaLayout, getTaffyLayout, testCases } from './helpers/layout.js'

describe('Taffy Layout Engine', () => {
  beforeAll(async () => {
    // Initialize both layout engines
    initYoga(yoga)
    initTaffy(TaffyNode)
  })

  it('should match Yoga layout for basic container', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = new TaffyNode()

    testCases.basicContainer.yoga(yogaNode)
    testCases.basicContainer.taffy(taffyNode)

    yogaNode.calculateLayout()
    taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for flex row container', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = new TaffyNode()

    testCases.flexRow.yoga(yogaNode, yoga)
    testCases.flexRow.taffy(taffyNode)

    yogaNode.calculateLayout()
    taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for flex column container', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = new TaffyNode()

    testCases.flexColumn.yoga(yogaNode, yoga)
    testCases.flexColumn.taffy(taffyNode)

    yogaNode.calculateLayout()
    taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for flex container with alignment', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = new TaffyNode()

    testCases.flexRowWithAlignment.yoga(yogaNode, yoga)
    testCases.flexRowWithAlignment.taffy(taffyNode)

    yogaNode.calculateLayout()
    taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for nested flex items', async () => {
    // Create parent nodes
    const yogaParent = yoga.Node.create()
    const taffyParent = new TaffyNode()

    testCases.flexRow.yoga(yogaParent, yoga)
    testCases.flexRow.taffy(taffyParent)

    // Create child nodes
    const yogaChild = yoga.Node.create()
    const taffyChild = new TaffyNode()

    testCases.basicContainer.yoga(yogaChild)
    testCases.basicContainer.taffy(taffyChild)

    yogaParent.insertChild(yogaChild, 0)
    taffyParent.insertChild(taffyChild, 0)

    // Calculate layouts
    yogaParent.calculateLayout()
    taffyParent.calculateLayout()

    // Compare parent layouts
    compareLayouts(getYogaLayout(yogaParent), getTaffyLayout(taffyParent))

    // Compare child layouts
    compareLayouts(getYogaLayout(yogaChild), getTaffyLayout(taffyChild))
  })

  it('should match Yoga layout for complex nested structure', async () => {
    // Create parent nodes
    const yogaParent = yoga.Node.create()
    const taffyParent = new TaffyNode()

    testCases.flexRowWithAlignment.yoga(yogaParent, yoga)
    testCases.flexRowWithAlignment.taffy(taffyParent)

    // Create first child with column layout
    const yogaChild1 = yoga.Node.create()
    const taffyChild1 = new TaffyNode()
    testCases.flexColumn.yoga(yogaChild1, yoga)
    testCases.flexColumn.taffy(taffyChild1)

    // Create second child with basic container
    const yogaChild2 = yoga.Node.create()
    const taffyChild2 = new TaffyNode()
    testCases.basicContainer.yoga(yogaChild2)
    testCases.basicContainer.taffy(taffyChild2)

    // Add children
    yogaParent.insertChild(yogaChild1, 0)
    yogaParent.insertChild(yogaChild2, 1)
    taffyParent.insertChild(taffyChild1, 0)
    taffyParent.insertChild(taffyChild2, 1)

    // Calculate layouts
    yogaParent.calculateLayout()
    taffyParent.calculateLayout()

    // Compare all layouts
    compareLayouts(getYogaLayout(yogaParent), getTaffyLayout(taffyParent))
    compareLayouts(getYogaLayout(yogaChild1), getTaffyLayout(taffyChild1))
    compareLayouts(getYogaLayout(yogaChild2), getTaffyLayout(taffyChild2))
  })
}) 