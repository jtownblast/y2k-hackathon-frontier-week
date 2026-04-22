import type { CSSProperties } from 'react';
import toolsSprite from '../../assets/icons/paint-tools.png';

export type ToolId =
  | 'select-free'
  | 'select-rect'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'magnifier'
  | 'pencil'
  | 'brush'
  | 'airbrush'
  | 'text'
  | 'line'
  | 'curve'
  | 'rectangle'
  | 'polygon'
  | 'ellipse'
  | 'rounded-rect';

export interface ToolDef {
  id: ToolId;
  name: string;
  hint: string;
  implemented: boolean;
  spriteIndex: number;
}

// spriteIndex corresponds to the column in jspaint's classic/tools.png (16 tools, 16px each)
// Source: https://github.com/1j01/jspaint — images/classic/tools.png
export const TOOLS: ToolDef[] = [
  { id: 'select-free',   spriteIndex: 0,  name: 'Free-Form Select', hint: 'Selects a free-form part of the picture.',            implemented: true  },
  { id: 'select-rect',   spriteIndex: 1,  name: 'Select',           hint: 'Selects a rectangular part of the picture.',          implemented: true  },
  { id: 'eraser',        spriteIndex: 2,  name: 'Eraser/Color Eraser', hint: 'Erases a portion of the picture.',                 implemented: true  },
  { id: 'fill',          spriteIndex: 3,  name: 'Fill With Color',  hint: 'Fills an area with the current drawing color.',       implemented: true  },
  { id: 'eyedropper',    spriteIndex: 4,  name: 'Pick Color',       hint: 'Picks up a color from the picture for drawing.',      implemented: true  },
  { id: 'magnifier',     spriteIndex: 5,  name: 'Magnifier',        hint: 'Changes the magnification.',                          implemented: false },
  { id: 'pencil',        spriteIndex: 6,  name: 'Pencil',           hint: 'Draws a free-form line one pixel wide.',              implemented: true  },
  { id: 'brush',         spriteIndex: 7,  name: 'Brush',            hint: 'Draws using a brush with the selected shape and size.', implemented: true },
  { id: 'airbrush',      spriteIndex: 8,  name: 'Airbrush',         hint: 'Draws using an airbrush of the selected size.',       implemented: true  },
  { id: 'text',          spriteIndex: 9,  name: 'Text',             hint: 'Inserts text into the picture.',                      implemented: false },
  { id: 'line',          spriteIndex: 10, name: 'Line',             hint: 'Draws a straight line with the selected line width.', implemented: true  },
  { id: 'curve',         spriteIndex: 11, name: 'Curve',            hint: 'Draws a curved line with the selected line width.',   implemented: true  },
  { id: 'rectangle',     spriteIndex: 12, name: 'Rectangle',        hint: 'Draws a rectangle with the selected fill style.',     implemented: true  },
  { id: 'polygon',       spriteIndex: 13, name: 'Polygon',          hint: 'Draws a polygon with the selected fill style.',       implemented: true  },
  { id: 'ellipse',       spriteIndex: 14, name: 'Ellipse',          hint: 'Draws an ellipse with the selected fill style.',      implemented: true  },
  { id: 'rounded-rect',  spriteIndex: 15, name: 'Rounded Rectangle', hint: 'Draws a rounded rectangle with the selected fill style.', implemented: true  },
];

export const TOOL_BY_ID: Record<ToolId, ToolDef> = TOOLS.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {} as Record<ToolId, ToolDef>);

// 28 classic Win98 Paint colors, 2 rows of 14.
export const PALETTE: string[] = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080FF', '#004080', '#4000FF', '#804000',
  '#FFFFFF', '#C0C0C0', '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFF80', '#00FF80', '#80FFFF', '#8080FF', '#FF0080', '#FF8040',
];

// Sprite rendering — the 16x16 source gets scaled 2x to 32x32 via pixelated rendering
// so the icons feel chunky/authentic like the reference screenshot.
export const ICON_NATIVE = 16;
export const ICON_SIZE = 32;
export const SPRITE_SHEET_WIDTH_NATIVE = ICON_NATIVE * TOOLS.length; // 256
export const SPRITE_SHEET_WIDTH = ICON_SIZE * TOOLS.length;          // 512
const SPRITE_URL = toolsSprite;

export function toolIconStyle(spriteIndex: number): CSSProperties {
  return {
    width: ICON_SIZE,
    height: ICON_SIZE,
    backgroundImage: `url(${SPRITE_URL})`,
    backgroundSize: `${SPRITE_SHEET_WIDTH}px ${ICON_SIZE}px`,
    backgroundPosition: `-${spriteIndex * ICON_SIZE}px 0`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    pointerEvents: 'none',
  };
}

export function ToolIcon({ spriteIndex }: { spriteIndex: number }) {
  return <div style={toolIconStyle(spriteIndex)} aria-hidden="true" />;
}
