/**
 * CSS Grid property parser for Satori
 * Converts CSS Grid syntax to structured data for layout engines
 */

export interface GridTrack {
  type: 'fr' | 'px' | 'auto' | 'minmax' | 'repeat' | 'min-content' | 'max-content'
  value: number | string
  min?: number | string
  max?: number | string
}

export interface ParsedGridProperties {
  gridTemplateColumns?: GridTrack[]
  gridTemplateRows?: GridTrack[]
  gridTemplateAreas?: string[][]
  gridAutoFlow?: 'row' | 'column' | 'row dense' | 'column dense'
  gridAutoColumns?: GridTrack[]
  gridAutoRows?: GridTrack[]
  // Individual placement properties (parsed to gridColumn/gridRow)
  gridColumn?: string
  gridRow?: string
  gridArea?: string
}

/**
 * Parse grid-template-columns/rows: "1fr 200px auto minmax(100px, 1fr)"
 */
function parseGridTemplate(value: string): GridTrack[] {
  if (!value || value === 'none') return []
  
  const tracks: GridTrack[] = []
  
  // Handle repeat() notation: repeat(3, 1fr 100px) -> 1fr 100px 1fr 100px 1fr 100px
  let expandedValue = value
  const repeatRegex = /repeat\((\d+),\s*([^)]+)\)/g
  expandedValue = expandedValue.replace(repeatRegex, (_, count, template) => {
    const repeatCount = parseInt(count, 10)
    const templateStr = String(template).trim()
    return Array(repeatCount).fill(templateStr).join(' ')
  })
  
  // Split on whitespace, but be careful with minmax() which contains spaces
  const tokens: string[] = []
  let current = ''
  let parenDepth = 0
  
  for (let i = 0; i < expandedValue.length; i++) {
    const char = expandedValue[i]
    
    if (char === '(') parenDepth++
    if (char === ')') parenDepth--
    
    if (char === ' ' && parenDepth === 0) {
      if (current.trim()) {
        tokens.push(current.trim())
        current = ''
      }
    } else {
      current += char
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim())
  }
  
  for (const token of tokens) {
    const tokenStr = String(token)
    
    if (tokenStr === 'auto') {
      tracks.push({ type: 'auto', value: 'auto' })
    } else if (tokenStr === 'min-content') {
      tracks.push({ type: 'min-content', value: 'min-content' })
    } else if (tokenStr === 'max-content') {
      tracks.push({ type: 'max-content', value: 'max-content' })
    } else if (tokenStr.endsWith('fr')) {
      tracks.push({ type: 'fr', value: parseFloat(tokenStr) })
    } else if (tokenStr.endsWith('px') || tokenStr.endsWith('em') || tokenStr.endsWith('rem') || tokenStr.endsWith('%')) {
      tracks.push({ type: 'px', value: parseFloat(tokenStr) })
    } else if (tokenStr.startsWith('minmax(') && tokenStr.endsWith(')')) {
      const content = tokenStr.slice(7, -1) // Remove 'minmax(' and ')'
      const [min, max] = content.split(',').map(s => s.trim())
      tracks.push({ 
        type: 'minmax', 
        value: tokenStr,
        min: min.endsWith('px') || min.endsWith('fr') || min.endsWith('%') ? parseFloat(min) : min,
        max: max.endsWith('px') || max.endsWith('fr') || max.endsWith('%') ? parseFloat(max) : max
      })
    } else {
      // Fallback - treat as pixel value if it's a number
      const numValue = parseFloat(tokenStr)
      if (!isNaN(numValue)) {
        tracks.push({ type: 'px', value: numValue })
      }
    }
  }
  
  return tracks
}

/**
 * Parse grid-template-areas: "header header" "sidebar main" "footer footer"
 */
function parseGridAreas(value: string): string[][] {
  if (!value || value === 'none') return []
  
  // Split by quotes and filter out empty strings
  const areaStrings = value
    .split('"')
    .filter(area => area.trim() && !area.trim().match(/^\s+$/))
    .map(area => area.trim())
  
  return areaStrings.map(area => area.split(/\s+/))
}

/**
 * Check if the serialized style contains any grid properties
 */
export function hasGridProperties(style: Record<string, any>): boolean {
  const gridProps = [
    // Container properties
    'gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas',
    'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows', 
    // Item placement properties (shorthand)
    'gridColumn', 'gridRow', 'gridArea',
    // Item placement properties (individual)
    'gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'gridRowEnd',
    // Shorthand properties
    'gridTemplate', 'grid'
  ]
  
  return gridProps.some(prop => prop in style)
}

/**
 * Parse individual grid placement property (gridColumnStart, gridRowStart, etc.)
 */
