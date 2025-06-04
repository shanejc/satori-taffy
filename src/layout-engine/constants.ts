// Layout Engine Constants
// These mirror Yoga's constants but are engine-agnostic

// Display constants
export const DISPLAY_FLEX = 'flex' as const;
export const DISPLAY_NONE = 'none' as const;
export const DISPLAY_GRID = 'grid' as const;

// Flex Direction constants
export const FLEX_DIRECTION_ROW = 'row' as const;
export const FLEX_DIRECTION_COLUMN = 'column' as const;
export const FLEX_DIRECTION_ROW_REVERSE = 'row-reverse' as const;
export const FLEX_DIRECTION_COLUMN_REVERSE = 'column-reverse' as const;

// Flex Wrap constants
export const WRAP_NO_WRAP = 'nowrap' as const;
export const WRAP_WRAP = 'wrap' as const;
export const WRAP_WRAP_REVERSE = 'wrap-reverse' as const;

// Align constants
export const ALIGN_AUTO = 'auto' as const;
export const ALIGN_FLEX_START = 'flex-start' as const;
export const ALIGN_FLEX_END = 'flex-end' as const;
export const ALIGN_CENTER = 'center' as const;
export const ALIGN_STRETCH = 'stretch' as const;
export const ALIGN_BASELINE = 'baseline' as const;
export const ALIGN_SPACE_BETWEEN = 'space-between' as const;
export const ALIGN_SPACE_AROUND = 'space-around' as const;

// Justify constants
export const JUSTIFY_FLEX_START = 'flex-start' as const;
export const JUSTIFY_FLEX_END = 'flex-end' as const;
export const JUSTIFY_CENTER = 'center' as const;
export const JUSTIFY_SPACE_BETWEEN = 'space-between' as const;
export const JUSTIFY_SPACE_AROUND = 'space-around' as const;

// Position constants
export const POSITION_TYPE_RELATIVE = 'relative' as const;
export const POSITION_TYPE_ABSOLUTE = 'absolute' as const;

// Overflow constants
export const OVERFLOW_VISIBLE = 'visible' as const;
export const OVERFLOW_HIDDEN = 'hidden' as const;

// Edge constants (for margins, borders, padding, positions)
export const EDGE_LEFT = 0 as const;
export const EDGE_TOP = 1 as const;
export const EDGE_RIGHT = 2 as const;
export const EDGE_BOTTOM = 3 as const;

// Gutter constants (for gaps)
export const GUTTER_ALL = 0 as const;
export const GUTTER_ROW = 1 as const;
export const GUTTER_COLUMN = 2 as const;

// Layout Engine Type constants
export const LAYOUT_ENGINE_YOGA = 'yoga' as const;
export const LAYOUT_ENGINE_TAFFY = 'taffy' as const; 