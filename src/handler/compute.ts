/**
 * Handler to update the Yoga node properties with the given element type and
 * style. Each supported element has its own preset styles, so this function
 * also returns the inherited style for children of the element.
 */

import presets from './presets.js'
import inheritable from './inheritable.js'
import expand, { SerializedStyle } from './expand.js'
import { lengthToNumber, parseViewBox, v } from '../utils.js'
import { resolveImageData } from './image.js'
import { LayoutNode } from '../layout-engine/interface.js'
import { getLayoutEngineType } from '../layout-engine/factory.js'
import { LAYOUT_ENGINE_YOGA, LAYOUT_ENGINE_TAFFY } from '../layout-engine/constants.js'
import {
  DISPLAY_FLEX,
  DISPLAY_NONE,
  DISPLAY_GRID,
  FLEX_DIRECTION_ROW,
  FLEX_DIRECTION_COLUMN,
  FLEX_DIRECTION_ROW_REVERSE,
  FLEX_DIRECTION_COLUMN_REVERSE,
  WRAP_WRAP,
  WRAP_NO_WRAP,
  WRAP_WRAP_REVERSE,
  ALIGN_STRETCH,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_FLEX_END,
  ALIGN_SPACE_BETWEEN,
  ALIGN_SPACE_AROUND,
  ALIGN_BASELINE,
  ALIGN_AUTO,
  JUSTIFY_FLEX_START,
  POSITION_TYPE_RELATIVE,
  POSITION_TYPE_ABSOLUTE,
  OVERFLOW_VISIBLE,
  OVERFLOW_HIDDEN,
  EDGE_TOP,
  EDGE_RIGHT,
  EDGE_BOTTOM,
  EDGE_LEFT
} from '../layout-engine/constants.js'

function setDimension(
  value: number | string | undefined,
  node: LayoutNode,
  setNumber: (this: LayoutNode, val: number) => void,
  setPercent: (this: LayoutNode, val: number) => void,
  setAuto?: (this: LayoutNode) => void
) {
  if (typeof value === 'number') {
    setNumber.call(node, value)
  } else if (typeof value === 'string') {
    if (value.endsWith('%')) {
      const percent = parseFloat(value)
      if (!isNaN(percent)) {
        setPercent.call(node, percent)
      }
    } else {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        setNumber.call(node, num)
      }
    }
  } else if (setAuto) {
    setAuto.call(node)
  }
}

function setEdgeValue(
  node: LayoutNode,
  topValue: number | string | undefined,
  rightValue: number | string | undefined,
  bottomValue: number | string | undefined,
  leftValue: number | string | undefined,
  setter: (this: LayoutNode, edge: number, value: number) => void
) {
  const convertValue = (value: number | string | undefined): number => {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      // Try to parse as number first (handles "10.5" strings)
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue) && value.trim() === String(numericValue)) {
        return numericValue
      }
      // If it has units, it should have been converted by expand() already
      // But as a fallback, return 0 instead of NaN
      return 0
    }
    return 0
  }

  setter.call(node, EDGE_TOP, convertValue(topValue))
  setter.call(node, EDGE_RIGHT, convertValue(rightValue))
  setter.call(node, EDGE_BOTTOM, convertValue(bottomValue))
  setter.call(node, EDGE_LEFT, convertValue(leftValue))
}

function setPositionValue(
  value: number | string | undefined,
  node: LayoutNode,
  setter: (this: LayoutNode, val: number) => void
) {
  if (typeof value !== 'undefined') {
    setter.call(node, typeof value === 'number' ? value : parseFloat(value))
  }
}

type SatoriElement = keyof typeof presets

