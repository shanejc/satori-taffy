import { it, describe, beforeAll } from 'vitest'
import { setLayoutEngine, initYoga, initTaffy } from '../src/index.js'
import yoga from 'yoga-wasm-web/auto'
import { TaffyNode } from '../src/taffy/taffy-prebuilt.js'
import { compareLayouts, getYogaLayout, getTaffyLayout, testCases } from './helpers/layout.js'

describe('Taffy Layout Engine', () => {
  beforeAll(async () => {
    // Initialize both layout engines
    setLayoutEngine('yoga')
    initYoga(yoga)
    
    setLayoutEngine('taffy')
    initTaffy(TaffyNode)
  })

  it('should match Yoga layout for basic container', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = await TaffyNode.create()

    testCases.basicContainer.yoga(yogaNode)
    await testCases.basicContainer.taffy(taffyNode)

    yogaNode.calculateLayout()
    await taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), await getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for flex row container', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = await TaffyNode.create()

    testCases.flexRow.yoga(yogaNode, yoga)
    await testCases.flexRow.taffy(taffyNode)

    yogaNode.calculateLayout()
    await taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), await getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for flex column container', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = await TaffyNode.create()

    testCases.flexColumn.yoga(yogaNode, yoga)
    await testCases.flexColumn.taffy(taffyNode)

    yogaNode.calculateLayout()
    await taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), await getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for flex container with alignment', async () => {
    const yogaNode = yoga.Node.create()
    const taffyNode = await TaffyNode.create()

    testCases.flexRowWithAlignment.yoga(yogaNode, yoga)
    await testCases.flexRowWithAlignment.taffy(taffyNode)

    yogaNode.calculateLayout()
    await taffyNode.calculateLayout()

    compareLayouts(getYogaLayout(yogaNode), await getTaffyLayout(taffyNode))
  })

  it('should match Yoga layout for nested flex items', async () => {
    // Create parent nodes
    const yogaParent = yoga.Node.create()
    const taffyParent = await TaffyNode.create()

    testCases.flexRow.yoga(yogaParent, yoga)
    await testCases.flexRow.taffy(taffyParent)

    // Create child nodes
    const yogaChild = yoga.Node.create()
    const taffyChild = await TaffyNode.create()

    testCases.basicContainer.yoga(yogaChild)
    await testCases.basicContainer.taffy(taffyChild)

    yogaParent.insertChild(yogaChild, 0)
    await taffyParent.insertChild(taffyChild, 0)

    // Calculate layouts
    yogaParent.calculateLayout()
    await taffyParent.calculateLayout()

    // Compare parent layouts
    compareLayouts(getYogaLayout(yogaParent), await getTaffyLayout(taffyParent))

    // Compare child layouts
    compareLayouts(getYogaLayout(yogaChild), await getTaffyLayout(taffyChild))
  })

  it('should match Yoga layout for complex nested structure', async () => {
    // Create parent nodes
    const yogaParent = yoga.Node.create()
    const taffyParent = await TaffyNode.create()

    testCases.flexRowWithAlignment.yoga(yogaParent, yoga)
    await testCases.flexRowWithAlignment.taffy(taffyParent)

    // Create first child with column layout
    const yogaChild1 = yoga.Node.create()
    const taffyChild1 = await TaffyNode.create()
    testCases.flexColumn.yoga(yogaChild1, yoga)
    await testCases.flexColumn.taffy(taffyChild1)

    // Create second child with basic container
    const yogaChild2 = yoga.Node.create()
    const taffyChild2 = await TaffyNode.create()
    testCases.basicContainer.yoga(yogaChild2)
    await testCases.basicContainer.taffy(taffyChild2)

    // Add children
    yogaParent.insertChild(yogaChild1, 0)
    yogaParent.insertChild(yogaChild2, 1)
    await taffyParent.insertChild(taffyChild1, 0)
    await taffyParent.insertChild(taffyChild2, 1)

    // Calculate layouts
    yogaParent.calculateLayout()
    await taffyParent.calculateLayout()

    // Compare all layouts
    compareLayouts(getYogaLayout(yogaParent), await getTaffyLayout(taffyParent))
    compareLayouts(getYogaLayout(yogaChild1), await getTaffyLayout(taffyChild1))
    compareLayouts(getYogaLayout(yogaChild2), await getTaffyLayout(taffyChild2))
  })
}) 