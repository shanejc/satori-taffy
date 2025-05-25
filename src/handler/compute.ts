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
import { getLayoutEngine } from '../layout-engine/factory.js'
import {
  DISPLAY_FLEX,
  DISPLAY_NONE,
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
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_AROUND,
  POSITION_TYPE_RELATIVE,
  POSITION_TYPE_ABSOLUTE,
  OVERFLOW_VISIBLE,
  OVERFLOW_HIDDEN,
  EDGE_TOP,
  EDGE_RIGHT,
  EDGE_BOTTOM,
  EDGE_LEFT,
  EDGE_ALL,
  GUTTER_ALL,
  GUTTER_COLUMN,
  GUTTER_ROW
} from '../layout-engine/constants.js'

type SatoriElement = keyof typeof presets

export default async function compute(
  node: LayoutNode,
  type: SatoriElement | string,
  inheritedStyle: SerializedStyle,
  definedStyle: Record<string, string | number>,
  props: Record<string, any>
): Promise<[SerializedStyle, SerializedStyle]> {
  await getLayoutEngine()

  // Extend the default style with defined and inherited styles.
  const style: SerializedStyle = {
    ...inheritedStyle,
    ...expand(presets[type], inheritedStyle),
    ...expand(definedStyle, inheritedStyle),
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

    // When no content size is defined, we use the image size as the content size.
    if (contentBoxWidth === undefined && contentBoxHeight === undefined) {
      contentBoxWidth = '100%'
      node.setAspectRatio(1 / r)
    } else {
      // If only one sisde is not defined, we can calculate the other one.
      if (contentBoxWidth === undefined) {
        if (typeof contentBoxHeight === 'number') {
          contentBoxWidth = contentBoxHeight / r
        } else {
          // If it uses a relative value (e.g. 50%), we can rely on aspect ratio.
          // Note: this doesn't work well if there are paddings or borders.
          node.setAspectRatio(1 / r)
        }
      } else if (contentBoxHeight === undefined) {
        if (typeof contentBoxWidth === 'number') {
          contentBoxHeight = contentBoxWidth * r
        } else {
          // If it uses a relative value (e.g. 50%), we can rely on aspect ratio.
          // Note: this doesn't work well if there are paddings or borders.
          node.setAspectRatio(1 / r)
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


  // Handle SVG image elements (similar to img elements but simpler)
  if (type === 'image') {
    // For SVG image elements, we just need to convert width/height props to styles
    if (props.width !== undefined && !style.width) {
      const convertedWidth = lengthToNumber(props.width, inheritedStyle.fontSize, 1, inheritedStyle) || props.width
      style.width = convertedWidth
    }
    if (props.height !== undefined && !style.height) {
      const convertedHeight = lengthToNumber(props.height, inheritedStyle.fontSize, 1, inheritedStyle) || props.height
      style.height = convertedHeight
    }
  }

  // Set properties for Yoga.
  node.setDisplay(
    v(
      style.display,
      {
        flex: DISPLAY_FLEX,
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
  node.setAlignSelf(
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
    )
  )
  node.setJustifyContent(
    v(
      style.justifyContent,
      {
        center: JUSTIFY_CENTER,
        'flex-start': JUSTIFY_FLEX_START,
        'flex-end': JUSTIFY_FLEX_END,
        'space-between': JUSTIFY_SPACE_BETWEEN,
        'space-around': JUSTIFY_SPACE_AROUND,
      },
      JUSTIFY_FLEX_START,
      'justifyContent'
    )
  )
  // @TODO: node.setAspectRatio

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
  node.setFlexGrow(typeof style.flexGrow === 'undefined' ? 0 : style.flexGrow)
  node.setFlexShrink(
    typeof style.flexShrink === 'undefined' ? 0 : style.flexShrink
  )

  if (typeof style.maxHeight !== 'undefined') {
    node.setMaxHeight(typeof style.maxHeight === 'number' ? style.maxHeight : parseFloat(style.maxHeight))
  }
  if (typeof style.maxWidth !== 'undefined') {
    node.setMaxWidth(typeof style.maxWidth === 'number' ? style.maxWidth : parseFloat(style.maxWidth))
  }
  if (typeof style.minHeight !== 'undefined') {
    node.setMinHeight(typeof style.minHeight === 'number' ? style.minHeight : parseFloat(style.minHeight))
  }
  if (typeof style.minWidth !== 'undefined') {
    node.setMinWidth(typeof style.minWidth === 'number' ? style.minWidth : parseFloat(style.minWidth))
  }

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

  node.setMarginEdge(EDGE_TOP, Number(style.marginTop || 0))
  node.setMarginEdge(EDGE_BOTTOM, Number(style.marginBottom || 0))
  node.setMarginEdge(EDGE_LEFT, Number(style.marginLeft || 0))
  node.setMarginEdge(EDGE_RIGHT, Number(style.marginRight || 0))

  node.setBorderEdge(EDGE_TOP, Number(style.borderTopWidth || 0))
  node.setBorderEdge(EDGE_BOTTOM, Number(style.borderBottomWidth || 0))
  node.setBorderEdge(EDGE_LEFT, Number(style.borderLeftWidth || 0))
  node.setBorderEdge(EDGE_RIGHT, Number(style.borderRightWidth || 0))

  node.setPaddingEdge(EDGE_TOP, Number(style.paddingTop || 0))
  node.setPaddingEdge(EDGE_BOTTOM, Number(style.paddingBottom || 0))
  node.setPaddingEdge(EDGE_LEFT, Number(style.paddingLeft || 0))
  node.setPaddingEdge(EDGE_RIGHT, Number(style.paddingRight || 0))

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

  if (typeof style.top !== 'undefined') {
    node.setTop(typeof style.top === 'number' ? style.top : parseFloat(style.top))
  }
  if (typeof style.bottom !== 'undefined') {
    node.setBottom(typeof style.bottom === 'number' ? style.bottom : parseFloat(style.bottom))
  }
  if (typeof style.left !== 'undefined') {
    node.setLeft(typeof style.left === 'number' ? style.left : parseFloat(style.left))
  }
  if (typeof style.right !== 'undefined') {
    node.setRight(typeof style.right === 'number' ? style.right : parseFloat(style.right))
  }

  if (typeof style.height !== 'undefined') {
    if (typeof style.height === 'number') {
      node.setHeight(style.height)
    } else if (style.height.endsWith('%')) {
      const heightPercent = parseFloat(style.height)
      if (!isNaN(heightPercent)) {
        node.setHeightPercent(heightPercent)
      }
    } else {
      const heightNum = parseFloat(style.height)
      if (!isNaN(heightNum)) {
        node.setHeight(heightNum)
      }
    }
  } else {
    node.setHeightAuto()
  }
  if (typeof style.width !== 'undefined') {
    if (typeof style.width === 'number') {
      node.setWidth(style.width)
    } else if (style.width.endsWith('%')) {
      const widthPercent = parseFloat(style.width)
      if (!isNaN(widthPercent)) {
        node.setWidthPercent(widthPercent)
      }
    } else {
      const widthNum = parseFloat(style.width)
      if (!isNaN(widthNum)) {
        node.setWidth(widthNum)
      }
    }
  } else {
    node.setWidthAuto()
  }

  return [style, inheritable(style)]
}