export default async function compute(
  node: LayoutNode,
  type: SatoriElement | string,
  inheritedStyle: SerializedStyle,
  definedStyle: Record<string, string | number>,
  props: Record<string, any>
): Promise<[SerializedStyle, SerializedStyle]> {

  // Extend the default style with defined and inherited styles.
  const style: SerializedStyle = {
    ...inheritedStyle,
    ...expand(presets[type], inheritedStyle),
    ...expand(definedStyle, inheritedStyle),
  }

  // Check for CSS Grid usage with Yoga engine and warn/fallback
  if (style.display === 'grid') {
    const currentEngine = getLayoutEngineType()
    if (currentEngine === LAYOUT_ENGINE_YOGA) {
      console.warn(
        'CSS Grid (display: "grid") is only supported with the Taffy layout engine. ' +
        'The current engine is Yoga. Falling back to flexbox layout. ' +
        'To use CSS Grid, switch to Taffy: setLayoutEngine("taffy")'
      )
      // Fallback to flexbox
      style.display = 'flex'
    }
  }

  if (type === 'img') {
    let [resolvedSrc, imageWidth, imageHeight] = await resolveImageData(
      props.src
    )

    // Cannot parse the image size (e.g. base64 data URI).
    if (imageWidth === undefined && imageHeight === undefined) {
      if (props.width === undefined || props.height === undefined) {
        throw new Error(
          'Image size cannot be determined. Please provide the width and height of the image.'
        )
      }
      imageWidth = parseInt(props.width)
      imageHeight = parseInt(props.height)
    }
    const r = imageHeight / imageWidth

    // Before calculating the missing width or height based on the image ratio,
    // we must subtract the padding and border due to how box model works.
    // TODO: Ensure these are absolute length values, not relative values.
    let extraHorizontal =
      (style.borderLeftWidth || 0) +
      (style.borderRightWidth || 0) +
      (style.paddingLeft || 0) +
      (style.paddingRight || 0)
    let extraVertical =
      (style.borderTopWidth || 0) +
      (style.borderBottomWidth || 0) +
      (style.paddingTop || 0) +
      (style.paddingBottom || 0)

    let contentBoxWidth = style.width || props.width
    let contentBoxHeight = style.height || props.height

    const isAbsoluteContentSize =
      typeof contentBoxWidth === 'number' &&
      typeof contentBoxHeight === 'number'

    if (isAbsoluteContentSize) {
      contentBoxWidth -= extraHorizontal
      contentBoxHeight -= extraVertical
    }

    // Store original image dimensions and ratio for use in measure function
    const originalImageWidth = imageWidth
    const originalImageHeight = imageHeight
    const aspectRatio = originalImageWidth / originalImageHeight

    // Set up measurement function for images with max constraints but no explicit size
    const hasMaxConstraints = style.maxWidth || style.maxHeight
    const hasNoExplicitSize = contentBoxWidth === undefined && contentBoxHeight === undefined

    if (hasMaxConstraints && (hasNoExplicitSize || contentBoxWidth === '100%')) {
      node.setMeasureFunc((availableWidth: number, availableHeight?: number) => {
        // Handle MinContent constraint - return intrinsic image size
        if (availableWidth === 0) {
          return {
            width: originalImageWidth,
            height: originalImageHeight
          }
        }
        
        // Convert percentage max values to absolute values
        let maxWidth: number | undefined = undefined
        let maxHeight: number | undefined = undefined
        
        if (style.maxWidth) {
          if (typeof style.maxWidth === 'string' && style.maxWidth.endsWith('%')) {
            const percent = parseFloat(style.maxWidth) / 100
            maxWidth = availableWidth * percent
          } else if (typeof style.maxWidth === 'number') {
            maxWidth = style.maxWidth
          }
        }
        
        if (style.maxHeight) {
          if (typeof style.maxHeight === 'string' && style.maxHeight.endsWith('%')) {
            const percent = parseFloat(style.maxHeight) / 100
            // Now we can use the actual available height provided by Taffy!
            maxHeight = availableHeight !== undefined ? availableHeight * percent : undefined
          } else if (typeof style.maxHeight === 'number') {
            maxHeight = style.maxHeight
          }
        }
        
        // Also consider the available container space as implicit max constraints
        if (availableWidth > 0) {
          maxWidth = maxWidth !== undefined ? Math.min(maxWidth, availableWidth) : availableWidth
        }
        
        if (availableHeight !== undefined && availableHeight > 0) {
          maxHeight = maxHeight !== undefined ? Math.min(maxHeight, availableHeight) : availableHeight
        }
        
        // Start with intrinsic image size
        let finalWidth = originalImageWidth
        let finalHeight = originalImageHeight
        
        // Scale up to utilize available space while respecting max constraints
        if (maxWidth !== undefined && maxWidth > finalWidth) {
          // Scale up to max width
          finalWidth = maxWidth
          finalHeight = finalWidth / aspectRatio
        }
        
        // Apply max-height constraint while preserving aspect ratio
        if (maxHeight !== undefined && finalHeight > maxHeight) {
          finalHeight = maxHeight
          finalWidth = finalHeight * aspectRatio
        }
        
        return {
          width: Math.max(0, finalWidth),
          height: Math.max(0, finalHeight)
        }
      })
    }

    // When no content size is defined, we use the image size as the content size.
    if (contentBoxWidth === undefined && contentBoxHeight === undefined) {
      // For images with max constraints, don't set explicit size - let measurement function handle it
      // This ensures the layout engine will call our measurement function
      if (!hasMaxConstraints) {
        contentBoxWidth = '100%'
      }
      if (r) {
        node.setAspectRatio(1 / r)
      }
    } else {
      // If only one sisde is not defined, we can calculate the other one.
      if (contentBoxWidth === undefined) {
        if (typeof contentBoxHeight === 'number') {
          contentBoxWidth = contentBoxHeight / r
        } else {
          // If it uses a relative value (e.g. 50%), we can rely on aspect ratio.
          // Note: this doesn't work well if there are paddings or borders.
          if (r) {
            node.setAspectRatio(1 / r)
          }
        }
      } else if (contentBoxHeight === undefined) {
        if (typeof contentBoxWidth === 'number') {
          contentBoxHeight = contentBoxWidth * r
        } else {
          // If it uses a relative value (e.g. 50%), we can rely on aspect ratio.
          // Note: this doesn't work well if there are paddings or borders.
          if (r) {
            node.setAspectRatio(1 / r)
          }
        }
      }
    }

    style.width = isAbsoluteContentSize
      ? (contentBoxWidth as number) + extraHorizontal
      : contentBoxWidth
    style.height = isAbsoluteContentSize
      ? (contentBoxHeight as number) + extraVertical
      : contentBoxHeight
    style.__src = resolvedSrc
  }

  if (type === 'svg') {
    const viewBox = props.viewBox || props.viewbox
    const viewBoxSize = parseViewBox(viewBox)
    const ratio = viewBoxSize ? viewBoxSize[3] / viewBoxSize[2] : null

    let { width, height } = props
    if (typeof width === 'undefined' && height) {
      if (ratio == null) {
        width = 0
      } else if (typeof height === 'string' && height.endsWith('%')) {
        width = parseInt(height) / ratio + '%'
      } else {
        height = lengthToNumber(
          height,
          inheritedStyle.fontSize,
          1,
          inheritedStyle
        )
        width = height / ratio
      }
    } else if (typeof height === 'undefined' && width) {
      if (ratio == null) {
        width = 0
      } else if (typeof width === 'string' && width.endsWith('%')) {
        height = parseInt(width) * ratio + '%'
      } else {
        width = lengthToNumber(
          width,
          inheritedStyle.fontSize,
          1,
          inheritedStyle
        )
        height = width * ratio
      }
    } else {
      if (typeof width !== 'undefined') {
        width =
          lengthToNumber(width, inheritedStyle.fontSize, 1, inheritedStyle) ||
          width
      }
      if (typeof height !== 'undefined') {
        height =
          lengthToNumber(height, inheritedStyle.fontSize, 1, inheritedStyle) ||
          height
      }
      width ||= viewBoxSize?.[2]
      height ||= viewBoxSize?.[3]
    }

    if (!style.width && width) style.width = width
    if (!style.height && height) style.height = height
  }


  if (type === 'image') {
    if (props.width !== undefined && !style.width) {
    }
    if (props.height !== undefined && !style.height) {
    }
  }

  // Set properties.
  node.setDisplay(
    v(
      style.display,
      {
        flex: DISPLAY_FLEX,
        grid: DISPLAY_GRID,
        block: DISPLAY_FLEX,
        none: DISPLAY_NONE,
        '-webkit-box': DISPLAY_FLEX,
      },
      DISPLAY_FLEX,
      'display'
    )
  )

  node.setAlignContent(
    v(
      style.alignContent,
      {
        stretch: ALIGN_STRETCH,
        center: ALIGN_CENTER,
        'flex-start': ALIGN_FLEX_START,
        'flex-end': ALIGN_FLEX_END,
        'space-between': ALIGN_SPACE_BETWEEN,
        'space-around': ALIGN_SPACE_AROUND,
        baseline: ALIGN_BASELINE,
        normal: ALIGN_AUTO,
      },
      ALIGN_AUTO,
      'alignContent'
    )
  )

  node.setAlignItems(
    v(
      style.alignItems,
      {
        stretch: ALIGN_STRETCH,
        center: ALIGN_CENTER,
        'flex-start': ALIGN_FLEX_START,
        'flex-end': ALIGN_FLEX_END,
        baseline: ALIGN_BASELINE,
        normal: ALIGN_AUTO,
      },
      ALIGN_STRETCH,
      'alignItems'
    )
  )
  await node.setAlignSelf(
    v(
      style.alignSelf,
      {
        stretch: ALIGN_STRETCH,
        center: ALIGN_CENTER,
        'flex-start': ALIGN_FLEX_START,
        'flex-end': ALIGN_FLEX_END,
        baseline: ALIGN_BASELINE,
        normal: ALIGN_AUTO,
      },
      ALIGN_AUTO,
      'alignSelf'
    ) as 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto'
  )
  
  node.setJustifyContent((style.justifyContent || JUSTIFY_FLEX_START) as 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around')
  // @TODO: await node.setAspectRatio

  node.setFlexDirection(
    v(
      style.flexDirection,
      {
        row: FLEX_DIRECTION_ROW,
        column: FLEX_DIRECTION_COLUMN,
        'row-reverse': FLEX_DIRECTION_ROW_REVERSE,
        'column-reverse': FLEX_DIRECTION_COLUMN_REVERSE,
      },
      FLEX_DIRECTION_ROW,
      'flexDirection'
    )
  )
  node.setFlexWrap(
    v(
      style.flexWrap,
      {
        wrap: WRAP_WRAP,
        nowrap: WRAP_NO_WRAP,
        'wrap-reverse': WRAP_WRAP_REVERSE,
      },
      WRAP_NO_WRAP,
      'flexWrap'
    )
  )

  if (typeof style.gap !== 'undefined') {
    node.setGap(style.gap)
  }

  if (typeof style.rowGap !== 'undefined') {
    node.setRowGap(style.rowGap)
  }

  if (typeof style.columnGap !== 'undefined') {
    node.setColumnGap(style.columnGap)
  }

  // @TODO: node.setFlex

  if (typeof style.flexBasis !== 'undefined') {
    node.setFlexBasis(style.flexBasis)
  }
  node.setFlexGrow(
    typeof style.flexGrow === 'undefined' ? 0 : style.flexGrow
  )
  node.setFlexShrink(
    typeof style.flexShrink === 'undefined' ? 1 : style.flexShrink
  )

  // Set grid template columns
  if (style.gridTemplateColumns && node.setGridTemplateColumns) {
    node.setGridTemplateColumns(style.gridTemplateColumns)
  }
  
  // Set grid template rows
  if (style.gridTemplateRows && node.setGridTemplateRows) {
    node.setGridTemplateRows(style.gridTemplateRows)
  }
  
  // Set grid template areas
  if (style.gridTemplateAreas && node.setGridTemplateAreas) {
    node.setGridTemplateAreas(style.gridTemplateAreas)
  }
  
  // Set grid auto flow
  if (style.gridAutoFlow && node.setGridAutoFlow) {
    node.setGridAutoFlow(style.gridAutoFlow)
  }
  
  // Set grid auto columns
  if (style.gridAutoColumns && node.setGridAutoColumns) {
    node.setGridAutoColumns(style.gridAutoColumns)
  }
  
  // Set grid auto rows
  if (style.gridAutoRows && node.setGridAutoRows) {
    node.setGridAutoRows(style.gridAutoRows)
  }
  
  // Set grid column/row for children
  if (style.gridColumn && node.setGridColumn) {
    node.setGridColumn(String(style.gridColumn))
  }
  
  if (style.gridRow && node.setGridRow) {
    node.setGridRow(String(style.gridRow))
  }

  setDimension(style.maxHeight, node, node.setMaxHeight, node.setMaxHeightPercent)
  setDimension(style.maxWidth, node, node.setMaxWidth, node.setMaxWidthPercent)
  setDimension(style.minHeight, node, node.setMinHeight, node.setMinHeightPercent)
  setDimension(style.minWidth, node, node.setMinWidth, node.setMinWidthPercent)

  node.setOverflow(
    v(
      style.overflow,
      {
        visible: OVERFLOW_VISIBLE,
        hidden: OVERFLOW_HIDDEN,
      },
      OVERFLOW_VISIBLE,
      'overflow'
    )
  )

  setEdgeValue(node, style.marginTop, style.marginRight, style.marginBottom, style.marginLeft, node.setMarginEdge)
  setEdgeValue(node, style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth, node.setBorderEdge)
  setEdgeValue(node, style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft, node.setPaddingEdge)

  node.setPositionType(
    v(
      style.position,
      {
        absolute: POSITION_TYPE_ABSOLUTE,
        relative: POSITION_TYPE_RELATIVE,
      },
      POSITION_TYPE_RELATIVE,
      'position'
    )
  )

  setPositionValue(style.top, node, node.setTop)
  setPositionValue(style.bottom, node, node.setBottom)
  setPositionValue(style.left, node, node.setLeft)
  setPositionValue(style.right, node, node.setRight)

  setDimension(style.height, node, node.setHeight, node.setHeightPercent, node.setHeightAuto)
  setDimension(style.width, node, node.setWidth, node.setWidthPercent, node.setWidthAuto)

  return [style, inheritable(style)]
}
