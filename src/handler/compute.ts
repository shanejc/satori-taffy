/**
 * Handler to update the Yoga node properties with the given element type and
 * style. Each supported element has its own preset styles, so this function
 * also returns the inherited style for children of the element.
 */

import presets from './presets.js'
import inheritable from './inheritable.js'
import expand, { SerializedStyle } from './expand.js'
import textHandler from '../text/index.js'
import { normalizeLocale } from '../language.js'
import { lengthToNumber, parseViewBox, v } from '../utils.js'
import { resolveImageData } from './image.js'
import { LayoutNode } from '../layout-engine/interface.js'
import { getLayoutEngine } from '../layout-engine/factory.js'

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

  // Set properties for Yoga.
  node.setDisplay(
    v(
      style.display,
      {
        flex: 'flex',
        block: 'flex',
        none: 'none',
        '-webkit-box': 'flex',
      },
      'flex',
      'display'
    )
  )

  node.setAlignContent(
    v(
      style.alignContent,
      {
        stretch: 'stretch',
        center: 'center',
        'flex-start': 'flex-start',
        'flex-end': 'flex-end',
        'space-between': 'space-between',
        'space-around': 'space-around',
        baseline: 'baseline',
        normal: 'auto',
      },
      'auto',
      'alignContent'
    )
  )

  node.setAlignItems(
    v(
      style.alignItems,
      {
        stretch: 'stretch',
        center: 'center',
        'flex-start': 'flex-start',
        'flex-end': 'flex-end',
        baseline: 'baseline',
        normal: 'auto',
      },
      'stretch',
      'alignItems'
    )
  )
  node.setAlignSelf(
    v(
      style.alignSelf,
      {
        stretch: 'stretch',
        center: 'center',
        'flex-start': 'flex-start',
        'flex-end': 'flex-end',
        baseline: 'baseline',
        normal: 'auto',
      },
      'auto',
      'alignSelf'
    )
  )
  node.setJustifyContent(
    v(
      style.justifyContent,
      {
        center: 'center',
        'flex-start': 'flex-start',
        'flex-end': 'flex-end',
        'space-between': 'space-between',
        'space-around': 'space-around',
      },
      'flex-start',
      'justifyContent'
    )
  )
  // @TODO: node.setAspectRatio

  node.setFlexDirection(
    v(
      style.flexDirection,
      {
        row: 'row',
        column: 'column',
        'row-reverse': 'row-reverse',
        'column-reverse': 'column-reverse',
      },
      'row',
      'flexDirection'
    )
  )
  node.setFlexWrap(
    v(
      style.flexWrap,
      {
        wrap: 'wrap',
        nowrap: 'nowrap',
        'wrap-reverse': 'wrap-reverse',
      },
      'nowrap',
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
    node.setFlexBasis(typeof style.flexBasis === 'string' ? parseFloat(style.flexBasis) : style.flexBasis)
  }
  node.setFlexGrow(typeof style.flexGrow === 'undefined' ? 0 : style.flexGrow)
  node.setFlexShrink(
    typeof style.flexShrink === 'undefined' ? 0 : style.flexShrink
  )

  if (typeof style.maxHeight !== 'undefined') {
    node.setMaxHeight(typeof style.maxHeight === 'string' ? parseFloat(style.maxHeight) : style.maxHeight)
  }
  if (typeof style.maxWidth !== 'undefined') {
    node.setMaxWidth(typeof style.maxWidth === 'string' ? parseFloat(style.maxWidth) : style.maxWidth)
  }
  if (typeof style.minHeight !== 'undefined') {
    node.setMinHeight(typeof style.minHeight === 'string' ? parseFloat(style.minHeight) : style.minHeight)
  }
  if (typeof style.minWidth !== 'undefined') {
    node.setMinWidth(typeof style.minWidth === 'string' ? parseFloat(style.minWidth) : style.minWidth)
  }

  node.setOverflow(
    v(
      style.overflow,
      {
        visible: 'visible',
        hidden: 'hidden',
      },
      'visible',
      'overflow'
    )
  )

  // Convert string values to numbers for margin, border, and padding
  const marginTop = typeof style.marginTop === 'string' ? parseFloat(style.marginTop) : (style.marginTop || 0)
  const marginRight = typeof style.marginRight === 'string' ? parseFloat(style.marginRight) : (style.marginRight || 0)
  const marginBottom = typeof style.marginBottom === 'string' ? parseFloat(style.marginBottom) : (style.marginBottom || 0)
  const marginLeft = typeof style.marginLeft === 'string' ? parseFloat(style.marginLeft) : (style.marginLeft || 0)
  node.setMargin(marginTop, marginRight, marginBottom, marginLeft)

  const borderTop = typeof style.borderTopWidth === 'string' ? parseFloat(style.borderTopWidth) : (style.borderTopWidth || 0)
  const borderRight = typeof style.borderRightWidth === 'string' ? parseFloat(style.borderRightWidth) : (style.borderRightWidth || 0)
  const borderBottom = typeof style.borderBottomWidth === 'string' ? parseFloat(style.borderBottomWidth) : (style.borderBottomWidth || 0)
  const borderLeft = typeof style.borderLeftWidth === 'string' ? parseFloat(style.borderLeftWidth) : (style.borderLeftWidth || 0)
  node.setBorder(borderTop, borderRight, borderBottom, borderLeft)

  const paddingTop = typeof style.paddingTop === 'string' ? parseFloat(style.paddingTop) : (style.paddingTop || 0)
  const paddingRight = typeof style.paddingRight === 'string' ? parseFloat(style.paddingRight) : (style.paddingRight || 0)
  const paddingBottom = typeof style.paddingBottom === 'string' ? parseFloat(style.paddingBottom) : (style.paddingBottom || 0)
  const paddingLeft = typeof style.paddingLeft === 'string' ? parseFloat(style.paddingLeft) : (style.paddingLeft || 0)
  node.setPadding(paddingTop, paddingRight, paddingBottom, paddingLeft)

  node.setPositionType(
    v(
      style.position,
      {
        absolute: 'absolute',
        relative: 'relative',
      },
      'relative',
      'position'
    )
  )

  if (typeof style.top !== 'undefined') {
    node.setTop(typeof style.top === 'string' ? parseFloat(style.top) : style.top)
  }
  if (typeof style.bottom !== 'undefined') {
    node.setBottom(typeof style.bottom === 'string' ? parseFloat(style.bottom) : style.bottom)
  }
  if (typeof style.left !== 'undefined') {
    node.setLeft(typeof style.left === 'string' ? parseFloat(style.left) : style.left)
  }
  if (typeof style.right !== 'undefined') {
    node.setRight(typeof style.right === 'string' ? parseFloat(style.right) : style.right)
  }

  if (typeof style.height !== 'undefined') {
    node.setHeight(typeof style.height === 'string' ? parseFloat(style.height) : style.height)
  } else {
    node.setHeightAuto()
  }
  if (typeof style.width !== 'undefined') {
    node.setWidth(typeof style.width === 'string' ? parseFloat(style.width) : style.width)
  } else {
    node.setWidthAuto()
  }

  return [style, inheritable(style)]
}
