import { TaffyStyle } from '@loading/taffy'
import { SerializedStyle } from '../handler/expand.js'

/**
 * Converts a SerializedStyle (from expand.ts) to TaffyStyle format
 */
export function toTaffyStyle(style: SerializedStyle): TaffyStyle {
  const taffyStyle: TaffyStyle = {}

  // Convert numeric properties
  if (typeof style.width === 'number') taffyStyle.width = style.width
  if (typeof style.height === 'number') taffyStyle.height = style.height
  if (typeof style.flexGrow === 'number') taffyStyle.flexGrow = style.flexGrow
  if (typeof style.flexShrink === 'number') taffyStyle.flexShrink = style.flexShrink

  // Convert string enum properties
  if (typeof style.flexDirection === 'string') {
    if (['row', 'column', 'row-reverse', 'column-reverse'].includes(style.flexDirection)) {
      taffyStyle.flexDirection = style.flexDirection as TaffyStyle['flexDirection']
    }
  }

  if (typeof style.alignItems === 'string') {
    if (['flex-start', 'flex-end', 'center', 'stretch', 'baseline'].includes(style.alignItems)) {
      taffyStyle.alignItems = style.alignItems as TaffyStyle['alignItems']
    }
  }

  if (typeof style.justifyContent === 'string') {
    if (['flex-start', 'flex-end', 'center', 'space-between', 'space-around'].includes(style.justifyContent)) {
      taffyStyle.justifyContent = style.justifyContent as TaffyStyle['justifyContent']
    }
  }

  if (typeof style.flexWrap === 'string') {
    if (['nowrap', 'wrap', 'wrap-reverse'].includes(style.flexWrap)) {
      taffyStyle.flexWrap = style.flexWrap as TaffyStyle['flexWrap']
    }
  }

  return taffyStyle
}

/**
 * Converts a TaffyStyle to a format compatible with expand.ts
 */
export function fromTaffyStyle(style: TaffyStyle): Record<string, string | number> {
  const result: Record<string, string | number> = {}

  // Convert numeric properties
  if (typeof style.width === 'number') result.width = style.width
  if (typeof style.height === 'number') result.height = style.height
  if (typeof style.flexGrow === 'number') result.flexGrow = style.flexGrow
  if (typeof style.flexShrink === 'number') result.flexShrink = style.flexShrink

  // Convert string enum properties
  if (style.flexDirection) result.flexDirection = style.flexDirection
  if (style.alignItems) result.alignItems = style.alignItems
  if (style.justifyContent) result.justifyContent = style.justifyContent
  if (style.flexWrap) result.flexWrap = style.flexWrap

  return result
} 