function parseGridPlacement(value: string): string {
  if (!value || value === 'auto') return 'auto'
  return String(value).trim()
}

/**
 * Parse grid-area property: "header" or "1 / 2 / 3 / 4"
 */
function parseGridArea(value: string): { gridRow: string; gridColumn: string } | null {
  if (!value || value === 'auto') return null
  
  const trimmed = value.trim()
  
  // Check if it's a named area (single identifier)
  if (!trimmed.includes('/')) {
    // This is a named area reference, would need grid-template-areas to resolve
    // For now, return null to indicate it needs special handling
    return null
  }
  
  // Parse "row-start / column-start / row-end / column-end" format
  const parts = trimmed.split('/').map(p => p.trim())
  
  if (parts.length === 4) {
    return {
      gridRow: `${parts[0]} / ${parts[2]}`,
      gridColumn: `${parts[1]} / ${parts[3]}`
    }
  } else if (parts.length === 2) {
    // "row / column" format
    return {
      gridRow: parts[0],
      gridColumn: parts[1]
    }
  }
  
  return null
}

/**
 * Parse all grid properties from the serialized style
 */
export function parseGridProperties(style: Record<string, any>): ParsedGridProperties {
  const result: ParsedGridProperties = {}
  
  // Parse container properties
  if (style.gridTemplateColumns) {
    result.gridTemplateColumns = parseGridTemplate(String(style.gridTemplateColumns))
  }
  
  if (style.gridTemplateRows) {
    result.gridTemplateRows = parseGridTemplate(String(style.gridTemplateRows))
  }
  
  if (style.gridTemplateAreas) {
    result.gridTemplateAreas = parseGridAreas(String(style.gridTemplateAreas))
  }
  
  if (style.gridAutoFlow) {
    const flow = String(style.gridAutoFlow).toLowerCase()
    if (['row', 'column', 'row dense', 'column dense'].includes(flow)) {
      result.gridAutoFlow = flow as any
    }
  }
  
  if (style.gridAutoColumns) {
    result.gridAutoColumns = parseGridTemplate(String(style.gridAutoColumns))
  }
  
  if (style.gridAutoRows) {
    result.gridAutoRows = parseGridTemplate(String(style.gridAutoRows))
  }
  
  // Parse item placement properties
  // Handle grid-area first (can set both gridRow and gridColumn)
  if (style.gridArea) {
    const parsed = parseGridArea(String(style.gridArea))
    if (parsed) {
      result.gridRow = parsed.gridRow
      result.gridColumn = parsed.gridColumn
    }
  }
  
  // Handle gridColumn and gridRow (override grid-area if present)
  if (style.gridColumn) {
    result.gridColumn = String(style.gridColumn)
  }
  
  if (style.gridRow) {
    result.gridRow = String(style.gridRow)
  }
  
  // Handle individual placement properties and combine them
  let gridColumnStart: string | undefined
  let gridColumnEnd: string | undefined
  let gridRowStart: string | undefined
  let gridRowEnd: string | undefined
  
  if (style.gridColumnStart) {
    gridColumnStart = parseGridPlacement(String(style.gridColumnStart))
  }
  
  if (style.gridColumnEnd) {
    gridColumnEnd = parseGridPlacement(String(style.gridColumnEnd))
  }
  
  if (style.gridRowStart) {
    gridRowStart = parseGridPlacement(String(style.gridRowStart))
  }
  
  if (style.gridRowEnd) {
    gridRowEnd = parseGridPlacement(String(style.gridRowEnd))
  }
  
  // Combine individual placement properties into shorthand (if not already set)
  if ((gridColumnStart || gridColumnEnd) && !result.gridColumn) {
    const start = gridColumnStart || 'auto'
    const end = gridColumnEnd || 'auto'
    result.gridColumn = end === 'auto' ? start : `${start} / ${end}`
  }
  
  if ((gridRowStart || gridRowEnd) && !result.gridRow) {
    const start = gridRowStart || 'auto'
    const end = gridRowEnd || 'auto'
    result.gridRow = end === 'auto' ? start : `${start} / ${end}`
  }
  
  // Handle shorthand properties
  if (style.gridTemplate) {
    const template = String(style.gridTemplate)
    if (template.includes(' / ')) {
      // grid-template: rows / columns
      const [rows, columns] = template.split(' / ')
      result.gridTemplateRows = parseGridTemplate(rows.trim())
      result.gridTemplateColumns = parseGridTemplate(columns.trim())
    }
  }
  
  // Note: 'grid' shorthand is extremely complex and would need extensive parsing
  // For now, we'll leave it as-is and handle individual properties
  
  return result
} 